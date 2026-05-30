import React, { useState, useEffect } from 'react';
import { Card, Button, Input } from '@/components/ui/Components';
import { api } from '@/lib/api';
import { supabase, isSupabaseConfigured } from '@/lib/db';
import { formatBRPhone } from '@/lib/utils';
import { addDays } from 'date-fns';
import { Rocket, ShieldCheck, Store, UserCircle, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router';

export function LandingPage() {
  const navigate = useNavigate();
  const [tenants, setTenants] = useState<any[]>([]);
  const [selectedTenantSlug, setSelectedTenantSlug] = useState('');

  useEffect(() => {
    api.getTenants().then(data => {
      setTenants(data || []);
      if (data && data.length > 0) {
        setSelectedTenantSlug(data[0].slug);
      }
    }).catch(console.error);
  }, []);

  const enterAsAdmin = () => {
    localStorage.setItem('mock_role', 'superadmin');
    navigate('/login');
  };

  const enterAsCompany = () => {
    localStorage.setItem('mock_role', 'tenant');
    localStorage.setItem('mock_tenant_id', 't1'); // Default fallback is Costa Azul
    navigate('/login');
  };

  const enterAsCustomer = () => {
    if (selectedTenantSlug) {
      navigate(`/${selectedTenantSlug}`);
    } else {
      navigate('/costa-azul');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center font-sans relative overflow-hidden p-4">
      {/* Dynamic ambient backgrounds */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute top-1/3 left-1/3 w-[300px] h-[300px] bg-emerald-600/5 rounded-full blur-[100px] pointer-events-none"></div>

      {/* Main Container */}
      <div className="text-center z-10 max-w-lg w-full flex flex-col items-center animate-fade-in px-4">
        {/* Subtle logo insignia */}
        <div className="font-extrabold text-sm sm:text-base tracking-widest text-slate-500 flex items-center gap-2 mb-8 select-none">
          <span className="bg-blue-600 text-white px-2 py-0.5 rounded-md text-[11px] font-black shadow-lg shadow-blue-600/20">GLJ</span>
          <span>GESTOR LAVA JATO</span>
        </div>

        {/* Dynamic Interactive Call to Action */}
        <button
          type="button"
          id="btn-signup-main"
          onClick={() => navigate('/cadastro-parceiro')}
          className="group relative w-full bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 text-white font-black text-lg sm:text-2xl py-6 px-8 rounded-2xl shadow-2xl shadow-blue-500/20 hover:shadow-blue-500/40 active:scale-[0.98] transition-all duration-300 ease-out border border-blue-400/30 overflow-hidden cursor-pointer"
        >
          {/* Shine effect overlay */}
          <div className="absolute inset-0 w-1/2 h-full bg-white/10 transform -skew-x-12 -translate-x-full group-hover:animate-shine pointer-events-none"></div>
          
          <span className="relative z-10 block tracking-wider uppercase font-sans">
            CADASTRE SUA EMPRESA AGORA
          </span>
          <span className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[9px] font-bold text-blue-200 tracking-widest opacity-0 group-hover:opacity-100 transition-opacity duration-350">
            CLIQUE PARA COMEÇAR 30 DIAS GRÁTIS
          </span>
        </button>

        {/* Discretionary stealth link for system administration */}
        <div className="mt-12 select-none">
          <button 
            type="button"
            id="btn-stealth-login"
            onClick={() => navigate('/login')} 
            className="text-slate-600 hover:text-slate-400 text-xs font-semibold tracking-wider transition-colors uppercase border-b border-transparent hover:border-slate-500 pb-0.5"
          >
            Acessar Painel
          </button>
        </div>
      </div>
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
      const cleanDigits = formData.telefone.replace(/\D/g, '');
      const finalPhone = cleanDigits.startsWith('55') && cleanDigits.length > 10 ? cleanDigits : '55' + cleanDigits;

      const payload: any = {
        nome: formData.nome,
        slug: formData.slug,
        endereco: formData.endereco,
        telefone_whatsapp: finalPhone,
        status_assinatura: 'GRATUITO',
        services_pricing: {
          'Lavagem Simples': 50,
          'Lavagem Completa': 80,
          '_admin_email': formData.email,
          '_admin_password': formData.password,
          '_recovery_code': Math.floor(100000 + Math.random() * 900000).toString()
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
                  placeholder="NOME DO MEU COMERCIO" 
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
            <div className="relative flex items-center">
              <span className="absolute left-3 flex items-center select-none pointer-events-none text-base border-r border-slate-800 pr-2.5 h-5 text-slate-400">
                🇧🇷
              </span>
              <Input 
                required 
                placeholder="(11) 99999-9999" 
                className="bg-slate-900 border-slate-800 text-white placeholder:text-slate-500 h-10 text-[13px] rounded-lg pl-12 w-full"
                value={formatBRPhone(formData.telefone)} 
                onChange={e => {
                  const rawValue = e.target.value.replace(/\D/g, '');
                  let stripped = rawValue;
                  if (rawValue.startsWith('55') && rawValue.length > 10) {
                    stripped = rawValue.substring(2);
                  }
                  if (stripped.length <= 11) {
                    setFormData({...formData, telefone: stripped});
                  }
                }} 
              />
            </div>
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
