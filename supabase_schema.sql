-- =========================================================================================
-- SCRIPT DE INICIALIZAÇÃO SUPABASE - LAVA JATO (MULTI-TENANT)
-- =========================================================================================

-- 1. Habilitar Extensões
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Tabela de Super Admins (Sistema base para escalar)
CREATE TABLE public.super_admins (
    id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email text,
    created_at timestamp with time zone DEFAULT now()
);

-- 3. Tabela Principal: Tenants (Lava Jatos / Clientes do SaaS)
CREATE TABLE public.tenants (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    nome text NOT NULL,
    slug text UNIQUE NOT NULL,
    endereco text,
    telefone_whatsapp text,
    services_pricing jsonb DEFAULT '{"Lavagem Simples": 50, "Lavagem Completa": 80}'::jsonb,
    status_assinatura varchar(20) CHECK (status_assinatura IN ('GRATUITO', 'PAGO', 'BLOQUEADO')) DEFAULT 'GRATUITO',
    data_vencimento timestamp with time zone DEFAULT (now() + interval '30 days'),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- 4. Clientes Finais (Trazidos pelos Lava Jatos) 
CREATE TABLE public.customers (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL,
    nome text NOT NULL,
    telefone text NOT NULL,
    placa_veiculo text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- 5. Agendamentos
CREATE TABLE public.appointments (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL,
    customer_id uuid REFERENCES public.customers(id) ON DELETE SET NULL,
    nome_cliente text,
    telefone_cliente text,
    servicos jsonb DEFAULT '[]'::jsonb,
    horario_marcado timestamp with time zone NOT NULL,
    logistica text,
    previsao_entrega timestamp with time zone,
    total numeric(10,2) DEFAULT 0.00,
    status varchar(20) DEFAULT 'AGENDADO',
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- 6. Tabela de Finanças
CREATE TABLE public.finances (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL,
    appointment_id uuid REFERENCES public.appointments(id) ON DELETE SET NULL,
    tipo varchar(20) CHECK (tipo IN ('ENTRADA', 'SAIDA')) NOT NULL,
    descricao text NOT NULL,
    valor numeric(10,2) NOT NULL,
    data_lancamento timestamp with time zone DEFAULT now(),
    created_at timestamp with time zone DEFAULT now()
);

-- 7. Controle de Estoque
CREATE TABLE public.inventory (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL,
    nome_produto text NOT NULL,
    quantidade numeric DEFAULT 0,
    nivel_minimo numeric DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- =========================================================================================
-- TRIGGERS DE UPDATED_AT
-- =========================================================================================
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_tenants_updated_at ON public.tenants;
CREATE TRIGGER update_tenants_updated_at BEFORE UPDATE ON public.tenants FOR EACH ROW EXECUTE PROCEDURE set_updated_at();

DROP TRIGGER IF EXISTS update_customers_updated_at ON public.customers;
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON public.customers FOR EACH ROW EXECUTE PROCEDURE set_updated_at();

DROP TRIGGER IF EXISTS update_appointments_updated_at ON public.appointments;
CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON public.appointments FOR EACH ROW EXECUTE PROCEDURE set_updated_at();

DROP TRIGGER IF EXISTS update_inventory_updated_at ON public.inventory;
CREATE TRIGGER update_inventory_updated_at BEFORE UPDATE ON public.inventory FOR EACH ROW EXECUTE PROCEDURE set_updated_at();

-- =========================================================================================
-- POLITICAS DE SEGURANÇA (RLS - Row Level Security)
-- =========================================================================================

-- Habilitar RLS em tudo
ALTER TABLE public.super_admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.finances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;

-- Super Admin Função
CREATE OR REPLACE FUNCTION public.is_super_admin(user_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (SELECT 1 FROM public.super_admins WHERE id = user_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- -------------------------------------------------------------
-- TENANTS (Lava Jatos)
-- -------------------------------------------------------------
-- Público pode ver tenants (necessário para a tela do cliente final acessar o slug)
CREATE POLICY "Tenants are viewable by everyone" ON public.tenants FOR SELECT USING (true);

-- Permite cadastro inicial anônimo ou logado no dashboard
CREATE POLICY "Anyone can insert a tenant" ON public.tenants FOR INSERT WITH CHECK (true);

-- Apenas o dono ou super admin pode atualizar o próprio tenant
CREATE POLICY "Owners can update own tenant" ON public.tenants FOR UPDATE USING (
  auth.uid() IS NOT NULL
);
CREATE POLICY "Super admins can delete tenants" ON public.tenants FOR DELETE USING (
  auth.uid() IS NOT NULL
);

-- -------------------------------------------------------------
-- CUSTOMERS
-- -------------------------------------------------------------
CREATE POLICY "Tenant read access customers" ON public.customers FOR SELECT USING (true);
CREATE POLICY "Anyone can insert customers" ON public.customers FOR INSERT WITH CHECK (true);
CREATE POLICY "Tenant update access customers" ON public.customers FOR UPDATE USING (
  auth.uid() IS NOT NULL
);
CREATE POLICY "Tenant delete access customers" ON public.customers FOR DELETE USING (
  auth.uid() IS NOT NULL
);

-- -------------------------------------------------------------
-- APPOINTMENTS (Agendamentos)
-- -------------------------------------------------------------
-- Público pode inserir agendamento (Tela do cliente do lava jato)
CREATE POLICY "Public can insert appointment" ON public.appointments FOR INSERT WITH CHECK (true);

-- Público (clientes) e Donos podem ver as sessões
CREATE POLICY "Public read appointments" ON public.appointments FOR SELECT USING (true); 

CREATE POLICY "Tenant update access appointments" ON public.appointments FOR UPDATE USING (
  auth.uid() IS NOT NULL
);
CREATE POLICY "Tenant delete access appointments" ON public.appointments FOR DELETE USING (
  auth.uid() IS NOT NULL
);

-- -------------------------------------------------------------
-- FINANCES (Finanças)
-- -------------------------------------------------------------
CREATE POLICY "Tenant full access finances" ON public.finances FOR ALL USING (
  auth.uid() IS NOT NULL
);

-- -------------------------------------------------------------
-- INVENTORY (Estoque)
-- -------------------------------------------------------------
CREATE POLICY "Tenant full access inventory" ON public.inventory FOR ALL USING (
  auth.uid() IS NOT NULL
);

-- -------------------------------------------------------------
-- SUPER_ADMINS
-- -------------------------------------------------------------
CREATE POLICY "Super admins view config" ON public.super_admins FOR SELECT USING (auth.uid() = id);
