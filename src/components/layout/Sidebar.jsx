import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Book, Search, Layers, User } from 'lucide-react';

const navLinks = [
  { href: '/search', label: 'Buscar Cartas', icon: Search },
  { href: '/collection', label: 'Minha Coleção', icon: Book },
  { href: '/decks', label: 'Meus Decks', icon: Layers },
];

export function Sidebar() {
  const location = useLocation();

  return (
    <aside className="w-64 flex-shrink-0 bg-primary-800/50 border-r border-primary-700 flex flex-col p-4">
      <div className="text-2xl font-bold text-center py-4 text-secondary-400" style={{ fontFamily: 'Cinzel, serif' }}>
        MTG Grimoire
      </div>
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
      <div className="mt-auto">
      </div>
    </aside>
  );
}