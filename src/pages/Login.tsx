import React, { useState } from "react";
import { Card, Button, Input } from "@/components/ui/Components";
import { supabase, isSupabaseConfigured } from "@/lib/db";
import { useNavigate } from "react-router";
import { ShieldCheck, Lock } from "lucide-react";

export function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const navigate = useNavigate();

  // Debug info
  const supabaseUrlStr = ((import.meta as any).env.VITE_SUPABASE_URL || '').trim();
  const hasKey = Boolean((import.meta as any).env.VITE_SUPABASE_ANON_KEY);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSupabaseConfigured) {
      alert("Modo Mock: Login bypass automático ativado para /admin");
      navigate("/admin");
      return;
    }

    setLoading(true);
    setErrorMsg("");

    try {
      let baseUrl = supabaseUrlStr.replace(/\/rest\/v1\/?$/, '');
      if (baseUrl && !baseUrl.startsWith('http')) {
         throw new Error(`A URL configurada (${baseUrl}) é inválida! Verifique as chaves VITE_SUPABASE_URL.`);
      }
      
      console.log("Iniciando signInWithPassword para:", email);
      
      const { data, error } = await supabase!.auth.signInWithPassword({
        email,
        password,
      });

      console.log("signInWithPassword resposta:", { data, error });

      if (error) {
        if (error.message.includes("Email not confirmed")) {
          setErrorMsg("Confirmação de E-mail é obrigatória pelo Supabase. Verifique sua caixa de entrada e confirme para entrar.");
        } else if (error.message.toLowerCase().includes("email logins are disabled")) {
          setErrorMsg("ATENÇÃO: O Login por Email está desativado no seu Supabase! Vá em Authentication > Providers > Email e habilite a opção 'Enable Email provider'.");
        } else if (error.message === "Invalid login credentials") {
          setErrorMsg("E-mail ou senha incorretos.");
        } else {
          setErrorMsg(error.message);
        }
        setLoading(false);
        return;
      }

      if (data?.user) {
        console.log("Usuário autenticado:", data.user.id);
        
        // Auto-bootstrap: Check Se a tabela de super_admins está vazia
        const { count, error: countError } = await supabase!
          .from("super_admins")
          .select("*", { count: 'exact', head: true });
          
        if (count === 0 && !countError) {
            console.log("Banco de dados sem super admins. Promovendo primeiro usuário a Super Admin.");
            await supabase!.from("super_admins").insert({
                id: data.user.id,
                email: data.user.email
            });
        }

        const { data: superAdmin, error: saError } = await supabase!
          .from("super_admins")
          .select("id")
          .eq("id", data.user.id)
          .maybeSingle();
          
        if (saError) {
          if (saError.code === '42P01' || saError.message?.includes('does not exist')) {
            setErrorMsg("O banco de dados está vazio! Você precisa rodar o script 'supabase_schema.sql' no SQL Editor do Supabase.");
          } else {
            setErrorMsg("Erro consultando tabela super_admins: " + saError.message);
          }
          setLoading(false);
          return;
        }

        // Ambos os cargos agora usam o mesmo link de administração unificado
        navigate("/admin");
      }
    } catch (err: any) {
      console.error("Exec catch:", err);
      // Fallback network error message
      if (err instanceof TypeError && err.message === 'Failed to fetch') {
         setErrorMsg("Erro de rede: O Supabase não respondeu. Verifique se a URL em VITE_SUPABASE_URL está correta e se a rede permite o acesso.");
      } else {
         setErrorMsg(err.message || "Erro ao realizar login. Verifique o console.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 sm:p-6 font-sans relative overflow-hidden">
      {/* Background ambient glow */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>

      <Card className="max-w-md w-full p-5 sm:p-8 border border-slate-800 bg-slate-900/40 backdrop-blur-md text-white rounded-3xl relative z-10">
        <div className="text-center mb-6 sm:mb-8">
          <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center font-black text-white text-xl mx-auto mb-4 shadow-lg shadow-blue-500/20">
            GLJ
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Acessar Sistema
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-1">
            Entre no painel de Gestão Lava Jatos
          </p>
          <div className="mt-4 text-[10px] sm:text-xs text-slate-400 bg-slate-950/60 p-2.5 rounded-xl text-left border border-slate-800 max-w-sm mx-auto overflow-hidden">
             <span className="font-bold text-slate-300">Status do Banco:</span><br/>
             {isSupabaseConfigured ? '🟢 Supabase Integrado' : '🟡 Modo Demonstração (Mock)'}
          </div>
        </div>

        {errorMsg && (
          <div className="mb-4 bg-red-950/40 text-red-400 text-xs sm:text-[13px] font-medium p-3 rounded-lg border border-red-900/50">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4 sm:space-y-5">
          <div>
            <label className="block text-xs sm:text-sm font-semibold text-slate-300 mb-1.5">
              E-mail
            </label>
            <Input
              type="email"
              required
              placeholder="seu@email.com"
              className="bg-slate-900 border-slate-800 text-white placeholder:text-slate-500 h-10 sm:h-11 text-xs sm:text-sm rounded-xl"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-semibold text-slate-300 mb-1.5">
              Senha
            </label>
            <Input
              type="password"
              required
              placeholder="••••••••"
              className="bg-slate-900 border-slate-800 text-white placeholder:text-slate-500 h-10 sm:h-11 text-xs sm:text-sm rounded-xl"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <Button
            type="submit"
            className="w-full h-11 sm:h-12 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold shadow-lg shadow-blue-500/20 active:scale-[0.98] transition-all rounded-xl disabled:opacity-50"
            disabled={loading}
          >
            {loading ? "Acessando..." : "Entrar na Conta"}
          </Button>
        </form>

        <div className="mt-5 sm:mt-6 text-center">
          <p className="text-xs sm:text-[13px] text-slate-400">
            Ainda não tem conta?{" "}
            <a
              href="#/cadastro-parceiro"
              className="text-blue-500 font-semibold hover:underline"
            >
              Teste Grátis
            </a>
          </p>
        </div>
      </Card>
    </div>
  );
}
