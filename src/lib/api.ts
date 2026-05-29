import { supabase, isSupabaseConfigured } from './db';
import { getLocalData, saveLocalData } from './store';

export const api = {
  async getTenants() {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase!.from('tenants').select('*');
      if (error) console.error("Supabase Error:", error);
      return data || [];
    }
    return getLocalData().tenants;
  },
  
  async updateTenantStatus(id: string, updates: any) {
    if (isSupabaseConfigured) {
      const { error } = await supabase!.from('tenants').update(updates).eq('id', id);
      if (error) {
         console.error("Supabase Error (Possível restrição RLS):", error);
         throw error;
      }
    } else {
      const data = getLocalData();
      data.tenants = data.tenants.map((t: any) => t.id === id ? { ...t, ...updates } : t);
      saveLocalData(data);
    }
  },

  async getTenantAdminData(tenantId: string) {
    if (isSupabaseConfigured) {
      const [
         { data: tenant }, 
         { data: appointments }, 
         { data: inventory },
         { data: finances },
         { data: customers }
      ] = await Promise.all([
         supabase!.from('tenants').select('*').eq('id', tenantId).maybeSingle(),
         supabase!.from('appointments').select('*').eq('tenant_id', tenantId),
         supabase!.from('inventory').select('*').eq('tenant_id', tenantId),
         supabase!.from('finances').select('*').eq('tenant_id', tenantId),
         supabase!.from('customers').select('*').eq('tenant_id', tenantId)
      ]);
      return { 
        tenant, 
        appointments: appointments || [], 
        inventory: inventory || [], 
        finances: finances || [],
        customers: customers || []
      };
    }
    const store = getLocalData();
    return {
      tenant: store.tenants.find((t: any) => t.id === tenantId),
      appointments: store.appointments.filter((a: any) => a.tenant_id === tenantId),
      inventory: store.inventory.filter((i: any) => i.tenant_id === tenantId),
      finances: store.finances.filter((f: any) => f.tenant_id === tenantId),
      customers: store.customers ? store.customers.filter((c: any) => c.tenant_id === tenantId) : []
    };
  },

  async getTenantBySlug(slug: string) {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase!.from('tenants').select('*').eq('slug', slug).maybeSingle();
      if (error) throw error;
      return data;
    }
    return getLocalData().tenants.find((t: any) => t.slug === slug);
  },

  async createTenant(tenantData: any) {
    if (isSupabaseConfigured) {
       const { data, error } = await supabase!.from('tenants').insert([tenantData]).select().maybeSingle();
       if (error) throw error;
       return data;
    } else {
       const data = getLocalData();
       const newMockTenant = { id: 't' + Date.now(), ...tenantData };
       data.tenants.push(newMockTenant);
       saveLocalData(data);
       return newMockTenant;
    }
  }
};
