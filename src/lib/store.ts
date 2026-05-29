import { MOCK_TENANTS, MOCK_APPOINTMENTS, MOCK_INVENTORY, MOCK_FINANCES } from './db';

const STORAGE_KEY = 'carwash_saas_data';

export function getLocalData() {
  const data = localStorage.getItem(STORAGE_KEY);
  if (data) {
    return JSON.parse(data);
  }
  const initialData = {
    tenants: MOCK_TENANTS,
    appointments: MOCK_APPOINTMENTS,
    inventory: MOCK_INVENTORY,
    finances: MOCK_FINANCES,
    customers: [
      { id: 'c1', tenant_id: 't1', nome: 'Carlos Silva', telefone: '5511911111111', placa_veiculo: 'ABC-1234' },
      { id: 'c2', tenant_id: 't1', nome: 'Ana Souza', telefone: '5511922222222', placa_veiculo: 'XYZ-9876' },
      { id: 'c3', tenant_id: 't1', nome: 'Wagner Pereira', telefone: '5511999999999', placa_veiculo: 'GTR-2026' },
      { id: 'c4', tenant_id: 't1', nome: 'Marcos Oliveira', telefone: '5511933333333', placa_veiculo: 'DEF-5678' },
      { id: 'c5', tenant_id: 't2', nome: 'Juliana Lima', telefone: '5511944444444', placa_veiculo: 'MNO-4321' }
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
