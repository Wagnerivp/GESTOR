import React, { useState, useEffect } from 'react';
import { Card, Button, Input } from '@/components/ui/Components';
import { api } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { useParams, useNavigate } from 'react-router';
import { differenceInDays, parseISO, addHours, format } from 'date-fns';
import { Clock, MapPin, CheckCircle, Shield } from 'lucide-react';

export function CustomerApp() {
  const { slug } = useParams<{ slug: string }>();
  const [tenant, setTenant] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [logistica, setLogistica] = useState('Levo na loja');
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    api.getTenantBySlug(slug || '').then(found => {
      setTenant(found);
      setLoading(false);
    }).catch(console.error);
  }, [slug]);

  if (loading) return <div className="p-8 text-center">Carregando aplicativo...</div>;
  
  if (!tenant) return (
    <div className="min-h-screen bg-slate-100 p-8 flex flex-col items-center justify-center">
      <Card className="p-8 max-w-sm text-center border border-slate-200">
        <h1 className="text-2xl font-bold mb-2 text-slate-800">404</h1>
        <p className="text-slate-500">Lava Jato não encontrado.</p>
      </Card>
    </div>
  );

  const diasRestantes = differenceInDays(parseISO(tenant.data_vencimento), new Date());
  if (tenant.status_assinatura === 'BLOQUEADO' || diasRestantes < 0) {
    return (
      <div className="min-h-screen bg-slate-100 p-6 flex flex-col items-center justify-center">
        <Card className="p-8 max-w-md w-full text-center border-slate-200">
          <Shield className="w-12 h-12 mx-auto text-slate-300 mb-4" />
          <h1 className="text-xl font-bold text-slate-800">Aplicativo Temporariamente Indisponível</h1>
          <p className="mt-2 text-slate-500 text-sm">Este serviço está passando por manutenção. Volte mais tarde.</p>
        </Card>
      </div>
    );
  }

  const toggleService = (serv: string) => {
    setSelectedServices(prev => prev.includes(serv) ? prev.filter(s => s !== serv) : [...prev, serv]);
  };

  const calculateTotal = () => {
    let total = selectedServices.reduce((acc, curr) => acc + (tenant.services_pricing[curr] || 0), 0);
    if (logistica === 'Busca em casa (+ R$ 10)') total += 10;
    return total;
  };

  const handleBooking = () => {
    if (!nome || !telefone || selectedServices.length === 0 || !selectedTime) {
      setValidationError("Preencha todos os campos e escolha um serviço/horário.");
      return;
    }
    setValidationError(null);
    
    // Calcula previsao = agora + 2h para demo, ou hora selecionada + 2h
    const [h, m] = selectedTime.split(':');
    const previsaoDate = new Date();
    previsaoDate.setHours(parseInt(h) + 2, parseInt(m), 0);
    
    const total = calculateTotal();
    const mensagem = `Olá ${tenant.nome}!\nGostaria de agendar:\n\n👤 Nome: ${nome}\n🚗 Serviços: ${selectedServices.join(', ')}\n⏰ Horário: ${selectedTime} (Previsão entrega: ${format(previsaoDate, 'HH:mm')})\n📍 Logística: ${logistica}\n💰 Total: ${formatCurrency(total)}\n\nPode confirmar?`;
    
    // Simulate DB save here could be done, but redirect to Whatsapp is the requirement
    window.open(`https://wa.me/${tenant.telefone_whatsapp}?text=${encodeURIComponent(mensagem)}`, '_blank');
  };

  const timeSlots = ["08:00", "09:00", "10:00", "11:00", "13:00", "14:00", "15:00", "16:00", "17:00"];

  return (
    <div className="min-h-screen bg-slate-100 font-sans pb-24">
      <header className="bg-slate-900 pt-12 pb-8 px-6 shadow-md rounded-b-[24px]">
        <h1 className="text-2xl font-bold text-white text-center tracking-tight">{tenant.nome}</h1>
        <p className="text-slate-400 text-center mt-2 flex items-center justify-center text-sm">
          <MapPin className="w-4 h-4 mr-1" /> {tenant.endereco}
        </p>
      </header>

      <main className="max-w-md mx-auto p-4 -mt-6 space-y-4">
        {validationError && (
          <div className="bg-red-50 text-red-600 border border-red-200 p-3.5 rounded-2xl text-[13px] font-semibold">
            {validationError}
          </div>
        )}
        <Card className="p-5">
          <h2 className="font-bold text-slate-800 mb-4 flex items-center text-[15px]"><CheckCircle className="w-4 h-4 mr-2 text-blue-600" /> Seus Dados</h2>
          <div className="space-y-3">
            <Input placeholder="Seu Nome" value={nome} onChange={e => setNome(e.target.value)} />
            <Input placeholder="Seu WhatsApp" type="tel" value={telefone} onChange={e => setTelefone(e.target.value)} />
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="font-bold text-slate-800 mb-4 flex items-center text-[15px]"><CheckCircle className="w-4 h-4 mr-2 text-blue-600 border-none shadow-none bg-transparent" />Serviços</h2>
          <div className="space-y-2">
            {Object.entries(tenant.services_pricing).map(([name, price]) => (
              <label key={name} className={`flex justify-between items-center p-3 border rounded-xl cursor-pointer transition-colors ${selectedServices.includes(name) ? 'border-blue-600 bg-blue-50/50' : 'border-slate-200 hover:bg-slate-50'}`}>
                <div className="flex items-center">
                  <input type="checkbox" checked={selectedServices.includes(name)} onChange={() => toggleService(name)} className="mr-3 w-4 h-4 text-blue-600 focus:ring-blue-600 border-slate-300 rounded" />
                  <span className="font-medium text-slate-800 text-[13px]">{name}</span>
                </div>
                <span className="font-bold text-slate-600 text-[13px]">{formatCurrency(price as number)}</span>
              </label>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="font-bold text-slate-800 mb-4 flex items-center text-[15px]"><Clock className="w-4 h-4 mr-2 text-blue-600" /> Horário (Hoje)</h2>
          <div className="grid grid-cols-3 gap-2">
            {timeSlots.map(time => (
              <button
                key={time}
                onClick={() => setSelectedTime(time)}
                className={`py-2 rounded-lg font-medium text-[13px] transition-all ${selectedTime === time ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100'}`}
              >
                {time}
              </button>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="font-bold text-slate-800 mb-4 text-[15px]">Logística</h2>
          <div className="flex space-x-2">
            {['Levo na loja', 'Busca em casa (+ R$ 10)'].map(opt => (
              <button
                key={opt}
                onClick={() => setLogistica(opt)}
                className={`flex-1 py-2 px-2 text-[13px] rounded-lg font-medium transition-all ${logistica === opt ? 'bg-blue-600 text-white border-none' : 'bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100'}`}
              >
                {opt}
              </button>
            ))}
          </div>
        </Card>

        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.02)] z-10">
          <div className="max-w-md mx-auto flex justify-between items-center">
            <div>
              <p className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold mb-0.5">Total a pagar</p>
              <p className="text-xl font-bold text-slate-900">{formatCurrency(calculateTotal())}</p>
            </div>
            <Button onClick={handleBooking} className="px-8 bg-blue-600 text-white shadow-sm rounded-lg">
              Confirmar
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
