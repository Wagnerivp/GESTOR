import React, { useState, useEffect } from 'react';
import { Card, Button, Badge, Input } from '@/components/ui/Components';
import { api } from '@/lib/api';
import { supabase, isSupabaseConfigured } from '@/lib/db';
import { cn, getFriendlyUrl, formatBRPhone, getTenantCode } from '@/lib/utils';
import { differenceInDays, addDays, parseISO } from 'date-fns';
import { Search, Settings, CalendarClock, ShieldCheck, LogOut, Copy, ExternalLink, UserPlus, Key, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router';

export function SuperAdminDashboard() {
  const [tenants, setTenants] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const navigate = useNavigate();
  const [copiedSignupLink, setCopiedSignupLink] = useState(false);
  const [signupFormPhone, setSignupFormPhone] = useState('');
  const [signupFormName, setSignupFormName] = useState('');
  const [quickCodeInput, setQuickCodeInput] = useState('');
  const [isRealSuperAdmin, setIsRealSuperAdmin] = useState<boolean>(true);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // States for Customer Details modal
  const [selectedTenantForDetails, setSelectedTenantForDetails] = useState<any | null>(null);
  const [isSavingDetails, setIsSavingDetails] = useState(false);
  const [editEmail, setEditEmail] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editRecoveryCode, setEditRecoveryCode] = useState('');

  const handleOpenDetailsModal = (tenant: any) => {
    setSelectedTenantForDetails(tenant);
    const pricing = tenant.services_pricing || {};
    const emailVal = pricing._admin_email || `${tenant.slug}@gestorlavajato.com.br`;
    const pwdVal = pricing._admin_password || `senha${getTenantCode(tenant) || '123'}`;
    const codeVal = pricing._recovery_code || Math.floor(100000 + Math.random() * 900000).toString();
    
    setEditEmail(emailVal);
    setEditPassword(pwdVal);
    setEditRecoveryCode(codeVal);
  };

  const handleRegenerateRecoveryCode = () => {
    const codeVal = Math.floor(100000 + Math.random() * 900000).toString();
    setEditRecoveryCode(codeVal);
  };

  const handleSaveDetails = async () => {
    if (!selectedTenantForDetails) return;
    setIsSavingDetails(true);
    try {
      const currentPricing = selectedTenantForDetails.services_pricing ? { ...selectedTenantForDetails.services_pricing } : {};
      currentPricing._admin_email = editEmail;
      currentPricing._admin_password = editPassword;
      currentPricing._recovery_code = editRecoveryCode;
      
      await api.updateTenantStatus(selectedTenantForDetails.id, {
        services_pricing: currentPricing
      });
      
      alert("Dados do cliente atualizados com sucesso!");
      setSelectedTenantForDetails(null);
      loadData();
    } catch (err: any) {
      console.error(err);
      alert("Erro ao salvar dados do cliente: " + (err.message || err));
    } finally {
      setIsSavingDetails(false);
    }
  };

  const loadData = async () => {
    try {
      if (isSupabaseConfigured) {
        const { data: { user } } = await supabase!.auth.getUser();
        if (!user) {
           navigate('/login');
           return;
        }
        setCurrentUser(user);
        
        const { data: sa } = await supabase!
          .from('super_admins')
          .select('id')
          .eq('id', user.id)
          .maybeSingle();
          
        const isMaster = user.email === 'tvpopulariptv@gmail.com' || user.email === 'wagnerivp@gmail.com';
        setIsRealSuperAdmin(!!sa || isMaster);
      }
      const dbTenants = await api.getTenants();
      setTenants(dbTenants);
    } catch (e) {
      console.error(e);
    }
  };

  const handleLogout = async () => {
    if (isSupabaseConfigured) {
      await supabase!.auth.signOut();
    }
    navigate('/login');
  };

  useEffect(() => {
    loadData();
    if (!isSupabaseConfigured) {
      window.addEventListener('localDataChanged', loadData);
      return () => window.removeEventListener('localDataChanged', loadData);
    }
  }, []);

  const handleActivateMonth = async (id: string, currentDueDate: string) => {
    const newDate = addDays(new Date(), 30).toISOString();
    try {
      await api.updateTenantStatus(id, { status_assinatura: 'PAGO', data_vencimento: newDate });
      loadData();
    } catch (err) {
      console.error("Erro ao atualizar no banco de dados (Verifique as políticas de RLS).", err);
    }
  };

  const handleActivateTest = async (id: string) => {
    const newDate = addDays(new Date(), 30).toISOString();
    try {
      await api.updateTenantStatus(id, { status_assinatura: 'GRATUITO', data_vencimento: newDate });
      loadData();
    } catch (err) {
      console.error("Erro ao atualizar no banco de dados (Verifique as políticas de RLS).", err);
    }
  };

  const handleDeleteTenant = async (id: string, name: string) => {
    const confirmed = window.confirm(
      `Tem certeza absoluta de que deseja excluir TOTALMENTE o cliente "${name}" do sistema?\n\nEsta ação é irreversível e excluirá todos os agendamentos, clientes, estoque e finanças vinculados! O código dele ficará disponível para reutilização no próximo cadastro para não perdermos número.`
    );
    if (confirmed) {
      try {
        // Optimistically filter the state so that the tenant disappears immediately from the screen!
        setTenants(prev => prev.filter(t => t.id !== id));

        await api.deleteTenant(id);
        alert(`O cliente "${name}" foi totalmente excluído com sucesso do Supabase e do sistema local!`);
        loadData();
      } catch (err: any) {
        console.error("Erro ao deletar tenant:", err);
        alert(`Erro ao excluir o acesso: ${err?.message || err}`);
        // If an error occurs, restore the state by reloading data
        loadData();
      }
    }
  };

  const filteredTenants = tenants.filter(t => t.nome.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
      <header className="bg-slate-900 text-white p-6 shadow-md">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-bold">GLJ</div>
            <span className="font-bold text-xl tracking-tight">gestor <span className="text-blue-500 uppercase font-black">LAVA JATO</span> <span className="text-xs bg-blue-600/20 text-blue-400 border border-blue-500/30 px-2 py-0.5 rounded ml-2 font-mono">ADMINISTRATIVO</span></span>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-sm text-slate-400">Controle Financeiro e SaaS</div>
            <button onClick={handleLogout} className="text-slate-400 hover:text-white transition-colors">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {isSupabaseConfigured && !isRealSuperAdmin && (
        <div className="bg-amber-100/90 border-b border-amber-300 p-5 text-amber-950 text-sm shadow-inner">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-start gap-3">
              <span className="text-2xl mt-0.5">🔑</span>
              <div className="text-left animate-fade-in">
                <p className="font-extrabold text-base text-amber-950">Ativar Permissões de Super Administrador no Supabase</p>
                <p className="text-amber-900 text-xs mt-1 leading-relaxed">
                  Para poder <strong>excluir e gerenciar clientes completamente no Supabase</strong>, você precisa dar essa permissão aos e-mails administradores executando o comando SQL abaixo uma única vez no painel do seu Supabase:
                </p>
                <div className="my-2 p-3 bg-slate-950 text-slate-200 rounded-xl font-mono text-[11px] overflow-auto max-h-40 border border-slate-800">
                  <pre>{`-- CLIQUE NO 'SQL EDITOR' NO SEU PAINEL SUPABASE, COLE E EXECUTE ESTE SCRIPT:

-- 1. Cria a validação automática para os e-mails de administração oficial (Sem erros de permissão auth.users!)
CREATE OR REPLACE FUNCTION public.is_super_admin(user_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (SELECT 1 FROM public.super_admins WHERE id = user_id) 
         OR coalesce(auth.jwt() ->> 'email', '') IN ('tvpopulariptv@gmail.com', 'wagnerivp@gmail.com');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Recria os privilégios corretos de segurança para poder deletar tenants
DROP POLICY IF EXISTS "Super admins can delete tenants" ON public.tenants;
CREATE POLICY "Super admins can delete tenants" ON public.tenants FOR DELETE USING (
  public.is_super_admin(auth.uid())
);

-- 3. Registra o seu usuário atual como Administrador oficial fisicamente
INSERT INTO public.super_admins (id, email) 
VALUES ('${currentUser?.id || 'SEU-ID'}', '${currentUser?.email || 'tvpopulariptv@gmail.com'}') 
ON CONFLICT (id) DO NOTHING;

-- 4. Cria a função segurança (Security Definer) para permitir excluir usuário na tabela auth.users pelo e-mail
CREATE OR REPLACE FUNCTION public.delete_auth_user_by_email(email_to_delete text)
RETURNS void AS $$
BEGIN
  -- Permite apenas se quem está chamando for um Super Admin oficial
  IF public.is_super_admin(auth.uid()) THEN
    DELETE FROM auth.users WHERE email = email_to_delete;
  ELSE
    RAISE EXCEPTION 'Acesso negado. Apenas super administradores podem executar esta ação.';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;`}</pre>
                </div>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs h-10 px-5 rounded-2xl transition-all shadow-md shrink-0 flex items-center gap-1.5 self-end md:self-center cursor-pointer"
              onClick={() => {
                const sql = `-- CLIQUE NO 'SQL EDITOR' MOSTRADO NO SEU PAINEL SUPABASE, COLE E EXECUTE ESTE SCRIPT COMPLETO:\n\nCREATE OR REPLACE FUNCTION public.is_super_admin(user_id uuid)\nRETURNS boolean AS $$\nBEGIN\n  RETURN EXISTS (SELECT 1 FROM public.super_admins WHERE id = user_id) \n         OR coalesce(auth.jwt() ->> 'email', '') IN ('tvpopulariptv@gmail.com', 'wagnerivp@gmail.com');\nEND;\n$$ LANGUAGE plpgsql SECURITY DEFINER;\n\nDROP POLICY IF EXISTS "Super admins can delete tenants" ON public.tenants;\nCREATE POLICY "Super admins can delete tenants" ON public.tenants FOR DELETE USING (\n  public.is_super_admin(auth.uid())\n);\n\nINSERT INTO public.super_admins (id, email) \nVALUES ('${currentUser?.id || 'SEU-ID'}', '${currentUser?.email || 'tvpopulariptv@gmail.com'}') \nON CONFLICT (id) DO NOTHING;\n\nCREATE OR REPLACE FUNCTION public.delete_auth_user_by_email(email_to_delete text)\nRETURNS void AS $$\nBEGIN\n  IF public.is_super_admin(auth.uid()) THEN\n    DELETE FROM auth.users WHERE email = email_to_delete;\n  ELSE\n    RAISE EXCEPTION 'Acesso negado. Apenas super administradores podem executar esta ação.';\n  END IF;\nEND;\n$$ LANGUAGE plpgsql SECURITY DEFINER;`;
                navigator.clipboard.writeText(sql);
                alert("COMANDO SQL COPIADO!\n\nAgora vá no painel do seu Supabase, clique em 'SQL Editor' no menu lateral esquerdo, clique em '+ New Query' (ou New Query), cole (Ctrl+V) este comando e clique no botão 'Run' no canto inferior direito para rodar!\n\nAssim que fizer isso, seu e-mail estará plenamente autorizado a excluir clientes, e excluir um cliente também irá apagar sua conta administrativa antiga imediatamente para liberar o e-mail de novo!");
              }}
            >
              <Copy className="w-3.5 h-3.5" />
              Copiar Script SQL Oficial
            </Button>
          </div>
        </div>
      )}

      <main className="flex-1 max-w-7xl w-full mx-auto p-8">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Gestão de Parceiros SaaS</h1>
            <p className="text-slate-500 text-sm mt-1">Gerencie as assinaturas e acessos dos seus clientes.</p>
          </div>
          <div className="w-72 relative">
            <Search className="w-5 h-5 absolute left-3 top-2.5 text-slate-400" />
            <Input 
              placeholder="Buscar Lava Jato..." 
              className="pl-10"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Link de Cadastro para Enviar para Donos de Lava Jatos */}
        <div className="bg-blue-50 border border-blue-200 rounded-3xl p-5 sm:p-6 mb-8 text-left shadow-sm">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-5 pb-4 border-b border-blue-100">
            <div>
              <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-blue-600" />
                Link de Cadastro para Donos de Lava-Jatos
              </h3>
              <p className="text-xs sm:text-[13px] text-slate-600 mt-1 max-w-xl">
                Você não precisa gerenciar cada lava jato. Envie este link abaixo para o dono do lava-jato fazer o cadastro por conta própria. Ele criará a conta, a senha e gerenciará o próprio sistema.
              </p>
            </div>
            
            <div className="flex items-center gap-2 shrink-0 bg-white p-2 rounded-2xl border border-blue-100 shadow-sm w-full lg:w-auto">
              <span className="text-xs font-mono font-bold text-blue-600 truncate max-w-[180px] sm:max-w-xs select-all bg-slate-50 p-1.5 px-3 rounded-lg border border-slate-150">
                {getFriendlyUrl('/#/cadastro-parceiro')}
              </span>
              <Button 
                onClick={() => {
                  navigator.clipboard.writeText(getFriendlyUrl('/#/cadastro-parceiro'));
                  setCopiedSignupLink(true);
                  setTimeout(() => setCopiedSignupLink(false), 2000);
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs h-9 px-4 rounded-xl transition-all shadow-sm shrink-0"
              >
                {copiedSignupLink ? "Copiado!" : "Copiar Link"}
              </Button>
              <a 
                href={getFriendlyUrl('/#/cadastro-parceiro')}
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-400 hover:text-blue-600 p-2 transition-colors shrink-0"
                title="Abrir Página de Cadastro"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
            <div className="md:col-span-4">
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Nome do Dono (Opcional)
              </label>
              <Input
                type="text"
                value={signupFormName}
                onChange={(e) => setSignupFormName(e.target.value)}
                placeholder="Ex do dono: Roberto Araújo"
                className="bg-white border-slate-200 text-slate-800 text-xs sm:text-sm h-10.5 rounded-xl shadow-inner"
              />
            </div>
            <div className="md:col-span-4">
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                WhatsApp do Dono (com DDD)
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-3.5 flex items-center select-none pointer-events-none text-base border-r border-slate-200/80 pr-2 h-5 text-slate-400">
                  🇧🇷
                </span>
                <Input
                  type="text"
                  value={formatBRPhone(signupFormPhone)}
                  onChange={(e) => {
                    const rawValue = e.target.value.replace(/\D/g, '');
                    // Strip 55 if pasted by accident
                    let stripped = rawValue;
                    if (rawValue.startsWith('55') && rawValue.length > 10) {
                      stripped = rawValue.substring(2);
                    }
                    if (stripped.length <= 11) {
                      setSignupFormPhone(stripped);
                    }
                  }}
                  placeholder="(11) 99999-9999"
                  className="bg-white border-slate-200 text-slate-800 text-xs sm:text-sm font-mono h-10.5 rounded-xl shadow-inner pl-12.5 w-full"
                />
              </div>
            </div>
            <div className="md:col-span-4 flex gap-2">
              <Button
                onClick={() => {
                  if (!signupFormPhone) {
                    alert("Digite o número de WhatsApp com DDD para enviar o convite!");
                    return;
                  }
                  const rawDigits = signupFormPhone.replace(/\D/g, '');
                  const cleanPhone = (rawDigits.startsWith('55') && rawDigits.length > 10) ? rawDigits : '55' + rawDigits;
                  const saudacao = signupFormName ? `Olá *${signupFormName}*!` : 'Olá!';
                  const msg = `${saudacao} Tenho ótimas notícias para o seu Lava Jato! 🚗✨\n\nCrie a sua conta na plataforma *Gestor Lava Jato* para gerenciar seus agendamentos automaticamente, controlar seu caixa, fluxo de clientes e estoque.\n\nVocê ganha 30 dias de teste grátis! Registre-se agora pelo link exclusivo:\n\n${getFriendlyUrl('/#/cadastro-parceiro')}`;
                  window.open(`https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(msg)}`, '_blank');
                }}
                className="w-1/2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-10.5 rounded-xl flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-600/10 transition-all active:scale-95"
              >
                Mandar p/ WhatsApp
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  const saudacao = signupFormName ? `Olá *${signupFormName}*!` : 'Olá!';
                  const msg = `${saudacao} Tenho ótimas notícias para o seu Lava Jato! 🚗✨\n\nCrie a sua conta na plataforma *Gestor Lava Jato* para gerenciar seus agendamentos automaticamente, controlar seu caixa, fluxo de clientes e estoque.\n\nVocê ganha 30 dias de teste grátis! Registre-se agora pelo link exclusivo:\n\n${getFriendlyUrl('/#/cadastro-parceiro')}`;
                  navigator.clipboard.writeText(msg);
                  alert("Mensagem de convite copiada com sucesso para a área de transferência!");
                }}
                className="w-1/2 border-slate-200 bg-white text-slate-700 font-bold text-xs h-10.5 rounded-xl hover:bg-slate-50 hover:text-slate-900 transition-all active:scale-95"
              >
                Copiar Texto
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredTenants.map((tenant) => {
            const diasRestantes = differenceInDays(parseISO(tenant.data_vencimento), new Date());
            const isBlocked = tenant.status_assinatura === 'BLOQUEADO' || diasRestantes < 0;
            const statusBadgeVariant = isBlocked ? 'danger' : (tenant.status_assinatura === 'PAGO' ? 'success' : 'warning');
            const displayStatus = isBlocked ? 'BLOQUEADO' : tenant.status_assinatura;

            return (
              <Card key={tenant.id} className="p-5 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-bold text-slate-900">{tenant.nome}</h3>
                      <p className="text-xs text-slate-500">/{tenant.slug}</p>
                      <div className="mt-1 flex items-center gap-1">
                        <span className="text-[10px] font-bold text-slate-400">CÓDIGO:</span>
                        <span className="text-[11px] font-mono font-bold text-blue-600 bg-blue-50/50 border border-blue-100 px-1.5 py-0.5 rounded shadow-sm">
                          {getTenantCode(tenant)}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <Badge variant={statusBadgeVariant}>{displayStatus}</Badge>
                    </div>
                  </div>
                  
                  <div className="mb-6">
                    <div className="flex justify-between text-xs mb-1">
                      <span className={isBlocked ? "text-red-600 font-semibold" : "text-slate-500"}>Expiração</span>
                      <span className={cn("font-bold transition-all", isBlocked ? "text-red-700" : (diasRestantes <= 2 ? "text-red-600 animate-pulse font-extrabold text-[13px]" : "text-slate-700"))}>
                        {diasRestantes < 0 ? 'Vencido' : `${diasRestantes} dias restantes`}
                      </span>
                    </div>
                    <div className={cn("w-full h-2 rounded-full", isBlocked ? "bg-red-100" : "bg-slate-100")}>
                      <div 
                        className={cn("h-2 rounded-full", isBlocked ? "bg-red-500" : (diasRestantes <= 2 ? "bg-red-500" : tenant.status_assinatura === 'PAGO' ? "bg-green-500" : "bg-blue-500"))} 
                        style={{ width: isBlocked ? '100%' : `${Math.min(100, Math.max(0, (diasRestantes / 30) * 100))}%` }}
                      ></div>
                    </div>
                  </div>
                                <div className="text-sm text-slate-500 mb-4 space-y-2">
                    <p><strong>Contato:</strong> {tenant.telefone_whatsapp}</p>
                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 mt-2">
                      <p className="text-xs text-slate-400 font-semibold mb-1">Acesso do Proprietário (Painel):</p>
                      <div className="flex items-center justify-between gap-2 bg-white px-2.5 py-1.5 rounded-lg border border-slate-100 text-[12px] font-mono font-medium text-slate-700 min-w-0">
                        <span className="truncate select-all select-none">{getFriendlyUrl('/#/login')}</span>
                        <div className="flex items-center gap-1 shrink-0">
                          <button 
                            onClick={() => {
                              navigator.clipboard.writeText(getFriendlyUrl('/#/login'));
                              setCopiedId(tenant.id);
                              setTimeout(() => setCopiedId(null), 2000);
                            }}
                            className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-blue-500 transition-colors flex items-center"
                            title="Copiar Link de Login"
                          >
                            {copiedId === tenant.id ? (
                              <span className="text-[10px] text-green-600 font-sans font-bold">✓ Copiado</span>
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                          <a 
                            href={getFriendlyUrl('/#/login')} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-blue-500 transition-colors"
                            title="Visualizar Tela de Login"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      </div>

                      {/* Prominent direct copy and share button with partner panel email instructions */}
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            navigator.clipboard.writeText(getFriendlyUrl('/#/login'));
                            setCopiedId(tenant.id);
                            setTimeout(() => setCopiedId(null), 2000);
                          }}
                          className="h-8 text-[11px] font-bold border-slate-200 rounded-lg py-1 hover:bg-slate-100 flex items-center justify-center gap-1"
                        >
                          <Copy className="w-3 h-3" />
                          {copiedId === tenant.id ? "Copiado!" : "Copiar Login"}
                        </Button>
                        <a
                          href={`https://api.whatsapp.com/send?phone=${tenant.telefone_whatsapp ? tenant.telefone_whatsapp.replace(/\D/g, '') : ''}&text=${encodeURIComponent(
                            `Olá! Segue o link de acesso administrativo para o painel de gerenciamento do seu Lava Jato (*${tenant.nome}*):\n\n${getFriendlyUrl('/#/login')}`
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="h-8 text-[11px] font-bold bg-emerald-550 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 rounded-lg flex items-center justify-center gap-1 transition-colors"
                        >
                          <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24">
                            <path d="M12.012 2c-5.506 0-9.989 4.478-9.99 9.984a9.96 9.96 0 001.333 4.993L2 22l5.13-1.347a9.914 9.914 0 004.882 1.28c5.505 0 9.989-4.478 9.99-9.984A10.046 10.046 0 0012.012 2zm5.72 14.12c-.25.703-1.455 1.298-2 .138-.545-.16-1.246-.484-2.112-.857-3.722-1.603-6.13-5.385-6.315-5.632-.186-.247-1.516-2.015-1.516-3.843 0-1.828.958-2.73 1.3-3.1.341-.37.743-.464.991-.464l.712.003c.217.007.45.105.7.705.25.6.853 2.073.931 2.228.077.155.124.34.02.553-.1.21-.155.34-.31.52-.15.18-.32.404-.46.545-.15.15-.31.32-.138.62.17.3.754 1.243 1.616 2.01.112.1.21.2.3.284 1.11 1.01 2.183 1.245 2.524 1.348.34.1.543.05.744-.18.2-.23.856-1.01 1.085-1.35.228-.34.46-.285.776-.17.316.115 2.01.95 2.35 1.11.34.16.57.24.65.38.08.14.08.81-.17 1.513z"/>
                          </svg>
                          WhatsApp
                        </a>
                      </div>

                    </div>
                  </div>
                </div>

                <div className="space-y-2 mt-auto text-left">
                  <Button 
                    className="w-full bg-blue-600 hover:bg-blue-700 font-bold"
                    onClick={() => handleActivateMonth(tenant.id, tenant.data_vencimento)}
                  >
                    {isBlocked ? 'Reativar Mês (R$ 30)' : 'Ativar Mês (R$ 30)'}
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    type="button"
                    className="w-full border-blue-200 hover:border-blue-300 hover:bg-blue-50/55 hover:text-blue-600 font-bold text-xs flex items-center justify-center gap-1.5 py-2.5 rounded-xl transition-all h-10 cursor-pointer"
                    onClick={() => handleOpenDetailsModal(tenant)}
                  >
                    📋 Dados do Cliente
                  </Button>

                  <div className="flex space-x-2">
                    <Button 
                      variant="secondary" 
                      className="w-1/2 font-bold hover:bg-slate-200 transition-colors"
                      onClick={() => handleActivateTest(tenant.id)}
                    >
                      Ativar Teste
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-1/2 border-red-200 hover:border-red-300 hover:bg-red-50 hover:text-red-600 text-red-600 transition-all font-bold text-xs flex items-center justify-center gap-1 cursor-pointer"
                      onClick={() => handleDeleteTenant(tenant.id, tenant.nome)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Excluir Acesso
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </main>

      {selectedTenantForDetails && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-100 p-6 sm:p-8 animate-in fade-in zoom-in-95 duration-200 text-left">
            <div className="flex justify-between items-center pb-4 mb-6 border-b border-slate-100">
              <div className="text-left">
                <h3 className="font-bold text-slate-900 text-lg">Informações de Acesso</h3>
                <p className="text-xs text-slate-500 font-semibold mt-0.5">Lava Jato: {selectedTenantForDetails.nome}</p>
              </div>
              <button 
                onClick={() => setSelectedTenantForDetails(null)}
                className="text-slate-400 hover:text-slate-600 font-bold transition-colors p-1"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4 text-left">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">E-mail Cadastrado</label>
                <div className="relative">
                  <Input 
                    type="email" 
                    value={editEmail} 
                    onChange={(e) => setEditEmail(e.target.value)} 
                    placeholder="email@cliente.com"
                    className="bg-slate-50 border-slate-200 h-10 pr-10 text-slate-800 text-xs sm:text-sm rounded-xl font-medium"
                  />
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(editEmail);
                      alert("E-mail copiado com sucesso!");
                    }}
                    type="button" 
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-blue-500 transition-colors"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Senha de Acesso</label>
                <div className="relative">
                  <Input 
                    type="text" 
                    value={editPassword} 
                    onChange={(e) => setEditPassword(e.target.value)} 
                    placeholder="Senha"
                    className="bg-slate-50 border-slate-200 h-10 pr-10 text-slate-800 text-xs sm:text-sm font-mono rounded-xl font-semibold"
                  />
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(editPassword);
                      alert("Senha copiada com sucesso!");
                    }}
                    type="button" 
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-blue-500 transition-colors"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Código do Lava Jato</label>
                  <div className="h-10 bg-blue-50 border border-blue-100 text-blue-800 font-bold font-mono text-center flex items-center justify-center rounded-xl text-sm">
                    {getTenantCode(selectedTenantForDetails)}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 flex justify-between">
                    <span>CÓD. RECUPERAÇÃO</span>
                    <button 
                      onClick={handleRegenerateRecoveryCode}
                      type="button"
                      className="text-[10px] text-blue-600 hover:underline hover:text-blue-700 font-bold lowercase"
                    >
                      (gerar outro)
                    </button>
                  </label>
                  <div className="relative">
                    <Input 
                      type="text" 
                      value={editRecoveryCode} 
                      onChange={(e) => setEditRecoveryCode(e.target.value)} 
                      placeholder="Código"
                      className="bg-slate-50 border-slate-200 h-10 pr-10 text-slate-800 text-xs sm:text-sm font-mono text-center font-bold rounded-xl"
                    />
                    <button 
                      onClick={() => {
                        navigator.clipboard.writeText(editRecoveryCode);
                        alert("Código de segurança copiado!");
                      }}
                      type="button" 
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-blue-500 transition-colors"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50/65 p-4 rounded-2xl border border-blue-100/50 text-xs text-blue-900 space-y-1.5 leading-relaxed">
                <p className="font-extrabold flex items-center gap-1.5">
                  <span>🔑</span> Recuperação Inteligente por WhatsApp
                </p>
                <p className="text-slate-600">
                  Se o cliente perder ou esquecer as credenciais, gere um <strong>Código de Segurança</strong> acima, salve e clique abaixo para enviar direto para o WhatsApp dele. Ele poderá usar o código na tela de login para redefinir a senha imediatamente.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-6 pt-4 border-t border-slate-100">
              <Button 
                type="button"
                variant="secondary"
                onClick={() => setSelectedTenantForDetails(null)}
                className="h-11 text-xs font-bold rounded-xl"
              >
                Voltar
              </Button>
              <Button 
                type="button"
                onClick={handleSaveDetails}
                disabled={isSavingDetails}
                className="h-11 bg-blue-600 text-white font-bold hover:bg-blue-700 text-xs rounded-xl shadow shadow-blue-500/10"
              >
                {isSavingDetails ? "Salvando..." : "Salvar Dados"}
              </Button>
            </div>

            <div className="mt-3">
              <Button
                type="button"
                variant="outline"
                className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 hover:text-white border-none text-white font-bold flex items-center justify-center gap-1.5 text-xs rounded-xl shadow-lg shadow-emerald-500/20 cursor-pointer"
                onClick={() => {
                  const code = selectedTenantForDetails.client_code || selectedTenantForDetails.services_pricing?._client_code || '';
                  const cleanPhone = selectedTenantForDetails.telefone_whatsapp ? selectedTenantForDetails.telefone_whatsapp.replace(/\D/g, '') : '';
                  const friendlyUrl = getFriendlyUrl('/#/login');
                  
                  const text = `Olá! Segue os seus dados de acesso ao painel do seu Lava Jato (*${selectedTenantForDetails.nome}*):\n\n📧 *E-mail:* ${editEmail}\n🔑 *Senha:* ${editPassword}\n\n*Código do Lava Jato:* ${code}\n\n🔗 *Link de Acesso:* ${friendlyUrl}\n\n⚠️ *CÓDIGO DE RECUPERAÇÃO EM CASO DE PERDA DE SENHA:* *${editRecoveryCode}*\n(Na tela de login, basta clicar em "Entrar por Código" e usar este código temporário para redefinir sua senha)`;
                  
                  const wpUrl = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(text)}`;
                  window.open(wpUrl, '_blank');
                }}
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M12.012 2c-5.506 0-9.989 4.478-9.99 9.984a9.96 9.96 0 001.333 4.993L2 22l5.13-1.347a9.914 9.914 0 004.882 1.28c5.505 0 9.989-4.478 9.99-9.984A10.046 10.046 0 0012.012 2zm5.72 14.12c-.25.703-1.455 1.298-2 .138-.545-.16-1.246-.484-2.112-.857-3.722-1.603-6.13-5.385-6.315-5.632-.186-.247-1.516-2.015-1.516-3.843 0-1.828.958-2.73 1.3-3.1.341-.37.743-.464.991-.464l.712.003c.217.007.45.105.7.705.25.6.853 2.073.931 2.228.077.155.124.34.02.553-.1.21-.155.34-.31.52-.15.18-.32.404-.46.545-.15.15-.31.32-.138.62.17.3.754 1.243 1.616 2.01.112.1.21.2.3.284 1.11 1.01 2.183 1.245 2.524 1.348.34.1.543.05.744-.18.2-.23.856-1.01 1.085-1.35.228-.34.46-.285.776-.17.316.115 2.01.95 2.35 1.11.34.16.57.24.65.38.08.14.08.81-.17 1.513z"/>
                </svg>
                Enviar Acesso & Código p/ WhatsApp
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
