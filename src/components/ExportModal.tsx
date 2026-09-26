import React, { useState } from 'react';
import { 
  X, 
  Share2, 
  Copy, 
  Check, 
  Download, 
  Printer, 
  MessageSquare,
  Calendar
} from 'lucide-react';
import { Shift, Doctor } from '../types';
import { MONTH_NAMES_PT } from '../utils/date';
import { generateWhatsAppScheduleText, downloadICalendar } from '../utils/exportSchedule';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  shifts: Shift[];
  doctors: Doctor[];
  currentDate: Date;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  shifts,
  doctors,
  currentDate,
}) => {
  const [copied, setCopied] = useState(false);
  const [selectedDocFilter, setSelectedDocFilter] = useState('all');

  if (!isOpen) return null;

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const previewText = generateWhatsAppScheduleText(
    selectedDocFilter === 'all' ? shifts : shifts.filter(s => s.doctorId === selectedDocFilter),
    doctors,
    year,
    month
  );

  const handleCopy = () => {
    navigator.clipboard.writeText(previewText);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handleWhatsAppSend = () => {
    const encoded = encodeURIComponent(previewText);
    window.open(`https://api.whatsapp.com/send?text=${encoded}`, '_blank');
  };

  const handleDownload = () => {
    downloadICalendar(shifts, doctors, selectedDocFilter === 'all' ? undefined : selectedDocFilter);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-teal-600 text-white flex items-center justify-center shadow-xs">
              <Share2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 font-['Outfit']">
                Exportar Escala uFetal
              </h3>
              <p className="text-xs text-slate-500">
                {MONTH_NAMES_PT[month]} / {year} • Compartilhe com a equipe médica
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
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          
          {/* Options */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200">
            <div className="text-xs font-semibold text-slate-700">
              Filtrar escala exportada:
            </div>
            <select
              value={selectedDocFilter}
              onChange={e => setSelectedDocFilter(e.target.value)}
              className="text-xs bg-white border border-slate-300 rounded-xl px-3 py-1.5 font-medium outline-none"
            >
              <option value="all">Toda a Equipe ({doctors.length} Médicos)</option>
              {doctors.map(d => (
                <option key={d.id} value={d.id}>Somente {d.name}</option>
              ))}
            </select>
          </div>

          {/* WhatsApp Text Preview */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                <span>Formato WhatsApp</span>
              </label>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopy}
                  className={`flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                    copied
                      ? 'bg-emerald-600 text-white'
                      : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-300'
                  }`}
                >
                  {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  <span>{copied ? 'Copiado!' : 'Copiar Texto'}</span>
                </button>
                <button
                  onClick={handleWhatsAppSend}
                  className="flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition cursor-pointer shadow-xs"
                >
                  <span>Abrir WhatsApp</span>
                </button>
              </div>
            </div>

            <pre className="p-4 bg-slate-900 text-emerald-400 font-mono text-xs rounded-2xl overflow-x-auto max-h-56 leading-relaxed whitespace-pre-wrap border border-slate-800 selection:bg-emerald-800 selection:text-white">
              {previewText}
            </pre>
          </div>

          {/* Other export formats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <button
              onClick={handleDownload}
              className="p-4 rounded-2xl border border-slate-200 hover:border-teal-400 hover:bg-teal-50/40 text-left transition flex items-start gap-3 cursor-pointer group"
            >
              <div className="w-9 h-9 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center shrink-0 group-hover:bg-teal-600 group-hover:text-white transition">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900">Download iCal (.ics)</h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Sincronize plantões com o Google Calendar, Apple Calendar ou Outlook.
                </p>
              </div>
            </button>

            <button
              onClick={() => window.print()}
              className="p-4 rounded-2xl border border-slate-200 hover:border-slate-400 hover:bg-slate-50 text-left transition flex items-start gap-3 cursor-pointer group"
            >
              <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0 group-hover:bg-slate-800 group-hover:text-white transition">
                <Printer className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900">Imprimir / Salvar PDF</h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Gere a folha oficial de escala para afixação no mural ou prontuário.
                </p>
              </div>
            </button>
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
