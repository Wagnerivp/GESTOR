import { createClient } from '@supabase/supabase-js';

// @ts-ignore
let supabaseUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim();
// Remove o sufixo /rest/v1 caso o usuário tenha copiado a URL da API ao invés da URL do Projeto
supabaseUrl = supabaseUrl.replace(/\/rest\/v1\/?$/, '');

// @ts-ignore
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Mock Store for initial preview
export const MOCK_TENANTS = [
  {
    id: 't1',
    nome: 'Lava Jato Costa Azul',
    slug: 'costa-azul',
    endereco: 'Av. Costa Azul, 100',
    telefone_whatsapp: '5511999999999',
    status_assinatura: 'PAGO',
    data_vencimento: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
    services_pricing: {
      'Lavagem Simples': 50,
      'Lavagem Completa': 80,
      'Higienização Interna': 120,
    }
  },
  {
    id: 't2',
    nome: 'Lava Jato Centro',
    slug: 'centro',
    endereco: 'Rua do Centro, 45',
    telefone_whatsapp: '5511988888888',
    status_assinatura: 'BLOQUEADO',
    data_vencimento: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    services_pricing: {
      'Lavagem Simples': 45,
      'Lavagem Completa': 70,
    }
  },
  {
    id: 't3',
    nome: 'Lava Jato Teste',
    slug: 'teste',
    endereco: 'Rua Teste, 1',
    telefone_whatsapp: '5511977777777',
    status_assinatura: 'GRATUITO',
    data_vencimento: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    services_pricing: {
      'Lavagem Simples': 40,
    }
  }
];

export const MOCK_APPOINTMENTS = [
  {
    id: 'a1',
    tenant_id: 't1',
    nome: 'Carlos Silva',
    telefone: '5511911111111',
    servicos: ['Lavagem Simples'],
    horario_marcado: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
    logistica: 'Levo o carro',
    total: 50,
    status: 'AGENDADO'
  }
];

export const MOCK_INVENTORY = [
  { id: 'i1', tenant_id: 't1', nome_produto: 'Shampoo Automotivo', quantidade: 5, nivel_minimo: 2 },
  { id: 'i2', tenant_id: 't1', nome_produto: 'Cera Cristalizadora', quantidade: 1, nivel_minimo: 3 },
];

export const MOCK_FINANCES = [
  { id: 'f1', tenant_id: 't1', data: new Date().toISOString(), descricao: 'Lavagem Corsa', tipo: 'RECEITA', valor: 50 },
  { id: 'f2', tenant_id: 't1', data: new Date().toISOString(), descricao: 'Compra Shampoo', tipo: 'DESPESA', valor: 150 },
];
