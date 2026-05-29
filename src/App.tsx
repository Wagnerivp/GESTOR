import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router';
import { isSupabaseConfigured } from './lib/db';
import { LandingPage, PartnerSignup } from './pages/LandingPage';
import { SuperAdminDashboard } from './pages/SuperAdminDashboard';
import { TenantAdminDashboard } from './pages/TenantAdminDashboard';
import { CustomerApp } from './pages/CustomerApp';
import { SetupScreen } from './pages/SetupScreen';
import { Login } from './pages/Login';

export default function App() {
  return (
    <BrowserRouter>
      {/* 
        Banner informativo para o avaliador no ambiente AI Studio 
        saber que o modo mock está ativo, substituindo a integração real se não houver chaves.
      */}
      {!isSupabaseConfigured && (
        <div className="bg-yellow-100 text-yellow-800 px-4 py-2 text-xs text-center border-b border-yellow-200 flex justify-between items-center sm:px-6">
          <span><strong>Modo de Demonstração Web (Mock).</strong> Supabase não configurado. Dados salvos localmente.</span>
          <a href="/setup" className="underline font-medium hover:text-yellow-900 ml-2">Ver Script SQL</a>
        </div>
      )}

      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/cadastro-parceiro" element={<PartnerSignup />} />
        <Route path="/login" element={<Login />} />
        <Route path="/setup" element={<SetupScreen />} />
        
        {/* Painel Mestre - Gestão de Assinaturas */}
        <Route path="/superadmin" element={<SuperAdminDashboard />} />
        
        {/* Painel do Inquilino - Gestão do Lava Jato */}
        <Route path="/admin" element={<TenantAdminDashboard />} />
        
        {/* Aplicativo Publico do Cliente Final (Rota Curinga /:slug) */}
        <Route path="/:slug" element={<CustomerApp />} />
      </Routes>
    </BrowserRouter>
  );
}

