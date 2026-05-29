import React, { useState, useEffect } from 'react';
import { Card, Button, Badge, Input } from '@/components/ui/Components';
import { api } from '@/lib/api';
import { supabase, isSupabaseConfigured } from '@/lib/db';
import { formatCurrency } from '@/lib/utils';
import { differenceInDays, parseISO, format } from 'date-fns';
import { Calendar, DollarSign, BarChart2, Package, Search, PhoneForwarded, LogOut, AlertCircle, ClipboardList, Users, Car, Settings, Copy, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router';

export function TenantAdminDashboard() {
  const [activeTab, setActiveTab] = useState('HORARIOS');
  const [data, setData] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const navigate = useNavigate();
  
  const [tenantId, setTenantId] = useState<string | null>('t1');
  const [copiedLink, setCopiedLink] = useState(false);
  
  const loadData = async () => {
    try {
      let activeId = tenantId;
      setErrorMsg(null);
      
      if (isSupabaseConfigured) {
         // Pegar o UUID do usuário logado pelo Supabase Auth
         const { data: { user } } = await supabase!.auth.getUser();
         if (!user) {
            window.location.href = '/login';
            return;
         }
         // Buscar o tenant pertencente a este Owner
         const { data: userTenant, error: extErr } = await supabase!.from('tenants').select('id, nome').eq('owner_id', user.id).maybeSingle();
         
         if (extErr) {
             console.error("Erro Database RLS:", extErr);
             if (extErr.code === '42P01' || extErr.message?.includes('does not exist')) {
                 setErrorMsg("O banco de dados está vazio! Você precisa rodar o script 'supabase_schema.sql' no SQL Editor.");
             } else {
                 setErrorMsg(`Erro de DB: ${extErr.message}`);
             }
             return;
         }

         if (userTenant) {
           activeId = userTenant.id;
         } else {
           console.log("Nenhum Lava Jato encontrado para este usuário");
           setErrorMsg(`Você ainda não tem permissão Administrativa. `);
           setData({ isUnassigned: true, userId: user.id, email: user.email });
           return;
         }
      }

      if (!activeId) return;

      const adminData = await api.getTenantAdminData(activeId);
      if (!adminData.tenant) {
         setErrorMsg("Erro ao carregar dados. O Lava Jato pode ter sido deletado.");
         return;
      }
      
      setData(adminData);
      setTenantId(activeId);
    } catch (e: any) {
      console.error("Exception loading data:", e);
      setErrorMsg(e.message || "Ocorreu um erro inesperado.");
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

  if (data?.isUnassigned) {
     return (
        <div className="min-h-screen bg-slate-100 flex items-center justify-center p-6">
          <Card className="max-w-lg w-full p-8 text-center shadow border-slate-200">
            <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
            <h1 className="text-xl font-bold text-slate-800 mb-2">Quase lá!</h1>
            <p className="text-slate-600 mb-6 text-sm text-center">
              Você conectou com sucesso, mas este usuário ainda não é <strong className="text-blue-600">Super Admin</strong> e não possui nenhum Lava Jato vinculado.
            </p>
            
            <div className="bg-slate-50 p-4 rounded text-left border mb-6 text-sm">
                <p className="font-bold mb-2">Ação Obrigatória no Supabase:</p>
                <p className="mb-4 text-slate-700">Por questões de segurança, eu não consigo te promover a Administrador automaticamente. Copie o código abaixo e rode no <strong>SQL Editor</strong> do seu painel do Supabase:</p>
                
                <div className="bg-slate-900 border border-slate-700 rounded p-3 mb-2 flex items-center justify-between">
                   <span className="font-mono text-xs select-all text-green-400 break-all">
                      INSERT INTO public.super_admins (id, email) VALUES ('{data.userId}', '{data.email || 'tvpopulariptv@gmail.com'}');
                   </span>
                   <Button variant="secondary" size="sm" className="ml-4 whitespace-nowrap" onClick={() => navigator.clipboard.writeText(`INSERT INTO public.super_admins (id, email) VALUES ('${data.userId}', '${data.email || 'tvpopulariptv@gmail.com'}');`)}>
                      Copiar SQL
                   </Button>
                </div>
                <p className="text-xs text-slate-500">Depois de rodar o código acima, clique em "Voltar para o Login" e entre novamente!</p>
            </div>

            <Button className="w-full bg-slate-200 text-slate-800 hover:bg-slate-300" variant="outline" onClick={handleLogout}>Voltar para o Login</Button>
          </Card>
        </div>
     );
  }

  if (errorMsg) {
     return (
        <div className="min-h-screen bg-slate-100 flex items-center justify-center p-6">
          <Card className="max-w-md w-full p-8 text-center border-red-200 bg-red-50/10">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h1 className="text-xl font-bold text-slate-800 mb-2">Erro de Acesso</h1>
            <p className="text-slate-600 mb-6">{errorMsg}</p>
            <Button className="bg-red-600 hover:bg-red-700 text-white w-full" onClick={handleLogout}>Sair da Conta</Button>
          </Card>
        </div>
     );
  }

  if (!data?.tenant) return <div className="p-10 text-center font-medium">Carregando seus dados...</div>;

  const { tenant, appointments, inventory, finances } = data;
  const diasRestantes = tenant.data_vencimento ? differenceInDays(parseISO(tenant.data_vencimento), new Date()) : 30;
  const isBlocked = tenant.status_assinatura === 'BLOQUEADO' || diasRestantes < 0;

  if (isBlocked) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-6">
        <Card className="max-w-md w-full p-8 text-center shadow-lg border-red-200 bg-red-50/10">
          <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="font-bold text-2xl">!</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Sistema Bloqueado</h1>
          <p className="text-slate-600 mb-6">
            Sua mensalidade venceu. Entre em contato com o suporte para reativar seu sistema e voltar a receber agendamentos.
          </p>
          <Button 
            className="w-full bg-red-600 hover:bg-red-700 text-white border-none mb-3"
            onClick={() => window.open(`https://wa.me/5511999999999?text=Ol%C3%A1%2C%20gostaria%20de%20reativar%20minha%20assinatura%20do%20Lava%20Jato%20${tenant.nome}`, '_blank')}
          >
            Falar com Suporte (WhatsApp)
          </Button>
          <Button variant="ghost" onClick={handleLogout} className="w-full text-slate-500">
            Sair da conta
          </Button>
        </Card>
      </div>
    );
  }

  const tabs = [
    { id: 'HORARIOS', label: 'Agendados do Dia', icon: Calendar },
    { id: 'FINANCAS', label: 'Finanças', icon: DollarSign },
    { id: 'TOTAL', label: 'Resumo Mensal', icon: BarChart2 },
    { id: 'ESTOQUE', label: 'Estoque', icon: Package },
    { id: 'CADASTROS', label: 'Cadastros', icon: ClipboardList },
  ];

  const totalReceitas = finances.filter((f:any) => f.tipo === 'RECEITA').reduce((acc:number, f:any) => acc + f.valor, 0);
  const totalDespesas = finances.filter((f:any) => f.tipo === 'DESPESA').reduce((acc:number, f:any) => acc + f.valor, 0);
  
  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
      <header className="bg-slate-900 text-white p-4 sm:p-6 shadow-md">
        <div className="max-w-6xl mx-auto flex flex-col gap-3">
          <div className="flex flex-row justify-between items-center gap-4">
            <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
              <span className="font-extrabold text-sm sm:text-lg md:text-xl tracking-tight truncate">{tenant.nome}</span>
              <Badge variant="success" className="bg-slate-800 text-slate-300 border-none px-2 py-0.5 text-[9px] sm:text-[10px] shrink-0 font-medium tracking-wider">ADMIN</Badge>
            </div>
            <div className="flex items-center space-x-3 sm:space-x-4 shrink-0">
              <div className="text-xs sm:text-sm text-slate-400">
                Vence em: <span className="font-bold text-white">{diasRestantes}d</span>
              </div>
              <button onClick={handleLogout} className="text-slate-400 hover:text-white transition-colors bg-slate-800 hover:bg-slate-700 p-2 rounded-xl" title="Sair da Conta">
                <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>
          </div>

          {/* Quick Scheduling Link Widget for Tenant */}
          <div className="bg-slate-800/40 border border-slate-800 rounded-xl px-3 py-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs sm:text-sm mt-1">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-slate-400 font-medium shrink-0">Link de Agendamentos do Cliente:</span>
              <span className="font-mono text-blue-400 truncate bg-slate-950/40 px-2 py-1 rounded select-all text-xs border border-slate-800/60 font-medium">{`${window.location.origin}/#/${tenant.slug}`}</span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(`${window.location.origin}/#/${tenant.slug}`);
                  setCopiedLink(true);
                  setTimeout(() => setCopiedLink(false), 2000);
                }}
                className="bg-slate-800 hover:bg-blue-600 border border-slate-700 hover:border-blue-500 text-slate-200 hover:text-white hover:shadow-lg hover:shadow-blue-600/15 py-1 px-3 md:px-3.5 rounded-lg flex items-center gap-1.5 font-semibold text-[11px] h-7.5 transition-all active:scale-95 cursor-pointer"
              >
                <Copy className="w-3 h-3" />
                {copiedLink ? "Copiado!" : "Copiar Link"}
              </button>
              <a 
                href={`${window.location.origin}/#/${tenant.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white py-1 px-3 md:px-3.5 rounded-lg flex items-center gap-1.5 font-semibold text-[11px] h-7.5 transition-all active:scale-95 cursor-pointer"
              >
                <ExternalLink className="w-3 h-3" />
                Visualizar
              </a>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-6xl w-full mx-auto p-4 md:p-8">
        <div className="flex space-x-1 bg-white p-1.5 rounded-xl shadow-sm mb-8 overflow-x-auto border border-slate-200">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center px-4 py-2.5 text-[13px] font-medium rounded-lg whitespace-nowrap transition-colors ${activeTab === tab.id ? 'bg-blue-600 text-white shadow' : 'text-slate-600 hover:bg-slate-50'}`}
            >
              <tab.icon className="w-4 h-4 mr-2" />
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'HORARIOS' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Agendamentos de Hoje</h2>
              <Button size="sm">Novo Agendamento</Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {appointments.map((app: any) => (
                <Card key={app.id} className="p-5 border-l-4 border-l-blue-600">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-slate-900">{format(parseISO(app.horario_marcado), 'HH:mm')} - {app.nome}</h3>
                      <p className="text-sm text-slate-500 flex items-center mt-1">
                        🇧🇷 {app.telefone}
                      </p>
                      <div className="mt-3 text-[13px] text-slate-700">
                        <span className="font-medium text-slate-500">Serviços:</span> {app.servicos.join(', ')}
                      </div>
                      <div className="mt-1 text-[13px] text-slate-700">
                        <span className="font-medium text-slate-500">Logística:</span> {app.logistica}
                      </div>
                    </div>
                    <Badge variant="warning">{app.status}</Badge>
                  </div>
                  <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between items-center">
                    <span className="font-bold text-slate-900">{formatCurrency(app.total)}</span>
                    <Button 
                      variant="secondary" 
                      size="sm" 
                      onClick={() => window.open(`https://wa.me/${app.telefone}?text=Ol%C3%A1%20${app.nome}%2C%20seu%20carro%20est%C3%A1%20pronto!`, '_blank')}
                    >
                      <PhoneForwarded className="w-4 h-4 mr-1" /> Avisar Cliente
                    </Button>
                  </div>
                </Card>
              ))}
              {appointments.length === 0 && <div className="col-span-full text-center p-8 text-gray-500 bg-white rounded-lg">Nenhum agendamento para hoje.</div>}
            </div>
          </div>
        )}

        {activeTab === 'FINANCAS' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="p-5 bg-white border border-slate-200">
                <p className="text-xs text-slate-500 font-medium mb-1 uppercase tracking-wider">Receitas Mês</p>
                <h3 className="text-xl font-bold text-slate-900">{formatCurrency(totalReceitas)}</h3>
              </Card>
              <Card className="p-5 bg-white border border-slate-200">
                <p className="text-xs text-slate-500 font-medium mb-1 uppercase tracking-wider">Despesas Mês</p>
                <h3 className="text-xl font-bold text-slate-900">{formatCurrency(totalDespesas)}</h3>
              </Card>
              <Card className="p-5 bg-white border border-slate-200">
                <p className="text-xs text-slate-500 font-medium mb-1 uppercase tracking-wider">Saldo Previsto</p>
                <h3 className="text-xl font-bold text-blue-600">{formatCurrency(totalReceitas - totalDespesas)}</h3>
              </Card>
            </div>
          </div>
        )}

        {activeTab === 'TOTAL' && (
          <Card className="p-6 border-slate-200">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Total Mensal de Serviços</h2>
            <div className="text-center py-10">
              <BarChart2 className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500">Gráfico de faturamento em desenvolvimento.</p>
              <p className="text-2xl font-bold text-slate-900 mt-2">{appointments.length} serviços realizados</p>
            </div>
          </Card>
        )}

        {activeTab === 'ESTOQUE' && (
          <Card className="overflow-hidden border-slate-200">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Produto</th>
                  <th className="px-6 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Quantidade</th>
                  <th className="px-6 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {inventory.map((item: any) => (
                  <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{item.nome_produto}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{item.quantidade} un</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {item.quantidade <= item.nivel_minimo ? (
                        <Badge variant="danger">Estoque Baixo</Badge>
                      ) : (
                        <Badge variant="success">Normal</Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}

        {activeTab === 'CADASTROS' && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Gerenciar Cadastros</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
              <Card className="p-6 hover:shadow-md transition-shadow cursor-pointer flex flex-col items-center justify-center text-center border-slate-200">
                <Users className="w-10 h-10 text-blue-500 mb-4" />
                <h3 className="font-bold text-slate-900">Clientes</h3>
                <p className="text-xs text-slate-500 mt-2">Gerenciar clientes fiéis</p>
              </Card>
              <Card className="p-6 hover:shadow-md transition-shadow cursor-pointer flex flex-col items-center justify-center text-center border-slate-200">
                <Car className="w-10 h-10 text-blue-500 mb-4" />
                <h3 className="font-bold text-slate-900">Veículos</h3>
                <p className="text-xs text-slate-500 mt-2">Marcas, modelos e placas</p>
              </Card>
              <Card className="p-6 hover:shadow-md transition-shadow cursor-pointer flex flex-col items-center justify-center text-center border-slate-200">
                <Settings className="w-10 h-10 text-blue-500 mb-4" />
                <h3 className="font-bold text-slate-900">Serviços</h3>
                <p className="text-xs text-slate-500 mt-2">Tabela de preços</p>
              </Card>
              <Card className="p-6 hover:shadow-md transition-shadow cursor-pointer flex flex-col items-center justify-center text-center border-slate-200">
                <Package className="w-10 h-10 text-blue-500 mb-4" />
                <h3 className="font-bold text-slate-900">Produtos</h3>
                <p className="text-xs text-slate-500 mt-2">Itens para estoque</p>
              </Card>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
