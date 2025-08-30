import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabaseClient";
import { Link } from "react-router-dom";


export function AuthPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isLoginView, setIsLoginView] = useState(true);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);

    try {
      if (isLoginView) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        alert("Login realizado com sucesso!");
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        alert(
          "Cadastro realizado! Verifique seu email para confirmar a conta."
        );
      }
    } catch (error) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex items-center justify-center min-h-screen bg-gray-950 overflow-hidden font-sans">
      <div className="absolute inset-0 z-0 opacity-20">
        {Array.from({ length: 50 }).map((_, i) => (
          <div
            key={i}
            className="absolute bg-white rounded-full h-0.5 w-0.5 animate-meteor-shower"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 10}s`,
              animationDuration: `${2 + Math.random() * 3}s`,
            }}
          ></div>
        ))}
      </div>

      <div className="relative z-10 flex flex-col md:flex-row bg-gray-800 rounded-lg shadow-xl overflow-hidden max-w-4xl w-full mx-4">
        <div className="flex-1 p-8 text-white flex flex-col justify-center items-start bg-gradient-to-br from-gray-900 to-slate-800">
          <h1
            className="text-4xl font-bold mb-4"
            style={{ fontFamily: "Cinzel, serif" }}
          >
            Sua Jornada Começa Aqui
          </h1>
          <p
            className="text-lg text-gray-300"
            style={{ fontFamily: "Inter, sans-serif" }}
          >
            Organize sua coleção, descubra novas estratégias e construa os decks
            dos seus sonhos. O Multiverso de Magic está em suas mãos.
          </p>
        </div>

        <div className="flex-1 p-8 bg-gray-700 text-white flex flex-col justify-center">
          <h2 className="text-3xl font-bold mb-6 text-center">
            {isLoginView ? "Entrar" : "Cadastre-se"}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 bg-gray-600 border-gray-500 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                placeholder="********"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 bg-gray-600 border-gray-500 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500"
                required
              />
            </div>
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-md transition duration-300"
            >
              {loading ? "Carregando..." : isLoginView ? "Entrar" : "Cadastrar"}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-400">
            {isLoginView ? (
              <>
                Não tem uma conta?{" "}
                <button
                  onClick={() => setIsLoginView(false)}
                  className="text-blue-400 hover:underline focus:outline-none"
                >
                  Cadastre-se
                </button>
              </>
            ) : (
              <>
                Já tem uma conta?{" "}
                <button
                  onClick={() => setIsLoginView(true)}
                  className="text-blue-400 hover:underline focus:outline-none"
                >
                  Faça Login
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
