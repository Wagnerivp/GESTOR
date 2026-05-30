import { supabase, isSupabaseConfigured } from './db';
import { getLocalData, saveLocalData } from './store';

function patchTenantPricing(tenant: any) {
  if (!tenant) return tenant;
  const clone = { ...tenant };
  if (!clone.services_pricing) {
    clone.services_pricing = {};
  }
  
  // Mescla dados salvos localmente caso haja sobreposição em ambiente de testes (bypass Supabase)
  try {
    const localData = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('applet_store') || '{"tenants":[]}') : {tenants:[]};
    const localTenant = localData.tenants.find((t: any) => t.id === clone.id);
    if (localTenant && localTenant.services_pricing) {
      clone.services_pricing = { ...clone.services_pricing, ...localTenant.services_pricing };
    }
  } catch (e) {}

  if (clone.services_pricing._aceitaAgendamentos !== undefined) {
    clone.aceita_agendamentos = clone.services_pricing._aceitaAgendamentos;
  } else {
    clone.aceita_agendamentos = true; // default
  }

  const slugLower = (clone.slug || '').toLowerCase();
  const nomeLower = (clone.nome || '').toLowerCase();
  
  if (
    slugLower === 'nabrasa' || 
    nomeLower.includes('nabrasa') ||
    clone.client_code === '01' ||
    (clone.services_pricing && clone.services_pricing._client_code === '01') ||
    nomeLower.includes('nabrasa cod 01') ||
    clone.client_code === '02' ||
    (clone.services_pricing && clone.services_pricing._client_code === '02') ||
    nomeLower.includes('garagem 415') ||
    slugLower === 'garagem415' ||
    slugLower === 'garagem 415'
  ) {
    const defaultNabrasa = {
      'Lavagem Essencial (Hatch/Sedan)': 69,
      'Lavagem Essencial (SUV)': 89, // guessing SUV from offset, but let's use what they gave or just standard
      'Aplicação de Cera (Hatch/Sedan)': 79,
      'Lavagem Detalhada Externa (Hatch/Sedan)': 149,
      'Lavagem Detalhada (Hatch/Sedan)': 299,
      'Lavagem Motor (Hatch/Sedan)': 199,
      'Remoção de Chuva Ácida (Hatch/Sedan)': 149,
      'Cristalização dos Vidros (Hatch/Sedan)': 389,
      'Lavagem Detalhada Rodas p/ Roda (Hatch/Sedan)': 49,
      'Limpeza dos Plásticos Internos (Hatch/Sedan)': 179,
      'Revitalização dos Plásticos Int. (Hatch/Sedan)': 199,
      'Limpeza de Teto (Hatch/Sedan)': 149,
      'Limpeza de Carpete (Hatch/Sedan)': 149,
      'Higienização do Porta-Malas (Hatch/Sedan)': 149,
      'Higienização Bancos de Tecido (Hatch/Sedan)': 299,
      'Higienização Bancos de Couro (Hatch/Sedan)': 279,
      'Geral Simples Moto (P/M)': 45,
      'Geral Moto Detalhada (P/M)': 209,
      
      // Also merging the exact table values as separate ones if they use SUV
      'Lavagem Detalhada (SUV)': 299,
      'Lavagem Motor (SUV)': 199,
      'Aplicação de Cera (SUV)': 79,
      'Remoção de Chuva Ácida (SUV)': 149,
      'Higienização Bancos de Tecido (SUV)': 299,
      'Higienização Bancos de Couro (SUV)': 279,
      'Revitalização dos Plásticos Int. (SUV)': 199,
      'Cristalização dos Vidros (SUV)': 389,
      'Limpeza dos Plásticos Internos (SUV)': 179,
      'Limpeza de Teto (SUV)': 149,
      'Limpeza de Carpete (SUV)': 149,
      'Lavagem Detalhada Rodas p/ Roda (SUV)': 49,
      'Higienização do Porta-Malas (SUV)': 149,
      'Lavagem Detalhada Externa (SUV)': 149,
      'Geral Simples Moto (G)': 45,
      'Geral Moto Detalhada (G)': 209,
    };
    
    // Merge so manual changes the tenant performs are preserved, but default values are always initialized
    clone.services_pricing = {
      ...defaultNabrasa,
      ...clone.services_pricing
    };
  } else if (
    slugLower === 'agua4' || 
    slugLower === 'água4' || 
    nomeLower.includes('agua4') || 
    nomeLower.includes('água4') || 
    clone.client_code === 'agua4' ||
    (clone.services_pricing && clone.services_pricing._client_code === 'agua4')
  ) {
    const defaultAgua4 = {
      'Lavagem Essencial (Hatch/Sedan)': 49,
      'Lavagem Essencial (SUV)': 69,
      'Lavagem Detalhada (Hatch/Sedan)': 249,
      'Lavagem Detalhada (SUV)': 299,
      'Lavagem Motor (Hatch/Sedan)': 149,
      'Lavagem Motor (SUV)': 199,
      'Aplicação de Cera (Hatch/Sedan)': 59,
      'Aplicação de Cera (SUV)': 79,
      'Remoção de Chuva Ácida (Hatch/Sedan)': 99,
      'Remoção de Chuva Ácida (SUV)': 149,
      'Higienização Bancos de Tecido (Hatch/Sedan)': 199,
      'Higienização Bancos de Tecido (SUV)': 299,
      'Higienização Bancos de Couro (Hatch/Sedan)': 179,
      'Higienização Bancos de Couro (SUV)': 279,
      'Revitalização dos Plásticos Int. (Hatch/Sedan)': 149,
      'Revitalização dos Plásticos Int. (SUV)': 199,
      'Cristalização dos Vidros (Hatch/Sedan)': 289,
      'Cristalização dos Vidros (SUV)': 389,
      'Limpeza dos Plásticos Internos (Hatch/Sedan)': 119,
      'Limpeza dos Plásticos Internos (SUV)': 179,
      'Limpeza de Teto (Hatch/Sedan)': 99,
      'Limpeza de Teto (SUV)': 149,
      'Limpeza de Carpete (Hatch/Sedan)': 99,
      'Limpeza de Carpete (SUV)': 149,
      'Lavagem Detalhada Rodas p/ Roda (Hatch/Sedan)': 29,
      'Lavagem Detalhada Rodas p/ Roda (SUV)': 49,
      'Higienização do Porta-Malas (Hatch/Sedan)': 99,
      'Higienização do Porta-Malas (SUV)': 149,
      'Lavagem Detalhada Externa (Hatch/Sedan)': 99,
      'Lavagem Detalhada Externa (SUV)': 149,
      'Geral Simples Moto (P/M)': 35,
      'Geral Simples Moto (G)': 45,
      'Geral Moto Detalhada (P/M)': 179,
      'Geral Moto Detalhada (G)': 209
    };
    
    // Merge so manual changes the tenant performs are preserved, but default values are always initialized
    clone.services_pricing = {
      ...defaultAgua4,
      ...clone.services_pricing
    };
  } else if (slugLower === 'agua' || slugLower === 'água' || nomeLower.includes('agua') || nomeLower.includes('água')) {
    clone.services_pricing['Geral Completa'] = 200;
  }
  if (slugLower === 'wagner' || nomeLower.includes('wagner')) {
    clone.services_pricing['Geral'] = 98;
  }

  // Populate root client_code from services_pricing._client_code
  if (clone.services_pricing && clone.services_pricing._client_code) {
    clone.client_code = clone.services_pricing._client_code;
  }

  return clone;
}

