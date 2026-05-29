import React, { useState, useEffect } from 'react';
import { Card, Button, Badge, Input } from '@/components/ui/Components';
import { api } from '@/lib/api';
import { supabase, isSupabaseConfigured } from '@/lib/db';
import { cn } from '@/lib/utils';
import { differenceInDays, addDays, parseISO } from 'date-fns';
import { Search, Settings, CalendarClock, ShieldCheck, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router';

export function SuperAdminDashboard() {
  const [tenants, setTenants] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
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
                  
                  <div className="text-sm text-slate-500 mb-4 space-y-1">
                    <p><strong>Contato:</strong> {tenant.telefone_whatsapp}</p>
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
