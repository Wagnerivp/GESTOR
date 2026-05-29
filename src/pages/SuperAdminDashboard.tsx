import React, { useState, useEffect } from 'react';
import { Card, Button, Badge, Input } from '@/components/ui/Components';
import { api } from '@/lib/api';
import { supabase, isSupabaseConfigured } from '@/lib/db';
import { cn } from '@/lib/utils';
import { differenceInDays, addDays, parseISO } from 'date-fns';
import { Search, Settings, CalendarClock, ShieldCheck, LogOut, Copy, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router';

export function SuperAdminDashboard() {
  const [tenants, setTenants] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const navigate = useNavigate();

  const loadData = async () => {
    try {
      if (isSupabaseConfigured) {
        const { data: { user } } = await supabase!.auth.getUser();
        if (!user) {
           window.location.href = '/login';
           return;
        }
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
    window.location.href = '/login';
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
      alert("Erro ao atualizar no banco de dados (Verifique as políticas de RLS).");
    }
  };

  const handleActivateTest = async (id: string) => {
    const newDate = addDays(new Date(), 30).toISOString();
    try {
      await api.updateTenantStatus(id, { status_assinatura: 'GRATUITO', data_vencimento: newDate });
      loadData();
    } catch (err) {
      alert("Erro ao atualizar no banco de dados (Verifique as políticas de RLS).");
    }
  };

  const filteredTenants = tenants.filter(t => t.nome.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
      <header className="bg-slate-900 text-white p-6 shadow-md">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-bold">W</div>
            <span className="font-bold text-xl tracking-tight">WashMaster <span className="text-blue-500">PRO</span></span>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-sm text-slate-400">Controle Financeiro e SaaS</div>
            <button onClick={handleLogout} className="text-slate-400 hover:text-white transition-colors">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

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
                    </div>
                    <Badge variant={statusBadgeVariant}>{displayStatus}</Badge>
                  </div>
                  
                  <div className="mb-6">
                    <div className="flex justify-between text-xs mb-1">
                      <span className={isBlocked ? "text-red-600" : "text-slate-500"}>Expiração</span>
                      <span className={cn("font-semibold", isBlocked ? "text-red-700" : "text-slate-700")}>
                        {diasRestantes < 0 ? 'Vencido' : `${diasRestantes} dias restantes`}
                      </span>
                    </div>
                    <div className={cn("w-full h-2 rounded-full", isBlocked ? "bg-red-100" : "bg-slate-100")}>
                      <div 
                        className={cn("h-2 rounded-full", isBlocked ? "bg-red-500" : tenant.status_assinatura === 'PAGO' ? "bg-green-500" : "bg-blue-500")} 
                        style={{ width: isBlocked ? '100%' : `${Math.min(100, Math.max(0, (diasRestantes / 30) * 100))}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <div className="text-sm text-slate-500 mb-4 space-y-2">
                    <p><strong>Contato:</strong> {tenant.telefone_whatsapp}</p>
                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 mt-2">
                      <p className="text-xs text-slate-400 font-semibold mb-1">Link de Agendamento:</p>
                      <div className="flex items-center justify-between gap-2 bg-white px-2.5 py-1.5 rounded-lg border border-slate-100 text-[12px] font-mono font-medium text-slate-700 min-w-0">
                        <span className="truncate select-all select-none">{`${window.location.origin}/#/${tenant.slug}`}</span>
                        <div className="flex items-center gap-1 shrink-0">
                          <button 
                            onClick={() => {
                              navigator.clipboard.writeText(`${window.location.origin}/#/${tenant.slug}`);
                              setCopiedId(tenant.id);
                              setTimeout(() => setCopiedId(null), 2000);
                            }}
                            className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-blue-500 transition-colors flex items-center"
                            title="Copiar Link"
                          >
                            {copiedId === tenant.id ? (
                              <span className="text-[10px] text-green-600 font-sans font-bold">✓ Copiado</span>
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                          <a 
                            href={`${window.location.origin}/#/${tenant.slug}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-blue-500 transition-colors"
                            title="Visualizar Página do Cliente"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      </div>

                      {/* Prominent direct copy and share button */}
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            navigator.clipboard.writeText(`${window.location.origin}/#/${tenant.slug}`);
                            setCopiedId(tenant.id);
                            setTimeout(() => setCopiedId(null), 2000);
                          }}
                          className="h-8 text-[11px] font-bold border-slate-200 rounded-lg py-1 hover:bg-slate-100 flex items-center justify-center gap-1"
                        >
                          <Copy className="w-3 h-3" />
                          {copiedId === tenant.id ? "Copiado!" : "Copiar Link"}
                        </Button>
                        <a
                          href={`https://api.whatsapp.com/send?phone=${tenant.telefone_whatsapp ? tenant.telefone_whatsapp.replace(/\D/g, '') : ''}&text=${encodeURIComponent(
                            `Olá! Segue o link de agendamentos do seu Lava Jato:\n\n${window.location.origin}/#/${tenant.slug}`
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="h-8 text-[11px] font-bold bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 rounded-lg flex items-center justify-center gap-1 transition-colors"
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

                <div className="space-y-2 mt-auto">
                  <Button 
                    className="w-full bg-blue-600 hover:bg-blue-700"
                    onClick={() => handleActivateMonth(tenant.id, tenant.data_vencimento)}
                  >
                    {isBlocked ? 'Reativar Mês (R$ 30)' : 'Ativar Mês (R$ 30)'}
                  </Button>
                  <div className="flex space-x-2">
                    <Button 
                      variant="secondary" 
                      className="w-1/2"
                      onClick={() => handleActivateTest(tenant.id)}
                    >
                      Ativar Teste
                    </Button>
                    <Button 
                      variant="secondary" 
                      className="w-1/2"
                    >
                      Editar Preços
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </main>
    </div>
  );
}
