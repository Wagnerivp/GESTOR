import React, { useState } from 'react';
import { Card, Button, Input } from '@/components/ui/Components';
import { api } from '@/lib/api';
import { supabase, isSupabaseConfigured } from '@/lib/db';
import { addDays } from 'date-fns';
import { Rocket, ShieldCheck, Store } from 'lucide-react';
import { useNavigate } from 'react-router';

export function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col font-sans relative overflow-hidden">
      {/* Background ambient glows */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-emerald-600/5 rounded-full blur-3xl pointer-events-none"></div>

      <header className="bg-slate-950/80 backdrop-blur-md py-4 sm:py-6 border-b border-slate-800/80 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex justify-between items-center">
          <div className="font-extrabold text-lg sm:text-2xl tracking-tighter text-white flex items-center gap-1.5 py-1 sm:py-2">
            <span className="bg-blue-600 text-white px-2 py-1 rounded-lg text-sm sm:text-lg font-black shadow-lg shadow-blue-600/20">GLJ</span>
            <span className="hidden xs:inline">Gestão <span className="text-blue-500">Lava Jatos</span></span>
            <span className="xs:hidden">Gestão <span className="text-blue-500">LJ</span></span>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <Button 
              variant="outline" 
              className="border-slate-800 bg-slate-900/50 text-slate-300 hover:text-white hover:bg-slate-800 hover:border-slate-700 h-9 sm:h-10 px-3 sm:px-5 text-xs sm:text-[13px] font-semibold transition-all rounded-xl"
              onClick={() => navigate('/login')}
            >
              Entrar
            </Button>
            <Button 
              className="bg-blue-600 text-white hover:bg-blue-700 h-9 sm:h-10 px-3 sm:px-5 text-xs sm:text-[13px] font-semibold transition-all shadow-lg shadow-blue-500/20 active:scale-95 rounded-xl hidden sm:inline-flex"
              onClick={() => navigate('/cadastro-parceiro')}
            >
              Criar Conta Grátis
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 py-12 sm:py-20 z-10">
        <div className="text-center w-full max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-slate-900 border border-slate-800 text-blue-400 px-3 py-1.5 rounded-full text-xs font-semibold mb-6 shadow-inner tracking-wide">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
            Plataforma Completa para Lava Jato
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-6xl font-black tracking-tight leading-tight mb-4 text-white max-w-4xl mx-auto">
            Selecione seu <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-blue-600">Acesso</span>
          </h1>
          <p className="text-sm sm:text-base md:text-lg text-slate-400 max-w-2xl mx-auto mb-10 sm:mb-14 leading-relaxed">
            Seja bem-vindo ao Gestão Lava Jatos. Escolha o portal para gerenciar ou acessar seus serviços.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-8 max-w-3xl mx-auto w-full">
            {/* Card Administrador */}
            <Card 
              className="bg-slate-900/40 border-slate-800/80 hover:border-blue-500/50 hover:bg-slate-900/80 transition-all p-6 sm:p-8 text-left cursor-pointer flex flex-col group rounded-3xl relative overflow-hidden backdrop-blur-sm"
              onClick={() => navigate('/login')}
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl group-hover:bg-blue-500/10 transition-all duration-500"></div>
              <div className="bg-slate-950/80 w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center mb-5 sm:mb-6 border border-slate-800 shadow-inner group-hover:border-blue-500/40 group-hover:shadow-blue-500/5 transition-all">
                <ShieldCheck className="w-6 h-6 sm:w-7 sm:h-7 text-blue-500 group-hover:scale-110 transition-transform duration-300" />
              </div>
              <h3 className="text-xl sm:text-2xl font-extrabold text-white mb-2 sm:mb-3 flex items-center gap-2">
                Administrador
              </h3>
              <p className="text-slate-400 text-xs sm:text-sm mb-6 sm:mb-8 flex-1 leading-relaxed">
                Acesso restrito para gerentes gerais da plataforma e donos do sistema de gestão integrada.
              </p>
              <Button 
                variant="outline" 
                className="w-full bg-slate-950 text-slate-300 border-slate-800 group-hover:border-blue-500/40 group-hover:text-white group-hover:bg-blue-600/10 h-11 sm:h-12 text-xs sm:text-sm font-semibold rounded-xl transition-all"
              >
                Acessar Painel Admin
              </Button>
            </Card>

            {/* Card Meu Lava Jato */}
            <Card 
              className="bg-slate-900/40 border-slate-800/80 hover:border-emerald-500/50 hover:bg-slate-900/80 transition-all p-6 sm:p-8 text-left cursor-pointer flex flex-col group rounded-3xl relative overflow-hidden backdrop-blur-sm"
              onClick={() => navigate('/login')}
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl group-hover:bg-emerald-500/10 transition-all duration-500"></div>
              <div className="bg-slate-950/80 w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center mb-5 sm:mb-6 border border-slate-800 shadow-inner group-hover:border-emerald-500/40 group-hover:shadow-emerald-500/5 transition-all">
                <Store className="w-6 h-6 sm:w-7 sm:h-7 text-emerald-500 group-hover:scale-110 transition-transform duration-300" />
              </div>
              <h3 className="text-xl sm:text-2xl font-extrabold text-white mb-2 sm:mb-3 flex items-center gap-2">
                Meu Lava Jato
              </h3>
              <p className="text-slate-400 text-xs sm:text-sm mb-6 sm:mb-8 flex-1 leading-relaxed">
                Portal operacional para gerenciar o fluxo diário, finanças, estoque e agendamentos de hoje.
              </p>
              <Button 
                className="w-full bg-blue-600 hover:bg-blue-700 text-white h-11 sm:h-12 text-xs sm:text-sm font-semibold rounded-xl shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 transition-all"
              >
                Entrar no Meu Lava Jato
              </Button>
            </Card>
          </div>
          
          <div className="mt-12 sm:mt-16 text-slate-500 text-xs sm:text-sm">
            Ainda não tem o sistema no seu Lava Jato? <button onClick={() => navigate('/cadastro-parceiro')} className="text-blue-500 hover:text-blue-400 hover:underline font-bold transition-colors">Criar conta grátis agora!</button>
          </div>
        </div>
      </main>
    </div>
  );
}

