import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';

export function HomePage() {
  const { user } = useAuth();

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 text-white">
      <h1 className="text-3xl mb-4">Bem-vindo, Planeswalker!</h1>
      <p className="mb-8">Seu email é: {user?.email}</p>

      <Link to="/search">
        <Button className="mb-4 bg-primary-500 hover:bg-primary-600">
          Buscar Cartas
        </Button>
      </Link>

      <Button onClick={handleLogout} variant="destructive">
        Sair (Logout)
      </Button>
    </div>
  );
}