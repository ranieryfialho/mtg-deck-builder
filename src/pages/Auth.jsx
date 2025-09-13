import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabaseClient";

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
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        alert("Cadastro realizado! Verifique seu email para confirmar a conta.");
      }
    } catch (error) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex items-center justify-center min-h-screen bg-primary-900 overflow-hidden font-sans">
      <div className="absolute inset-0 z-0 bg-gradient-to-br from-primary-900 to-slate-900 opacity-50"></div>

      <div className="relative z-10 flex flex-col md:flex-row bg-primary-800/50 backdrop-blur-sm border border-primary-700 rounded-lg shadow-2xl shadow-primary-900/50 overflow-hidden max-w-4xl w-full mx-4">

        <div className="flex-1 p-8 text-white flex flex-col justify-center items-start">
          <h1 className="text-4xl font-bold mb-4 text-secondary-400" style={{ fontFamily: "Cinzel, serif" }}>
            Sua Jornada Começa Aqui
          </h1>
          <p className="text-lg text-slate-300" style={{ fontFamily: "Inter, sans-serif" }}>
            Organize sua coleção, descubra novas estratégias e construa os decks dos seus sonhos. O Multiverso de Magic está em suas mãos.
          </p>
        </div>

        <div className="flex-1 p-8 bg-slate-900/50 text-white flex flex-col justify-center">
          <h2 className="text-3xl font-bold mb-6 text-center text-secondary-400" style={{ fontFamily: "Cinzel, serif" }}>
            {isLoginView ? "Entrar" : "Cadastre-se"}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email" type="email" placeholder="seu@email.com" value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 bg-primary-800 border-primary-700 text-white placeholder-slate-400 focus:border-secondary-500 focus:ring-secondary-500"
                required
              />
            </div>
            <div>
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password" type="password" placeholder="********" value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 bg-primary-800 border-primary-700 text-white placeholder-slate-400 focus:border-secondary-500 focus:ring-secondary-500"
                required
              />
            </div>
            <Button
              type="submit" disabled={loading}
              className="w-full bg-secondary-500 hover:bg-secondary-600 text-secondary-foreground font-semibold py-2 rounded-md transition duration-300"
            >
              {loading ? "Carregando..." : isLoginView ? "Entrar" : "Cadastrar"}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-slate-400">
            {isLoginView ? (
              <>
                Não tem uma conta?{" "}
                <button onClick={() => setIsLoginView(false)} className="text-secondary-400 hover:underline focus:outline-none">
                  Cadastre-se
                </button>
              </>
            ) : (
              <>
                Já tem uma conta?{" "}
                <button onClick={() => setIsLoginView(true)} className="text-secondary-400 hover:underline focus:outline-none">
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