import { MOCK_TENANTS, MOCK_APPOINTMENTS, MOCK_INVENTORY, MOCK_FINANCES } from './db';

const STORAGE_KEY = 'carwash_saas_data';

export function getLocalData() {
  const data = localStorage.getItem(STORAGE_KEY);
  if (data) {
    const parsed = JSON.parse(data);
    // Auto-migrate if vehicles / customers / inventory elements don't contain key fields
    if (!parsed.vehicles) {
      parsed.vehicles = [
        { id: 'v1', tenant_id: 't1', marca: 'Chevrolet', modelo: 'Onix', placa: 'ABC-1234', observacao: 'Arranhão leve na porta traseira do lado esquerdo.' },
        { id: 'v2', tenant_id: 't1', marca: 'Hyundai', modelo: 'HB20', placa: 'XYZ-9876', observacao: 'Sem avarias, veículo em perfeito estado.' },
        { id: 'v3', tenant_id: 't-wagner', marca: 'Fiat', modelo: 'Toro', placa: 'GTR-2026', observacao: 'Amassado pequeno no parachoques dianteiro.' }
      ];
    }
    if (!parsed.inventory) {
      parsed.inventory = MOCK_INVENTORY;
    }
    // Certificar campos adicionais do estoque
    parsed.inventory = parsed.inventory.map((item: any) => ({
      ...item,
      valor_compra: item.valor_compra || 45.00,
      movimentacoes: item.movimentacoes || [
        { data: new Date().toISOString(), tipo: 'ENTRADA', quantidade: 5, valor_compra: 45.00, descricao: 'Compra de lote inicial' }
      ]
    }));
    // Certificar campos adicionais de clientes
    if (parsed.customers) {
      parsed.customers = parsed.customers.map((c: any) => ({
        ...c,
        endereco: c.endereco || 'Rua Central, 123',
        endereco_busca: c.endereco_busca || 'Rua Central, 123',
        quantidade_lavadas: (c.quantidade_lavadas !== undefined && c.quantidade_lavadas !== null) ? Number(c.quantidade_lavadas) : 2,
        servicos_historico: c.servicos_historico || []
      }));
    }
    return parsed;
  }
  const initialData = {
    tenants: MOCK_TENANTS,
    appointments: MOCK_APPOINTMENTS,
    inventory: MOCK_INVENTORY.map(item => ({
      ...item,
      valor_compra: 45.00,
      movimentacoes: [
        { data: new Date().toISOString(), tipo: 'ENTRADA', quantidade: item.quantidade, valor_compra: 45.00, descricao: 'Estoque inicial' }
      ]
    })),
    finances: MOCK_FINANCES,
    vehicles: [
      { id: 'v1', tenant_id: 't1', marca: 'Chevrolet', modelo: 'Onix', placa: 'ABC-1234', observacao: 'Arranhão leve na porta traseira do lado esquerdo.' },
      { id: 'v2', tenant_id: 't1', marca: 'Hyundai', modelo: 'HB20', placa: 'XYZ-9876', observacao: 'Sem avarias, veículo em perfeito estado.' },
      { id: 'v3', tenant_id: 't-wagner', marca: 'Fiat', modelo: 'Toro', placa: 'GTR-2026', observacao: 'Amassado pequeno no parachoques dianteiro.' }
    ],
    customers: [
      { id: 'c1', tenant_id: 't1', nome: 'Carlos Silva', telefone: '5511911111111', placa_veiculo: 'ABC-1234', endereco: 'Av. Paulista, 1500', endereco_busca: 'Av. Paulista, 1500', quantidade_lavadas: 3, servicos_historico: [{ data: '2026-05-10T14:00:00Z', servicos: ['Lavagem Simples'], valor: 50 }, { data: '2026-05-24T09:00:00Z', servicos: ['Lavagem Completa'], valor: 80 }] },
      { id: 'c2', tenant_id: 't1', nome: 'Ana Souza', telefone: '5511922222222', placa_veiculo: 'XYZ-9876', endereco: 'Rua das Camélias, 88', endereco_busca: 'Rua das Camélias, 88', quantidade_lavadas: 1, servicos_historico: [{ data: '2026-05-18T10:30:00Z', servicos: ['Lavagem Simples'], valor: 45 }] },
      { id: 'c3', tenant_id: 't-wagner', nome: 'Wagner Pereira', telefone: '5511999999999', placa_veiculo: 'GTR-2026', endereco: 'Av. Brasil, 1200', endereco_busca: 'Rua das Palmeiras, 400', quantidade_lavadas: 2, servicos_historico: [{ data: '2026-05-25T08:30:00Z', servicos: ['Geral'], valor: 98 }] },
      { id: 'c4', tenant_id: 't1', nome: 'Marcos Oliveira', telefone: '5511933333333', placa_veiculo: 'DEF-5678', endereco: 'Rua Bela Cintra, 900', endereco_busca: 'Rua Bela Cintra, 900', quantidade_lavadas: 0, servicos_historico: [] },
      { id: 'c5', tenant_id: 't-agua', nome: 'Juliana Lima', telefone: '5511944444444', placa_veiculo: 'MNO-4321', endereco: 'Rua Oscar Freire, 300', endereco_busca: 'Rua Oscar Freire, 300', quantidade_lavadas: 4, servicos_historico: [{ data: '2026-05-12T11:00:00Z', servicos: ['Geral Completa'], valor: 200 }] }
    ]
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(initialData));
  return initialData;
}

export function saveLocalData(data: any) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  window.dispatchEvent(new Event('localDataChanged'));
}

export function updateTenant(id: string, updates: any) {
  const data = getLocalData();
  data.tenants = data.tenants.map((t: any) => t.id === id ? { ...t, ...updates } : t);
  saveLocalData(data);
}
