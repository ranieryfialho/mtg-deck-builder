import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabaseClient";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const fetchCollection = async (userId) => {
  const { data, error } = await supabase
    .from("user_cards")
    .select("*")
    .eq("user_id", userId)
    .order("card_name", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }
  return data;
};

export function CollectionPage() {
  const { user } = useAuth();

  const {
    data: collection,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["collection", user?.id],
    queryFn: () => fetchCollection(user.id),
    enabled: !!user,
  });

  if (isLoading) {
    return (
      <div className="text-center text-white p-10">
        Carregando sua coleção...
      </div>
    );
  }

  if (isError) {
    return <div className="text-center text-red-500 p-10">{error.message}</div>;
  }

  return (
    <div className="w-full min-h-screen bg-slate-900 text-white p-4">
      <div className="container mx-auto">
        <h1
          className="text-4xl font-bold mb-6 text-center"
          style={{ fontFamily: "Cinzel, serif" }}
        >
          Minha Coleção
        </h1>

        {collection && collection.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {collection.map((card) => (
              <Link
                to={`/card/${card.set_code}/${card.collector_number}`}
                key={card.id}
              >
                <div className="relative group">
                  <img
                    src={card.card_image_url}
                    alt={card.card_name}
                    className="rounded-lg w-full transition-transform duration-300 group-hover:scale-105"
                    loading="lazy"
                  />
                  <div className="absolute top-2 right-2 bg-blue-600 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center border-2 border-slate-900">
                    {card.quantity}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-slate-400 text-lg">Sua coleção está vazia.</p>
            <p className="text-slate-500 mt-2">
              Use a busca para encontrar e adicionar suas cartas!
            </p>
            <Link to="/search">
              <Button className="mt-4 bg-primary-500 hover:bg-primary-600">
                Buscar Cartas
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
