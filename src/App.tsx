import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router';
import { LandingPage, PartnerSignup } from './pages/LandingPage';
import { SuperAdminDashboard } from './pages/SuperAdminDashboard';
import { TenantAdminDashboard } from './pages/TenantAdminDashboard';
import { CustomerApp } from './pages/CustomerApp';
import { SetupScreen } from './pages/SetupScreen';
import { Login } from './pages/Login';

export default function App() {
  return (
    <HashRouter>
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
    </HashRouter>
  );
}

