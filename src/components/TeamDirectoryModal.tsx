import React, { useState } from 'react';
import {
  X,
  Users,
  UserPlus,
  Phone,
  Mail,
  ShieldCheck,
  Clock,
  Check,
  Stethoscope,
  UserMinus
} from 'lucide-react';
import { Doctor, Shift } from '../types';
import { calculateHours } from '../utils/date';

interface TeamDirectoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  doctors: Doctor[];
  currentDoctor: Doctor;
  shifts: Shift[];
  currentDate: Date;
  onSelectDoctor: (doc: Doctor) => void;
  onAddDoctor: (docData: { name: string; crm: string; phone: string; email: string; specialty: string }) => void;
  onRequestRemoveDoctor: (doc: Doctor, shiftCount: number) => void;
}

export const TeamDirectoryModal: React.FC<TeamDirectoryModalProps> = ({
  isOpen,
  onClose,
  doctors,
  currentDoctor,
  shifts,
  currentDate,
  onSelectDoctor,
  onAddDoctor,
  onRequestRemoveDoctor,
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [name, setName] = useState('');
  const [crm, setCrm] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [specialty, setSpecialty] = useState('Medicina Fetal');

  if (!isOpen) return null;

  const currentMonthPrefix = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
  const monthShifts = shifts.filter(s => s.date.startsWith(currentMonthPrefix));

  const handleCreateDoctor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !crm) return;
    onAddDoctor({ name, crm, phone, email, specialty });
    setName('');
    setCrm('');
    setPhone('');
    setEmail('');
    setShowAddForm(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-teal-700 text-white flex items-center justify-center shadow-xs">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 font-['Outfit']">
                Equipe Médica uFetal
              </h3>
              <p className="text-xs text-slate-500">
                Especialistas em Medicina Fetal, contatos e carga horária
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          
          {/* Add Doctor Button / Form Toggle */}
          {!showAddForm ? (
            <button
              onClick={() => setShowAddForm(true)}
              className="w-full py-2.5 border-2 border-dashed border-teal-300 rounded-2xl text-teal-700 font-bold text-xs hover:bg-teal-50/50 transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>Cadastrar Novo Médico Fetalista</span>
            </button>
          ) : (
            <form onSubmit={handleCreateDoctor} className="bg-teal-50/50 border border-teal-200 rounded-2xl p-4 space-y-3">
              <h4 className="font-bold text-xs text-teal-900 uppercase tracking-wider">
                Novo Membro da Equipe
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Nome Completo com Título *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Dra. Ana Paula Costa"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-white border border-teal-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    CRM com Estado *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: CRM 192.300-SP"
                    value={crm}
                    onChange={e => setCrm(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-white border border-teal-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Especialidade / Foco
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Ecocardiografia Fetal"
                    value={specialty}
                    onChange={e => setSpecialty(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-white border border-teal-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    WhatsApp / Telefone de Contato
                  </label>
                  <input
                    type="text"
                    placeholder="(11) 98765-4321"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-white border border-teal-300 rounded-xl"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs rounded-xl transition"
                >
                  Salvar Médico
                </button>
              </div>
            </form>
          )}

          {/* Doctors List */}
          <div className="space-y-3">
            {doctors.map(doc => {
              const docShifts = monthShifts.filter(s => s.doctorId === doc.id);
              const totalHours = docShifts.reduce((acc, s) => acc + calculateHours(s.startTime, s.endTime, s.shiftType), 0);
              const isCurrent = doc.id === currentDoctor.id;

              return (
                <div
                  key={doc.id}
                  className={`p-4 rounded-2xl border transition shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                    isCurrent
                      ? 'border-teal-400 bg-teal-50/40 ring-1 ring-teal-400/30'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    <div
                      className="w-11 h-11 rounded-2xl flex items-center justify-center text-white text-sm font-bold shrink-0 shadow-xs"
                      style={{ backgroundColor: doc.color }}
                    >
                      {doc.initials}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-sm text-slate-900">{doc.name}</h4>
                        {doc.isCoordinator && (
                          <span className="px-2 py-0.2 rounded text-[10px] font-extrabold bg-teal-100 text-teal-800">
                            Coordenação
                          </span>
                        )}
                        {isCurrent && (
                          <span className="text-[10px] text-teal-700 font-bold bg-white px-2 py-0.2 rounded-full border border-teal-300">
                            Você
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 font-medium">{doc.specialty}</p>
                      <div className="flex items-center gap-3 mt-1 text-[11px] text-slate-400">
                        <span>{doc.crm}</span>
                        {doc.phone && <span>• {doc.phone}</span>}
                      </div>
                    </div>
                  </div>

                  {/* Right side: Monthly stats & Quick Switch */}
                  <div className="flex items-center gap-4 sm:border-l sm:border-slate-100 sm:pl-4">
                    <div className="text-right text-xs">
                      <div className="font-bold text-slate-900">{docShifts.length} plantões</div>
                      <div className="text-[11px] text-slate-500">{totalHours}h este mês</div>
                    </div>

                    {!isCurrent && (
                      <button
                        onClick={() => {
                          onSelectDoctor(doc);
                          onClose();
                        }}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-teal-50 hover:text-teal-700 text-slate-700 font-semibold text-xs rounded-xl transition cursor-pointer shrink-0"
                      >
                        Operar como
                      </button>
                    )}

                    {!isCurrent && currentDoctor.isCoordinator && (
                      <button
                        onClick={() => onRequestRemoveDoctor(doc, docShifts.length)}
                        title="Retirar médico da equipe"
                        className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl transition cursor-pointer shrink-0"
                      >
                        <UserMinus className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200 transition cursor-pointer"
          >
            Fechar
          </button>
        </div>

      </div>
    </div>
  );
};
