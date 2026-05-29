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
    <div className="min-h-screen bg-slate-900 flex flex-col font-sans">
      <header className="bg-slate-900 py-6 border-b border-slate-800">
        <div className="max-w-6xl mx-auto px-6 flex justify-between items-center">
          <div className="font-black text-2xl tracking-tighter text-white border border-slate-700 p-2 rounded-xl">
            Lava<span className="text-blue-500">Gestor</span>
          </div>
          <div className="space-x-4">
            <Button variant="outline" className="border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800" onClick={() => navigate('/login')}>Login</Button>
            <Button className="bg-blue-600 text-white hover:bg-blue-700" onClick={() => navigate('/cadastro-parceiro')}>Criar Conta Grátis</Button>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-6 py-20">
        <div className="text-center w-full">
          <h1 className="text-4xl md:text-6xl font-extrabold max-w-4xl mx-auto tracking-tight leading-tight mb-4 text-white">
            Selecione seu <span className="text-blue-500">Acesso</span>
          </h1>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto mb-12">
            Bem-vindo ao Lava Gestor. Escolha como deseja acessar a plataforma.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto w-full">
            <Card className="bg-slate-800 border-slate-700 hover:bg-slate-750 transition-all p-8 text-left cursor-pointer flex flex-col group" onClick={() => navigate('/login')}>
               <div className="bg-slate-900/50 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 border border-slate-700 group-hover:border-blue-500/50 transition-colors">
                  <ShieldCheck className="w-8 h-8 text-blue-500" />
               </div>
               <h3 className="text-2xl font-bold text-white mb-3">Administrador</h3>
               <p className="text-slate-400 text-base mb-8 flex-1 leading-relaxed">Acesso restrito para administradores e gestores gerais da plataforma Lava Gestor.</p>
               <Button variant="outline" className="w-full bg-slate-900 border-slate-700 text-slate-300 group-hover:text-white group-hover:border-slate-600 h-12 text-md font-medium">Acessar Admin</Button>
            </Card>

            <Card className="bg-slate-800 border-slate-700 hover:bg-slate-750 transition-all p-8 text-left cursor-pointer flex flex-col group" onClick={() => navigate('/login')}>
               <div className="bg-slate-900/50 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 border border-slate-700 group-hover:border-emerald-500/50 transition-colors">
                  <Store className="w-8 h-8 text-emerald-500" />
               </div>
               <h3 className="text-2xl font-bold text-white mb-3">Meu Lava Jato</h3>
               <p className="text-slate-400 text-base mb-8 flex-1 leading-relaxed">Exclusivo para clientes que assinam o plano LAVA GESTOR. Gerencie clientes, finanças e agendamentos.</p>
               <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white h-12 text-md font-medium shadow-lg shadow-blue-500/20">Acessar Meu Lava Jato</Button>
            </Card>
          </div>
          
          <div className="mt-16 text-slate-500 text-sm">
             Ainda não tem o sistema no seu Lava Jato? <button onClick={() => navigate('/cadastro-parceiro')} className="text-blue-500 hover:underline font-medium">Criar conta grátis agora!</button>
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
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-6 py-12">
      <Card className="max-w-md w-full p-8 border-slate-200">
        <div className="text-center mb-8">
          <Rocket className="w-12 h-12 text-blue-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-slate-800">Crie sua Conta</h1>
          <p className="text-slate-500 mt-2 text-sm">Você ganha 30 dias totalmente grátis para testar. Sem cartão de crédito.</p>
        </div>

        {errorStr && (
           <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded text-sm text-center">
             {errorStr}
           </div>
        )}

        {success && (
           <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded text-sm text-center">
             Conta criada com sucesso! Verifique seu e-mail (caso tenha ativado a confirmação) e faça login. Redirecionando...
           </div>
        )}

        <form onSubmit={handleSignup} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Dados de Acesso (Login)</label>
            <div className="space-y-3 p-4 bg-slate-50 rounded-xl border border-slate-100">
              <Input type="email" required placeholder="E-mail" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
              <Input type="password" required placeholder="Crie uma senha" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Nome do Lava Jato</label>
            <Input required placeholder="Ex: Central Wash" value={formData.nome} onChange={e => setFormData({...formData, nome: e.target.value})} />
          </div>
          <div>
             <label className="block text-sm font-semibold text-slate-700 mb-1.5">Link Exclusivo (Slug)</label>
             <div className="flex rounded-md shadow-sm">
                <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-slate-200 bg-slate-50 text-slate-500 text-[13px]">
                  app.com/
                </span>
                <Input required className="rounded-l-none" placeholder="centralwash" value={formData.slug} onChange={e => setFormData({...formData, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '')})} />
             </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Endereço Completo</label>
            <Input required placeholder="Rua 1, Bairro..." value={formData.endereco} onChange={e => setFormData({...formData, endereco: e.target.value})} />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Seu WhatsApp</label>
            <Input required placeholder="5511999999999" value={formData.telefone} onChange={e => setFormData({...formData, telefone: e.target.value})} />
          </div>

          <Button type="submit" disabled={loading} className="w-full mt-6 h-12 bg-blue-600 hover:bg-blue-700 disabled:opacity-50">
            {loading ? 'Processando...' : 'Finalizar Cadastro'}
          </Button>
        </form>
      </Card>
    </div>
  );
}