export function PartnerSignup() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ 
    nome: '', 
    slug: '', 
    endereco: '', 
    telefone: '',
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [errorStr, setErrorStr] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorStr('');

    try {
      let authUserId = null;

      // 1. Criar o Usuário na camada de Autenticação do Supabase (se configurado)
      if (isSupabaseConfigured && supabase) {
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            emailRedirectTo: window.location.origin + '/login'
          }
        });

        if (authError) {
          let msg = authError.message;
          if (msg.toLowerCase().includes("signups not allowed") || msg.toLowerCase().includes("email logins are disabled")) {
            msg = "ATENÇÃO: O Cadastro por Email está desativado no seu Supabase! Vá em Authentication > Providers > Email e habilite a opção 'Enable Email provider' e 'Enable Email Signups'.";
          } else if (msg.toLowerCase().includes("rate limit")) {
            msg = "Limite de e-mails excedido no Supabase. Aguarde alguns minutos ou use um e-mail diferente. (Para testes, você pode desativar a 'Confirmação de Email' nas configs do Supabase).";
          }
          throw new Error(msg);
        }
        
        // Verifica se precisa de confirmação
        if (authData.user && authData.user.identities && authData.user.identities.length === 0) {
           throw new Error("Este e-mail já está em uso ou precisa de confirmação.");
        }

        authUserId = authData.user?.id;
      }

      // 2. Verificar Slug
      const existing = await api.getTenantBySlug(formData.slug);
      if (existing) {
        setErrorStr("Este link (slug) já está em uso. Tente outro.");
        setLoading(false);
        return;
      }

      // 3. Cadastrar a Tabela Tenant
      const payload: any = {
        nome: formData.nome,
        slug: formData.slug,
        endereco: formData.endereco,
        telefone_whatsapp: formData.telefone,
        status_assinatura: 'GRATUITO',
        services_pricing: {
          'Lavagem Simples': 50,
          'Lavagem Completa': 80
        }
      };
      
      if (authUserId) {
        payload.owner_id = authUserId; // Vincula o Tenant ao usuário logado
      }

      if (!isSupabaseConfigured) {
        payload.data_vencimento = addDays(new Date(), 30).toISOString();
      }

      const newTenant = await api.createTenant(payload);
      
      setSuccess(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setTimeout(() => navigate('/login'), 4000);
    } catch (err: any) {
      console.error(err);
      setErrorStr(err.message || "Erro ao criar conta.");
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 sm:p-6 py-10 sm:py-16 font-sans relative overflow-hidden">
      {/* Background ambient glow */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>

      <Card className="max-w-md w-full p-5 sm:p-8 border-slate-800/80 bg-slate-900/40 backdrop-blur-md text-white rounded-3xl relative z-10">
        <div className="text-center mb-6 sm:mb-8">
          <div className="bg-blue-600/10 w-12 h-12 rounded-2xl flex items-center justify-center mb-4 mx-auto border border-blue-500/20">
            <Rocket className="w-6 h-6 text-blue-500" />
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">Crie sua Conta</h1>
          <p className="text-slate-400 mt-2 text-xs sm:text-sm">Você ganha 30 dias totalmente grátis para testar. Sem cartão de crédito necessário.</p>
        </div>

        {errorStr && (
           <div className="mb-4 p-3 bg-red-950/40 border border-red-900/50 text-red-400 rounded-xl text-xs sm:text-sm text-center">
             {errorStr}
           </div>
        )}

        {success && (
           <div className="mb-4 p-3 bg-green-950/40 border border-green-900/50 text-green-400 rounded-xl text-xs sm:text-sm text-center">
             Conta criada com sucesso! Verifique seu e-mail e faça login. Redirecionando...
           </div>
        )}

        <form onSubmit={handleSignup} className="space-y-4">
          <div>
            <label className="block text-xs sm:text-sm font-semibold text-slate-300 mb-1.5">Dados de Acesso (Login)</label>
            <div className="space-y-3 p-3 sm:p-4 bg-slate-950/60 rounded-xl border border-slate-800/80">
              <Input 
                type="email" 
                required 
                placeholder="E-mail" 
                className="bg-slate-900 border-slate-800 text-white placeholder:text-slate-500 h-10 text-[13px] rounded-lg"
                value={formData.email} 
                onChange={e => setFormData({...formData, email: e.target.value})} 
              />
              <Input 
                type="password" 
                required 
                placeholder="Crie uma nova senha" 
                className="bg-slate-900 border-slate-800 text-white placeholder:text-slate-500 h-10 text-[13px] rounded-lg"
                value={formData.password} 
                onChange={e => setFormData({...formData, password: e.target.value})} 
              />
            </div>
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-semibold text-slate-300 mb-1.5">Nome do Lava Jato</label>
            <Input 
              required 
              placeholder="Ex: Central Wash" 
              className="bg-slate-900 border-slate-800 text-white placeholder:text-slate-500 h-10 text-[13px] rounded-lg"
              value={formData.nome} 
              onChange={e => setFormData({...formData, nome: e.target.value})} 
            />
          </div>
          <div>
             <label className="block text-xs sm:text-sm font-semibold text-slate-300 mb-1.5">Link Exclusivo (Slug)</label>
             <div className="flex rounded-lg shadow-sm overflow-hidden border border-slate-800 bg-slate-900">
                <span className="inline-flex items-center px-2.5 sm:px-3 border-r border-slate-800 bg-slate-950 text-slate-400 text-xs sm:text-[13px] select-none">
                  app.com/
                </span>
                <Input 
                  required 
                  className="rounded-none border-0 bg-transparent text-white placeholder:text-slate-500 h-10 text-[13px]"
                  placeholder="centralwash" 
                  value={formData.slug} 
                  onChange={e => setFormData({...formData, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '')})} 
                />
             </div>
          </div>
          <div>
            <label className="block text-xs sm:text-sm font-semibold text-slate-300 mb-1.5">Endereço Completo</label>
            <Input 
              required 
              placeholder="Rua 1, Bairro..." 
              className="bg-slate-900 border-slate-800 text-white placeholder:text-slate-500 h-10 text-[13px] rounded-lg"
              value={formData.endereco} 
              onChange={e => setFormData({...formData, endereco: e.target.value})} 
            />
          </div>
          <div>
            <label className="block text-xs sm:text-sm font-semibold text-slate-300 mb-1.5">WhatsApp Comercial</label>
            <Input 
              required 
              placeholder="Ex: 5511999999999" 
              className="bg-slate-900 border-slate-800 text-white placeholder:text-slate-500 h-10 text-[13px] rounded-lg"
              value={formData.telefone} 
              onChange={e => setFormData({...formData, telefone: e.target.value})} 
            />
          </div>

          <Button 
            type="submit" 
            disabled={loading} 
            className="w-full mt-6 h-11 sm:h-12 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold shadow-lg shadow-blue-500/20 active:scale-[0.98] transition-all rounded-xl disabled:opacity-50"
          >
            {loading ? 'Criando sua conta...' : 'Finalizar Cadastro'}
          </Button>
        </form>

        <div className="mt-5 text-center text-xs text-slate-400">
          Já possui uma conta? <button onClick={() => navigate('/login')} className="text-blue-500 hover:underline font-semibold transition-colors">Faça Login</button>
        </div>
      </Card>
    </div>
  );
}
