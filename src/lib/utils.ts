import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export function formatBRPhone(value: string) {
  const digits = value.replace(/\D/g, '');
  // If user pasted a number starting with 55 and has more than 10 digits, strip the 55
  let localDigits = digits;
  if (digits.startsWith('55') && digits.length > 10) {
    localDigits = digits.substring(2);
  }
  
  // Format as (XX) XXXXX-XXXX or (XX) XXXX-XXXX
  if (localDigits.length === 0) {
    return '';
  }
  if (localDigits.length <= 2) {
    return `(${localDigits}`;
  }
  if (localDigits.length <= 6) {
    return `(${localDigits.slice(0, 2)}) ${localDigits.slice(2)}`;
  }
  if (localDigits.length <= 10) {
    return `(${localDigits.slice(0, 2)}) ${localDigits.slice(2, 6)}-${localDigits.slice(6)}`;
  }
  return `(${localDigits.slice(0, 2)}) ${localDigits.slice(2, 7)}-${localDigits.slice(7, 11)}`;
}

export function getFriendlyUrl(path: string) {
  let origin = window.location.origin;
  // Se o link contiver o domínio de desenvolvimento privado (ais-dev-),
  // converte automaticamente para o domínio do preview público (ais-pre-)
  // para que qualquer outro dispositivo ou celular possa acessá-lo!
  if (origin.includes('ais-dev-')) {
    origin = origin.replace('ais-dev-', 'ais-pre-');
  }
  return `${origin}${path}`;
}

export function formatTenantCode(num: number): string {
  if (num < 10) {
    return `0${num}`;
  }
  return num.toString();
}

export function getTenantCode(tenant: any) {
  if (!tenant) return '';
  const pricing = tenant.services_pricing || {};
  const codeVal = pricing._client_code || tenant.client_code;
  if (codeVal) {
    const num = Number(codeVal);
    return isNaN(num) ? codeVal : formatTenantCode(num);
  }
  
  // Fallback to legacy slug structure if clients do not have client_code
  const cleanSlug = (tenant.slug || 'LAVA').toUpperCase().replace(/[^A-Z0-9]/g, '');
  const cleanId = (tenant.id || '2026').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(-4);
  return `GLJ-${cleanSlug}-${cleanId}`;
}
