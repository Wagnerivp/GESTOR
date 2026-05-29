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
    finances: MOCK_FINANCES
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
