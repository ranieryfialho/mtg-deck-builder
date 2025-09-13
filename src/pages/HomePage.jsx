import { useAuth } from '@/context/AuthContext';

export function HomePage() {
  const { user } = useAuth();

  return (
    <div className="flex flex-col items-center justify-center h-full p-8 text-center">
      <h1 className="text-6xl font-bold text-secondary-400" style={{ fontFamily: 'Cinzel, serif' }}>
        Bem-vindo ao seu Grimório
      </h1>
      <p className="mt-4 text-xl text-slate-300">
        Use o menu à esquerda para navegar pela sua coleção, buscar novas cartas ou construir seus decks.
      </p>
    </div>
  );
}