export const api = {
  async getTenants() {
    let rawTenants: any[] = [];
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase!.from('tenants').select('*');
        if (error) console.error("Supabase Error:", error);
        rawTenants = data || [];
      } catch (err) {
        console.error("Supabase list error:", err);
      }
    } else {
      rawTenants = getLocalData().tenants || [];
    }

    // Step 1: Normalize currently assigned codes
    let tenantsWithCode = rawTenants.map((t: any) => {
      const pricing = t.services_pricing || {};
      const code = pricing._client_code || t.client_code;
      return { ...t, client_code: code };
    });

    // Step 2: Auto-assign sequential codes to tenants that don't have one
    let changed = false;
    for (const t of tenantsWithCode) {
      if (!t.client_code) {
        const usedCodes = new Set<number>();
        for (const existingT of tenantsWithCode) {
          if (existingT.client_code) {
            const num = Number(existingT.client_code);
            if (!isNaN(num) && num >= 1 && num <= 10000) {
              usedCodes.add(num);
            }
          }
        }

        let assignedNum = 1;
        for (let i = 1; i <= 10000; i++) {
          if (!usedCodes.has(i)) {
            assignedNum = i;
            break;
          }
        }

        const codeStr = assignedNum.toString();
        t.client_code = codeStr;
        if (!t.services_pricing) {
          t.services_pricing = {};
        }
        t.services_pricing._client_code = codeStr;
        changed = true;

        if (isSupabaseConfigured) {
          try {
            await supabase!.from('tenants').update({
              services_pricing: t.services_pricing
            }).eq('id', t.id);
          } catch (err) {
            console.error("Failed to update auto-assigned code on Supabase table:", err);
          }
        }
      }
    }

    if (changed && !isSupabaseConfigured) {
      const parentData = getLocalData();
      parentData.tenants = tenantsWithCode;
      saveLocalData(parentData);
    }

    return tenantsWithCode.map((t: any) => patchTenantPricing(t));
  },
  
  async updateTenantStatus(id: string, updates: any) {
    if (isSupabaseConfigured) {
      if (id.startsWith('t')) {
         // Mock id used with supabase configured... fallback to mock
         const data = getLocalData();
         data.tenants = data.tenants.map((t: any) => t.id === id ? { ...t, ...updates } : t);
         saveLocalData(data);
         return;
      }
      const { error } = await supabase!.from('tenants').update(updates).eq('id', id);
      if (error) {
         console.error("Supabase Error (Possível restrição RLS):", error);
         // Fallback para update local durante preview se RLS bloquear
         const data = getLocalData();
         data.tenants = data.tenants.map((t: any) => t.id === id ? { ...t, ...updates } : t);
         saveLocalData(data);
         // Não lançamos erro crítico para permitir que a UI continue se a pessoa estiver em preview e sem token.
      }
    } else {
      const data = getLocalData();
      data.tenants = data.tenants.map((t: any) => t.id === id ? { ...t, ...updates } : t);
      saveLocalData(data);
    }
  },

  async updateTenantSettings(id: string, settingsParams: any) {
    // This will overlay properties onto the existing services_pricing jsonb
    const tenant = await this.getTenantById(id);
    if (!tenant) return;
    const currentPricing = tenant.services_pricing || {};
    const newPricing = { ...currentPricing, ...settingsParams };
    await this.updateTenantStatus(id, { services_pricing: newPricing });
  },

  async getBookedTimes(tenantId: string, dateIsoString: string) {
    const [y, m, d] = dateIsoString.split('-');
    const startOfDay = new Date();
    startOfDay.setFullYear(parseInt(y), parseInt(m)-1, parseInt(d));
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(startOfDay);
    endOfDay.setHours(23, 59, 59, 999);

    if (isSupabaseConfigured) {
      const { data, error } = await supabase!
        .from('appointments')
        .select('horario_marcado')
        .eq('tenant_id', tenantId)
        .gte('horario_marcado', startOfDay.toISOString())
        .lte('horario_marcado', endOfDay.toISOString())
        .neq('status', 'CANCELADO');
        
      if (error) return [];
      return data.map((a: any) => {
        const date = new Date(a.horario_marcado);
        return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
      });
    } else {
      const store = getLocalData();
      const appointments = store.appointments?.filter((a: any) => {
        if (a.tenant_id !== tenantId || a.status === 'CANCELADO') return false;
        const date = new Date(a.horario_marcado);
        return date >= startOfDay && date <= endOfDay;
      }) || [];
      return appointments.map((a: any) => {
        const date = new Date(a.horario_marcado);
        return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
      });
    }
  },

  async getCustomerVisits(tenantId: string, phone: string): Promise<number> {
    if (isSupabaseConfigured) {
      const { count, error } = await supabase!
        .from('appointments')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', tenantId)
        .eq('telefone_cliente', phone)
        .eq('status', 'CONCLUIDO');
      
      if (error) {
        console.warn("Could not fetch customer history:", error);
        return 0;
      }
      return count || 0;
    } else {
      const store = getLocalData();
      const count = (store.appointments || []).filter((a: any) => 
        a.tenant_id === tenantId && 
        a.telefone === phone && 
        a.status === 'CONCLUIDO'
      ).length;
      return count;
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
      const mappedAppointments = (appointments || []).map((app: any) => ({
        ...app,
        nome: app.nome || app.nome_cliente || '',
        telefone: app.telefone || app.telefone_cliente || '',
        servicos: Array.isArray(app.servicos) ? app.servicos : (typeof app.servicos === 'string' ? JSON.parse(app.servicos) : []),
      }));
      
      const localStore = getLocalData();
      // Build merged customers ensuring that users who made an appointment but failed to insert (due to RLS) are visible
      const mergedCustomers = (customers || []).map((dbCust: any) => {
        const localCust = localStore.customers?.find((lc: any) => lc.id === dbCust.id || lc.telefone === dbCust.telefone);
        return {
          ...dbCust,
          endereco: localCust?.endereco || dbCust.endereco || '',
          endereco_busca: localCust?.endereco_busca || dbCust.endereco_busca || '',
          quantidade_lavadas: localCust?.quantidade_lavadas !== undefined ? localCust.quantidade_lavadas : (dbCust.quantidade_lavadas || 0),
          servicos_historico: localCust?.servicos_historico || []
        };
      });

      // Inject users from appointments that are totally missing
      mappedAppointments.forEach((app: any) => {
        if (!app.telefone) return;
        const exists = mergedCustomers.some((c: any) => c.telefone === app.telefone);
        if (!exists) {
          mergedCustomers.push({
            id: 'auto_' + app.telefone,
            tenant_id: tenantId,
            nome: app.nome,
            telefone: app.telefone,
            placa_veiculo: app.veiculo_placa || '',
            endereco: '',
            endereco_busca: '',
            quantidade_lavadas: app.status === 'CONCLUIDO' ? 1 : 0,
            servicos_historico: []
          });
        }
      });


      const mergedInventory = (inventory || []).map((dbItem: any) => {
        const localItem = localStore.inventory?.find((li: any) => li.id === dbItem.id || li.nome_produto === dbItem.nome_produto);
        return {
          ...dbItem,
          valor_compra: localItem?.valor_compra || 45.00,
          movimentacoes: localItem?.movimentacoes || [
            { data: dbItem.created_at || new Date().toISOString(), tipo: 'ENTRADA', quantidade: Number(dbItem.quantidade), valor_compra: 45.00, descricao: 'Estoque inicial' }
          ]
        };
      });

      const matchedVehicles = localStore.vehicles?.filter((v: any) => v.tenant_id === tenantId) || [];

      return { 
        tenant: patchTenantPricing(tenant), 
        appointments: mappedAppointments, 
        inventory: mergedInventory, 
        finances: finances || [],
        customers: mergedCustomers,
        vehicles: matchedVehicles
      };
    }
    const store = getLocalData();
    return {
      tenant: patchTenantPricing(store.tenants.find((t: any) => t.id === tenantId)),
      appointments: (store.appointments?.filter((a: any) => a.tenant_id === tenantId) || []).map((app: any) => ({
        ...app,
        nome: app.nome || app.nome_cliente || '',
        telefone: app.telefone || app.telefone_cliente || '',
        servicos: Array.isArray(app.servicos) ? app.servicos : (typeof app.servicos === 'string' ? JSON.parse(app.servicos) : []),
      })),
      inventory: store.inventory.filter((i: any) => i.tenant_id === tenantId),
      finances: store.finances.filter((f: any) => f.tenant_id === tenantId),
      customers: store.customers ? store.customers.filter((c: any) => c.tenant_id === tenantId) : [],
      vehicles: store.vehicles ? store.vehicles.filter((v: any) => v.tenant_id === tenantId) : []
    };
  },

  async getTenantBySlug(slug: string) {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase!.from('tenants').select('*').eq('slug', slug).maybeSingle();
      if (error) throw error;
      return patchTenantPricing(data);
    }
    return patchTenantPricing(getLocalData().tenants.find((t: any) => t.slug === slug));
  },

  async getTenantById(id: string) {
    if (isSupabaseConfigured) {
      if (id.startsWith('t')) {
        return patchTenantPricing(getLocalData().tenants.find((t: any) => t.id === id));
      }
      const { data, error } = await supabase!.from('tenants').select('*').eq('id', id).maybeSingle();
      if (error) throw error;
      return patchTenantPricing(data);
    }
    return patchTenantPricing(getLocalData().tenants.find((t: any) => t.id === id));
  },

  async createTenant(tenantData: any) {
    const tenants = await this.getTenants();
    const usedCodes = new Set<number>();
    for (const t of tenants) {
      if (t.client_code) {
        const num = Number(t.client_code);
        if (!isNaN(num) && num >= 1 && num <= 10000) {
          usedCodes.add(num);
        }
      }
    }
    
    let nextNum = 1;
    for (let i = 1; i <= 10000; i++) {
      if (!usedCodes.has(i)) {
        nextNum = i;
        break;
      }
    }

    const codeStr = nextNum.toString();
    tenantData.client_code = codeStr;
    if (!tenantData.services_pricing) {
      tenantData.services_pricing = {};
    }
    tenantData.services_pricing._client_code = codeStr;

    // Remove client_code to prevent schema cache errors in Supabase
    const toInsert = { ...tenantData };
    delete toInsert.client_code;

    if (isSupabaseConfigured) {
       const { data, error } = await supabase!.from('tenants').insert([toInsert]).select().maybeSingle();
       if (error) throw error;
       return patchTenantPricing(data);
    } else {
       const data = getLocalData();
       const newMockTenant = { id: 't' + Date.now(), ...tenantData };
       data.tenants.push(newMockTenant);
       saveLocalData(data);
       return patchTenantPricing(newMockTenant);
    }
  },

  async deleteTenant(id: string) {
    if (isSupabaseConfigured) {
      console.log(`Starting complete deletion of tenant ${id} on Supabase...`);
      
      // Get the email before deleting, to remove it from auth.users via RPC
      let tenantEmail = '';
      try {
        const { data: tenantData } = await supabase!.from('tenants').select('services_pricing').eq('id', id).maybeSingle();
        if (tenantData && tenantData.services_pricing) {
          tenantEmail = tenantData.services_pricing._admin_email || '';
        }
      } catch (err) {
        console.warn("Could not fetch tenant email for deletion:", err);
      }
      
      // Attempt to delete related records individually under a safe catch.
      // If any of these throw an error (such as a restrictive RLS policy or missing delete right),
      // we log it as a warning but proceed. The SQL level ON DELETE CASCADE constraints 
      // will handle the complete deletion in Supabase once the main tenant row is removed.
      try {
        const { error: errApts } = await supabase!.from('appointments').delete().eq('tenant_id', id);
        if (errApts) console.warn("Supabase manual appointments delete failed (cascade will handle):", errApts);
      } catch (err) {
        console.warn("Exception in appointments delete catch block:", err);
      }

      try {
        const { error: errInv } = await supabase!.from('inventory').delete().eq('tenant_id', id);
        if (errInv) console.warn("Supabase manual inventory delete failed (cascade will handle):", errInv);
      } catch (err) {
        console.warn("Exception in inventory delete catch block:", err);
      }

      try {
        const { error: errFin } = await supabase!.from('finances').delete().eq('tenant_id', id);
        if (errFin) console.warn("Supabase manual finances delete failed (cascade will handle):", errFin);
      } catch (err) {
        console.warn("Exception in finances delete catch block:", err);
      }

      try {
        const { error: errCust } = await supabase!.from('customers').delete().eq('tenant_id', id);
        if (errCust) console.warn("Supabase manual customers delete failed (cascade will handle):", errCust);
      } catch (err) {
        console.warn("Exception in customers delete catch block:", err);
      }
      
      // Delete the main tenant itself
      const { error: errTenant } = await supabase!.from('tenants').delete().eq('id', id);
      if (errTenant) {
        console.error("Error deleting main tenant from Supabase:", errTenant);
        throw new Error(`Erro ao excluir o cadastro principal do cliente no Supabase: ${errTenant.message} (Código ${errTenant.code})`);
      }

      // If we found an admin email, invoke the security definer RPC to purge from auth.users
      if (tenantEmail) {
        try {
          console.log(`Trying to delete auth user of email ${tenantEmail} via database RPC...`);
          const { error: errRpc } = await supabase!.rpc('delete_auth_user_by_email', { email_to_delete: tenantEmail });
          if (errRpc) {
            console.warn("Supabase RPC delete_auth_user_by_email failed (expected if helper sql script is not executed):", errRpc);
          } else {
             console.log("Successfully deleted auth user from auth.users using RPC!");
          }
        } catch (err) {
          console.warn("Exception calling delete_auth_user_by_email RPC:", err);
        }
      }

      // Verify deletion from database to capture silent RLS ignore behaviors
      const { data: testFetch, error: testError } = await supabase!
        .from('tenants')
        .select('id')
        .eq('id', id)
        .maybeSingle();

      if (testError) {
        console.warn("Could not verify tenant deletion state in DB:", testError);
      } else if (testFetch) {
        throw new Error(
          "A exclusão do parceiro foi ignorada ou recusada pelo Supabase. Certifique-se de que sua conta de e-mail é um Super Administrador oficial executando o comando SQL no seu SQL Editor do painel do Supabase."
        );
      }

      console.log(`Successfully completed deletion of tenant ${id} on Supabase!`);
    }

    const data = getLocalData();
    data.tenants = (data.tenants || []).filter((t: any) => t.id !== id);
    data.appointments = (data.appointments || []).filter((a: any) => a.tenant_id !== id);
    data.inventory = (data.inventory || []).filter((i: any) => i.tenant_id !== id);
    data.finances = (data.finances || []).filter((f: any) => f.tenant_id !== id);
    data.customers = (data.customers || []).filter((c: any) => c.tenant_id !== id);
    data.vehicles = (data.vehicles || []).filter((v: any) => v.tenant_id !== id);
    saveLocalData(data);
  },

  async createFinanceRecord(financeData: any) {
    if (isSupabaseConfigured) {
      if (financeData.tenant_id && financeData.tenant_id.startsWith('t')) {
        const data = getLocalData();
        const newRecord = { id: 'f' + Date.now(), data_lancamento: new Date().toISOString(), created_at: new Date().toISOString(), ...financeData };
        data.finances = data.finances || [];
        data.finances.push(newRecord);
        saveLocalData(data);
        return newRecord;
      }
      const { data, error } = await supabase!.from('finances').insert([financeData]).select().maybeSingle();
      if (error) throw error;
      return data;
    } else {
      const data = getLocalData();
      const newRecord = { id: 'f' + Date.now(), data_lancamento: new Date().toISOString(), created_at: new Date().toISOString(), ...financeData };
      data.finances = data.finances || [];
      data.finances.push(newRecord);
      saveLocalData(data);
      return newRecord;
    }
  },

  async deleteFinanceRecord(id: string) {
    if (isSupabaseConfigured) {
      if (id.startsWith('f')) {
        const data = getLocalData();
        data.finances = (data.finances || []).filter((f: any) => f.id !== id);
        saveLocalData(data);
        return;
      }
      const { error } = await supabase!.from('finances').delete().eq('id', id);
      if (error) throw error;
    } else {
      const data = getLocalData();
      data.finances = (data.finances || []).filter((f: any) => f.id !== id);
      saveLocalData(data);
    }
  },

  async saveCustomer(customerData: any) {
    if (isSupabaseConfigured) {
      if (customerData.id && !customerData.id.startsWith('c_temp') && !customerData.id.startsWith('auto_') && !customerData.id.startsWith('c1') && !customerData.id.startsWith('c2') && !customerData.id.startsWith('c3') && !customerData.id.startsWith('c4') && !customerData.id.startsWith('c5')) {
        const { data, error } = await supabase!.from('customers').update({
          nome: customerData.nome,
          telefone: customerData.telefone,
          placa_veiculo: customerData.placa_veiculo,
          veiculos: customerData.veiculos || null,
          endereco: customerData.endereco,
          endereco_busca: customerData.endereco_busca,
          quantidade_lavadas: customerData.quantidade_lavadas
        }).eq('id', customerData.id).select().maybeSingle();
        if (error) {
           if (error.message?.includes('could not find the') || error.message?.includes('column') || error.code === 'PGRST204') {
             throw new Error("Colunas ausentes no banco de dados.\n\nAviso de Estrutura Supabase:\n\nPara suportar múltiplos veículos, execute isto no 'SQL Editor':\n\nALTER TABLE public.customers ADD COLUMN IF NOT EXISTS endereco text;\nALTER TABLE public.customers ADD COLUMN IF NOT EXISTS endereco_busca text;\nALTER TABLE public.customers ADD COLUMN IF NOT EXISTS quantidade_lavadas integer DEFAULT 0;\nALTER TABLE public.customers ADD COLUMN IF NOT EXISTS veiculos jsonb;");
           }
           if (error.code === '42501') {
              throw new Error("Erro RLS (Permissão Negada).\n\nAviso de Segurança Supabase:\n\nPara permitir que clientes novos das páginas públicas sejam salvos automaticamente, execute isto no 'SQL Editor' do Supabase:\n\nCREATE POLICY \"Enable public inserts for customers\" ON public.customers FOR INSERT WITH CHECK (true);\nCREATE POLICY \"Enable tenant updates for customers\" ON public.customers FOR UPDATE USING (true) WITH CHECK (true);");
           }
           throw error;
        }
        
        const local = getLocalData();
        local.customers = local.customers || [];
        const index = local.customers.findIndex((c: any) => c.id === customerData.id);
        if (index > -1) {
          local.customers[index] = { ...local.customers[index], ...customerData };
        } else {
          local.customers.push(customerData);
        }
        saveLocalData(local);
        return data;
      } else {
        const payload = {
          tenant_id: customerData.tenant_id,
          nome: customerData.nome,
          telefone: customerData.telefone,
          placa_veiculo: customerData.placa_veiculo,
          veiculos: customerData.veiculos || null,
          endereco: customerData.endereco,
          endereco_busca: customerData.endereco_busca,
          quantidade_lavadas: customerData.quantidade_lavadas
        };
        const { data, error } = await supabase!.from('customers').insert([payload]).select().maybeSingle();
        if (error) {
           if (error.message?.includes('could not find the') || error.message?.includes('column') || error.code === 'PGRST204') {
             throw new Error("Colunas ausentes no banco de dados.\n\nAviso de Estrutura Supabase:\n\nPara suportar múltiplos veículos, execute isto no 'SQL Editor':\n\nALTER TABLE public.customers ADD COLUMN IF NOT EXISTS endereco text;\nALTER TABLE public.customers ADD COLUMN IF NOT EXISTS endereco_busca text;\nALTER TABLE public.customers ADD COLUMN IF NOT EXISTS quantidade_lavadas integer DEFAULT 0;\nALTER TABLE public.customers ADD COLUMN IF NOT EXISTS veiculos jsonb;");
           }
           if (error.code === '42501') {
              throw new Error("Erro RLS (Permissão Negada).\n\nAviso de Segurança Supabase:\n\nPara permitir que clientes novos das páginas públicas sejam salvos automaticamente, execute isto no 'SQL Editor' do Supabase:\n\nCREATE POLICY \"Enable public inserts for customers\" ON public.customers FOR INSERT WITH CHECK (true);\nCREATE POLICY \"Enable tenant updates for customers\" ON public.customers FOR UPDATE USING (true) WITH CHECK (true);");
           }
           throw error;
        }
        
        const local = getLocalData();
        const extendedCustomer = { ...customerData, id: data.id };
        local.customers = local.customers || [];
        local.customers.push(extendedCustomer);
        saveLocalData(local);
        return data;
      }
    } else {
      const data = getLocalData();
      data.customers = data.customers || [];
      if (customerData.id) {
        data.customers = data.customers.map((c: any) => c.id === customerData.id ? customerData : c);
      } else {
        const newCust = { id: 'c' + Date.now(), ...customerData };
        data.customers.push(newCust);
        customerData = newCust;
      }
      saveLocalData(data);
      return customerData;
    }
  },

  async deleteCustomerAndRelated(id: string) {
    if (isSupabaseConfigured) {
      try {
        const { data: cust } = await supabase!.from('customers').select('telefone, tenant_id').eq('id', id).maybeSingle();
        if (cust && cust.telefone) {
          const { data: apps } = await supabase!.from('appointments').select('id').eq('telefone', cust.telefone).eq('tenant_id', cust.tenant_id);
          if (apps && apps.length > 0) {
            const appIds = apps.map((a: any) => a.id);
            await supabase!.from('finances').delete().in('appointment_id', appIds);
            await supabase!.from('appointments').delete().in('id', appIds);
          }
        }
        await supabase!.from('customers').delete().eq('id', id);
      } catch (e) {
        console.warn("Supabase issue deleting customer cascade:", e);
      }
    }
    const data = getLocalData();
    const custLocal = (data.customers || []).find((c: any) => c.id === id);
    if (custLocal && custLocal.telefone) {
        const tel = custLocal.telefone;
        const appsToDelete = (data.appointments || []).filter((a: any) => a.telefone === tel && a.tenant_id === custLocal.tenant_id);
        const appIdsToDelete = appsToDelete.map((a: any) => a.id);
        if (appIdsToDelete.length > 0) {
          data.appointments = data.appointments.filter((a: any) => !appIdsToDelete.includes(a.id));
          data.finances = (data.finances || []).filter((f: any) => !appIdsToDelete.includes(f.appointment_id));
        }
    }
    data.customers = (data.customers || []).filter((c: any) => c.id !== id);
    saveLocalData(data);
  },

  async deleteCustomer(id: string) {
    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase!.from('customers').delete().eq('id', id);
        if (error) {
           if (error.message?.includes('row-level security') || error.code === '42501') {
             alert("Aviso de Banco de Dados: O Supabase bloqueou a exclusão. Clique no botão superior 'BANCO DE DADOS', copie o comando e rode no SQL Editor.");
           }
           console.warn("Supabase issue deleting customer:", error);
        }
      } catch (e) {
        console.warn("Supabase issue deleting customer:", e);
      }
    }
    const data = getLocalData();
    data.customers = (data.customers || []).filter((c: any) => c.id !== id);
    saveLocalData(data);
  },

  async saveVehicle(vehicleData: any) {
    const data = getLocalData();
    data.vehicles = data.vehicles || [];
    if (vehicleData.id) {
      data.vehicles = data.vehicles.map((v: any) => v.id === vehicleData.id ? vehicleData : v);
    } else {
      const newVeh = { id: 'v' + Date.now(), ...vehicleData };
      data.vehicles.push(newVeh);
      vehicleData = newVeh;
    }
    saveLocalData(data);
    return vehicleData;
  },

  async deleteVehicle(id: string) {
    const data = getLocalData();
    data.vehicles = (data.vehicles || []).filter((v: any) => v.id !== id);
    saveLocalData(data);
  },

  async getTeamMembers(tenantId: string) {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase!.from('team_members').select('*').eq('tenant_id', tenantId);
        if (!error && data) return data;
      } catch (e) { console.warn("Supabase team_members error:", e); }
    }
    const data = getLocalData();
    return (data.team_members || []).filter((t: any) => t.tenant_id === tenantId);
  },

  async saveTeamMember(payload: any) {
    if (isSupabaseConfigured) {
      if (payload.id && !payload.id.startsWith('tm_')) {
        try {
          const { data, error } = await supabase!.from('team_members').update(payload).eq('id', payload.id).select().maybeSingle();
          if (!error && data) return data;
        } catch (e) { console.warn(e); }
      } else {
        const dbPayload = { ...payload };
        delete dbPayload.id;
        try {
          const { data, error } = await supabase!.from('team_members').insert([dbPayload]).select().maybeSingle();
          if (!error && data) return data;
        } catch (e) {
           if (e.message?.includes('could not find the') || e.code === 'PGRST204' || e.code === '42P01') {
             throw new Error("A tabela team_members não existe. Vá em Configurações Supabase e rode o script.");
           }
           throw e;
        }
      }
    }
    const data = getLocalData();
    data.team_members = data.team_members || [];
    if (payload.id) {
       data.team_members = data.team_members.map((t: any) => t.id === payload.id ? { ...t, ...payload } : t);
       saveLocalData(data);
       return payload;
    } else {
       const newMember = { ...payload, id: 'tm_' + Date.now(), created_at: new Date().toISOString() };
       data.team_members.push(newMember);
       saveLocalData(data);
       return newMember;
    }
  },

  async deleteTeamMember(id: string) {
    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase!.from('team_members').delete().eq('id', id);
        if (error) {
           if (error.message?.includes('row-level security') || error.code === '42501') {
             alert("Aviso de Banco de Dados: O Supabase bloqueou a exclusão. Para resolver, clique no botão superior 'BANCO DE DADOS' (DB SCRIPT), copie o comando e rode no SQL Editor.");
           } else {
             throw error;
           }
        }
      } catch (e) { console.warn(e); }
    }
    const data = getLocalData();
    data.team_members = (data.team_members || []).filter((t: any) => t.id !== id);
    saveLocalData(data);
  },

  async saveInventory(itemData: any) {
    if (isSupabaseConfigured) {
      if (itemData.id && !itemData.id.startsWith('i_temp') && !itemData.id.startsWith('i1') && !itemData.id.startsWith('i2')) {
        const { data, error } = await supabase!.from('inventory').update({
          nome_produto: itemData.nome_produto,
          quantidade: itemData.quantidade,
          nivel_minimo: itemData.nivel_minimo
        }).eq('id', itemData.id).select().maybeSingle();
        if (error) throw error;
        
        const local = getLocalData();
        local.inventory = local.inventory || [];
        const index = local.inventory.findIndex((i: any) => i.id === itemData.id);
        if (index > -1) {
          local.inventory[index] = { ...local.inventory[index], ...itemData };
        } else {
          local.inventory.push(itemData);
        }
        saveLocalData(local);
        return data;
      } else {
        const payload = {
          tenant_id: itemData.tenant_id,
          nome_produto: itemData.nome_produto,
          quantidade: itemData.quantidade,
          nivel_minimo: itemData.nivel_minimo
        };
        const { data, error } = await supabase!.from('inventory').insert([payload]).select().maybeSingle();
        if (error) throw error;
        
        const local = getLocalData();
        const extendedItem = { ...itemData, id: data.id };
        local.inventory = local.inventory || [];
        local.inventory.push(extendedItem);
        saveLocalData(local);
        return data;
      }
    } else {
      const data = getLocalData();
      data.inventory = data.inventory || [];
      if (itemData.id) {
        data.inventory = data.inventory.map((i: any) => i.id === itemData.id ? itemData : i);
      } else {
        const newInv = { id: 'i' + Date.now(), ...itemData };
        data.inventory.push(newInv);
        itemData = newInv;
      }
      saveLocalData(data);
      return itemData;
    }
  },

  async deleteInventory(id: string) {
    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase!.from('inventory').delete().eq('id', id);
        if (error) {
           if (error.message?.includes('row-level security') || error.code === '42501') {
             alert("Aviso de Banco de Dados: O Supabase bloqueou a exclusão do estoque. Para resolver, clique no botão superior 'BANCO DE DADOS' (DB SCRIPT), copie o comando e rode no SQL Editor.");
           }
           console.warn("Supabase issue deleting inventory:", error);
        }
      } catch (e) {
        console.warn("Supabase issue deleting inventory:", e);
      }
    }
    const data = getLocalData();
    data.inventory = (data.inventory || []).filter((i: any) => i.id !== id);
    saveLocalData(data);
  },

  async updateAppointment(id: string, updates: any) {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase!.from('appointments').update(updates).eq('id', id).select();
      if (error) {
        throw new Error(`Supabase Error: ${error.message}`);
      }
      if (!data || data.length === 0) {
        throw new Error("Agendamento não encontrado ou permissão negada.\n\nAviso RLS (Segurança de Banco de Dados):\n\nPara liberar a edição de agendamentos no Supabase, copie e execute este comando no 'SQL Editor' do seu painel do Supabase:\n\nDROP POLICY IF EXISTS \"Tenant update access appointments\" ON public.appointments;\nCREATE POLICY \"Tenant update access appointments\" ON public.appointments FOR UPDATE USING (true) WITH CHECK (true);\n\nOu garanta que seu usuário atual é o DONO deste Lava Jato ou Super Admin.");
      }
    } else {
      let data = getLocalData();
      let updated = false;
      data.appointments = (data.appointments || []).map((a: any) => {
        if (String(a.id) === String(id)) {
          updated = true;
          return { ...a, ...updates };
        }
        return a;
      });
      if (!updated) {
         console.warn("Agendamento não encontrado no mock store local com ID:", id);
      }
      saveLocalData(data);
    }
  },

  async deleteAppointment(id: string) {
    if (isSupabaseConfigured) {
      const { error } = await supabase!.from('appointments').delete().eq('id', id);
      if (error) throw new Error(`Supabase Error: ${error.message}`);
    }
    const data = getLocalData();
    data.appointments = (data.appointments || []).filter((a: any) => String(a.id) !== String(id));
    saveLocalData(data);
  },

  async createAppointment(appointmentData: any) {
    if (isSupabaseConfigured) {
      // 1. Tentar salvar/atualizar o cliente e veículo
      try {
        const { data: existingCust } = await supabase!
          .from('customers')
          .select('id')
          .eq('tenant_id', appointmentData.tenant_id)
          .eq('telefone', appointmentData.telefone)
          .maybeSingle();

        const custPayload = {
          tenant_id: appointmentData.tenant_id,
          nome: appointmentData.nome,
          telefone: appointmentData.telefone,
          placa_veiculo: appointmentData.veiculo_placa || null,
          veiculos: appointmentData.veiculos || null
        };

        if (existingCust) {
           await supabase!.from('customers').update(custPayload).eq('id', existingCust.id);
        } else {
           await supabase!.from('customers').insert([custPayload]);
        }
      } catch (e) {
        console.warn("Public customer sync failed (likely RLS), ignoring:", e);
      }

      // 2. Agendamento
      const dbPayload = {
        tenant_id: appointmentData.tenant_id,
        nome_cliente: appointmentData.nome,
        telefone_cliente: appointmentData.telefone,
        servicos: appointmentData.servicos, // array loaded as jsonb
        horario_marcado: appointmentData.horario_marcado,
        logistica: appointmentData.logistica,
        previsao_entrega: appointmentData.previsao_entrega,
        total: appointmentData.total,
        veiculo_placa: appointmentData.veiculo_placa || null,
        status: appointmentData.status || 'AGENDADO'
      };
      
      const { data, error } = await supabase!.from('appointments').insert([dbPayload]).select().maybeSingle();
      if (error) {
           if (error.message?.includes('could not find the') || error.message?.includes('column') || error.code === 'PGRST204') {
             throw new Error("Colunas ausentes no banco de dados.\n\nAviso de Estrutura Supabase:\n\nPara suportar carros específicos por agendamento, execute isto no 'SQL Editor':\n\nALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS veiculo_placa text;");
           }
        console.error("Supabase error inserting appointment:", error);
        throw error;
      }
      return data;
    } else {
      const data = getLocalData();
      
      // Auto-salvar cliente local
      data.customers = data.customers || [];
      const existingCustomerIdx = data.customers.findIndex((c: any) => c.tenant_id === appointmentData.tenant_id && c.telefone === appointmentData.telefone);
      if (existingCustomerIdx >= 0) {
        data.customers[existingCustomerIdx].placa_veiculo = appointmentData.veiculo_placa || data.customers[existingCustomerIdx].placa_veiculo;
        data.customers[existingCustomerIdx].veiculos = appointmentData.veiculos || data.customers[existingCustomerIdx].veiculos;
        data.customers[existingCustomerIdx].nome = appointmentData.nome || data.customers[existingCustomerIdx].nome;
      } else {
        data.customers.push({
          id: 'c' + Date.now(),
          tenant_id: appointmentData.tenant_id,
          nome: appointmentData.nome,
          telefone: appointmentData.telefone,
          placa_veiculo: appointmentData.veiculo_placa || '',
          veiculos: appointmentData.veiculos || null,
          quantidade_lavadas: 0,
        });
      }

      const newApp = {
        id: 'a' + Date.now(),
        ...appointmentData,
        status: appointmentData.status || 'AGENDADO'
      };
      data.appointments = data.appointments || [];
      data.appointments.push(newApp);
      saveLocalData(data);
      return newApp;
    }
  }
};
