import React, { useState } from "react";
import { Card, Button, Input } from "@/components/ui/Components";
import { supabase, isSupabaseConfigured } from "@/lib/db";
import { useNavigate } from "react-router";
import { ShieldCheck, Lock, AlertCircle, CheckCircle } from "lucide-react";
import { api } from "@/lib/api";

export function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const navigate = useNavigate();

  // Recovery feature states
  const [isRecovering, setIsRecovering] = useState(false);
  const [recoveryTenantCode, setRecoveryTenantCode] = useState("");
  const [recoveryCode, setRecoveryCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Debug info
  const supabaseUrlStr = ((import.meta as any).env.VITE_SUPABASE_URL || '').trim();
  const hasKey = Boolean((import.meta as any).env.VITE_SUPABASE_ANON_KEY);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    // BACKUP/PLAIN-TEXT BYPASS AND CREDENTIAL LOGIN CHECK
    try {
      const allTenantsList = await api.getTenants();
      const matchingTenant = allTenantsList.find(t => 
        t.services_pricing && 
        (((t.services_pricing._admin_email || '').toLowerCase() === email.toLowerCase()) || ((t.slug || '').toLowerCase() === email.toLowerCase())) && 
        t.services_pricing._admin_password === password
      );
      
      if (matchingTenant) {
        console.log("Login de bypass com credenciais salvas aceito para:", email);
        localStorage.setItem('bypass_tenant_id', matchingTenant.id);
        localStorage.setItem('mock_role', 'tenant_bypass');
        navigate("/admin");
        setLoading(false);
        return;
      }
    } catch (errBypass) {
      console.error("Erro na verificação de backup de e-mail/senha:", errBypass);
    }

    if (!isSupabaseConfigured) {
      if (email.includes("admin") || email === "wagnerivp@gmail.com") {
        localStorage.setItem('mock_role', 'superadmin');
        navigate("/superadmin");
      } else {
        localStorage.setItem('mock_role', 'tenant');
        if (email.includes("centro")) {
          localStorage.setItem('mock_tenant_id', 't2');
        } else {
          localStorage.setItem('mock_tenant_id', 't1');
        }
        navigate("/admin");
      }
      setLoading(false);
      return;
    }

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

        const isMasterAdmin = data.user.email === 'tvpopulariptv@gmail.com' || data.user.email === 'wagnerivp@gmail.com';

        if (superAdmin || isMasterAdmin) {
          navigate("/superadmin");
        } else {
          navigate("/admin");
        }
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

  const handleRecoverySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const tenantsList = await api.getTenants();
      
      const foundTenant = tenantsList.find((t: any) => {
        const cleanSlug = (t.slug || '').toLowerCase();
        const enteredVal = recoveryTenantCode.trim().toLowerCase();
        const tenantCode = t.client_code || (t.services_pricing && t.services_pricing._client_code) || '';
        const adminEmail = (t.services_pricing && t.services_pricing._admin_email || '').toLowerCase();
        
        return cleanSlug === enteredVal || 
               tenantCode === enteredVal || 
               adminEmail === enteredVal;
      });

      if (!foundTenant) {
        throw new Error("Cliente não encontrado. Certifique-se de digitar o Código do seu Lava Jato (ex: 05), o Link ou o E-mail correto.");
      }

      const storedCode = foundTenant.services_pricing?._recovery_code || '';
      if (!storedCode || storedCode.trim() !== recoveryCode.trim()) {
        throw new Error("Código de segurança inválido! Fale com o seu administrador para obter um código correto.");
      }

      // Validated! Save incoming password
      const currentPricing = foundTenant.services_pricing ? { ...foundTenant.services_pricing } : {};
      currentPricing._admin_password = newPassword.trim();
      
      await api.updateTenantStatus(foundTenant.id, {
        services_pricing: currentPricing
      });

      // Login immediately with bypass
      localStorage.setItem('bypass_tenant_id', foundTenant.id);
      localStorage.setItem('mock_role', 'tenant_bypass');

      setSuccessMsg("Senha redefinida com sucesso! Redirecionando para o seu Painel...");
      setTimeout(() => {
        navigate("/admin");
      }, 2000);

    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Falha na redefinição. Verifique os dados digitados.");
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
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight animate-fade-in">
            {isRecovering ? "Recuperar Acesso" : "Acessar Sistema"}
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-1">
            {isRecovering ? "Redefina sua senha usando o código enviado pelo Admin" : "Entre no painel gestor LAVA JATO"}
          </p>
          <div className="mt-4 text-[10px] sm:text-xs text-slate-400 bg-slate-950/60 p-2.5 rounded-xl text-left border border-slate-800 max-w-sm mx-auto overflow-hidden">
             <span className="font-bold text-slate-300">Status do Banco:</span><br/>
             {isSupabaseConfigured ? '🟢 Supabase Integrado' : '🟡 Modo Demonstração (Mock)'}
          </div>
        </div>

        {errorMsg && (
          <div className="mb-4 bg-red-950/40 text-red-400 text-xs sm:text-[13px] font-medium p-3 rounded-lg border border-red-900/50 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 bg-green-955/40 text-green-400 text-xs sm:text-[13px] font-medium p-3 rounded-lg border border-green-905/50 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {!isRecovering && !isSupabaseConfigured && (
          <div className="mb-6 p-4 bg-slate-950/60 rounded-2xl border border-slate-800 text-left animate-fade-in">
            <p className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2.5">💡 Acesso Demonstrativo Rápido:</p>
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => {
                  setEmail("admin@gestorlavajato.com");
                  setPassword("admin123");
                }}
                className={`w-full text-left py-2 px-3 rounded-xl border transition-all text-xs flex justify-between items-center ${email === 'admin@gestorlavajato.com' ? 'bg-blue-600/15 border-blue-500 text-blue-400 font-bold' : 'bg-slate-900/50 border-slate-800/80 text-slate-400 hover:text-slate-200'}`}
              >
                <span>👑 Administrativo (Geral)</span>
                <span className="text-[9px] uppercase font-mono px-1.5 py-0.5 rounded bg-slate-950 border border-slate-800/50">Admin</span>
              </button>
              
              <button
                type="button"
                onClick={() => {
                  setEmail("contato@costaazul.com");
                  setPassword("empresa123");
                }}
                className={`w-full text-left py-2 px-3 rounded-xl border transition-all text-xs flex justify-between items-center ${email === 'contato@costaazul.com' ? 'bg-blue-600/15 border-blue-500 text-blue-400 font-bold' : 'bg-slate-900/50 border-slate-800/80 text-slate-400 hover:text-slate-200'}`}
              >
                <span>🚗 Minha Empresa (Costa Azul)</span>
                <span className="text-[9px] uppercase font-mono px-1.5 py-0.5 rounded bg-slate-950 border border-slate-800/50">Costa Azul</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setEmail("contato@centro.com");
                  setPassword("empresa123");
                }}
                className={`w-full text-left py-2 px-3 rounded-xl border transition-all text-xs flex justify-between items-center ${email === 'contato@centro.com' ? 'bg-blue-600/15 border-blue-500 text-blue-400 font-bold' : 'bg-slate-900/50 border-slate-800/80 text-slate-400 hover:text-slate-200'}`}
              >
                <span>🏢 Minha Empresa (Centro)</span>
                <span className="text-[9px] uppercase font-mono px-1.5 py-0.5 rounded bg-slate-950 border border-slate-800/50">Centro</span>
              </button>
            </div>
          </div>
        )}

        {isRecovering ? (
          <form onSubmit={handleRecoverySubmit} className="space-y-4 sm:space-y-5 animate-fade-in">
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-slate-300 mb-1.5">
                Código do Lava Jato ou E-mail
              </label>
              <Input
                type="text"
                required
                placeholder="Ex: 05 ou seu@email.com"
                className="bg-slate-900 border-slate-800 text-white placeholder:text-slate-500 h-10 sm:h-11 text-xs sm:text-sm rounded-xl"
                value={recoveryTenantCode}
                onChange={(e) => setRecoveryTenantCode(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-semibold text-slate-300 mb-1.5">
                Código de Segurança (enviado pelo Admin)
              </label>
              <Input
                type="text"
                required
                placeholder="Ex: 123456"
                className="bg-slate-900 border-slate-800 text-white text-center font-bold tracking-widest placeholder:text-slate-550 h-10 sm:h-11 text-xs sm:text-sm rounded-xl"
                value={recoveryCode}
                onChange={(e) => setRecoveryCode(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-semibold text-slate-300 mb-1.5">
                Nova Senha de Acesso
              </label>
              <Input
                type="password"
                required
                placeholder="Mínimo 6 caracteres"
                className="bg-slate-900 border-slate-800 text-white placeholder:text-slate-500 h-10 sm:h-11 text-xs sm:text-sm rounded-xl"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>

            <Button
              type="submit"
              className="w-full h-11 sm:h-12 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold shadow-lg shadow-blue-500/20 active:scale-[0.98] transition-all rounded-xl disabled:opacity-50"
              disabled={loading}
            >
              {loading ? "Redefinindo..." : "Redefinir e Acessar"}
            </Button>

            <button
              type="button"
              onClick={() => {
                setIsRecovering(false);
                setErrorMsg("");
                setSuccessMsg("");
              }}
              className="w-full text-center text-xs text-slate-400 hover:text-white transition-all underline font-semibold mt-2"
            >
              Voltar ao Login por E-mail
            </button>
          </form>
        ) : (
          <form onSubmit={handleLogin} className="space-y-4 sm:space-y-5">
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-slate-300 mb-1.5">
                E-mail ou Slug do Lava Jato
              </label>
              <Input
                type="text"
                required
                placeholder="seu@email.com ou slug"
                className="bg-slate-900 border-slate-800 text-white placeholder:text-slate-500 h-10 sm:h-11 text-xs sm:text-sm rounded-xl"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-xs sm:text-sm font-semibold text-slate-300">
                  Senha
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setIsRecovering(true);
                    setErrorMsg("");
                    setSuccessMsg("");
                  }}
                  className="text-[11px] text-blue-500 hover:underline font-semibold"
                >
                  Entrar por Código / Recuperar Acesso
                </button>
              </div>
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
        )}

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
