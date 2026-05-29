import React from 'react';
import { Card, Button } from '@/components/ui/Components';
import { Database, ShieldAlert } from 'lucide-react';

export function SetupScreen() {
  return (
    <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-6">
      <div className="max-w-2xl w-full">
        <div className="text-center mb-8">
          <Database className="w-16 h-16 text-blue-600 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-slate-800">Configuração do Supabase Ausente</h1>
          <p className="text-slate-500 mt-2">
            O aplicativo está rodando em <strong>Modo de Simulação (Mock)</strong> usando LocalStorage.
          </p>
        </div>

        <Card className="p-8 mb-6 border-slate-200">
          <h2 className="text-xl font-semibold mb-4 flex items-center text-slate-800">
            <ShieldAlert className="w-5 h-5 mr-2 text-yellow-500" />
            Como conectar seu banco Real (Supabase)
          </h2>
          
          <div className="space-y-4 text-sm text-slate-700">
            <p>
              Você solicitou um backend completo com Supabase (PostgreSQL, Auth e RLS).
              Os scripts SQL completos foram gerados na raiz do projeto.
            </p>
            
            <ol className="list-decimal pl-5 space-y-2">
              <li>Acesse o arquivo <code className="bg-slate-100 px-1.5 py-0.5 rounded text-blue-600 font-mono text-xs">supabase_schema.sql</code> gerado na raiz.</li>
              <li>Execute o script no SQL Editor do seu projeto Supabase.</li>
              <li>Preencha as variáveis de ambiente no arquivo <code className="bg-slate-100 px-1.5 py-0.5 rounded text-blue-600 font-mono text-xs">.env</code>:
                <pre className="bg-slate-900 text-green-400 p-3 rounded-md mt-2 overflow-x-auto text-xs font-mono">
                  VITE_SUPABASE_URL="sua-url-aqui"{"\n"}
                  VITE_SUPABASE_ANON_KEY="sua-anon-key-aqui"
                </pre>
              </li>
              <li>Reinicie o servidor de desenvolvimento.</li>
            </ol>
          </div>
        </Card>

        <div className="flex justify-center space-x-4">
          <Button className="bg-blue-600 text-white" onClick={() => window.location.href = '/superadmin'}>
            Ir para Super Admin (Mock)
          </Button>
          <Button variant="secondary" onClick={() => window.location.href = '/cadastro-parceiro'}>
            Ver Landing Page
          </Button>
        </div>
      </div>
    </div>
  );
}
