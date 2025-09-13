import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Book, Search, Layers, LogOut, User } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';

const navLinks = [
  { href: '/search', label: 'Buscar Cartas', icon: Search },
  { href: '/collection', label: 'Minha Coleção', icon: Book },
  { href: '/decks', label: 'Meus Decks', icon: Layers },
];

export function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [username, setUsername] = useState(null); // Estado local para o nome de usuário

  // useEffect para buscar o perfil quando o usuário estiver disponível
  useEffect(() => {
    let isMounted = true;
    async function getProfile() {
      if (!user) return;
      const { data, error } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', user.id)
        .single();

      if (isMounted && data) {
        setUsername(data.username);
      }
      if (error) {
        console.warn('Erro ao buscar perfil na sidebar:', error);
      }
    }
    getProfile();
    return () => { isMounted = false };
  }, [user]); // Roda sempre que o 'user' mudar

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/auth');
  };

  const displayName = username || user?.email;

  return (
    <aside className="w-64 flex-shrink-0 bg-primary-800/50 border-r border-primary-700 flex flex-col p-4">
      <Link to="/" className="text-2xl font-bold text-center py-4 text-secondary-400 hover:text-secondary-300 transition-colors" style={{ fontFamily: 'Cinzel, serif' }}>
        MTG Grimoire
      </Link>
      
      <nav className="flex flex-col gap-2 mt-8">
        {navLinks.map((link) => {
          const isActive = location.pathname.startsWith(link.href);
          return (
            <Link
              key={link.href}
              to={link.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-md text-lg transition-colors",
                isActive
                  ? "bg-secondary-500 text-secondary-foreground font-semibold"
                  : "text-slate-200 hover:bg-primary-700"
              )}
            >
              <link.icon className="h-5 w-5" />
              {link.label}
            </Link>
          );
        })}
      </nav>
      
      <div className="mt-auto border-t border-primary-700 pt-4 space-y-2">
        <Link to="/profile" className="flex items-center gap-3 px-4 py-2 rounded-md text-slate-300 hover:bg-primary-700 transition-colors">
            <User className="h-5 w-5" />
            <span className="truncate" title={displayName}>
                {displayName}
            </span>
        </Link>
        <Button variant="destructive" className="w-full" onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          Sair
        </Button>
      </div>
    </aside>
  );
}