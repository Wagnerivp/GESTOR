import React, { useState, useEffect } from 'react';
import { Card, Button, Input } from '@/components/ui/Components';
import { api } from '@/lib/api';
import { formatCurrency, formatBRPhone } from '@/lib/utils';
import { useParams, useNavigate } from 'react-router';
import { differenceInDays, parseISO, addHours, format } from 'date-fns';
import { Clock, MapPin, CheckCircle, Shield, Car, Check, Bike, AlignLeft } from 'lucide-react';

export function CustomerApp() {
  const { slug } = useParams<{ slug: string }>();
  const [tenant, setTenant] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // States - Load from localStorage if available
  const [nome, setNome] = useState(() => localStorage.getItem('lavajato_nome') || '');
  const [telefone, setTelefone] = useState(() => localStorage.getItem('lavajato_telefone') || '');
  const [marca, setMarca] = useState(() => localStorage.getItem('lavajato_marca') || '');
  const [modelo, setModelo] = useState(() => localStorage.getItem('lavajato_modelo') || '');
  const [placa, setPlaca] = useState(() => localStorage.getItem('lavajato_placa') || '');
  
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [bookedTimes, setBookedTimes] = useState<string[]>([]);
  const [logistica, setLogistica] = useState('Levo na loja');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [visitedCount, setVisitedCount] = useState<number>(0);

  const [savedVehicles, setSavedVehicles] = useState<any[]>(() => {
    try {
      const v = localStorage.getItem('lavajato_saved_vehicles');
      return v ? JSON.parse(v) : [];
    } catch { return []; }
  });

  useEffect(() => {
    localStorage.setItem('lavajato_saved_vehicles', JSON.stringify(savedVehicles));
  }, [savedVehicles]);

  useEffect(() => {
    // Save to localStorage whenever they change
    localStorage.setItem('lavajato_nome', nome);
    localStorage.setItem('lavajato_telefone', telefone);
    localStorage.setItem('lavajato_marca', marca);
    localStorage.setItem('lavajato_modelo', modelo);
    localStorage.setItem('lavajato_placa', placa);
  }, [nome, telefone, marca, modelo, placa]);

  useEffect(() => {
    api.getTenantBySlug(slug || '').then(found => {
      setTenant(found);
      setLoading(false);
    }).catch(console.error);
  }, [slug]);

  useEffect(() => {
    if (tenant && telefone && telefone.length >= 10) {
      // Tenta buscar o histórico de serviços pelo telefone
      const formatPhoneVal = telefone.replace(/\D/g, '');
      const finalPhone = formatPhoneVal.startsWith('55') && formatPhoneVal.length > 10 ? formatPhoneVal : '55' + formatPhoneVal;
      api.getCustomerVisits(tenant.id, finalPhone).then(count => {
        setVisitedCount(count);
      }).catch(() => {});
    }
  }, [tenant, telefone]);

  useEffect(() => {
    if (tenant && selectedDate) {
      api.getBookedTimes(tenant.id, selectedDate)
        .then(times => setBookedTimes(times))
        .catch(console.error);
    }
  }, [tenant, selectedDate]);

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

  const handleBooking = async () => {
    if (!nome || !telefone || selectedServices.length === 0 || !selectedTime || !selectedDate) {
      setValidationError("Preencha todos os campos e escolha um serviço/horário.");
      return;
    }
    setValidationError(null);
    
    const [y, mm, d] = selectedDate.split('-');
    const [h, m] = selectedTime.split(':');
    
    const scheduledDate = new Date();
    scheduledDate.setFullYear(parseInt(y), parseInt(mm) - 1, parseInt(d));
    scheduledDate.setHours(parseInt(h), parseInt(m), 0, 0);

    const previsaoDate = new Date(scheduledDate);
    previsaoDate.setHours(parseInt(h) + 2, parseInt(m), 0, 0);
    
    const total = calculateTotal();
    
    // Formatar telefone do dono
    const rawOwnerPhone = tenant.telefone_whatsapp || '';
    const cleanOwnerPhone = rawOwnerPhone.replace(/\D/g, '');
    const finalOwnerPhone = cleanOwnerPhone.startsWith('55') && cleanOwnerPhone.length > 10 ? cleanOwnerPhone : '55' + cleanOwnerPhone;

    let veiculoInfo = '';
    if (marca || modelo || placa) {
      veiculoInfo = `\n🚙 Veículo: ${marca} ${modelo} ${placa ? `(Placa: ${placa})` : ''}`.trim();
    }

    const mensagem = `Olá ${tenant.nome}!\nGostaria de agendar:\n\n👤 Nome: ${nome}${veiculoInfo ? '\n' + veiculoInfo : ''}\n🚗 Serviços: ${selectedServices.join(', ')}\n📅 Data: ${format(scheduledDate, 'dd/MM/yyyy')}\n⏰ Horário: ${selectedTime} (Previsão entrega: ${format(previsaoDate, 'HH:mm')})\n📍 Logística: ${logistica}\n💰 Total: ${formatCurrency(total)}\n\nPode confirmar?`;
    const whatsappUrl = `https://wa.me/${finalOwnerPhone}?text=${encodeURIComponent(mensagem)}`;

    try {
      const formatPhoneVal = telefone.replace(/\D/g, '');
      const finalPhone = formatPhoneVal.startsWith('55') && formatPhoneVal.length > 10 ? formatPhoneVal : '55' + formatPhoneVal;

      // Chama a API silenciosamente...
      await api.createAppointment({
        tenant_id: tenant.id,
        nome,
        telefone: finalPhone,
        servicos: selectedServices,
        horario_marcado: scheduledDate.toISOString(),
        logistica,
        previsao_entrega: previsaoDate.toISOString(),
        total,
        status: 'AGENDADO',
        veiculo_marca: marca,
        veiculo_modelo: modelo,
        veiculo_placa: placa,
        veiculos: savedVehicles
      });
    } catch (err: any) {
      console.error("Erro ao salvar no banco de dados:", err);
    } finally {
      // Redireciona sempre para o WhatsApp do dono
      window.open(whatsappUrl, '_blank');
    }
  };

  const generateTimeSlots = () => {
    if (!tenant || !selectedDate) return [];
    
    // Parse the date safely
    const [y, m, d] = selectedDate.split('-');
    const dateObj = new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
    const dayOfWeek = dateObj.getDay();

    let start = 8;
    let end = 17; // default
    let availableDays = [0, 1, 2, 3, 4, 5, 6]; // default all days

    const nomeLower = tenant.nome?.toLowerCase() || '';
    const slugLower = tenant.slug?.toLowerCase() || '';

    if (
      nomeLower.includes('garagem 415') ||
      slugLower === 'garagem415' ||
      slugLower === 'garagem 415'
    ) {
      start = 7;
      end = 21; // 07:00 to 21:00
      availableDays = [0, 1, 2, 3, 4, 5, 6]; // Seg a Dom
    } else if (tenant.client_code === '01') {
      start = 8;
      end = 18; // 8:00 to 18:00
      availableDays = [0, 1, 2, 3, 4, 5, 6]; // Seg a Dom
    } else if (tenant.client_code === '02') {
      start = 7;
      end = 19; // 07:00 to 19:00
      availableDays = [1, 2, 3, 4, 5, 6]; // Seg a Sab (0 é Domingo)
    }

    if (!availableDays.includes(dayOfWeek)) {
      return [];
    }

    const slots = [];
    for (let i = start; i <= end; i++) {
       slots.push(`${i.toString().padStart(2, '0')}:00`);
    }
    return slots;
  };

  const timeSlots = generateTimeSlots();

  if (tenant.aceita_agendamentos === false) {
    return (
      <div className="min-h-screen bg-slate-100 p-8 flex flex-col items-center justify-center">
        <Card className="p-8 max-w-sm text-center border border-slate-200">
          <Clock className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h1 className="text-xl font-bold mb-2 text-slate-800">Agendamentos Pausados</h1>
          <p className="text-slate-500 mb-6">O serviço de agendamentos online está temporariamente indisponível para este Lava Jato.</p>
          <Button 
            className="w-full bg-blue-600 font-bold" 
            onClick={() => window.open(`https://wa.me/${tenant.telefone_whatsapp && tenant.telefone_whatsapp.replace(/\D/g,'')}`, '_blank')}
          >
            Falar pelo WhatsApp
          </Button>
        </Card>
      </div>
    );
  }

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
        <Card className="p-5 border-blue-100 bg-gradient-to-b from-white to-blue-50/20">
          <h2 className="font-bold text-slate-800 mb-4 flex items-center text-[15px]"><CheckCircle className="w-4 h-4 mr-2 text-blue-600" /> Seus Dados</h2>
          
          {visitedCount > 0 && (
            <div className="mb-4 bg-emerald-50 text-emerald-700 border border-emerald-200 p-3 rounded-xl text-sm font-semibold flex items-center">
               <Shield className="w-4 h-4 mr-2" />
               Que bom ter você de volta! Você já fez {visitedCount} {visitedCount === 1 ? 'serviço' : 'serviços'} conosco.
            </div>
          )}

          <div className="space-y-4">
            <div className="space-y-3">
              <Input placeholder="Seu Nome Completo" value={nome} onChange={e => setNome(e.target.value)} />
              <div className="relative flex items-center">
                <span className="absolute left-3 flex items-center select-none pointer-events-none text-base border-r border-slate-200 pr-2.5 h-5 text-slate-400">
                  🇧🇷
                </span>
                <Input 
                  placeholder="Seu WhatsApp" 
                  type="tel" 
                  className="pl-12 w-full"
                  value={formatBRPhone(telefone)} 
                  onChange={e => {
                    const rawValue = e.target.value.replace(/\D/g, '');
                    let stripped = rawValue;
                    if (rawValue.startsWith('55') && rawValue.length > 10) {
                      stripped = rawValue.substring(2);
                    }
                    if (stripped.length <= 11) {
                      setTelefone(stripped);
                    }
                  }} 
                />
              </div>
            </div>

            <div className="pt-4 border-t border-blue-100/60">
               <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center justify-between">
                 <div className="flex items-center"><Car className="w-4 h-4 mr-1.5 opacity-70" /> Veículo da Lavagem</div>
               </h3>
               
               {savedVehicles.length > 0 && (
                 <div className="mb-4 space-y-2">
                   {savedVehicles.map((v: any, index: number) => (
                     <div key={index} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 rounded-lg border border-slate-200 bg-slate-50 cursor-pointer" onClick={() => { setMarca(v.marca); setModelo(v.modelo); setPlaca(v.placa); }}>
                       <div className="flex flex-col mb-2 sm:mb-0">
                          <span className="font-bold text-slate-800 text-sm">{v.marca} {v.modelo}</span>
                          <span className="text-xs text-slate-500 uppercase font-mono">{v.placa}</span>
                       </div>
                       <div className="flex items-center gap-2 w-full sm:w-auto">
                          <Button size="xs" variant="secondary" className="flex-1 sm:flex-none text-[10px]" onClick={(e) => { e.stopPropagation(); setMarca(v.marca); setModelo(v.modelo); setPlaca(v.placa); }}>USAR</Button>
                          <Button size="xs" className="flex-1 sm:flex-none text-[10px] bg-red-100 text-red-600 hover:bg-red-200 border-none" onClick={(e) => {
                            e.stopPropagation();
                            setSavedVehicles(prev => prev.filter((_, i) => i !== index));
                            if (v.placa === placa) { setMarca(''); setModelo(''); setPlaca(''); }
                          }}>EXCLUIR</Button>
                       </div>
                     </div>
                   ))}
                 </div>
               )}

               <div className="grid grid-cols-2 gap-3 mb-3">
                  <Input placeholder="Marca (Ex: Fiat)" value={marca} onChange={e => setMarca(e.target.value)} />
                  <Input placeholder="Modelo (Ex: Argo)" value={modelo} onChange={e => setModelo(e.target.value)} />
               </div>
               <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <Input placeholder="Placa (Ex: ABC1234)" value={placa} onChange={e => setPlaca(e.target.value)} className="w-full" />
                  <Button 
                    type="button" 
                    onClick={() => {
                      if (marca && modelo && placa) {
                        setSavedVehicles(prev => {
                          if (prev.some((v: any) => v.placa === placa)) return prev;
                          return [...prev, { marca, modelo, placa }];
                        });
                      } else {
                         alert('Preencha marca, modelo e placa para salvar o veículo.');
                      }
                    }}
                    variant="secondary"
                    className="shrink-0 text-xs py-2 h-auto"
                  >
                    Salvar Veículo
                  </Button>
               </div>
            </div>
          </div>
        </Card>

        {(() => {
          const services = Object.entries(tenant.services_pricing).filter(([k]) => !k.startsWith('_'));
          const groups: Record<string, [string, any][]> = {
            'MOTO': [],
            'SERVIÇOS RÁPIDOS': [],
            'HATCH / SEDAN': [],
            'SUV / CAMINHONETE': []
          };
          
          services.forEach(([name, price]) => {
            const upperName = name.toUpperCase();
            if (upperName.includes('SUV') || upperName.includes('CAMINHONETE')) {
              groups['SUV / CAMINHONETE'].push([name, price]);
            } else if (upperName.includes('MOTO')) {
              groups['MOTO'].push([name, price]);
            } else if (upperName.includes('HATCH') || upperName.includes('SEDAN')) {
              groups['HATCH / SEDAN'].push([name, price]);
            } else {
              groups['SERVIÇOS RÁPIDOS'].push([name, price]);
            }
          });

          return (
            <div className="space-y-4">
              <h2 className="font-bold text-slate-800 flex items-center text-[16px] px-1"><CheckCircle className="w-5 h-5 mr-2 text-blue-600" />Selecione os Serviços</h2>
              
              {Object.entries(groups).map(([groupName, groupServices]) => {
                if (groupServices.length === 0) return null;
                
                let GroupIcon = Car;
                if (groupName === 'MOTO') GroupIcon = Bike;
                if (groupName === 'OUTROS SERVIÇOS') GroupIcon = AlignLeft;

                return (
                  <Card key={groupName} className="p-0 overflow-hidden border border-slate-200 shadow-sm relative rounded-[16px]">
                    <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-600"></div>
                    <div className="p-4 pl-5">
                      <h3 className="font-bold text-slate-800 mb-3 flex items-center text-[13px] uppercase tracking-wide">
                        <GroupIcon className="w-4 h-4 mr-2 text-blue-600 opacity-80" /> 
                        {groupName}
                      </h3>
                      <div className="space-y-2">
                        {groupServices.map(([name, price]) => {
                          const displayName = name.replace(/\s*\/?\((hatch\/sedan|suv|p\/m|caminhonete)\)\s*/i, '').trim();
                          const isSelected = selectedServices.includes(name);
                          
                          return (
                            <div 
                              key={name} 
                              onClick={() => toggleService(name)}
                              className={`flex justify-between items-center p-3 border rounded-xl cursor-pointer transition-all duration-200 ${isSelected ? 'border-blue-600 bg-blue-50/70 shadow-sm ring-1 ring-blue-600' : 'border-slate-200 hover:bg-slate-50 hover:border-blue-300'}`}
                            >
                              <div className="flex items-center gap-3 pr-2 flex-1">
                                <div className={`w-5 h-5 rounded-md border flex items-center justify-center flex-shrink-0 transition-colors ${isSelected ? 'border-blue-600 bg-blue-600' : 'border-slate-300 bg-white'}`}>
                                  {isSelected && <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
                                </div>
                                <span className={`font-medium text-[13px] leading-tight flex-1 ${isSelected ? 'text-blue-900' : 'text-slate-700'}`}>{displayName}</span>
                              </div>
                              <span className={`font-bold text-[13px] whitespace-nowrap px-2.5 py-1 rounded-md ${isSelected ? 'text-blue-700 bg-blue-100/50' : 'text-slate-600 bg-slate-100'}`}>
                                {formatCurrency(price as number)}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          );
        })()}

        <Card className="p-5">
          <h2 className="font-bold text-slate-800 mb-4 flex items-center text-[15px]"><Clock className="w-4 h-4 mr-2 text-blue-600" /> Data e Horário</h2>
          
          <div className="mb-4">
            <label className="block text-sm font-semibold text-slate-700 mb-2">Selecione a Data:</label>
            <input 
              type="date" 
              value={selectedDate}
              onChange={e => {
                setSelectedDate(e.target.value);
                setSelectedTime(null);
              }}
              min={format(new Date(), 'yyyy-MM-dd')}
              className="w-full bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-lg block p-2.5 focus:ring-blue-500 focus:border-blue-500" 
            />
          </div>

          <label className="block text-sm font-semibold text-slate-700 mb-2 mt-4">Selecione o Horário:</label>
          {timeSlots.length > 0 ? (
            <div className="grid grid-cols-3 gap-2">
              {timeSlots.map(time => {
                const isBooked = bookedTimes.includes(time);
                return (
                  <button
                    key={time}
                    disabled={isBooked}
                    onClick={() => setSelectedTime(time)}
                    className={`py-2 rounded-lg font-medium text-[13px] transition-all ${
                      isBooked 
                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed line-through'
                        : selectedTime === time 
                          ? 'bg-blue-600 text-white shadow-sm' 
                          : 'bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {time}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 text-center text-slate-500 text-sm">
              Fechado neste dia. Selecione outra data.
            </div>
          )}
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
