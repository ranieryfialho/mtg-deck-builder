import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function ProfilePage() {
  const { user, profile, refetchProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [username, setUsername] = useState('');
  const [feedback, setFeedback] = useState({ message: '', type: '' });

  useEffect(() => {
    if (profile) {
      setUsername(profile.username || '');
    }
  }, [profile]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    setFeedback({ message: '', type: '' });

    const updates = {
      id: user.id,
      username,
      updated_at: new Date(),
    };

    const { error } = await supabase.from('profiles').upsert(updates);

    if (error) {
      setFeedback({ message: 'Erro ao salvar: ' + error.message, type: 'error' });
    } else {
      setFeedback({ message: 'Perfil salvo com sucesso!', type: 'success' });
      refetchProfile(); 
    }
    setLoading(false);
  };

  return (
    <div className="p-8">
      <h1 className="text-5xl font-bold mb-8 text-secondary-400" style={{ fontFamily: 'Cinzel, serif' }}>
        Meu Perfil
      </h1>
      <div className="max-w-md bg-primary-800/50 border border-primary-700 p-6 rounded-lg">
        <form onSubmit={handleUpdateProfile} className="space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="text" value={user.email} disabled className="bg-primary-700/50 mt-1" />
          </div>
          <div>
            <Label htmlFor="username">Nome de Usuário</Label>
            <Input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="mt-1"
              placeholder="Como você quer ser chamado?"
            />
          </div>
          <div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Salvando...' : 'Salvar Perfil'}
            </Button>
          </div>
        </form>
        {feedback.message && (
          <p className={`mt-4 text-sm ${feedback.type === 'error' ? 'text-red-400' : 'text-green-400'}`}>
            {feedback.message}
          </p>
        )}
      </div>
    </div>
  );
}