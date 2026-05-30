import React, { useState, useEffect } from 'react';
import { Card, Button, Badge, Input } from '@/components/ui/Components';
import { api } from '@/lib/api';
import { supabase, isSupabaseConfigured } from '@/lib/db';
import { getLocalData, saveLocalData } from '@/lib/store';
import { formatCurrency, cn, getFriendlyUrl, formatBRPhone } from '@/lib/utils';
import { differenceInDays, parseISO, format, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar, DollarSign, BarChart2, Package, Search, PhoneForwarded, LogOut, AlertCircle, ClipboardList, Users, Car, Settings, Copy, ExternalLink, ShieldCheck, Plus, Trash2, Edit, ChevronLeft, Save, Clock, PauseCircle, PlayCircle, CheckCircle, Star, X } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
import { useNavigate } from 'react-router';

export function TenantAdminDashboard() {
  const [activeTab, setActiveTab] = useState('HORARIOS');
  const [data, setData] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  
  const queryParams = new URLSearchParams(window.location.hash.includes('?') ? window.location.hash.split('?')[1] : '');
  const initialTenantId = queryParams.get('tenantId') || '';
  
  const [tenantId, setTenantId] = useState<string | null>(initialTenantId || 't1');
  const [copiedLink, setCopiedLink] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [allTenants, setAllTenants] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedTenantId, setCopiedTenantId] = useState<string | null>(null);

  // Compartilhamento de link via whatsapp / busca por cliente
  const [sharePhone, setSharePhone] = useState('');
  const [shareName, setShareName] = useState('');
  const [shareSearchQuery, setShareSearchQuery] = useState('');
  const [shareSelectedCustomer, setShareSelectedCustomer] = useState<any>(null);
  const [showShareSuccessMsg, setShowShareSuccessMsg] = useState(false);

  // Controle de Serviços extras
  const [selectedCadastroType, setSelectedCadastroType] = useState<string | null>(null);
  const [serviceNameField, setServiceNameField] = useState('');
  const [servicePriceField, setServicePriceField] = useState('');
  const [editingServiceName, setEditingServiceName] = useState<string | null>(null);
  const [isSavingService, setIsSavingService] = useState(false);
  const [serviceError, setServiceError] = useState<string | null>(null);
  const [serviceSuccess, setServiceSuccess] = useState<string | null>(null);

  // Estados para Clientes
  const [editingPrevisaoId, setEditingPrevisaoId] = useState<string | null>(null);
  const [newPrevisaoTime, setNewPrevisaoTime] = useState('');
  
  const [showCustomerForm, setShowCustomerForm] = useState(false);
  const [activeCustomer, setActiveCustomer] = useState<any | null>(null);
  const [customerFieldNome, setCustomerFieldNome] = useState('');
  const [customerFieldTelefone, setCustomerFieldTelefone] = useState('');
  const [customerFieldEndereco, setCustomerFieldEndereco] = useState('');
  const [customerFieldEnderecoBusca, setCustomerFieldEnderecoBusca] = useState('');
  const [customerFieldPlacaVeiculo, setCustomerFieldPlacaVeiculo] = useState('');
  const [customerFieldVeiculos, setCustomerFieldVeiculos] = useState<any[]>([]);
  const [customerFieldQuantidadeLavadas, setCustomerFieldQuantidadeLavadas] = useState(0);
  const [searchCustomerQuery, setSearchCustomerQuery] = useState('');
  const [newVisitServiceNames, setNewVisitServiceNames] = useState<string[]>([]);
  const [newVisitValueSpent, setNewVisitValueSpent] = useState('');
  const [selectedFidelidadeCustomer, setSelectedFidelidadeCustomer] = useState<any | null>(null);
  
  // Lista de Compra de Materiais, Consumo, Funcionários (Aba Estoque)
  const [compraTipo, setCompraTipo] = useState('MATERIAL'); // MATERIAL, CONSUMO, FUNCIONARIO
  const [compraItem, setCompraItem] = useState('');
  const [compraQtd, setCompraQtd] = useState<number | ''>('');
  const [compraValorUnit, setCompraValorUnit] = useState<number | ''>('');
  
  // Estados para Funcionários
  const [showEmployeeForm, setShowEmployeeForm] = useState(false);
  const [activeEmployee, setActiveEmployee] = useState<any | null>(null);
  const [employeeFieldNome, setEmployeeFieldNome] = useState('');
  const [employeeFieldCargo, setEmployeeFieldCargo] = useState('');
  const [employeeFieldTelefone, setEmployeeFieldTelefone] = useState('');
  
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentVales, setPaymentVales] = useState('');
  const [paymentOutros, setPaymentOutros] = useState('');
  
  // Estados para Veículos
  const [showVehicleForm, setShowVehicleForm] = useState(false);
  const [activeVehicle, setActiveVehicle] = useState<any | null>(null);
  const [vehicleFieldMarca, setVehicleFieldMarca] = useState('');
  const [vehicleFieldModelo, setVehicleFieldModelo] = useState('');
  const [vehicleFieldPlaca, setVehicleFieldPlaca] = useState('');
  const [vehicleFieldObservacao, setVehicleFieldObservacao] = useState('');
  const [searchVehicleQuery, setSearchVehicleQuery] = useState('');

  // Estados para Produtos (Estoque)
  const [showProductForm, setShowProductForm] = useState(false);
  const [activeProduct, setActiveProduct] = useState<any | null>(null);
  const [productFieldNome, setProductFieldNome] = useState('');
  const [productFieldQuantidade, setProductFieldQuantidade] = useState(0);
  const [productFieldNivelMinimo, setProductFieldNivelMinimo] = useState(0);
  const [productFieldValorCompra, setProductFieldValorCompra] = useState(0);
  const [searchProductQuery, setSearchProductQuery] = useState('');
  
  // Controle de Movimentações de Estoque
  const [activeProductForMovement, setActiveProductForMovement] = useState<any | null>(null);
  const [movementType, setMovementType] = useState<'ENTRADA' | 'SAIDA'>('ENTRADA');
  const [movementAmount, setMovementAmount] = useState(1);
  const [movementPrice, setMovementPrice] = useState(0);
  const [movementDesc, setMovementDesc] = useState('');

  // Controle de Finanças Manuais
  const [expenseDesc, setExpenseDesc] = useState('');
  const [expenseValue, setExpenseValue] = useState('');

  // Handlers para Compras/Gastos
  const handleAddCompra = async () => {
    if (!tenantId || !tenant) return;
    if (!compraItem || !compraQtd || !compraValorUnit) {
      alert('Preencha o item, quantidade e valor unitário.');
      return;
    }
    const q = Number(compraQtd);
    const v = Number(compraValorUnit);
    const total = q * v;
    
    try {
      // 1. Registra Despesa na aba de Finanças
      await api.createFinanceRecord({
        tenant_id: tenantId,
        tipo: 'SAIDA',
        descricao: `[${compraTipo}] ${compraItem} (${q}x R$ ${v.toFixed(2)})`,
        valor: total,
        data_lancamento: new Date().toISOString()
      });
      
      // 2. Se for MATERIAL, atualiza/insere no estoque
      if (compraTipo === 'MATERIAL') {
        const existing = inventory.find((i: any) => i.nome_produto.toLowerCase() === compraItem.toLowerCase());
        if (existing) {
          await api.saveInventory({
            ...existing,
            quantidade: Number(existing.quantidade) + q
          });
        } else {
          await api.saveInventory({
            tenant_id: tenantId,
            nome_produto: compraItem,
            quantidade: q,
            nivel_minimo: 5
          });
        }
      }
      
      setCompraItem('');
      setCompraQtd('');
      setCompraValorUnit('');
      loadData();
      alert('Compra adicionada com sucesso!');
    } catch (e: any) {
      alert('Erro ao registrar compra: ' + e.message);
    }
  };

  // Handlers para Finanças
  const handleAddExpense = async () => {
    if (!tenantId || !tenant) return;
    if (!expenseDesc || !expenseValue) {
      alert('Preencha a descrição e o valor da despesa.');
      return;
    }
    try {
      await api.createFinanceRecord({
        tenant_id: tenantId,
        tipo: 'SAIDA',
        descricao: expenseDesc,
        valor: parseFloat(expenseValue),
        data_lancamento: new Date().toISOString()
      });
      setExpenseDesc('');
      setExpenseValue('');
      await loadData();
    } catch(err: any) {
      alert('Erro ao registrar despesa: ' + err.message);
    }
  };

  const handleConfirmRevenue = async (app: any) => {
    if (!tenantId || !tenant) return;
    try {
      await api.createFinanceRecord({
        tenant_id: tenantId,
        appointment_id: app.id,
        tipo: 'ENTRADA',
        descricao: `Serviço: ${app.nome} (${(app.servicos || []).join(', ')})`,
        valor: app.total,
        data_lancamento: new Date().toISOString()
      });
      await loadData();
    } catch(err: any) {
      if (err.message?.includes('row-level security') || err.code === '42501') {
         alert("Aviso RLS (Segurança de Banco de Dados):\n\nPara liberar a inserção de receitas no Supabase, copie e execute este comando no 'SQL Editor' do seu painel do Supabase:\n\nDROP POLICY IF EXISTS \"Tenant full access finances\" ON public.finances;\nCREATE POLICY \"Tenant full access finances\" ON public.finances FOR ALL USING (true) WITH CHECK (true);\n\nOu garanta que seu usuário atual é o DONO deste Lava Jato ou Super Admin.");
      } else {
         alert('Erro ao confirmar receita: ' + err.message);
      }
    }
  };

  const handleDeleteFinanceRecord = async (id: string) => {
    if(!confirm('Deseja realmente excluir este registro financeiro?')) return;
    try {
      await api.deleteFinanceRecord(id);
      await loadData();
    } catch(err: any) {
      alert('Erro: ' + err.message);
    }
  };

  // Handlers para Clientes
  const handleSaveCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenantId) return;
    if (!customerFieldNome.trim() || !customerFieldTelefone.trim()) {
      alert("Nome e Telefone são obrigatórios!");
      return;
    }
    try {
      const payload = {
        id: activeCustomer?.id || undefined,
        tenant_id: tenantId,
        nome: customerFieldNome.trim(),
        telefone: customerFieldTelefone.trim(),
        placa_veiculo: customerFieldPlacaVeiculo.trim().toUpperCase(),
        veiculos: customerFieldVeiculos.length > 0 ? customerFieldVeiculos : null,
        endereco: customerFieldEndereco.trim(),
        endereco_busca: customerFieldEnderecoBusca.trim(),
        quantidade_lavadas: Number(customerFieldQuantidadeLavadas),
        servicos_historico: activeCustomer?.servicos_historico || []
      };
      await api.saveCustomer(payload);
      setShowCustomerForm(false);
      setActiveCustomer(null);
      // Reset fields
      setCustomerFieldNome('');
      setCustomerFieldTelefone('');
      setCustomerFieldEndereco('');
      setCustomerFieldEnderecoBusca('');
      setCustomerFieldPlacaVeiculo('');
      setCustomerFieldVeiculos([]);
      setCustomerFieldQuantidadeLavadas(0);
      await loadData();
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Erro ao salvar cliente.");
    }
  };

  const handleDeleteCustomer = async (id: string) => {
    if (!window.confirm("Deseja realmente excluir este cliente? Isso apagará também todo o histórico de agendamentos e o valor que este cliente gerou das receitas do caixa.")) return;
    try {
      await api.deleteCustomerAndRelated(id);
      
      // Proactive check: check if customer still exists in DB because of missing RLS policy
      if (isSupabaseConfigured && tenantId) {
        try {
          const freshData = await api.getTenantAdminData(tenantId);
          const remains = freshData.customers?.some((c: any) => c.id === id);
          if (remains) {
            alert(
              "Aviso RLS (Segurança de Banco de Dados):\n\nO cliente foi removido localmente, mas continua gravado no banco de dados Supabase porque seu schema está sem a regra de exclusão (Policy RLS).\n\nPara liberar a exclusão completa, copie e execute este comando no 'SQL Editor' do seu painel do Supabase:\n\nCREATE POLICY \"Tenant delete access customers\" ON public.customers FOR DELETE USING (\n  EXISTS (SELECT 1 FROM public.tenants WHERE id = tenant_id AND owner_id = auth.uid()) OR public.is_super_admin(auth.uid())\n);"
            );
          }
        } catch (e) {
          console.error("Erro ao verificar deleção:", e);
        }
      }

      await loadData();
    } catch (err) {
      console.error(err);
      alert("Erro ao excluir cliente.");
    }
  };

  const handleAddCustomerVisit = async (customerId: string) => {
    if (newVisitServiceNames.length === 0) {
      alert("Selecione pelo menos um serviço!");
      return;
    }
    const val = parseFloat(newVisitValueSpent.replace(',', '.'));
    if (isNaN(val) || val < 0) {
      alert("Digite um valor gasto válido!");
      return;
    }
    try {
      const parentCustomer = data?.customers?.find((c: any) => c.id === customerId);
      if (!parentCustomer) return;
      
      const newVisit = {
        data: new Date().toISOString(),
        servicos: [...newVisitServiceNames],
        valor: val
      };
      
      const currentHistory = Array.isArray(parentCustomer.servicos_historico) ? parentCustomer.servicos_historico : [];
      const updatedHistory = [newVisit, ...currentHistory];
      const updatedCount = Number(parentCustomer.quantidade_lavadas || 0) + 1;
      
      const payload = {
        ...parentCustomer,
        quantidade_lavadas: updatedCount,
        servicos_historico: updatedHistory
      };
      
      await api.saveCustomer(payload);
      setNewVisitServiceNames([]);
      setNewVisitValueSpent('');
      await loadData();
      alert("Visita e serviços registrados com sucesso!");
    } catch (err) {
      console.error(err);
      alert("Erro ao registrar serviços da visita.");
    }
  };

  // Handlers para Veículos
  const handleSaveVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenantId) return;
    if (!vehicleFieldMarca.trim() || !vehicleFieldModelo.trim() || !vehicleFieldPlaca.trim()) {
      alert("Marca, Modelo e Placa são obrigatórios!");
      return;
    }
    try {
      const payload = {
        id: activeVehicle?.id || undefined,
        tenant_id: tenantId,
        marca: vehicleFieldMarca.trim(),
        modelo: vehicleFieldModelo.trim(),
        placa: vehicleFieldPlaca.trim().toUpperCase(),
        observacao: vehicleFieldObservacao.trim()
      };
      await api.saveVehicle(payload);
      setShowVehicleForm(false);
      setActiveVehicle(null);
      setVehicleFieldMarca('');
      setVehicleFieldModelo('');
      setVehicleFieldPlaca('');
      setVehicleFieldObservacao('');
      await loadData();
    } catch (err) {
      console.error(err);
      alert("Erro ao salvar veículo.");
    }
  };

  const handleCarroPronto = async (app: any) => {
    if (!tenantId) return;
    try {
      // 1. Mudar status
      await api.updateAppointment(app.id, { status: 'CONCLUIDO' });
      
      // 2. Avisar pelo whatsapp
      const text = `Olá ${app.nome}, passando para avisar que seu carro já está pronto!`;
      window.open(`https://wa.me/${app.telefone}?text=${encodeURIComponent(text)}`, '_blank');
      
      await loadData();
    } catch(err: any) {
       alert('Erro: ' + (err.message || 'Desconhecido'));
    }
  };

  const handleIniciarServico = async (app: any) => {
    try {
      await api.updateAppointment(app.id, { status: 'EM_ANDAMENTO' });
      await loadData();
    } catch(err: any) {
      alert('Erro ao iniciar serviço: ' + err.message);
    }
  };

  const handleSavePrevisao = async (appId: string, currentMarcado: string) => {
    if (!newPrevisaoTime) {
      setEditingPrevisaoId(null);
      return;
    }
    const [h, m] = newPrevisaoTime.split(':');
    const updateDate = parseISO(currentMarcado);
    updateDate.setHours(parseInt(h), parseInt(m), 0, 0);

    try {
      await api.updateAppointment(appId, { previsao_entrega: updateDate.toISOString() });
      await loadData();
      setEditingPrevisaoId(null);
    } catch(err: any) {
      console.error(err);
      alert('Erro ao atualizar previsão: ' + (err.message || 'Desconhecido'));
    }
  };

  const handleDeleteVehicle = async (id: string) => {
    if (!window.confirm("Deseja realmente excluir este veículo?")) return;
    try {
      await api.deleteVehicle(id);
      await loadData();
    } catch (err) {
      console.error(err);
      alert("Erro ao excluir veículo.");
    }
  };

  // Handlers para Funcionários
  const handleSaveEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenantId || !tenant) return;
    if (!employeeFieldNome.trim()) {
      alert("O nome do funcionário é obrigatório!");
      return;
    }
    try {
      const currentPricing = tenant.services_pricing ? { ...tenant.services_pricing } : {};
      const funcs = currentPricing._funcionarios || [];
      
      if (activeEmployee) {
        const idx = funcs.findIndex((f: any) => f.id === activeEmployee.id);
        if (idx !== -1) {
          funcs[idx] = { ...activeEmployee, nome: employeeFieldNome, cargo: employeeFieldCargo, telefone: employeeFieldTelefone };
        }
      } else {
        funcs.push({
          id: 'f_' + Date.now(),
          nome: employeeFieldNome,
          cargo: employeeFieldCargo,
          telefone: employeeFieldTelefone
        });
      }
      
      currentPricing._funcionarios = funcs;
      await api.updateTenantStatus(tenant.id, { services_pricing: currentPricing });
      setShowEmployeeForm(false);
      setActiveEmployee(null);
      await loadData();
      alert("Funcionário salvo com sucesso!");
    } catch (e: any) {
      alert("Erro ao salvar funcionário: " + e.message);
    }
  };

  const handleDeleteEmployee = async (empId: string) => {
    if (!tenantId || !tenant) return;
    if (!window.confirm("Deseja realmente remover este funcionário?")) return;
    try {
      const currentPricing = tenant.services_pricing ? { ...tenant.services_pricing } : {};
      currentPricing._funcionarios = (currentPricing._funcionarios || []).filter((f: any) => f.id !== empId);
      await api.updateTenantStatus(tenant.id, { services_pricing: currentPricing });
      await loadData();
    } catch (e: any) {
      alert("Erro ao remover: " + e.message);
    }
  };

  const handlePayEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenantId || !tenant || !activeEmployee) return;
    
    const valor = Number(paymentAmount) || 0;
    const vales = Number(paymentVales) || 0;
    const outros = Number(paymentOutros) || 0;
    
    const totalDespesa = valor + vales + outros;
    
    if (totalDespesa <= 0) {
       alert("Preencha ao menos um valor (pagamento, vales ou outros).");
       return;
    }
    
    try {
      await api.createFinanceRecord({
        tenant_id: tenantId,
        tipo: 'SAIDA',
        descricao: `[PAGAMENTO] Funcionário: ${activeEmployee.nome} (Semanal/Outros)`,
        valor: totalDespesa,
        data_lancamento: new Date().toISOString()
      });
      setShowPaymentModal(false);
      setPaymentAmount('');
      setPaymentVales('');
      setPaymentOutros('');
      setActiveEmployee(null);
      await loadData();
      alert(`Pagamento de R$ ${totalDespesa.toFixed(2)} registrado com sucesso e abatido nas Despesas Gerais.`);
    } catch (err: any) {
      alert("Erro ao registrar pagamento: " + err.message);
    }
  };

  // Handlers para Produtos (Estoque)
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenantId) return;
    if (!productFieldNome.trim()) {
      alert("O nome do produto é obrigatório!");
      return;
    }
    try {
      const payload = {
        id: activeProduct?.id || undefined,
        tenant_id: tenantId,
        nome_produto: productFieldNome.trim(),
        quantidade: Number(productFieldQuantidade),
        nivel_minimo: Number(productFieldNivelMinimo),
        valor_compra: Number(productFieldValorCompra),
        movimentacoes: activeProduct?.movimentacoes || [
          { data: new Date().toISOString(), tipo: 'ENTRADA', quantidade: Number(productFieldQuantidade), valor_compra: Number(productFieldValorCompra), descricao: 'Cadastrado no estoque' }
        ]
      };
      await api.saveInventory(payload);
      setShowProductForm(false);
      setActiveProduct(null);
      setProductFieldNome('');
      setProductFieldQuantidade(0);
      setProductFieldNivelMinimo(0);
      setProductFieldValorCompra(0);
      await loadData();
    } catch (err) {
      console.error(err);
      alert("Erro ao salvar produto.");
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!window.confirm("Deseja realmente excluir este produto?")) return;
    try {
      await api.deleteInventory(id);
      await loadData();
    } catch (err) {
      console.error(err);
      alert("Erro ao excluir produto.");
    }
  };

  const handleStockMovement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProductForMovement) return;
    const amount = Number(movementAmount);
    if (isNaN(amount) || amount <= 0) {
      alert("Digite uma quantidade válida maior que zero!");
      return;
    }
    
    // Validar se estoque aguenta saída
    const currentQty = Number(activeProductForMovement.quantidade || 0);
    if (movementType === 'SAIDA' && amount > currentQty) {
      alert(`Quantidade insuficiente! Estoque atual é de apenas ${currentQty} un.`);
      return;
    }

    try {
      const unitPrice = parseFloat(movementPrice.toString().replace(',', '.'));
      const newQty = movementType === 'ENTRADA' ? (currentQty + amount) : (currentQty - amount);
      
      const newMovement = {
        data: new Date().toISOString(),
        tipo: movementType,
        quantidade: amount,
        valor_compra: movementType === 'ENTRADA' ? unitPrice : undefined,
        descricao: movementDesc.trim() || (movementType === 'ENTRADA' ? 'Entrada no estoque' : 'Consumo / Saída de estoque')
      };

      const updatedMovements = [newMovement, ...(activeProductForMovement.movimentacoes || [])];
      
      const payload = {
        ...activeProductForMovement,
        quantidade: newQty,
        movimentacoes: updatedMovements
      };

      await api.saveInventory(payload);

      // Registrar nas finanças caso seja "ENTRADA" de produtos (compra / despesa)
      if (movementType === 'ENTRADA') {
        const totalCost = amount * unitPrice;
        if (totalCost > 0) {
          // Registrar despesa nas finanças
          if (isSupabaseConfigured) {
            await supabase!.from('finances').insert([{
              tenant_id: tenantId,
              tipo: 'SAIDA',
              descricao: `Compra: ${amount}x ${activeProductForMovement.nome_produto}`,
              valor: totalCost
            }]);
          } else {
            const currentData = getLocalData();
            currentData.finances = currentData.finances || [];
            currentData.finances.push({
              id: 'f' + Date.now(),
              tenant_id: tenantId,
              data: new Date().toISOString(),
              descricao: `Compra: ${amount}x ${activeProductForMovement.nome_produto}`,
              tipo: 'DESPESA',
              valor: totalCost
            });
            saveLocalData(currentData);
          }
        }
      }

      setActiveProductForMovement(null);
      setMovementAmount(1);
      setMovementPrice(0);
      setMovementDesc('');
      await loadData();
      alert("Movimentação de estoque salva!");
    } catch (err) {
      console.error(err);
      alert("Erro ao salvar movimentação de estoque.");
    }
  };

  const handleSendLink = (method: 'whatsapp' | 'copy') => {
    if (!sharePhone) {
      alert("Por favor, digite ou selecione um número de telefone com DDD!");
      return;
    }
    const cleanPhone = sharePhone.replace(/\D/g, '');
    const message = `Olá *${shareName || 'Cliente'}*, acompanhe seu atendimento e faça novos agendamentos no *${data?.tenant?.nome || 'Lava Jato'}* pelo nosso link exclusivo:\n\n${getFriendlyUrl(`/#/${data?.tenant?.slug || 'costa-azul'}`)}`;
    const encodedMsg = encodeURIComponent(message);
    
    if (method === 'whatsapp') {
      window.open(`https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodedMsg}`, '_blank');
    } else {
      navigator.clipboard.writeText(message);
      setShowShareSuccessMsg(true);
      setTimeout(() => setShowShareSuccessMsg(false), 3000);
    }
  };

  const handleDeleteService = async (serviceNameToDelete: string) => {
    if (!tenant) return;
    if (!window.confirm(`Tem certeza que deseja excluir o serviço "${serviceNameToDelete}"?`)) return;

    try {
      setServiceError(null);
      setServiceSuccess(null);
      const currentPricing = tenant.services_pricing ? { ...tenant.services_pricing } : {};
      
      delete currentPricing[serviceNameToDelete];
      
      await api.updateTenantStatus(tenant.id, { services_pricing: currentPricing });
      setServiceSuccess(`Serviço "${serviceNameToDelete}" excluído com sucesso!`);
      await loadData();
    } catch (err: any) {
      console.error(err);
      setServiceError("Erro ao excluir serviço. Tente novamente.");
    }
  };

  const handleSaveService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenant) return;
    if (!serviceNameField.trim()) {
      setServiceError("O nome do serviço é obrigatório.");
      return;
    }
    const priceVal = parseFloat(servicePriceField.toString().replace(',', '.'));
    if (isNaN(priceVal) || priceVal < 0) {
      setServiceError("Digite um preço válido maior ou igual a zero.");
      return;
    }

    try {
      setIsSavingService(true);
      setServiceError(null);
      setServiceSuccess(null);
      
      const currentPricing = tenant.services_pricing ? { ...tenant.services_pricing } : {};
      
      if (editingServiceName) {
        // Se mudou o nome do serviço, deleta a chave antiga e insere a nova
        if (editingServiceName !== serviceNameField.trim()) {
          delete currentPricing[editingServiceName];
        }
      }
      
      currentPricing[serviceNameField.trim()] = priceVal;
      
      await api.updateTenantStatus(tenant.id, { services_pricing: currentPricing });
      
      if (editingServiceName) {
        setServiceSuccess("Serviço atualizado com sucesso!");
      } else {
        setServiceSuccess("Serviço adicionado com sucesso!");
      }

      // Reset fields
      setServiceNameField('');
      setServicePriceField('');
      setEditingServiceName(null);
      await loadData();
    } catch (err: any) {
      console.error(err);
      setServiceError("Erro ao salvar serviço. Tente novamente.");
    } finally {
      setIsSavingService(false);
    }
  };
  
  const loadData = async () => {
    try {
      const urlParams = new URLSearchParams(window.location.hash.includes('?') ? window.location.hash.split('?')[1] : '');
      const paramTenantId = urlParams.get('tenantId');
      let activeId = paramTenantId || tenantId || 't1';
      setErrorMsg(null);
      let localIsSuperAdmin = false;
      
      let bypassTenantId = localStorage.getItem('bypass_tenant_id');
      
      if (!isSupabaseConfigured || bypassTenantId) {
        const mockRole = localStorage.getItem('mock_role') || 'superadmin';
        if (mockRole === 'superadmin' && !bypassTenantId) {
          localIsSuperAdmin = true;
          setIsSuperAdmin(true);
          try {
            const tenantList = await api.getTenants();
            setAllTenants(tenantList);
          } catch (e) {
            console.error("Error loading tenants:", e);
          }
          if (paramTenantId) {
            activeId = paramTenantId;
          } else {
            activeId = tenantId || 't1';
          }
        } else {
          localIsSuperAdmin = false;
          setIsSuperAdmin(false);
          activeId = bypassTenantId || localStorage.getItem('mock_tenant_id') || 't1';
        }
        setTenantId(activeId);
      }
      
      if (isSupabaseConfigured && !bypassTenantId) {
         // Pegar o UUID do usuário logado pelo Supabase Auth
         const { data: { user } } = await supabase!.auth.getUser();
         if (!user) {
            window.location.href = '#/login';
            return;
         }
         
         // Verificar se é Super Admin
         const { data: superAdmin } = await supabase!
           .from('super_admins')
           .select('id')
           .eq('id', user.id)
           .maybeSingle();

         if (superAdmin) {
           localIsSuperAdmin = true;
           setIsSuperAdmin(true);
           try {
             const tenantList = await api.getTenants();
             setAllTenants(tenantList);
           } catch (e) {
             console.error("Error loading tenants:", e);
           }
           
           if (paramTenantId) {
             activeId = paramTenantId;
           } else {
             // Se é superadmin mas não especificou no parâmetro, buscar o primeiro
             const { data: firstTenant } = await supabase!.from('tenants').select('id').limit(1).maybeSingle();
             if (firstTenant) {
               activeId = firstTenant.id;
             } else {
               activeId = '';
             }
           }
         } else {
           localIsSuperAdmin = false;
           setIsSuperAdmin(false);
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
      }

      if (!activeId) {
        if (localIsSuperAdmin) {
          setData({
            tenant: {
              id: 'placeholder',
              nome: 'Sistema Geral',
              slug: 'sistema-geral',
              status_assinatura: 'GRATUITO',
              data_vencimento: new Date().toISOString()
            },
            appointments: [],
            inventory: [],
            finances: []
          });
          setTenantId('');
          return;
        } else {
          return;
        }
      }

      const adminData = await api.getTenantAdminData(activeId);
      if (!adminData.tenant) {
         if (localIsSuperAdmin) {
           setData({
             tenant: {
               id: 'placeholder',
               nome: 'Sistema Geral',
               slug: 'sistema-geral',
               status_assinatura: 'GRATUITO',
               data_vencimento: new Date().toISOString()
             },
             appointments: [],
             inventory: [],
             finances: []
           });
           setTenantId('');
           return;
         }
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
    localStorage.removeItem('bypass_tenant_id');
    localStorage.removeItem('mock_role');
    window.location.href = '#/login';
  };

  const handleToggleAgendamentos = async () => {
    try {
      const current = tenant.aceita_agendamentos !== false;
      const newValue = !current;
      await api.updateTenantSettings(tenant.id, { _aceitaAgendamentos: newValue });
      await loadData();
    } catch(err: any) {
      console.error(err);
      alert('Erro ao alterar status de agendamentos: ' + (err.message || 'Desconhecido'));
    }
  };

  useEffect(() => {
    loadData();
    if (!isSupabaseConfigured) {
      window.addEventListener('localDataChanged', loadData);
      return () => window.removeEventListener('localDataChanged', loadData);
    }
  }, [window.location.hash]);

  useEffect(() => {
    if (isSuperAdmin) {
      navigate('/superadmin');
    }
  }, [isSuperAdmin]);

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

  const { tenant, appointments, inventory, finances, customers, vehicles } = data;
  const diasRestantes = tenant.data_vencimento ? differenceInDays(parseISO(tenant.data_vencimento), new Date()) : 30;
  const isBlocked = tenant.status_assinatura === 'BLOQUEADO' || diasRestantes < 0;

  if (isBlocked && !isSuperAdmin) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-6">
        <Card className="max-w-md w-full p-8 text-center shadow-lg border-red-200 bg-red-50/10">
          <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <span className="font-bold text-2xl">!</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Sistema Bloqueado</h1>
          <p className="text-slate-600 mb-6">
            Sua assinatura do plano venceu. Clique no botão de pagamento abaixo para realizar o PIX e solicitar a renovação instantânea.
          </p>
          <Button 
            className="w-full bg-red-600 hover:bg-red-700 text-white font-extrabold text-sm py-3 rounded-xl border-none mb-3 shadow-lg hover:shadow-red-500/20 active:scale-95 transition-all cursor-pointer"
            onClick={() => {
              const msg = "Olá, quero Renovar Assinatura, vou fazer o Pix na chave 21975151937 e você renova aí? Estou te enviando o Comprovante.";
              window.open(`https://api.whatsapp.com/send?phone=5522992040941&text=${encodeURIComponent(msg)}`, '_blank');
            }}
          >
            Pague seu Plano
          </Button>
          <Button variant="ghost" onClick={handleLogout} className="w-full text-slate-500 hover:text-slate-700">
            Sair da conta
          </Button>
        </Card>
      </div>
    );
  }

  const tabs = [
    { id: 'HORARIOS', label: 'Agendados do Dia', icon: Clock },
    { id: 'MES', label: 'Guia do Mês', icon: Calendar },
    { id: 'FINANCAS', label: 'Dashboard Financeiro', icon: DollarSign },
    { id: 'ESTOQUE', label: 'Estoque', icon: Package },
    { id: 'SERVICOS', label: 'Serviços', icon: Settings },
    { id: 'CADASTROS', label: 'Cadastros', icon: ClipboardList },
    { id: 'FIDELIDADE', label: 'Estatísticas do Cliente', icon: Star },
  ];

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  let receitasMes = 0;
  let despesasMes = 0;
  let receitasAno = 0;
  let despesasAno = 0;

  finances.forEach((f: any) => {
    const d = new Date(f.data_lancamento || f.created_at || new Date());
    const val = Number(f.valor) || 0;
    if (d.getFullYear() === currentYear) {
      if (f.tipo === 'RECEITA' || f.tipo === 'ENTRADA') receitasAno += val;
      else if (f.tipo === 'DESPESA' || f.tipo === 'SAIDA') despesasAno += val;

      if (d.getMonth() === currentMonth) {
         if (f.tipo === 'RECEITA' || f.tipo === 'ENTRADA') receitasMes += val;
         else if (f.tipo === 'DESPESA' || f.tipo === 'SAIDA') despesasMes += val;
      }
    }
  });

  const lucroMes = receitasMes - despesasMes;
  const lucroAno = receitasAno - despesasAno;

  // Estatísticas de veículos baseadas nos agendamentos
  const categoryCounts = {
    'Hatch/Sedan': 0,
    'SUV': 0,
    'Moto': 0,
  };

  const serviceCounts: Record<string, number> = {};

  appointments.forEach((app: any) => {
    app.servicos.forEach((srv: string) => {
      // Determina categoria
      if (srv.includes('(SUV)')) {
        categoryCounts['SUV']++;
      } else if (srv.includes('(Moto)') || srv.includes('(MOTO)')) {
        categoryCounts['Moto']++;
      } else {
        categoryCounts['Hatch/Sedan']++;
      }

      // Conta o tipo de serviço (removendo a categoria para agrupar melhor)
      const genericName = srv.replace(/\s*\(.*?\)/, '').trim();
      serviceCounts[genericName] = (serviceCounts[genericName] || 0) + 1;
    });
  });

  const categoryChartData = Object.entries(categoryCounts).map(([name, value]) => ({ name, value })).filter(d => d.value > 0);
  const serviceChartData = Object.entries(serviceCounts).map(([name, value]) => ({ name, value })).sort((a,b) => b.value - a.value).slice(0, 5);

  const getAppStatusDisplay = (app: any) => {
    let status = app.status;
    let className = "px-2 py-1 text-[10px] sm:text-[11px] rounded uppercase font-black tracking-wider border ";

    if (app.status === 'CONCLUIDO') {
      className += "bg-transparent text-green-600 border-green-200 shadow-sm";
    } else if (app.previsao_entrega) {
      const prevDate = new Date(app.previsao_entrega);
      if (currentTime > prevDate) {
        status = 'ATRASADO';
        className += "bg-red-100 text-red-700 animate-pulse border-red-300 shadow-sm";
      } else if (app.status === 'EM_ANDAMENTO') {
        status = 'EM ANDAMENTO';
        className += "bg-blue-100 text-blue-700 border-blue-300 shadow-sm";
      } else {
        className += "bg-orange-100 text-orange-600 animate-pulse border-orange-300 shadow-sm";
      }
    } else {
      if (app.status === 'EM_ANDAMENTO') {
        status = 'EM ANDAMENTO';
        className += "bg-blue-100 text-blue-700 border-blue-300 shadow-sm";
      } else {
        className += "bg-orange-100 text-orange-600 animate-pulse border-orange-300 shadow-sm";
      }
    }

    return { status, className };
  };

  const renderCountdown = (app: any) => {
    if (app.status !== 'EM_ANDAMENTO' || !app.previsao_entrega) return null;
    const prevDate = new Date(app.previsao_entrega);
    const diff = prevDate.getTime() - currentTime.getTime();
    if (diff <= 0) return null;
    
    let totalSecs = Math.floor(diff / 1000);
    const h = Math.floor(totalSecs / 3600);
    totalSecs %= 3600;
    const m = Math.floor(totalSecs / 60);
    const s = totalSecs % 60;
    return <span className="text-[12px] font-mono font-bold text-blue-600 animate-pulse bg-blue-50 px-2 py-1 rounded border border-blue-100">ETA: {h}h {m}m {s}s</span>;
  };
  
  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
      {isSuperAdmin && (
        <div className="bg-blue-600 text-white text-xs sm:text-sm px-4 py-2 flex flex-col sm:flex-row justify-between items-center gap-2 font-semibold shadow-md relative z-20">
          <div className="flex items-center gap-2">
            <span className="bg-blue-800 text-white px-2 py-0.5 rounded text-[10px] uppercase font-black tracking-wider">Gestor Total</span>
            <span>Painel de Administração Único — Todos os Lava Jatos & Assinaturas</span>
          </div>
          <button 
            onClick={() => navigate('/superadmin')} 
            className="bg-white/10 hover:bg-white/20 px-3 py-1 rounded text-white text-xs font-bold transition-all border border-white/20 cursor-pointer flex items-center gap-1 shrink-0"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            Ver Todos os Parceiros SaaS
          </button>
        </div>
      )}
      <header className="bg-slate-900 text-white p-4 sm:p-6 shadow-md">
        <div className="max-w-6xl mx-auto flex flex-col gap-3">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 min-w-0 w-full md:w-auto">
              <div className="flex items-center space-x-2 sm:space-x-3 shrink-0">
                <span className="font-extrabold text-sm sm:text-lg md:text-xl tracking-tight truncate">{tenant.nome}</span>
                <Badge variant="success" className="bg-slate-800 text-slate-300 border-none px-2 py-0.5 text-[9px] sm:text-[10px] shrink-0 font-medium tracking-wider">ADMIN</Badge>
              </div>
              
              {isSuperAdmin && allTenants.length > 0 && (
                <div className="flex items-center gap-2 shrink-0 bg-slate-950/60 border border-slate-800/80 px-2.5 py-1.5 rounded-xl">
                  <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider shrink-0">Ir para outro Lava Jato:</span>
                  <select 
                    value={tenantId || ''} 
                    onChange={(e) => {
                      const selectedId = e.target.value;
                      setTenantId(selectedId);
                      navigate(`/admin?tenantId=${selectedId}`);
                    }}
                    className="bg-slate-900 border border-slate-700 text-slate-200 text-xs py-0.5 px-2 rounded font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500 max-w-[180px] sm:max-w-xs cursor-pointer text-ellipsis whitespace-nowrap"
                  >
                    {allTenants.map((t) => (
                      <option key={t.id} value={t.id}>{t.nome}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
            <div className="flex items-center space-x-3 sm:space-x-4 shrink-0 self-end md:self-auto">
              <div className="text-xs sm:text-sm text-slate-400">
                Vence em: <span className={cn("font-bold tracking-tight px-1 rounded", diasRestantes <= 2 ? "text-red-500 animate-pulse font-extrabold bg-red-950/20" : "text-white")}>{diasRestantes}d</span>
              </div>
              {isSuperAdmin && (
                <button 
                  onClick={() => navigate('/superadmin')} 
                  className="bg-blue-600 hover:bg-blue-500 text-white px-2.5 py-1.5 rounded-lg text-xs font-black tracking-wide cursor-pointer flex items-center gap-1 shrink-0 transition-colors py-1.5"
                  title="Acessar painel geral de parceiros"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  SaaS PARCEIROS
                </button>
              )}
              <button onClick={handleLogout} className="text-slate-400 hover:text-white transition-colors bg-slate-800 hover:bg-slate-700 p-2 rounded-xl cursor-pointer" title="Sair da Conta">
                <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-6xl w-full mx-auto p-4 md:p-8">
        {/* Banner de Expiração Próxima */}
        {diasRestantes <= 2 && diasRestantes >= 0 && (
          <div className="bg-red-50 border-2 border-red-500 animate-pulse text-red-800 p-4 rounded-2xl mb-6 shadow-md flex flex-col sm:flex-row justify-between items-center gap-3">
             <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
                <div className="text-left">
                   <p className="font-extrabold text-red-700 text-sm sm:text-base">ATENÇÃO: Sua Assinatura vai expirar!</p>
                   <p className="text-xs text-red-600 font-medium">Restam apenas <span className="font-bold underline text-sm">{diasRestantes} dias restante(s)</span> para o bloqueio automático do sistema.</p>
                </div>
             </div>
             <Button
                onClick={() => {
                   const rawText = "Olá, quero Renovar Assinatura, vou fazer o Pix na chave 21975151937 e você renova aí? Estou te enviando o Comprovante.";
                   window.open(`https://api.whatsapp.com/send?phone=5522992040941&text=${encodeURIComponent(rawText)}`, '_blank');
                }}
                className="bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs sm:text-sm px-6 py-2.5 rounded-xl cursor-pointer shadow-lg border-none"
             >
                Pague seu Plano
             </Button>
          </div>
        )}

        {/* Card de Compartilhamento do Link do Cliente */}
        <Card className="bg-gradient-to-br from-blue-50/50 to-indigo-50/30 border border-blue-100 p-5 rounded-2xl mb-6 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="bg-blue-600 text-white p-2.5 rounded-xl shadow-md shrink-0">
                <ExternalLink className="w-5 h-5 animate-pulse" />
              </div>
              <div className="min-w-0">
                <h4 className="font-extrabold text-[#0f172a] text-[15px] leading-tight">
                  Seu Link de Agendamento Online
                </h4>
                <p className="text-slate-500 text-[12px] mt-0.5 leading-relaxed">
                  Envie este link para seus clientes do Lava Jato fazerem agendamentos automáticos pelo WhatsApp!
                </p>
                
                {/* Visual Friendly URL */}
                <div className="mt-3 flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-blue-100/80 font-mono text-xs text-blue-600 max-w-[400px] w-full shadow-inner">
                  <span className="truncate select-all select-none">{getFriendlyUrl(`/#/${tenant.slug}`)}</span>
                </div>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2 shrink-0 md:self-end">
              <Button
                type="button"
                className={`h-10 px-4 text-xs font-bold rounded-xl transition-all shadow-md active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer ${
                  tenant.aceita_agendamentos !== false 
                    ? 'bg-amber-100 text-amber-700 hover:bg-amber-200 border border-amber-200' 
                    : 'bg-green-100 text-green-700 hover:bg-green-200 border border-green-200'
                }`}
                onClick={handleToggleAgendamentos}
              >
                {tenant.aceita_agendamentos !== false ? (
                  <><PauseCircle className="w-4 h-4" /> Pausar Agendamentos</>
                ) : (
                  <><PlayCircle className="w-4 h-4" /> Retomar Agendamentos</>
                )}
              </Button>
              <Button
                type="button"
                className="bg-blue-600 text-white hover:bg-blue-700 h-10 px-4 text-xs font-bold rounded-xl transition-all shadow-md active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
                onClick={() => {
                  navigator.clipboard.writeText(getFriendlyUrl(`/#/${tenant.slug}`));
                  setCopiedLink(true);
                  setTimeout(() => setCopiedLink(false), 2000);
                }}
              >
                <Copy className="w-3.5 h-3.5" />
                {copiedLink ? 'Copiado!' : 'Copiar Link'}
              </Button>
              
              <a
                href={getFriendlyUrl(`/#/${tenant.slug}`)}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-slate-200/80 hover:bg-slate-300/80 text-slate-700 font-bold px-4 h-10 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer border border-slate-300/40"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Testar Link do Cliente
              </a>
            </div>
          </div>

          {/* Quick Share with dynamic Brazilian phone formatting */}
          <div className="mt-4 pt-4 border-t border-slate-200/60 grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
            <div className="md:col-span-1">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Nome do Cliente (Opcional)
              </label>
              <Input
                type="text"
                placeholder="Ex: Carlos"
                value={shareName}
                onChange={(e) => setShareName(e.target.value)}
                className="bg-white border-slate-200 hover:border-slate-300 text-slate-800 text-xs h-9.5 rounded-xl shadow-inner w-full focus:ring-1 focus:ring-blue-500"
              />
            </div>
            
            <div className="md:col-span-1">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                WhatsApp do Cliente (com DDD)
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-3.5 flex items-center select-none pointer-events-none text-sm border-r border-slate-200 pr-2 h-4.5 text-slate-400">
                  🇧🇷
                </span>
                <Input
                  type="text"
                  placeholder="(11) 99999-9999"
                  value={formatBRPhone(sharePhone)}
                  onChange={(e) => {
                    const rawValue = e.target.value.replace(/\D/g, '');
                    let stripped = rawValue;
                    if (rawValue.startsWith('55') && rawValue.length > 10) {
                      stripped = rawValue.substring(2);
                    }
                    if (stripped.length <= 11) {
                      setSharePhone(stripped);
                    }
                  }}
                  className="bg-white border-slate-200 hover:border-slate-300 text-slate-800 text-xs h-9.5 rounded-xl shadow-inner pl-11 w-full focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="md:col-span-1 flex gap-2">
              <Button
                type="button"
                id="btn-send-whatsapp-tenant"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold h-9.5 rounded-xl flex items-center justify-center gap-1.5 shadow-sm hover:shadow active:scale-[0.97]"
                onClick={() => handleSendLink('whatsapp')}
              >
                Mandar p/ WhatsApp
              </Button>
              <Button
                type="button"
                id="btn-copy-msg-tenant"
                variant="outline"
                className="bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold h-9.5 rounded-xl flex items-center justify-center gap-1 shadow-sm border-slate-200/80 active:scale-[0.97]"
                onClick={() => handleSendLink('copy')}
              >
                {showShareSuccessMsg ? 'Copiado!' : 'Copiar Texto'}
              </Button>
            </div>
          </div>
        </Card>

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

        {activeTab === 'PARCEIROS' && isSuperAdmin && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Gestão de Parceiros SaaS</h2>
                <p className="text-slate-500 text-xs sm:text-sm mt-0.5">Ativações, renovações e gerenciamento direto de todos os Lava Jatos cadastrados.</p>
              </div>
              <div className="w-full sm:w-72 relative">
                <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <Input 
                  placeholder="Buscar Lava Jato..." 
                  className="pl-9 h-10 text-xs sm:text-sm"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {allTenants
                .filter(t => t.nome.toLowerCase().includes(searchTerm.toLowerCase()))
                .map((tenantItem) => {
                  const itemRestantes = tenantItem.data_vencimento ? differenceInDays(parseISO(tenantItem.data_vencimento), new Date()) : 30;
                  const itemBlocked = tenantItem.status_assinatura === 'BLOQUEADO' || itemRestantes < 0;
                  const statusVariant = itemBlocked ? 'danger' : (tenantItem.status_assinatura === 'PAGO' ? 'success' : 'warning');
                  const itemDisplayStatus = itemBlocked ? 'BLOQUEADO' : tenantItem.status_assinatura;

                  return (
                    <Card key={tenantItem.id} className="p-5 flex flex-col justify-between hover:shadow-md transition-shadow border border-slate-200 bg-white">
                      <div>
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="font-bold text-slate-900 text-sm sm:text-base">{tenantItem.nome}</h3>
                            <p className="text-xs text-slate-500">/{tenantItem.slug}</p>
                          </div>
                          <Badge variant={statusVariant}>{itemDisplayStatus}</Badge>
                        </div>
                        
                        <div className="mb-6">
                          <div className="flex justify-between text-xs mb-1">
                            <span className={itemBlocked ? "text-red-600 font-semibold" : "text-slate-500"}>Expiração</span>
                            <span className={cn("font-semibold", itemBlocked ? "text-red-700" : "text-slate-700")}>
                              {itemRestantes < 0 ? 'Vencido' : `${itemRestantes} dias restantes`}
                            </span>
                          </div>
                          <div className={cn("w-full h-2 rounded-full", itemBlocked ? "bg-red-100" : "bg-slate-100")}>
                            <div 
                              className={cn("h-2 rounded-full", itemBlocked ? "bg-red-500" : tenantItem.status_assinatura === 'PAGO' ? "bg-green-500" : "bg-blue-500")} 
                              style={{ width: itemBlocked ? '100%' : `${Math.min(100, Math.max(0, (itemRestantes / 30) * 100))}%` }}
                            ></div>
                          </div>
                        </div>
                        
                        <div className="text-xs sm:text-sm text-slate-500 mb-4 space-y-1.5">
                          <p><strong>Contato:</strong> {tenantItem.telefone_whatsapp || 'Não informado'}</p>
                          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 mt-2">
                            <p className="text-[10px] text-slate-400 font-semibold mb-1 uppercase tracking-wide">Link de Agendamentos do Cliente:</p>
                            <div className="flex items-center justify-between gap-1.5 bg-white px-2.5 py-1.5 rounded-lg border border-slate-100 text-[11px] font-mono text-slate-700 min-w-0 mb-2">
                              <span className="truncate select-all select-none">{getFriendlyUrl(`/#/${tenantItem.slug}`)}</span>
                              <button 
                                onClick={() => {
                                  navigator.clipboard.writeText(getFriendlyUrl(`/#/${tenantItem.slug}`));
                                  setCopiedTenantId(tenantItem.id);
                                  setTimeout(() => setCopiedTenantId(null), 2000);
                                }}
                                className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-blue-600 transition-colors shrink-0 flex items-center"
                                  title="Copiar Link"
                              >
                                {copiedTenantId === tenantItem.id ? "✓" : <Copy className="w-3.5 h-3.5" />}
                              </button>
                            </div>

                            <div className="flex items-center gap-1.5 justify-between">
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                  navigator.clipboard.writeText(getFriendlyUrl(`/#/${tenantItem.slug}`));
                                  setCopiedTenantId(tenantItem.id);
                                  setTimeout(() => setCopiedTenantId(null), 2000);
                                }}
                                className="h-7 text-[10px] font-bold border-slate-200 rounded-md py-0.5 px-2 hover:bg-slate-100 flex items-center justify-center gap-1 text-slate-600 shrink-0"
                              >
                                <Copy className="w-2.5 h-2.5" />
                                {copiedTenantId === tenantItem.id ? "Copiado!" : "Copiar"}
                              </Button>
                              <a 
                                href={getFriendlyUrl(`/#/${tenantItem.slug}`)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="h-7 text-[10px] font-bold bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200 rounded-md py-0.5 px-2 flex items-center justify-center gap-1 transition-colors shrink-0"
                              >
                                <ExternalLink className="w-2.5 h-2.5" />
                                Ver Link
                              </a>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2 mt-auto">
                        <Button 
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold h-9 text-xs"
                          onClick={async () => {
                            const newDate = addDays(new Date(), 30).toISOString();
                            try {
                              await api.updateTenantStatus(tenantItem.id, { status_assinatura: 'PAGO', data_vencimento: newDate });
                              const updatedList = await api.getTenants();
                              setAllTenants(updatedList);
                            } catch (err: any) {
                              setErrorMsg("Erro ao atualizar status do Lava Jato!");
                            }
                          }}
                        >
                          {itemBlocked ? 'Reativar Mês (R$ 30)' : 'Ativar Mês (R$ 30)'}
                        </Button>
                        <div className="flex space-x-2">
                          <Button 
                            variant="secondary" 
                            className="w-1/2 h-8 text-[11px] font-bold"
                            onClick={async () => {
                              const newDate = addDays(new Date(), 30).toISOString();
                              try {
                                await api.updateTenantStatus(tenantItem.id, { status_assinatura: 'GRATUITO', data_vencimento: newDate });
                                const updatedList = await api.getTenants();
                                setAllTenants(updatedList);
                              } catch (err: any) {
                                setErrorMsg("Erro ao atualizar status do Lava Jato!");
                              }
                            }}
                          >
                            Ativar Teste
                          </Button>
                          <Button 
                            variant="secondary" 
                            className="w-1/2 bg-slate-200 hover:bg-blue-50 hover:text-blue-700 text-slate-800 border-none transition-all flex items-center justify-center font-bold text-[11px] h-8"
                            onClick={() => {
                              setTenantId(tenantItem.id);
                              navigate(`/admin?tenantId=${tenantItem.id}`);
                              setActiveTab('HORARIOS');
                            }}
                          >
                            Gerenciar Painel
                          </Button>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              {allTenants.length === 0 && (
                <div className="col-span-full text-center py-10 text-slate-500 bg-white rounded-xl border border-slate-200">
                  Nenhum parceiro encontrado.
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'HORARIOS' && (
          <div className="space-y-6">
            {/* Resumo Financeiro na Tela Inicial (Dashboard Rápido) */}
            <div className="grid grid-cols-3 gap-4 mb-2">
               <Card className="p-4 border-l-4 border-l-green-500 bg-white shadow-sm flex flex-col justify-center">
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Receita do Mês</p>
                  <p className="text-xl font-black text-green-700">{formatCurrency(receitasMes)}</p>
               </Card>
               <Card className="p-4 border-l-4 border-l-red-500 bg-white shadow-sm flex flex-col justify-center">
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Despesa do Mês</p>
                  <p className="text-xl font-black text-red-600">{formatCurrency(despesasMes)}</p>
               </Card>
               <Card className={`p-4 border-l-4 bg-white shadow-sm flex flex-col justify-center ${lucroMes >= 0 ? 'border-l-blue-500' : 'border-l-amber-500'}`}>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Lucro Líquido</p>
                  <p className={`text-xl font-black ${lucroMes >= 0 ? 'text-blue-600' : 'text-amber-600'}`}>{formatCurrency(lucroMes)}</p>
               </Card>
            </div>

            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Agendamentos de Hoje</h2>
              <Button size="sm">Novo Agendamento</Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {appointments
                .filter((app: any) => app.horario_marcado && format(parseISO(app.horario_marcado), 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd'))
                .sort((a: any, b: any) => new Date(a.horario_marcado).getTime() - new Date(b.horario_marcado).getTime())
                .map((app: any) => {
                const linkedCustomer = (customers || []).find((c: any) => c.telefone === app.telefone);
                let vehiclePlaca = app.veiculo_placa;
                if (!vehiclePlaca && linkedCustomer && Array.isArray(linkedCustomer.veiculos) && linkedCustomer.veiculos.length > 0) {
                   vehiclePlaca = linkedCustomer.veiculos.map((v: any) => v.placa).join(', ');
                } else if (!vehiclePlaca) {
                   vehiclePlaca = linkedCustomer?.placa_veiculo || 'Nenhum';
                }
                const ticketId = app.id.slice(-6).toUpperCase();

                return (
                <Card key={app.id} className="p-5 border-l-4 border-l-blue-600">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-slate-900 flex items-center gap-2 flex-wrap">
                        {format(parseISO(app.horario_marcado), 'dd/MM/yyyy HH:mm')} - {app.nome}
                      </h3>
                      <div className="flex items-center gap-2 mt-2 mb-1">
                        <Badge variant="default" className="font-mono text-[10px] bg-slate-200 text-slate-800 border overflow-hidden">TICKET: #{ticketId}</Badge>
                        <button onClick={() => { navigator.clipboard.writeText(ticketId); alert('Ticket copiado!'); }} className="text-slate-400 hover:text-blue-600 transition-colors" title="Copiar Ticket"><Copy className="w-3.5 h-3.5" /></button>
                      </div>
                      <p className="text-sm text-slate-500 flex items-center mt-1">
                        🇧🇷 {app.telefone}
                      </p>
                      <div className="mt-3 text-[13px] text-slate-700">
                        <span className="font-medium text-slate-500">Serviços:</span> {app.servicos.join(', ')}
                      </div>
                      <div className="mt-1 text-[13px] text-slate-700">
                        <span className="font-medium text-slate-500">Logística:</span> {app.logistica}
                      </div>
                      <div className="mt-1 text-[13px] text-slate-700">
                        <span className="font-medium text-slate-500">Veículo:</span> <span className="font-bold">{vehiclePlaca}</span>
                      </div>

                      {editingPrevisaoId === app.id ? (
                        <div className="flex items-center gap-2 mt-2">
                          <span className="font-medium text-slate-500 text-[13px]">Previsão:</span>
                          <input 
                            type="time" 
                            value={newPrevisaoTime} 
                            onChange={e => setNewPrevisaoTime(e.target.value)} 
                            className="w-24 text-xs h-8 border rounded px-2" 
                          />
                          <Button onClick={() => handleSavePrevisao(app.id, app.horario_marcado)} size="sm" className="h-8 text-xs px-3">Salvar</Button>
                          <Button variant="ghost" onClick={() => setEditingPrevisaoId(null)} size="sm" className="h-8 text-xs px-2">Cancelar</Button>
                        </div>
                      ) : (
                        <div className="mt-1 text-[13px] text-slate-700 flex items-center gap-2">
                          <div>
                            <span className="font-medium text-slate-500">Previsão:</span> {app.previsao_entrega ? format(parseISO(app.previsao_entrega), 'HH:mm') : 'Não definida'}
                          </div>
                          <button onClick={() => {
                              setEditingPrevisaoId(app.id); 
                              setNewPrevisaoTime(app.previsao_entrega ? format(parseISO(app.previsao_entrega), 'HH:mm') : '');
                          }} className="text-blue-600 hover:text-blue-800 underline text-xs font-medium">
                            Editar
                          </button>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className={getAppStatusDisplay(app).className}>{getAppStatusDisplay(app).status}</span>
                      {renderCountdown(app)}
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between items-center">
                    <span className="font-bold text-slate-900">{formatCurrency(app.total)}</span>
                    <div className="flex items-center gap-2">
                      {app.status === 'AGENDADO' && (
                        <Button 
                          size="sm" 
                          className="bg-blue-600 hover:bg-blue-700 text-white"
                          onClick={() => handleIniciarServico(app)}
                        >
                          <PlayCircle className="w-4 h-4 mr-1" /> Iniciar
                        </Button>
                      )}
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="bg-white border-orange-200 text-orange-700 hover:bg-orange-50"
                        onClick={() => {
                          const horaPrev = app.previsao_entrega ? format(parseISO(app.previsao_entrega), 'HH:mm') : 'mais tarde';
                          const text = `Olá ${app.nome}, tudo bem?\n\nPedimos sinceras desculpas pelo imprevisto, mas precisaremos fazer um pequeno ajuste na previsão de entrega do seu veículo. Nossa equipe está trabalhando com o máximo de cuidado e dedicação para garantir que o serviço fique impecável para você!\n\nA nova estimativa de finalização é para as *${horaPrev}*.\n\nAgradecemos imensamente pela sua paciência e compreensão. Qualquer dúvida estamos à disposição!`;
                          window.open(`https://wa.me/${app.telefone}?text=${encodeURIComponent(text)}`, '_blank');
                        }}
                      >
                        <Clock className="w-4 h-4 mr-1" /> Avisar Atraso
                      </Button>
                      <Button 
                        variant="secondary" 
                        size="sm" 
                        onClick={() => handleCarroPronto(app)}
                      >
                        <PhoneForwarded className="w-4 h-4 mr-1" /> Avisar Cliente
                      </Button>
                      <button 
                        onClick={async () => {
                          if (confirm("Teste Finalizado? Deseja excluir todo o histórico, agendamentos e valores gerados por este cliente na receita?")) {
                            const linkedCust = (customers || []).find((c: any) => c.telefone === app.telefone);
                            if (linkedCust?.id) {
                              try {
                                await api.deleteCustomerAndRelated(linkedCust.id);
                                loadData();
                              } catch(e) { alert("Erro ao excluir dados do teste."); }
                            } else {
                              try {
                                await api.deleteAppointment(app.id);
                                loadData();
                              } catch (e: any) {
                                if (e.message?.includes('row-level security') || e.code === '42501') {
                                  alert("Aviso RLS: Para liberar a exclusão no Supabase, execute este comando no SQL Editor:\n\nCREATE POLICY \"Tenant delete access appointments\" ON public.appointments FOR DELETE USING (EXISTS (SELECT 1 FROM public.tenants WHERE id = tenant_id AND owner_id = auth.uid()) OR public.is_super_admin(auth.uid()));");
                                } else {
                                  alert("Erro ao deletar: " + e.message);
                                }
                              }
                            }
                          }
                        }}
                        className="text-red-500 hover:bg-red-50 p-2 rounded-md transition-colors"
                        title="Deletar Teste Completo"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </Card>
              )})}
              {appointments.filter((app: any) => app.horario_marcado && format(parseISO(app.horario_marcado), 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')).length === 0 && <div className="col-span-full text-center p-8 text-gray-500 bg-white rounded-lg border border-slate-200">Nenhum agendamento para hoje.</div>}
            </div>
            
            <div className="pt-6 mt-6 border-t border-slate-200 space-y-6">
               <h2 className="text-xl font-bold text-slate-900 border-l-4 border-slate-800 pl-3">Controle Financeiro & Equipe</h2>
               
               <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                 {/* Extrato Financeiro Manual */}
                 <Card className="p-0 overflow-hidden border-slate-200 flex flex-col h-[500px]">
                    <div className="p-4 bg-slate-50 border-b border-slate-200 sticky top-0 z-10 font-bold text-slate-700 text-[12px] uppercase tracking-wider flex items-center justify-between">
                      <div className="flex items-center gap-2"><DollarSign className="w-4 h-4 text-emerald-600"/> Lançamento de Caixas / Despesas Avulsas</div>
                    </div>
                    
                    <div className="p-4 bg-white border-b border-slate-100 shrink-0">
                      <div className="flex flex-col sm:flex-row gap-2">
                        <Input 
                          placeholder="Motivo (Ex: Conta de Luz)" 
                          value={expenseDesc}
                          onChange={(e) => setExpenseDesc(e.target.value)}
                          className="flex-1 bg-slate-50"
                        />
                        <div className="flex gap-2">
                          <Input 
                            type="number" 
                            placeholder="Valor R$" 
                            value={expenseValue}
                            onChange={(e) => setExpenseValue(e.target.value)}
                            className="w-28 bg-slate-50"
                          />
                          <Button onClick={handleAddExpense} className="bg-red-600 hover:bg-red-700 whitespace-nowrap">Lançar Saída</Button>
                        </div>
                      </div>
                    </div>

                    <div className="flex-1 overflow-y-auto w-full">
                      <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-50 sticky top-0 text-[10px] uppercase font-bold text-slate-500">
                          <tr>
                            <th className="px-4 py-2 border-y border-slate-100">Lançamento</th>
                            <th className="px-4 py-2 border-y border-slate-100 w-24">Data</th>
                            <th className="px-4 py-2 border-y border-slate-100 text-right w-24">Valor</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-sm">
                          {finances
                            .filter((f: any) => f.tipo === 'SAIDA' || f.tipo === 'DESPESA' || (f.tipo === 'ENTRADA' && f.descricao)) // Also allow loose entradas
                            .sort((a: any, b: any) => new Date(b.created_at || b.data_lancamento).getTime() - new Date(a.created_at || a.data_lancamento).getTime())
                            .map((f: any) => (
                              <tr key={f.id} className="hover:bg-slate-50">
                                <td className="px-4 py-3 font-medium text-slate-700 truncate max-w-[200px]" title={f.descricao}>{f.descricao}</td>
                                <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">{format(new Date(f.data_lancamento || f.created_at || new Date()), "dd/MM")}</td>
                                <td className={`px-4 py-3 text-right font-black whitespace-nowrap ${f.tipo === 'ENTRADA' ? 'text-green-600' : 'text-red-500'}`}>
                                  {f.tipo === 'ENTRADA' ? '+' : '-'}{formatCurrency(f.valor)}
                                </td>
                              </tr>
                          ))}
                        </tbody>
                      </table>
                      {finances.length === 0 && <div className="text-center p-8 text-slate-400 text-sm">Nenhum lançamento no caixa ainda.</div>}
                    </div>
                 </Card>

                 {/* Controle de Funcionarios */}
                 <Card className="p-0 overflow-hidden border-slate-200 flex flex-col h-[500px]">
                    <div className="p-4 bg-slate-50 border-b border-slate-200 sticky top-0 z-10 flex items-center justify-between">
                      <div className="font-bold text-slate-700 text-[12px] uppercase tracking-wider flex items-center gap-2"><Users className="w-4 h-4 text-blue-600"/> Equipe e Pagamentos</div>
                      <Button size="xs" onClick={() => { setActiveEmployee(null); setEmployeeFieldNome(''); setEmployeeFieldCargo(''); setEmployeeFieldTelefone(''); setShowEmployeeForm(true); }} className="h-7 text-[11px]"><Plus className="w-3 h-3 mr-1" /> Novo Funcionário</Button>
                    </div>

                    <div className="flex-1 overflow-y-auto bg-white p-4 space-y-3">
                      {showEmployeeForm && (
                         <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg space-y-3 mb-4">
                            <h4 className="font-bold text-slate-800 text-xs uppercase">{activeEmployee ? 'Editar' : 'Novo'} Funcionário</h4>
                            <div className="grid grid-cols-2 gap-2">
                               <Input placeholder="Nome Completo" value={employeeFieldNome} onChange={e=>setEmployeeFieldNome(e.target.value)} className="bg-white text-xs"/>
                               <Input placeholder="Cargo (Ex: Lavador)" value={employeeFieldCargo} onChange={e=>setEmployeeFieldCargo(e.target.value)} className="bg-white text-xs"/>
                            </div>
                            <Input placeholder="Telefone (Opcional)" value={employeeFieldTelefone} onChange={e=>setEmployeeFieldTelefone(e.target.value)} className="bg-white text-xs"/>
                            <div className="flex gap-2 justify-end">
                               <Button variant="outline" size="sm" onClick={() => setShowEmployeeForm(false)}>Cancelar</Button>
                               <Button size="sm" onClick={handleSaveEmployee}>Salvar Info</Button>
                            </div>
                         </div>
                      )}

                      {(tenant?.services_pricing?._funcionarios || []).map((emp: any) => (
                         <div key={emp.id} className="p-3 border border-slate-100 rounded-xl bg-slate-50 hover:bg-slate-100 hover:border-slate-300 transition-colors">
                           <div className="flex items-center justify-between">
                             <div>
                               <p className="font-bold text-slate-800 text-sm flex items-center gap-2">{emp.nome}</p>
                               <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mt-0.5">{emp.cargo || 'Funcinário'}</p>
                             </div>
                             <div className="flex items-center gap-1">
                               <Button variant="secondary" size="xs" className="h-7 bg-white" onClick={() => {
                                 setActiveEmployee(emp);
                                 setPaymentAmount(''); setPaymentVales(''); setPaymentOutros('');
                                 setShowPaymentModal(true);
                               }}>Pagar</Button>
                               <button onClick={() => { setActiveEmployee(emp); setEmployeeFieldNome(emp.nome); setEmployeeFieldCargo(emp.cargo||''); setEmployeeFieldTelefone(emp.telefone||''); setShowEmployeeForm(true); }} className="p-1.5 text-blue-600 bg-white rounded-md border border-slate-200 hover:bg-blue-50"><Edit className="w-3.5 h-3.5"/></button>
                               <button onClick={() => handleDeleteEmployee(emp.id)} className="p-1.5 text-red-600 bg-white rounded-md border border-slate-200 hover:bg-red-50"><Trash2 className="w-3.5 h-3.5"/></button>
                             </div>
                           </div>
                         </div>
                      ))}
                      {(tenant?.services_pricing?._funcionarios || []).length === 0 && !showEmployeeForm && (
                        <div className="text-center p-8 text-slate-400 text-sm">
                           Nenhum funcionário cadastrado.
                        </div>
                      )}
                    </div>
                 </Card>
               </div>
            </div>

            {/* Modal de Pagamento de Funcionario */}
            {showPaymentModal && activeEmployee && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
                <Card className="w-full max-w-sm bg-white shadow-xl">
                  <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                    <h3 className="font-bold text-slate-800">Lançar Pagamento</h3>
                    <button onClick={() => setShowPaymentModal(false)}><X className="w-5 h-5 text-slate-400" /></button>
                  </div>
                  <div className="p-4 space-y-4">
                    <div className="bg-slate-50 p-3 rounded-lg flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">{activeEmployee.nome.charAt(0)}</div>
                      <div>
                        <p className="font-bold text-sm text-slate-800">{activeEmployee.nome}</p>
                        <p className="text-xs text-slate-500 uppercase">{activeEmployee.cargo}</p>
                      </div>
                    </div>
                    
                    <form onSubmit={handlePayEmployee} className="space-y-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Valor (Ex: Semanal, Diária)</label>
                        <Input type="number" required placeholder="Ex: 500" value={paymentAmount} onChange={e=>setPaymentAmount(e.target.value)} />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Vales / Adiantamentos</label>
                        <Input type="number" placeholder="Ex: 50" value={paymentVales} onChange={e=>setPaymentVales(e.target.value)} />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Outros Valores</label>
                        <Input type="number" placeholder="Ex: 20" value={paymentOutros} onChange={e=>setPaymentOutros(e.target.value)} />
                      </div>

                      <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-500 uppercase">Total Despesa</span>
                        <span className="text-lg font-black text-red-600">
                          {formatCurrency((Number(paymentAmount)||0) + (Number(paymentVales)||0) + (Number(paymentOutros)||0))}
                        </span>
                      </div>

                      <Button type="submit" className="w-full bg-red-600 hover:bg-red-700">Confirmar Pagamento</Button>
                      <p className="text-[10px] text-center text-slate-500 mt-2">O total pago será abatido diretamente nas depesas gerais do mês.</p>
                    </form>
                  </div>
                </Card>
              </div>
            )}
          </div>

        )}

        {activeTab === 'MES' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">Guia de Serviços do Mês</h2>
              <span className="bg-blue-50 text-blue-700 border border-blue-200 uppercase font-black text-[10px] tracking-wider px-2.5 py-1 rounded-full">
                {format(new Date(), 'MMMM / yyyy', { locale: ptBR })}
              </span>
            </div>

            <Card className="border border-slate-200 bg-white shadow-sm overflow-hidden">
              <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <h3 className="font-bold text-slate-700 text-sm uppercase flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-blue-500" />
                  Todos os Serviços deste mês
                </h3>
              </div>
              <div className="divide-y divide-slate-100 max-h-[800px] overflow-y-auto">
                {(() => {
                  const currentMonthServices = appointments
                    .filter((app: any) => app.horario_marcado && format(parseISO(app.horario_marcado), 'yyyy-MM') === format(new Date(), 'yyyy-MM'))
                    .sort((a: any, b: any) => new Date(b.horario_marcado).getTime() - new Date(a.horario_marcado).getTime());

                  if (currentMonthServices.length === 0) {
                    return <div className="p-10 text-center text-slate-500 text-sm">Nenhum serviço registrado neste mês ainda.</div>;
                  }

                  return currentMonthServices.map((app: any) => {
                    const isTodayLocal = format(parseISO(app.horario_marcado), 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
                    const linkedCustomer = (customers || []).find((c: any) => c.telefone === app.telefone);
                    let vehiclePlaca = app.veiculo_placa;
                    if (!vehiclePlaca && linkedCustomer && Array.isArray(linkedCustomer.veiculos) && linkedCustomer.veiculos.length > 0) {
                      vehiclePlaca = linkedCustomer.veiculos.map((v: any) => v.placa).join(', ');
                    } else if (!vehiclePlaca) {
                      vehiclePlaca = linkedCustomer?.placa_veiculo || 'Nenhum';
                    }
                    
                    return (
                      <div key={app.id} className="p-4 sm:p-5 hover:bg-slate-50 transition-all flex flex-col md:flex-row justify-between md:items-center gap-4">
                        <div className="flex items-start gap-4">
                          <div className={`p-3 rounded-xl border ${app.status === 'CONCLUIDO' ? 'bg-green-50 border-green-100 text-green-600' : isTodayLocal ? 'bg-blue-50 border-blue-100 text-blue-600' : 'bg-slate-100 border-slate-200 text-slate-500'}`}>
                            {app.status === 'CONCLUIDO' ? <CheckCircle className="w-6 h-6" /> : isTodayLocal ? <Star className="w-6 h-6" /> : <Calendar className="w-6 h-6" />}
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-bold text-slate-900">{app.nome}</h4>
                              <p className="text-xs text-slate-500">({app.telefone})</p>
                              {app.status === 'CONCLUIDO' && <span className="bg-green-100 text-green-800 text-[10px] px-2 py-0.5 rounded-full font-bold">CONCLUÍDO</span>}
                              {app.status === 'AGENDADO' && <span className="bg-blue-100 text-blue-800 text-[10px] px-2 py-0.5 rounded-full font-bold">AGENDADO</span>}
                              {isTodayLocal && <span className="bg-amber-100 text-amber-800 text-[10px] px-2 py-0.5 rounded-full font-bold">HOJE</span>}
                            </div>
                            <p className="text-sm text-slate-700 font-medium mb-1">{app.servicos?.join(', ')}</p>
                            <div className="flex items-center gap-3 text-xs text-slate-500 font-medium">
                              <span className="flex items-center"><Clock className="w-3.5 h-3.5 mr-1"/> {format(parseISO(app.horario_marcado), "dd/MM/yyyy 'às' HH:mm")}</span>
                              <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                              <span>Placa: {vehiclePlaca}</span>
                              <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                              <span className="uppercase text-[10px] bg-slate-200 px-1.5 py-0.5 rounded">Tk: #{app.id.slice(-6).toUpperCase()}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-row md:flex-col items-center md:items-end justify-between w-full md:w-auto">
                          <span className="font-black text-slate-800 text-lg">{formatCurrency(app.total)}</span>
                          <button 
                            onClick={async () => {
                               if (linkedCustomer?.id) {
                                 handleDeleteCustomer(linkedCustomer.id);
                               } else {
                                 if (confirm("Deseja deletar este agendamento de teste?")) {
                                   try {
                                     await api.deleteAppointment(app.id);
                                     loadData();
                                   } catch(e) { console.error(e); }
                                 }
                               }
                            }}
                            className="mt-2 text-xs text-red-500 hover:text-red-700 font-medium flex items-center gap-1 opacity-60 hover:opacity-100 transition-opacity"
                          >
                            <Trash2 className="w-3.5 h-3.5" /> Excluir Registro
                          </button>
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            </Card>
          </div>
        )}

        {activeTab === 'FINANCAS' && (
          <div className="space-y-6">
            {/* Cards Financeiros */}
            <div>
              <h2 className="text-xl font-bold text-slate-900 mb-4">Resumo Mensal</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="p-5 bg-white border border-slate-200">
                  <p className="text-xs text-slate-500 font-medium mb-1 uppercase tracking-wider">Receitas (Mês)</p>
                  <h3 className="text-2xl font-bold text-green-600">{formatCurrency(receitasMes)}</h3>
                </Card>
                <Card className="p-5 bg-white border border-slate-200">
                  <p className="text-xs text-slate-500 font-medium mb-1 uppercase tracking-wider">Despesas (Mês)</p>
                  <h3 className="text-2xl font-bold text-red-600">{formatCurrency(despesasMes)}</h3>
                </Card>
                <Card className="p-5 bg-white border border-slate-200">
                  <p className="text-xs text-slate-500 font-medium mb-1 uppercase tracking-wider">Lucro Líquido (Mês)</p>
                  <h3 className={`text-2xl font-bold ${lucroMes >= 0 ? 'text-blue-600' : 'text-red-500'}`}>{formatCurrency(lucroMes)}</h3>
                </Card>
              </div>
            </div>

            <div>
              <h2 className="text-xl font-bold text-slate-900 mb-4 pt-4 border-t border-slate-200">Estatísticas Anuais</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="p-5 bg-white border border-slate-200">
                  <p className="text-xs text-slate-500 font-medium mb-1 uppercase tracking-wider">Receitas (Ano)</p>
                  <h3 className="text-xl font-bold text-slate-900">{formatCurrency(receitasAno)}</h3>
                </Card>
                <Card className="p-5 bg-white border border-slate-200">
                  <p className="text-xs text-slate-500 font-medium mb-1 uppercase tracking-wider">Despesas (Ano)</p>
                  <h3 className="text-xl font-bold text-slate-900">{formatCurrency(despesasAno)}</h3>
                </Card>
                <Card className="p-5 bg-white border border-slate-200">
                  <p className="text-xs text-slate-500 font-medium mb-1 uppercase tracking-wider">Lucro Líquido (Ano)</p>
                  <h3 className={`text-xl font-bold ${lucroAno >= 0 ? 'text-blue-600' : 'text-red-500'}`}>{formatCurrency(lucroAno)}</h3>
                </Card>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 pt-6 border-t border-slate-200">
              {/* Controle de Gastos */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
                <h3 className="text-lg font-bold text-slate-900 mb-4 border-b border-slate-100 pb-3">Controle de Gastos (Despesas)</h3>
                <div className="flex gap-2 mb-6">
                  <Input 
                    placeholder="Descrição do Gasto (Ex: Produtos, Energia)" 
                    value={expenseDesc}
                    onChange={(e) => setExpenseDesc(e.target.value)}
                    className="flex-1"
                  />
                  <Input 
                    type="number" 
                    placeholder="R$ Valor" 
                    value={expenseValue}
                    onChange={(e) => setExpenseValue(e.target.value)}
                    className="w-32"
                  />
                  <Button onClick={handleAddExpense} className="bg-red-600 hover:bg-red-700">Adicionar</Button>
                </div>

                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                  {finances
                    .filter((f: any) => f.tipo === 'SAIDA' || f.tipo === 'DESPESA')
                    .sort((a: any, b: any) => new Date(b.created_at || b.data_lancamento).getTime() - new Date(a.created_at || a.data_lancamento).getTime())
                    .map((f: any) => (
                      <div key={f.id} className="flex justify-between items-center p-3 border-b border-slate-100">
                        <div>
                          <p className="text-sm font-semibold text-slate-800">{f.descricao}</p>
                          <p className="text-xs text-slate-500">{format(new Date(f.data_lancamento || f.created_at || new Date()), "dd/MM/yyyy HH:mm")}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-red-600">-{formatCurrency(f.valor)}</span>
                          <button onClick={() => handleDeleteFinanceRecord(f.id)} className="text-slate-400 hover:text-red-500">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                  ))}
                  {finances.filter((f: any) => f.tipo === 'SAIDA' || f.tipo === 'DESPESA').length === 0 && (
                     <div className="text-center p-6 text-sm text-slate-500">
                       Nenhuma despesa registrada.
                     </div>
                  )}
                </div>
              </div>
            </div>

            {/* Estatísticas de Serviços e Veículos */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-6 border-t border-slate-200">
              
              {/* Gráfico de Serviços por Categoria */}
              <Card className="p-6 border-slate-200">
                <h3 className="text-lg font-bold text-slate-900 mb-4">Veículos Lavados por Categoria</h3>
                <div className="h-64 mb-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryChartData}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {categoryChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <RechartsTooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="grid grid-cols-3 gap-4 text-center">
                  {categoryChartData.map((entry, i) => (
                    <div key={i} className="bg-slate-50 rounded p-2">
                      <p className="text-xs text-slate-500">{entry.name}</p>
                      <p className="text-lg font-bold" style={{color: COLORS[i % COLORS.length]}}>{entry.value}</p>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Gráfico de Serviços Mais Feitos */}
              <Card className="p-6 border-slate-200">
                <h3 className="text-lg font-bold text-slate-900 mb-4">Top 5 Serviços Mais Realizados</h3>
                <div className="h-64 mb-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={serviceChartData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                      <XAxis type="number" />
                      <YAxis dataKey="name" type="category" width={120} tick={{fontSize: 11}} />
                      <RechartsTooltip />
                      <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]}>
                        {serviceChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </div>
          </div>
        )}

        {activeTab === 'ESTOQUE' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">Estoque e Compras</h2>
              <span className="bg-slate-100 text-slate-700 border border-slate-200 uppercase font-black text-[10px] tracking-wider px-2.5 py-1 rounded-full">
                Inventário & Lançamento de Gastos
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Formulário de Nova Compra/Gasto */}
              <Card className="col-span-1 border border-slate-200 bg-white p-5">
                <h3 className="text-sm font-bold text-slate-800 mb-4 uppercase tracking-wider flex items-center border-b border-slate-100 pb-3">
                  <Plus className="w-4 h-4 mr-2 text-blue-600" /> Registrar Gasto
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Tipo de Gasto</label>
                    <select
                      className="w-full text-sm border-slate-200 rounded-lg flex h-10 w-full items-center justify-between border border-slate-200 bg-white px-3 py-2 text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                      value={compraTipo}
                      onChange={(e) => setCompraTipo(e.target.value)}
                    >
                      <option value="MATERIAL">Material / Produto p/ Estoque</option>
                      <option value="CONSUMO">Conta de Consumo (Água, Luz, etc)</option>
                      <option value="FUNCIONARIO">Pagamento Funcionário</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Item / Descrição</label>
                    <Input 
                      placeholder={compraTipo === 'MATERIAL' ? "Ex: Shampoo, Pretinho" : compraTipo === 'CONSUMO' ? "Ex: Conta de Energia" : "Ex: Diária do João"}
                      value={compraItem}
                      onChange={(e) => setCompraItem(e.target.value)}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Qtd</label>
                      <Input 
                        type="number"
                        placeholder="Ex: 5"
                        value={compraQtd}
                        onChange={(e) => setCompraQtd(e.target.value ? Number(e.target.value) : '')}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Valor Unit (R$)</label>
                      <Input 
                        type="number"
                        placeholder="Ex: 10.50"
                        value={compraValorUnit}
                        onChange={(e) => setCompraValorUnit(e.target.value ? Number(e.target.value) : '')}
                      />
                    </div>
                  </div>
                  
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-500 uppercase">Valor Total</span>
                    <span className="text-lg font-black text-slate-900">
                      {formatCurrency((Number(compraQtd) || 0) * (Number(compraValorUnit) || 0))}
                    </span>
                  </div>
                  
                  <Button 
                    className="w-full bg-blue-600 hover:bg-blue-700 font-bold"
                    onClick={handleAddCompra}
                    disabled={!compraItem || !compraQtd || !compraValorUnit}
                  >
                    Registrar e Lançar Despesa
                  </Button>
                  {compraTipo === 'MATERIAL' && (
                     <p className="text-[10px] text-slate-400 text-center mt-2 leading-tight">Ao registrar como MATERIAL, este item será adicionado automaticamente ao saldo de Estoque Atual.</p>
                  )}
                </div>
              </Card>
              
              {/* Relatório de Estoque Existente */}
              <Card className="col-span-1 lg:col-span-2 overflow-hidden border-slate-200">
                <div className="p-4 bg-slate-50 border-b border-slate-200/60 font-bold text-slate-700 text-[12px] uppercase tracking-wider flex items-center justify-between">
                  <span>Quantidade Atual em Estoque (Materiais)</span>
                </div>
                <div className="max-h-[500px] overflow-y-auto">
                  <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-white sticky top-0 border-b border-slate-200">
                      <tr>
                        <th className="px-5 py-3 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">Produto / Material</th>
                        <th className="px-5 py-3 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">Quantidade</th>
                        <th className="px-5 py-3 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">Status</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-100">
                      {inventory.map((item: any) => (
                        <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-5 py-3 whitespace-nowrap text-sm font-semibold text-slate-800">{item.nome_produto}</td>
                          <td className="px-5 py-3 whitespace-nowrap text-sm text-slate-600 font-medium">
                            <span className="bg-slate-100 px-2 py-0.5 rounded border border-slate-200">{item.quantidade} un</span>
                          </td>
                          <td className="px-5 py-3 whitespace-nowrap">
                            {item.quantidade <= item.nivel_minimo ? (
                              <Badge variant="danger" className="text-[10px]">Baixo / Repor</Badge>
                            ) : (
                              <Badge variant="success" className="text-[10px]">Normal</Badge>
                            )}
                          </td>
                        </tr>
                      ))}
                      {inventory.length === 0 && (
                        <tr>
                          <td colSpan={3} className="px-5 py-8 text-center text-slate-400 text-sm">
                            Nenhum material em estoque. Use o formulário ao lado para comprar e registrar entrada.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          </div>
        )}

        {activeTab === 'SERVICOS' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">Gerenciar Serviços e Preços</h2>
              <Badge variant="success" className="bg-blue-50 text-blue-700 border border-blue-200 uppercase font-black text-[10px] tracking-wider px-2.5 py-1">
                Gestão de Serviços & Preços
              </Badge>
            </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Formulário de Cadastro/Edição de Serviço */}
                  <Card className="p-6 border-slate-200 self-start lg:col-span-1">
                    <h3 className="font-bold text-slate-800 text-[15px] mb-4 flex items-center gap-1.5">
                      {editingServiceName ? (
                        <>
                          <Edit className="w-4 h-4 text-amber-500" />
                          Editar Serviço
                        </>
                      ) : (
                        <>
                          <Plus className="w-4 h-4 text-blue-600" />
                          Novo Serviço
                        </>
                      )}
                    </h3>

                    <form onSubmit={handleSaveService} className="space-y-4">
                      {serviceError && (
                        <div className="bg-red-50 text-red-600 p-3 rounded-xl text-xs flex items-center gap-1.5 border border-red-100">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                          <span>{serviceError}</span>
                        </div>
                      )}

                      {serviceSuccess && (
                        <div className="bg-emerald-50 text-emerald-700 p-3 rounded-xl text-xs flex items-center gap-1.5 border border-emerald-100">
                          <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                          <span>{serviceSuccess}</span>
                        </div>
                      )}

                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Nome do Serviço</label>
                        <Input
                          required
                          type="text"
                          placeholder="Ex: Lavagem de Chassi"
                          value={serviceNameField}
                          onChange={e => setServiceNameField(e.target.value)}
                          className="bg-white border-slate-200"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Preço (R$)</label>
                        <Input
                          required
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="Ex: 85.00"
                          value={servicePriceField}
                          onChange={e => setServicePriceField(e.target.value)}
                          className="bg-white border-slate-200"
                        />
                      </div>

                      <div className="pt-2 flex gap-2">
                        {editingServiceName && (
                          <Button
                            type="button"
                            variant="outline"
                            className="bg-white hover:bg-slate-50 text-slate-600 font-bold text-xs h-10 w-1/3 rounded-xl border border-slate-200"
                            onClick={() => {
                              setEditingServiceName(null);
                              setServiceNameField('');
                              setServicePriceField('');
                              setServiceError(null);
                            }}
                          >
                            Cancelar
                          </Button>
                        )}
                        <Button
                          type="submit"
                          disabled={isSavingService}
                          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs h-10 rounded-xl flex items-center justify-center gap-1.5"
                        >
                          <Save className="w-3.5 h-3.5" />
                          {isSavingService ? 'Salvando...' : (editingServiceName ? 'Salvar Alterações' : 'Adicionar Serviço')}
                        </Button>
                      </div>
                    </form>
                  </Card>

                  {/* Tabela de Preços Cadastrados */}
                  <Card className="lg:col-span-2 overflow-hidden border border-slate-100">
                    <div className="p-4 bg-slate-50 border-b border-slate-200/60 flex items-center justify-between">
                      <h3 className="font-bold text-slate-700 text-[11px] uppercase tracking-wider font-sans">Tabela de Preços Atuais</h3>
                      <Badge variant="success" className="bg-emerald-50 text-emerald-800 font-semibold border-none text-[10px]">
                        {Object.keys(tenant?.services_pricing || {}).filter(k => !k.startsWith('_')).length} Ativos
                      </Badge>
                    </div>

                    <div className="overflow-x-auto border-t border-slate-100">
                      <table className="min-w-full divide-y divide-slate-100">
                        <thead className="bg-slate-50/50">
                          <tr>
                            <th className="px-6 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Nome do Serviço</th>
                            <th className="px-6 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Valor Cobrado</th>
                            <th className="px-6 py-3 text-right text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Ações</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-100">
                          {(() => {
                            const services = Object.entries(tenant?.services_pricing || {}).filter(([k]) => !k.startsWith('_'));
                            if (services.length === 0) {
                              return (
                                <tr>
                                  <td colSpan={3} className="px-6 py-10 text-center text-slate-400 font-medium text-sm">
                                    Nenhum serviço cadastrado ainda. Cadastre o seu primeiro serviço ao lado!
                                  </td>
                                </tr>
                              );
                            }

                            const groups: Record<string, [string, any][]> = {
                              'MOTO': [],
                              'SERVIÇOS RÁPIDOS': [],
                              'HATCH / SEDAN': [],
                              'SUV / CAMINHONETE': []
                            };
                            
                            services.forEach(([name, price]) => {
                              const upperName = name.toUpperCase();
                              if (upperName.includes('SUV') || upperName.includes('CAMINHONETE')) {
                                groups['SUV / CAMINHONETE'].push([name, price]);
                              } else if (upperName.includes('MOTO')) {
                                groups['MOTO'].push([name, price]);
                              } else if (upperName.includes('HATCH') || upperName.includes('SEDAN')) {
                                groups['HATCH / SEDAN'].push([name, price]);
                              } else {
                                groups['SERVIÇOS RÁPIDOS'].push([name, price]);
                              }
                            });

                            return Object.entries(groups).map(([groupName, groupServices]) => {
                              if (groupServices.length === 0) return null;
                              
                              return (
                                <React.Fragment key={groupName}>
                                  <tr>
                                    <td colSpan={3} className="bg-slate-100/80 px-6 py-2 text-[10px] font-black tracking-widest text-slate-500 uppercase">
                                      {groupName}
                                    </td>
                                  </tr>
                                  {groupServices.map(([name, price]: [string, any]) => (
                                    <tr key={name} className="hover:bg-slate-50/40 transition-colors">
                                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-slate-800">{name}</td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-600">{formatCurrency(price)}</td>
                                      <td className="px-6 py-4 whitespace-nowrap text-right text-xs font-semibold space-x-2">
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setEditingServiceName(name);
                                            setServiceNameField(name);
                                            setServicePriceField(price.toString());
                                            setServiceError(null);
                                            setServiceSuccess(null);
                                          }}
                                          className="text-amber-600 hover:text-amber-700 font-bold bg-amber-50 hover:bg-amber-100 px-3 py-1.5 rounded-lg inline-flex items-center gap-1 transition-colors cursor-pointer"
                                        >
                                          <Edit className="w-3.5 h-3.5" /> Editar
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => handleDeleteService(name)}
                                          className="text-red-600 hover:text-red-700 font-bold bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg inline-flex items-center gap-1 transition-colors cursor-pointer"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" /> Excluir
                                        </button>
                                      </td>
                                    </tr>
                                  ))}
                                </React.Fragment>
                              );
                            });
                          })()}
                        </tbody>
                      </table>
                    </div>
                  </Card>
                </div>
          </div>
        )}

        {activeTab === 'CADASTROS' && (
          <div className="space-y-6">
            {selectedCadastroType === 'CLIENTES' ? (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => {
                      setSelectedCadastroType(null);
                      setShowCustomerForm(false);
                      setActiveCustomer(null);
                    }}
                    className="flex items-center text-slate-600 hover:text-slate-900 font-bold text-sm bg-white border px-3 py-1.5 rounded-xl gap-1 hover:shadow-sm"
                  >
                    <ChevronLeft className="w-4 h-4" /> Voltar para Cadastros
                  </button>

                  <Button
                    onClick={() => {
                      setActiveCustomer(null);
                      setCustomerFieldNome('');
                      setCustomerFieldTelefone('');
                      setCustomerFieldEndereco('');
                      setCustomerFieldEnderecoBusca('');
                      setCustomerFieldPlacaVeiculo('');
                      setCustomerFieldVeiculos([]);
                      setCustomerFieldQuantidadeLavadas(0);
                      setShowCustomerForm(true);
                    }}
                    className="bg-blue-600 text-white font-bold text-xs shrink-0 flex items-center gap-1"
                  >
                    <Plus className="w-4 h-4" /> Cadastrar Novo Cliente
                  </Button>
                </div>

                {/* Formulário / Modal de Cliente */}
                {showCustomerForm && (
                  <Card className="p-6 border-slate-200">
                    <h3 className="font-bold text-slate-800 text-[15px] mb-4">
                      {activeCustomer ? 'Editar Informações do Cliente' : 'Cadastrar Novo Cliente'}
                    </h3>
                    <form onSubmit={handleSaveCustomer} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Nome Completo</label>
                        <Input
                          required
                          value={customerFieldNome}
                          onChange={e => setCustomerFieldNome(e.target.value)}
                          placeholder="Digite o nome"
                          className="bg-white border-slate-200"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Telefone / WhatsApp</label>
                        <Input
                          required
                          value={customerFieldTelefone}
                          onChange={e => setCustomerFieldTelefone(e.target.value)}
                          placeholder="Ex: (21) 99999-9999"
                          className="bg-white border-slate-200"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Endereço de Residência</label>
                        <Input
                          value={customerFieldEndereco}
                          onChange={e => setCustomerFieldEndereco(e.target.value)}
                          placeholder="Rua, número, bairro..."
                          className="bg-white border-slate-200"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Endereço de Busca/Retirada do Carro</label>
                        <Input
                          value={customerFieldEnderecoBusca}
                          onChange={e => setCustomerFieldEnderecoBusca(e.target.value)}
                          placeholder="Onde o carro deve ser retirado para lavagem?"
                          className="bg-white border-slate-200"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Veículos / Placas</label>
                        <div className="space-y-2">
                           <div className="flex gap-2">
                             <Input
                               value={customerFieldPlacaVeiculo}
                               onChange={e => setCustomerFieldPlacaVeiculo(e.target.value.toUpperCase())}
                               placeholder="Veículo Principal - Ex: ABC-1234 (Celta Prata)"
                               className="bg-white border-slate-200"
                             />
                           </div>
                           
                           {customerFieldVeiculos.map((v: any, index: number) => (
                              <div key={index} className="flex gap-2 bg-slate-50 p-2 rounded border border-slate-100 items-center">
                                 <Car className="w-4 h-4 text-slate-400" />
                                 <div className="flex-1 text-sm text-slate-700">
                                   <span className="font-bold">{v.marca} {v.modelo}</span> - <span className="font-mono text-xs">{v.placa}</span>
                                 </div>
                                 <button 
                                   type="button" 
                                   onClick={() => setCustomerFieldVeiculos(prev => prev.filter((_, i) => i !== index))}
                                   className="text-red-500 hover:text-red-700 bg-red-50 p-1.5 rounded"
                                   title="Excluir Veículo"
                                 >
                                    <Trash2 className="w-4 h-4" />
                                 </button>
                              </div>
                           ))}

                           <button 
                             type="button"
                             onClick={() => {
                               const marca = prompt("Marca (Ex: Fiat):");
                               if (!marca) return;
                               const modelo = prompt("Modelo (Ex: Argo):");
                               if (!modelo) return;
                               const placa = prompt("Placa (Ex: ABC1234):");
                               if (!placa) return;
                               setCustomerFieldVeiculos(prev => [...prev, { marca, modelo, placa: placa.toUpperCase() }]);
                             }}
                             className="text-[11px] font-bold text-blue-600 hover:text-blue-800 bg-blue-50 px-2 py-1 rounded border border-blue-100 flex items-center gap-1"
                           >
                             <Plus className="w-3 h-3" /> Adicionar Outro Veículo a este Cliente
                           </button>
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Lavagens Acumuladas</label>
                        <Input
                          type="number"
                          min="0"
                          value={customerFieldQuantidadeLavadas}
                          onChange={e => setCustomerFieldQuantidadeLavadas(Number(e.target.value))}
                          className="bg-white border-slate-200"
                        />
                      </div>

                      <div className="md:col-span-2 pt-2 flex justify-end gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setShowCustomerForm(false);
                            setActiveCustomer(null);
                          }}
                        >
                          Cancelar
                        </Button>
                        <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold">
                          Salvar Cliente
                        </Button>
                      </div>
                    </form>
                  </Card>
                )}

                {/* Lista / Dashboard de Clientes */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Diretório de Clientes */}
                  <Card className="lg:col-span-2 border-slate-200">
                    <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <h3 className="font-bold text-sm text-slate-700 uppercase tracking-wider">Diretório de Clientes</h3>
                      <div className="relative w-full sm:w-60">
                        <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                        <Input
                          placeholder="Buscar por nome ou fone..."
                          value={searchCustomerQuery}
                          onChange={e => setSearchCustomerQuery(e.target.value)}
                          className="pl-8 h-8 text-xs bg-white border-slate-200"
                        />
                      </div>
                    </div>

                    <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto">
                      {(data?.customers || [])
                        .filter((c: any) => 
                          (c.nome || '').toLowerCase().includes(searchCustomerQuery.toLowerCase()) ||
                          (c.telefone || '').includes(searchCustomerQuery)
                        )
                        .map((c: any) => {
                          const autoLavadas = appointments.filter((a: any) => a.telefone === c.telefone && a.status === 'CONCLUIDO').length;
                          const totalLavadas = (c.quantidade_lavadas || 0) + autoLavadas;
                          
                          const allCustAppointments = appointments.filter((a: any) => a.telefone === c.telefone);
                          const totalAmountApps = allCustAppointments.reduce((acc, app) => acc + (Number(app.total) || 0), 0);
                          const manualHistoryAmount = Array.isArray(c.servicos_historico) ? c.servicos_historico.reduce((acc: number, vt: any) => acc + (Number(vt.valor) || 0), 0) : 0;
                          const customerTotalSpent = totalAmountApps + manualHistoryAmount;

                          return (
                          <div key={c.id} className={`p-4 hover:bg-slate-50/50 transition-colors ${activeCustomer?.id === c.id ? 'bg-blue-50/30 border-l-4 border-blue-500' : ''}`}>
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-2">
                              <div>
                                <h4 className="font-bold text-slate-800 text-sm">{c.nome}</h4>
                                <p className="text-xs text-slate-500">{formatBRPhone(c.telefone)}</p>
                                <div className="mt-1 flex flex-wrap gap-1">
                                  {Array.isArray(c.veiculos) && c.veiculos.length > 0 ? (
                                    c.veiculos.map((v: any, i: number) => (
                                      <span key={i} className="bg-slate-100 text-slate-600 text-[10px] uppercase px-1.5 py-0.5 rounded flex items-center gap-1 border border-slate-200">
                                        <Car className="w-2.5 h-2.5" /> {v.marca} {v.modelo} ({v.placa})
                                      </span>
                                    ))
                                  ) : c.placa_veiculo ? (
                                    <span className="bg-slate-100 text-slate-600 text-[10px] uppercase px-1.5 py-0.5 rounded flex items-center gap-1 border border-slate-200">
                                      <Car className="w-2.5 h-2.5" /> {c.placa_veiculo}
                                    </span>
                                  ) : null}
                                </div>
                              </div>
                              <div className="flex items-center gap-1.5 whitespace-nowrap">
                                <Badge variant="default" className="bg-slate-100 text-slate-600 border-slate-200 text-[10px]">
                                  {formatCurrency(customerTotalSpent)} Gasto
                                </Badge>
                                <Badge variant="success" className="bg-emerald-50 text-emerald-800 border-none text-[10px]">
                                  {totalLavadas} Lavadas Realizadas
                                </Badge>
                                <button
                                  onClick={() => {
                                    setActiveCustomer(c);
                                    setCustomerFieldNome(c.nome);
                                    setCustomerFieldTelefone(c.telefone);
                                    setCustomerFieldEndereco(c.endereco || '');
                                    setCustomerFieldEnderecoBusca(c.endereco_busca || '');
                                    setCustomerFieldPlacaVeiculo(c.placa_veiculo || '');
                                    setCustomerFieldVeiculos(c.veiculos || []);
                                    setCustomerFieldQuantidadeLavadas(c.quantidade_lavadas || 0);
                                    setShowCustomerForm(true);
                                  }}
                                  className="text-blue-600 hover:text-blue-700 p-1.5 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors cursor-pointer"
                                  title="Editar"
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => {
                                    const ticketId = prompt("Digite o Ticket de Agendamento ou Placa de Veículo para vincular:");
                                    if (ticketId) {
                                      // Localiza agendamento pra ver se tem veiculo lá ou usa como string
                                      const app = appointments.find((a: any) => a.id.slice(-6).toUpperCase() === ticketId.toUpperCase());
                                      const veiculoText = app ? (app.placa_veiculo || `Vinc. Ticket ${ticketId}`) : ticketId;
                                      
                                      api.saveCustomer({ ...c, placa_veiculo: veiculoText }).then(() => {
                                        alert("Veículo / Referência vinculado com sucesso!");
                                        loadData();
                                      });
                                    }
                                  }}
                                  className="text-amber-600 hover:text-amber-700 p-1.5 bg-amber-50 hover:bg-amber-100 rounded-lg transition-colors cursor-pointer"
                                  title="Sincronizar Veículo / Ticket"
                                >
                                  <Car className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteCustomer(c.id)}
                                  className="text-red-600 hover:text-red-700 p-1.5 bg-red-50 hover:bg-red-100 rounded-lg transition-colors cursor-pointer"
                                  title="Deletar"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                                <Button
                                  onClick={() => {
                                    setActiveCustomer(c);
                                    setNewVisitServiceNames([]);
                                    setNewVisitValueSpent('');
                                  }}
                                  size="xs"
                                  variant="secondary"
                                  className="text-[10px] font-bold px-2 py-1 bg-slate-100 border border-slate-200"
                                >
                                  Ver Visitas
                                </Button>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600 mt-1">
                              <p>
                                <span className="font-semibold text-slate-400 uppercase text-[9px] tracking-wide block">Endereço Principal</span>
                                {c.endereco || 'Não informado'}
                              </p>
                              <p>
                                <span className="font-semibold text-slate-400 uppercase text-[9px] tracking-wide block">Local de Busca do Carro</span>
                                {c.endereco_busca || 'Não informado'}
                              </p>
                            </div>
                          </div>
                        )})}
                      {(data?.customers || []).length === 0 && (
                        <div className="p-8 text-center text-slate-400 text-xs">Nenhum cliente cadastrado ainda.</div>
                      )}
                    </div>
                  </Card>

                  {/* Histórico e Registro de Visitas */}
                  <Card className="lg:col-span-1 border-slate-200">
                    {activeCustomer ? (
                      <div className="p-4 space-y-5">
                        <div>
                          <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest">Histórico de Visitas do Cliente</p>
                          <h3 className="font-black text-slate-800 text-base truncate">{activeCustomer.nome}</h3>
                        </div>

                        {/* Registrar nova visita rápida */}
                        <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 space-y-3">
                          <h4 className="text-[11px] font-black uppercase text-slate-700">Registrar Serviços Feitos nesta Visita</h4>
                          
                          <div className="space-y-1.5 max-h-36 overflow-y-auto">
                            {Object.keys(tenant?.services_pricing || {}).filter(k => !k.startsWith('_')).map(sName => (
                              <label key={sName} className="flex items-center gap-2 text-xs text-slate-700 hover:bg-slate-100 p-1.5 rounded transition-colors cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={newVisitServiceNames.includes(sName)}
                                  onChange={() => {
                                    let nextList;
                                    if (newVisitServiceNames.includes(sName)) {
                                      nextList = newVisitServiceNames.filter(n => n !== sName);
                                    } else {
                                      nextList = [...newVisitServiceNames, sName];
                                    }
                                    setNewVisitServiceNames(nextList);
                                    
                                    // Auto calcula valor acumulado dos serviços selecionados
                                    let sum = 0;
                                    nextList.forEach((nItem: any) => {
                                      sum += (tenant?.services_pricing?.[nItem] || 0);
                                    });
                                    setNewVisitValueSpent(sum.toString());
                                  }}
                                  className="rounded text-blue-600 focus:ring-0 border-slate-300"
                                />
                                <span>{sName} ({formatCurrency(tenant?.services_pricing?.[sName] || 0)})</span>
                              </label>
                            ))}
                            {Object.keys(tenant?.services_pricing || {}).filter(k => !k.startsWith('_')).length === 0 && (
                              <p className="text-slate-400 text-[10px]">Nenhum serviço cadastrado na tabela de preços.</p>
                            )}
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Valor Comercial do Serviço (R$)</label>
                            <Input
                              type="number"
                              step="0.01"
                              placeholder="Ex: 85.00"
                              value={newVisitValueSpent}
                              onChange={e => setNewVisitValueSpent(e.target.value)}
                              className="bg-white border-slate-200 text-xs h-8"
                            />
                          </div>

                          <Button
                            onClick={() => handleAddCustomerVisit(activeCustomer.id)}
                            className="bg-blue-600 text-white w-full h-8.5 font-bold text-xs"
                          >
                            Gravar Visita e Somar Lavada
                          </Button>
                        </div>

                        {/* Visitas Anteriores */}
                        <div className="space-y-2">
                          <h4 className="text-[11px] font-extrabold uppercase text-slate-500 tracking-wider">Histórico de Visitas Realizadas</h4>
                          <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                            {(() => {
                              // Manual visits
                              const manualVisits = Array.isArray(activeCustomer.servicos_historico) ? activeCustomer.servicos_historico.map((vt: any) => ({
                                data: vt.data,
                                valor: vt.valor || 0,
                                servicos: Array.isArray(vt.servicos) ? vt.servicos.join(' + ') : vt.servicos,
                                isManual: true
                              })) : [];

                              // Auto visits from appointments
                              const autoVisits = appointments
                                .filter((a: any) => a.telefone === activeCustomer.telefone && a.status === 'CONCLUIDO')
                                .map((a: any) => ({
                                  data: a.horario_marcado || a.data_lancamento || new Date().toISOString(),
                                  valor: a.total || 0,
                                  servicos: Array.isArray(a.servicos) ? a.servicos.join(' + ') : a.servicos,
                                  isManual: false,
                                  id: a.id
                                }));

                              const allVisits = [...manualVisits, ...autoVisits].sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());

                              if (allVisits.length === 0) {
                                return <p className="text-center text-slate-400 text-xs py-4">Nenhuma visita encontrada.</p>;
                              }

                              return allVisits.map((vt: any, idx: number) => (
                                <div key={idx} className={`p-3 border rounded-xl hover:shadow-xs transition-shadow ${vt.isManual ? 'bg-white border-slate-100' : 'bg-blue-50/30 border-blue-100'}`}>
                                  <div className="flex justify-between text-[11px] font-bold text-slate-400 mb-1">
                                    <div className="flex items-center gap-1.5">
                                      <span>{format(parseISO(vt.data), 'dd/MM/yyyy HH:mm')}</span>
                                      {!vt.isManual && <Badge variant="success" className="bg-blue-100 text-blue-700 border-none px-1 py-0.5 text-[8px] uppercase">Agendamento</Badge>}
                                    </div>
                                    <span className="text-blue-600 font-extrabold">{formatCurrency(vt.valor)}</span>
                                  </div>
                                  <div className="text-xs font-bold text-slate-800">
                                    {vt.servicos}
                                  </div>
                                </div>
                              ));
                            })()}
                          </div>
                        </div>

                      </div>
                    ) : (
                      <div className="p-8 text-center text-slate-400 text-xs flex flex-col items-center justify-center min-h-[300px]">
                        <Users className="w-10 h-10 text-slate-300 mb-2" />
                        Selecione um cliente para conferir e editar o histórico completo de visitas e serviços feitos.
                      </div>
                    )}
                  </Card>
                </div>
              </div>
            ) : selectedCadastroType === 'VEICULOS' ? (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => {
                      setSelectedCadastroType(null);
                      setShowVehicleForm(false);
                      setActiveVehicle(null);
                    }}
                    className="flex items-center text-slate-600 hover:text-slate-900 font-bold text-sm bg-white border px-3 py-1.5 rounded-xl gap-1 hover:shadow-sm"
                  >
                    <ChevronLeft className="w-4 h-4" /> Voltar para Cadastros
                  </button>

                  <Button
                    onClick={() => {
                      setActiveVehicle(null);
                      setVehicleFieldMarca('');
                      setVehicleFieldModelo('');
                      setVehicleFieldPlaca('');
                      setVehicleFieldObservacao('');
                      setShowVehicleForm(true);
                    }}
                    className="bg-blue-600 text-white font-bold text-xs flex items-center gap-1 shrink-0"
                  >
                    <Plus className="w-4 h-4" /> Cadastrar Novo Veículo
                  </Button>
                </div>

                {/* Formulário / Modal de Veículo */}
                {showVehicleForm && (
                  <Card className="p-6 border-slate-200">
                    <h3 className="font-bold text-slate-800 text-[15px] mb-4 flex items-center gap-2">
                      <Car className="w-5 h-5 text-blue-600" />
                      {activeVehicle ? 'Editar Dados do Veículo' : 'Cadastrar Novo Veículo'}
                    </h3>
                    <form onSubmit={handleSaveVehicle} className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Marca</label>
                          <Input
                            required
                            value={vehicleFieldMarca}
                            onChange={e => setVehicleFieldMarca(e.target.value)}
                            placeholder="Ex: Fiat, Chevrolet, Toyota..."
                            className="bg-white border-slate-200"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Modelo do Carro</label>
                          <Input
                            required
                            value={vehicleFieldModelo}
                            onChange={e => setVehicleFieldModelo(e.target.value)}
                            placeholder="Ex: Mobi, Onix, Corolla..."
                            className="bg-white border-slate-200"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Placa Oficial</label>
                          <Input
                            required
                            value={vehicleFieldPlaca}
                            onChange={e => setVehicleFieldPlaca(e.target.value)}
                            placeholder="Ex: ABC-1234, ABC1D23"
                            className="bg-white border-slate-200"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                          Observações & Vistorias de Danos / Arranhados ou Avarias
                        </label>
                        <p className="text-[10px] text-amber-600 font-medium mb-1.5">
                          ⚠️ Descreva em detalhes arranhados, batidas, trincas ou qualquer avaria visível para proteção do seu lava jato.
                        </p>
                        <textarea
                          rows={4}
                          value={vehicleFieldObservacao}
                          onChange={e => setVehicleFieldObservacao(e.target.value)}
                          placeholder="Mencione detalhes: Exemplo: Riscado na tampa traseira esquerda, para-choque dianteiro trincado no canto inferior..."
                          className="w-full bg-white border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:border-blue-500 focus:ring-1"
                        ></textarea>

                        {/* Templates Rápidos */}
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          <span className="text-[11px] font-bold text-slate-400 self-center mr-1">Rápidos:</span>
                          {[
                            'Sem avarias ou riscos visíveis',
                            'Arranhão leve na porta do motorista',
                            'Para-choque traseiro com mossa',
                            'Retrovisor direito trincado',
                            'Roda dianteira direita ralada',
                          ].map(t => (
                            <button
                              key={t}
                              type="button"
                              onClick={() => {
                                const current = vehicleFieldObservacao ? vehicleFieldObservacao + '; ' : '';
                                setVehicleFieldObservacao(current + t);
                              }}
                              className="text-[10.5px] text-slate-600 bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded-md transition-colors"
                            >
                              + {t}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="pt-2 flex justify-end gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setShowVehicleForm(false);
                            setActiveVehicle(null);
                          }}
                        >
                          Cancelar
                        </Button>
                        <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold">
                          Gravar Veículo
                        </Button>
                      </div>
                    </form>
                  </Card>
                )}

                {/* Grid de Veículos Cadastrados */}
                <Card className="border-slate-200">
                  <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <h3 className="font-bold text-sm text-slate-700 uppercase tracking-wider">Veículos em nossa Oficina</h3>
                    <div className="relative w-full sm:w-60">
                      <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                      <Input
                        placeholder="Filtrar por placa ou modelo..."
                        value={searchVehicleQuery}
                        onChange={e => setSearchVehicleQuery(e.target.value)}
                        className="pl-8 h-8 text-xs bg-white border-slate-200"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 p-4 gap-4 max-h-[550px] overflow-y-auto">
                    {(data?.vehicles || [])
                      .filter((v: any) => 
                        (v.marca || '').toLowerCase().includes(searchVehicleQuery.toLowerCase()) ||
                        (v.modelo || '').toLowerCase().includes(searchVehicleQuery.toLowerCase()) ||
                        (v.placa || '').toLowerCase().includes(searchVehicleQuery.toLowerCase())
                      )
                      .map((v: any) => (
                        <div key={v.id} className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow transition-shadow">
                          <div>
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <h4 className="font-extrabold text-slate-900 text-sm">{v.marca} {v.modelo}</h4>
                                <span className="bg-blue-50 text-blue-700 border border-blue-200 font-mono text-[11px] font-black tracking-wide px-2 py-0.5 rounded-md inline-block mt-0.5">
                                  {v.placa}
                                </span>
                              </div>
                              <div className="flex gap-1">
                                <button
                                  onClick={() => {
                                    setActiveVehicle(v);
                                    setVehicleFieldMarca(v.marca);
                                    setVehicleFieldModelo(v.modelo);
                                    setVehicleFieldPlaca(v.placa);
                                    setVehicleFieldObservacao(v.observacao || '');
                                    setShowVehicleForm(true);
                                  }}
                                  className="text-amber-600 hover:text-amber-700 p-1.5 bg-amber-50 rounded-lg"
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteVehicle(v.id)}
                                  className="text-red-600 hover:text-red-700 p-1.5 bg-red-50 rounded-lg"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

                            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 text-xs min-h-[50px] mt-1 text-slate-800">
                              <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest block mb-0.5">Avarias, Arranhados & Obs do Carro:</span>
                              {v.observacao ? (
                                <p className="font-medium">{v.observacao}</p>
                              ) : (
                                <p className="text-slate-400 italic">Carro limpo / Sem avarias assinaladas na recepção.</p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    {(data?.vehicles || []).length === 0 && (
                      <div className="col-span-full p-8 text-center text-slate-400 text-xs">Nenhum veículo cadastrado ainda.</div>
                    )}
                  </div>
                </Card>
              </div>
            ) : selectedCadastroType === 'PRODUTOS' ? (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => {
                      setSelectedCadastroType(null);
                      setShowProductForm(false);
                      setActiveProduct(null);
                      setActiveProductForMovement(null);
                    }}
                    className="flex items-center text-slate-600 hover:text-slate-900 font-bold text-sm bg-white border px-3 py-1.5 rounded-xl gap-1 hover:shadow-sm"
                  >
                    <ChevronLeft className="w-4 h-4" /> Voltar para Cadastros
                  </button>

                  <Button
                    onClick={() => {
                      setActiveProduct(null);
                      setProductFieldNome('');
                      setProductFieldQuantidade(0);
                      setProductFieldNivelMinimo(0);
                      setProductFieldValorCompra(0);
                      setShowProductForm(true);
                    }}
                    className="bg-blue-600 text-white font-bold text-xs flex items-center gap-1 shrink-0"
                  >
                    <Plus className="w-4 h-4" /> Novo Item para Estoque
                  </Button>
                </div>

                {/* Métricas e Avisos Urgentes de Estoque Baixo */}
                {(() => {
                  const lowStockItems = (data?.inventory || []).filter((i: any) => i.quantidade <= i.nivel_minimo);
                  const totalSpentOnInventory = (data?.inventory || []).reduce((sum: number, item: any) => sum + (Number(item.quantidade) * Number(item.valor_compra || 0)), 0);

                  return (
                    <>
                      {/* Banners Criticos */}
                      {lowStockItems.length > 0 && (
                        <div className="bg-red-50 text-red-900 p-4 rounded-2xl border border-red-200/60 flex items-start gap-3">
                          <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                          <div>
                            <h4 className="font-extrabold text-sm text-red-800">ATENÇÃO: Estoque Crítico Restante!</h4>
                            <p className="text-xs text-red-600 mt-0.5">
                              Os seguintes produtos atingiram o nível de segurança mínimo e necessitam de reposição imediata:{' '}
                              <strong>{lowStockItems.map((i: any) => `${i.nome_produto} (${i.quantidade} un)`).join(', ')}</strong>.
                            </p>
                          </div>
                        </div>
                      )}

                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                        <Card className="p-4 bg-white border-slate-200">
                          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Custo Total Atual do Estoque</p>
                          <h3 className="text-xl font-bold text-slate-800">{formatCurrency(totalSpentOnInventory)}</h3>
                          <span className="text-[9px] text-slate-400">Valoração calculada: Quantidade x Custo Unitário de Compra.</span>
                        </Card>
                        <Card className="p-4 bg-white border-slate-200">
                          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Itens Abaixo da Meta Mínima</p>
                          <h3 className="text-xl font-extrabold text-red-600">{lowStockItems.length} Produtos</h3>
                          <span className="text-[9px] text-slate-400">Produtos precisando de compra urgente hoje.</span>
                        </Card>
                        <Card className="p-4 bg-white border-slate-200">
                          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Total de Tipos de Produtos</p>
                          <h3 className="text-xl font-extrabold text-slate-800">{(data?.inventory || []).length} Cadastrados</h3>
                          <span className="text-[9px] text-slate-400">Variedade de químicos, ceras e tecidos para uso.</span>
                        </Card>
                      </div>
                    </>
                  );
                })()}

                {/* Formulário / Modal de Produto */}
                {showProductForm && (
                  <Card className="p-6 border-slate-200">
                    <h3 className="font-bold text-slate-800 text-[15px] mb-4 flex items-center gap-2">
                      <Package className="w-5 h-5 text-blue-600" />
                      {activeProduct ? 'Editar Informações do Produto' : 'Cadastrar Item no Estoque'}
                    </h3>
                    <form onSubmit={handleSaveProduct} className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                        <div className="sm:col-span-2">
                          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Nome do Produto</label>
                          <Input
                            required
                            value={productFieldNome}
                            onChange={e => setProductFieldNome(e.target.value)}
                            placeholder="Ex: Cera Líquida, Solupan, Shampoo Neutro..."
                            className="bg-white border-slate-200"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Quantidade Inicial</label>
                          <Input
                            type="number"
                            min="0"
                            required
                            value={productFieldQuantidade}
                            onChange={e => setProductFieldQuantidade(Number(e.target.value))}
                            className="bg-white border-slate-200"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Estoque Mínimo (Alerta)</label>
                          <Input
                            type="number"
                            min="0"
                            required
                            value={productFieldNivelMinimo}
                            onChange={e => setProductFieldNivelMinimo(Number(e.target.value))}
                            className="bg-white border-slate-200"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Custo Pago Unitário (R$)</label>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            required
                            value={productFieldValorCompra}
                            onChange={e => setProductFieldValorCompra(Number(e.target.value))}
                            placeholder="Ex: 45.00"
                            className="bg-white border-slate-200"
                          />
                        </div>
                        <div className="flex items-end text-xs text-slate-500 pb-2.5">
                          ℹ️ Isto define a base de gastos para fins de faturamento e alertas financeiros ao registrar novas entradas de mercadoria.
                        </div>
                      </div>

                      <div className="pt-2 flex justify-end gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setShowProductForm(false);
                            setActiveProduct(null);
                          }}
                        >
                          Cancelar
                        </Button>
                        <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold">
                          Salvar Produto
                        </Button>
                      </div>
                    </form>
                  </Card>
                )}

                {/* Movimentações de Estoque (Modal Rápido) */}
                {activeProductForMovement && (
                  <Card className="p-6 border-slate-200 bg-blue-50/20 border-l-4 border-l-blue-600">
                    <h3 className="font-extrabold text-slate-800 text-[14px] mb-3 uppercase tracking-wide">
                      Registrar Entrada ou Saída: <span className="text-blue-700 font-black">{activeProductForMovement.nome_produto}</span>
                    </h3>
                    <form onSubmit={handleStockMovement} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Tipo da Ação</label>
                        <select
                          value={movementType}
                          onChange={e => setMovementType(e.target.value as 'ENTRADA' | 'SAIDA')}
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-sm focus:outline-none focus:border-blue-500 font-semibold"
                        >
                          <option value="ENTRADA">📥 ENTRADA (Compra / Reposição)</option>
                          <option value="SAIDA">📤 SAÍDA (Consumo / Descarte)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Quantidade</label>
                        <Input
                          type="number"
                          min="1"
                          required
                          value={movementAmount}
                          onChange={e => setMovementAmount(Number(e.target.value))}
                          className="bg-white border-slate-200 h-9"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                          {movementType === 'ENTRADA' ? 'Custo Pago Unitário (R$)' : 'Valor da Operação'}
                        </label>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          disabled={movementType === 'SAIDA'}
                          value={movementType === 'SAIDA' ? '' : movementPrice}
                          onChange={e => setMovementPrice(Number(e.target.value))}
                          placeholder="Ex: 12.00"
                          className="bg-white border-slate-200 disabled:opacity-50 h-9"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Nota / Observações</label>
                        <Input
                          value={movementDesc}
                          onChange={e => setMovementDesc(e.target.value)}
                          placeholder="Mencione o motivo..."
                          className="bg-white border-slate-200 h-9"
                        />
                      </div>

                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setActiveProductForMovement(null);
                            setMovementAmount(1);
                            setMovementPrice(0);
                            setMovementDesc('');
                          }}
                          className="w-1/2 h-9 text-xs"
                        >
                          Sair
                        </Button>
                        <Button type="submit" className="w-1/2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs h-9">
                          Lançar
                        </Button>
                      </div>
                    </form>
                  </Card>
                )}

                {/* Dashboard do Estoque & Movimentações */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Lista de Itens no Estoque */}
                  <Card className="lg:col-span-2 border-slate-200 overflow-hidden">
                    <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <h3 className="font-bold text-sm text-slate-700 uppercase tracking-wider">Produtos Estocados</h3>
                      <div className="relative w-full sm:w-60">
                        <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                        <Input
                          placeholder="Buscar produto..."
                          value={searchProductQuery}
                          onChange={e => setSearchProductQuery(e.target.value)}
                          className="pl-8 h-8 text-xs bg-white border-slate-200"
                        />
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-slate-100">
                        <thead className="bg-slate-50/50">
                          <tr>
                            <th className="px-6 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Item / Produto</th>
                            <th className="px-6 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Estoque Restante</th>
                            <th className="px-6 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Custo Unitário</th>
                            <th className="px-6 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Estoque Mínimo</th>
                            <th className="px-6 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider text-right">Ações</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-100">
                          {(data?.inventory || [])
                            .filter((i: any) => i.nome_produto.toLowerCase().includes(searchProductQuery.toLowerCase()))
                            .map((item: any) => {
                              const isLow = item.quantidade <= item.nivel_minimo;
                              return (
                                <tr key={item.id} className={`hover:bg-slate-50/40 transition-colors ${activeProduct?.id === item.id ? 'bg-blue-50/20' : ''}`}>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-slate-800">{item.nome_produto}</td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 font-semibold">
                                    <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold", isLow ? "bg-red-50 text-red-700 border border-red-200" : "bg-slate-100 text-slate-700")}>
                                      {item.quantidade} un
                                    </span>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 font-semibold">{formatCurrency(item.valor_compra || 0)}</td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400 font-semibold">{item.nivel_minimo} un</td>
                                  <td className="px-6 py-4 whitespace-nowrap text-right space-x-1.5">
                                    <button
                                      onClick={() => {
                                        setActiveProductForMovement(item);
                                        setMovementAmount(1);
                                        setMovementPrice(item.valor_compra || 0);
                                      }}
                                      className="text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-lg px-2.5 py-1.5 font-bold text-xs inline-flex items-center gap-1"
                                      title="Lançar Entrada/Saída"
                                    >
                                      ↕️ Entrada/Saída
                                    </button>
                                    <button
                                      onClick={() => {
                                        setActiveProduct(item);
                                        setProductFieldNome(item.nome_produto);
                                        setProductFieldQuantidade(item.quantidade);
                                        setProductFieldNivelMinimo(item.nivel_minimo);
                                        setProductFieldValorCompra(item.valor_compra || 0);
                                        setShowProductForm(true);
                                      }}
                                      className="text-blue-600 hover:text-blue-700 bg-blue-50 p-1.5 rounded-lg inline-block"
                                      title="Editar Produto"
                                    >
                                      <Edit className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteProduct(item.id)}
                                      className="text-red-600 hover:text-red-700 bg-red-50 p-1.5 rounded-lg inline-block"
                                      title="Deletar Produto"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                    <Button
                                      onClick={() => {
                                        setActiveProduct(item);
                                      }}
                                      size="xs"
                                      variant="secondary"
                                      className="text-[10px] font-bold"
                                    >
                                      Ver Histórico
                                    </Button>
                                  </td>
                                </tr>
                              );
                            })}
                        </tbody>
                      </table>
                    </div>
                  </Card>

                  {/* Relatório de Transações / Movimentações de Estoque */}
                  <Card className="lg:col-span-1 border-slate-200">
                    {activeProduct ? (
                      <div className="p-4 space-y-4">
                        <div>
                          <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest">Fluxo Histórico do Item</p>
                          <h3 className="font-black text-slate-800 text-sm truncate">{activeProduct.nome_produto}</h3>
                        </div>

                        <div className="space-y-2">
                          <h4 className="text-[11px] font-extrabold uppercase text-slate-500 tracking-wider">Histórico de Entradas / Saídas</h4>
                          <div className="space-y-2 max-h-[350px] overflow-y-auto">
                            {(Array.isArray(activeProduct.movimentacoes) ? activeProduct.movimentacoes : []).map((mov: any, index: number) => {
                              const isEntrada = mov.tipo === 'ENTRADA';
                              return (
                                <div key={index} className={`p-3 rounded-xl border border-dotted ${isEntrada ? 'bg-emerald-50/20 border-emerald-200/85' : 'bg-orange-50/10 border-orange-200/70'}`}>
                                  <div className="flex justify-between items-start text-[10px] font-bold mb-1">
                                    <span className={isEntrada ? 'text-emerald-700' : 'text-orange-700'}>
                                      {isEntrada ? '📥 ENTRADA' : '📤 SAÍDA'}
                                    </span>
                                    <span className="text-slate-400">{format(parseISO(mov.data), 'dd/MM/yyyy HH:mm')}</span>
                                  </div>
                                  <div className="flex justify-between text-xs font-semibold text-slate-700">
                                    <span>Quantidade:</span>
                                    <span className="font-extrabold text-slate-900">{mov.quantidade} un</span>
                                  </div>
                                  {isEntrada && mov.valor_compra !== undefined && (
                                    <div className="flex justify-between text-xs font-semibold text-slate-600">
                                      <span>Custo Unitário:</span>
                                      <span className="font-bold">{formatCurrency(mov.valor_compra)}</span>
                                    </div>
                                  )}
                                  <p className="text-[11px] text-slate-500 italic mt-1 font-medium bg-white/50 px-2 py-1 rounded">
                                    💬 {mov.descricao || 'Nenhuma nota informada'}
                                  </p>
                                </div>
                              );
                            })}
                            {(Array.isArray(activeProduct.movimentacoes) ? activeProduct.movimentacoes : []).length === 0 && (
                              <p className="text-center text-slate-400 text-xs py-4">Sem movimentações anteriores.</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="p-8 text-center text-slate-400 text-xs flex flex-col items-center justify-center min-h-[300px]">
                        <Package className="w-10 h-10 text-slate-300 mb-2" />
                        Selecione um produto da tabela ao lado para conferir o relatório completo de entradas, saídas, custos operacionais e datas.
                      </div>
                    )}
                  </Card>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-slate-900 mb-4">Gerenciar Cadastros</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                  <button
                    onClick={() => {
                      setSelectedCadastroType('CLIENTES');
                      setActiveCustomer(null);
                      setShowCustomerForm(false);
                    }}
                    className="p-6 hover:shadow-md hover:border-blue-300 transition-all bg-white rounded-2xl border border-slate-200 flex flex-col items-center justify-center text-center cursor-pointer group"
                  >
                    <Users className="w-10 h-10 text-blue-600 mb-4 group-hover:scale-105 transition-transform" />
                    <h3 className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">Clientes</h3>
                    <p className="text-xs text-slate-500 mt-2">Gerenciar clientes fiéis</p>
                  </button>

                  <button
                    onClick={() => {
                      setSelectedCadastroType('VEICULOS');
                      setActiveVehicle(null);
                      setShowVehicleForm(false);
                    }}
                    className="p-6 hover:shadow-md hover:border-blue-300 transition-all bg-white rounded-2xl border border-slate-200 flex flex-col items-center justify-center text-center cursor-pointer group"
                  >
                    <Car className="w-10 h-10 text-blue-600 mb-4 group-hover:scale-105 transition-transform" />
                    <h3 className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">Veículos</h3>
                    <p className="text-xs text-slate-500 mt-2">Marcas, modelos e placas</p>
                  </button>

                  <button
                    onClick={() => {
                      setSelectedCadastroType('PRODUTOS');
                      setActiveProduct(null);
                      setShowProductForm(false);
                    }}
                    className="p-6 hover:shadow-md hover:border-blue-300 transition-all bg-white rounded-2xl border border-slate-200 flex flex-col items-center justify-center text-center cursor-pointer group"
                  >
                    <Package className="w-10 h-10 text-blue-600 mb-4 group-hover:scale-105 transition-transform" />
                    <h3 className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">Produtos</h3>
                    <p className="text-xs text-slate-500 mt-2">Itens para estoque</p>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'FIDELIDADE' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">Estatísticas do Cliente (Fidelidade)</h2>
              <span className="bg-amber-50 text-amber-700 border border-amber-200 uppercase font-black text-[10px] tracking-wider px-2.5 py-1 rounded-full">
                Fidelização & Estatísticas
              </span>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
              <h3 className="text-lg font-bold text-slate-900 mb-4 border-b border-slate-100 pb-3">Carros Finalizados (Confirmar Receita)</h3>
              <div className="space-y-3">
                {appointments
                  .filter((app: any) => app.status === 'CONCLUIDO')
                  .filter((app: any) => !finances.some((f: any) => f.appointment_id === app.id))
                  .map((app: any) => (
                    <div key={app.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-100 gap-3">
                      <div>
                        <p className="font-semibold text-slate-800 text-sm">{app.nome}</p>
                        <p className="text-xs text-slate-500">{app.servicos?.join(', ')}</p>
                        <p className="text-xs text-slate-500 mt-1">{format(new Date(app.horario_marcado), "dd/MM 'às' HH:mm")}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-green-600">{formatCurrency(app.total)}</span>
                        <Button 
                          size="sm" 
                          className="bg-green-600 hover:bg-green-700 text-white"
                          onClick={() => handleConfirmRevenue(app)}
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Confirmar Valor
                        </Button>
                      </div>
                    </div>
                  ))}
                {appointments.filter((app: any) => app.status === 'CONCLUIDO').filter((app: any) => !finances.some((f: any) => f.appointment_id === app.id)).length === 0 && (
                   <div className="text-center p-6 text-sm text-slate-500">
                     Nenhum carro finalizado aguardando confirmação.
                   </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
               <Card className="col-span-1 border border-slate-200 overflow-hidden bg-white">
                 <div className="p-4 bg-slate-50 border-b border-slate-200/60 font-bold text-slate-700 text-[12px] uppercase tracking-wider flex items-center">
                   <Users className="w-4 h-4 mr-2" /> Selecione o Cliente
                 </div>
                 <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
                   {(customers || [])
                     .sort((a: any, b: any) => a.nome?.localeCompare(b.nome))
                     .map((customer: any) => (
                     <div 
                       key={customer.id} 
                       onClick={() => setSelectedFidelidadeCustomer(customer)}
                       className={`p-4 cursor-pointer hover:bg-amber-50/50 transition-colors flex items-center justify-between ${selectedFidelidadeCustomer?.id === customer.id ? 'bg-amber-50 border-l-4 border-amber-500' : ''}`}
                     >
                       <div>
                         <p className="font-bold text-sm text-slate-800">{customer.nome}</p>
                         <p className="text-xs text-slate-500 flex items-center mt-1"><Car className="w-3 h-3 mr-1"/> {customer.placa_veiculo || 'S/ Veículo'}</p>
                       </div>
                       <div className="flex items-center gap-2">
                           <button 
                             onClick={(e) => { e.stopPropagation(); handleDeleteCustomer(customer.id); if (selectedFidelidadeCustomer?.id === customer.id) setSelectedFidelidadeCustomer(null); }} 
                             className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                             title="Excluir Cliente e Histórico"
                           >
                             <Trash2 className="w-4 h-4" />
                           </button>
                           <ChevronLeft className="w-4 h-4 text-slate-300 rotate-180" />
                       </div>
                     </div>
                   ))}
                   {(customers || []).length === 0 && (
                     <div className="p-8 text-center text-slate-400 text-xs">Nenhum cliente.</div>
                   )}
                 </div>
               </Card>

               <div className="col-span-1 md:col-span-2 space-y-6">
                 {!selectedFidelidadeCustomer ? (
                    <Card className="p-10 flex flex-col items-center justify-center text-center border border-slate-200 bg-white text-slate-500">
                      <Star className="w-12 h-12 text-slate-200 mb-4" />
                      <p>Selecione um cliente na lista ao lado para ver as estatísticas de fidelidade dele.</p>
                    </Card>
                 ) : (
                    <>
                      {(() => {
                        const history = appointments
                          .filter((a: any) => a.telefone === selectedFidelidadeCustomer.telefone)
                          .sort((a: any, b: any) => new Date(b.horario_marcado).getTime() - new Date(a.horario_marcado).getTime());
                        const amounts = history.map((h: any) => h.total || 0);
                        const totalValue = amounts.reduce((acc: number, curr: number) => acc + curr, 0);
                        const qty = history.length;
                        
                        let avgTime = 'N/A';
                        if (qty > 0) {
                          const validHours = history.map((h: any) => new Date(h.horario_marcado).getHours()).filter((h: number) => !isNaN(h));
                          if (validHours.length > 0) {
                            const avgHour = Math.round(validHours.reduce((acc: number, h: number) => acc + h, 0) / validHours.length);
                            avgTime = `${avgHour.toString().padStart(2, '0')}:00`;
                          }
                        }

                        return (
                          <>
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                              <Card className="p-4 border border-slate-200 bg-gradient-to-br from-white to-amber-50/30">
                                <p className="text-[10px] uppercase tracking-wider font-semibold text-slate-500 mb-1">Veículo Principal</p>
                                <p className="font-bold text-slate-800 text-sm truncate">{selectedFidelidadeCustomer.placa_veiculo || 'Nenhum'}</p>
                              </Card>
                              <Card className="p-4 border border-slate-200 bg-gradient-to-br from-white to-blue-50/30">
                                <p className="text-[10px] uppercase tracking-wider font-semibold text-slate-500 mb-1">Total em Serviços</p>
                                <p className="font-bold text-blue-600 text-lg">{formatCurrency(totalValue)}</p>
                              </Card>
                              <Card className="p-4 border border-slate-200 bg-gradient-to-br from-white to-emerald-50/30">
                                <p className="text-[10px] uppercase tracking-wider font-semibold text-slate-500 mb-1">Vezes no Lava-Jato</p>
                                <p className="font-bold text-emerald-600 text-lg">{qty}x</p>
                              </Card>
                              <Card className="p-4 border border-slate-200 bg-gradient-to-br from-white to-purple-50/30">
                                <p className="text-[10px] uppercase tracking-wider font-semibold text-slate-500 mb-1">Média de Horário</p>
                                <p className="font-bold text-purple-600 text-lg flex items-center"><Clock className="w-4 h-4 mr-1"/> {avgTime}</p>
                              </Card>
                            </div>

                            <Card className="border border-slate-200 overflow-hidden bg-white">
                              <div className="p-4 bg-slate-50 border-b border-slate-200/60 font-bold text-slate-700 text-[12px] uppercase tracking-wider flex items-center justify-between">
                                <span>Histórico de Serviços ({history.length})</span>
                              </div>
                              <div className="divide-y divide-slate-100 max-h-[400px] overflow-y-auto">
                                {history.length === 0 ? (
                                  <div className="p-6 text-center text-slate-500 text-sm">Este cliente não possui serviços agendados ou concluídos.</div>
                                ) : (
                                  history.map((h: any) => (
                                    <div key={h.id} className="p-4 hover:bg-slate-50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                      <div>
                                        <p className="font-bold text-slate-800 text-sm flex items-center">
                                          {format(new Date(h.horario_marcado), "dd/MM/yyyy 'às' HH:mm")}
                                          {h.status === 'CONCLUIDO' && <span className="ml-2 bg-green-100 text-green-800 text-[9px] px-1.5 py-0.5 rounded-full font-bold">Concluído</span>}
                                          {h.status === 'AGENDADO' && <span className="ml-2 bg-blue-100 text-blue-800 text-[9px] px-1.5 py-0.5 rounded-full font-bold">Agendado</span>}
                                        </p>
                                        <p className="text-xs text-slate-500 mt-1">{h.servicos?.join(', ')}</p>
                                      </div>
                                      <div className="flex items-center gap-4">
                                        <h4 className="font-bold text-slate-700">{formatCurrency(h.total)}</h4>
                                        <Button 
                                          variant="ghost" 
                                          size="sm"
                                          onClick={async () => {
                                            if(confirm("Deseja realmente excluir este agendamento? (Ideal para quando o cliente marca mas não comparece).")) {
                                              try {
                                                await api.deleteAppointment(h.id);
                                                loadData();
                                              } catch (e: any) {
                                                if (e.message?.includes('row-level security') || e.code === '42501') {
                                                  alert("Aviso RLS: Seu Supabase está bloqueando exclusão. Libere a Role.");
                                                } else {
                                                  alert("Erro ao excluir: " + e.message);
                                                }
                                              }
                                            }
                                          }}
                                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                          title="Excluir falta"
                                        >
                                          <Trash2 className="w-4 h-4" /> Excluir
                                        </Button>
                                      </div>
                                    </div>
                                  ))
                                )}
                              </div>
                            </Card>
                          </>
                        );
                      })()}
                    </>
                 )}
               </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
