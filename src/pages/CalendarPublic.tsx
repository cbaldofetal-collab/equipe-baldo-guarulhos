import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { Shift, Doctor } from '../types';
import { formatDateToPt } from '../utils/date';

interface CalendarPublicProps {
  shifts: Shift[];
  doctors: Doctor[];
}

export const CalendarPublic: React.FC<CalendarPublicProps> = ({ shifts, doctors }) => {
  const [currentDate, setCurrentDate] = useState(new Date(2026, 8, 10));

  const getDoctorName = (doctorId: string | null) => {
    if (!doctorId) return 'Vago';
    return doctors.find(d => d.id === doctorId)?.name || 'Desconhecido';
  };

  const getDoctorColor = (doctorId: string | null) => {
    if (!doctorId) return '#f3f4f6';
    return doctors.find(d => d.id === doctorId)?.color || '#d1d5db';
  };

  const getDaysInMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const getFirstDayOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();

  const handlePreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const daysInMonth = getDaysInMonth(currentDate);
  const firstDay = getFirstDayOfMonth(currentDate);
  const monthName = currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

  const days = [];
  for (let i = 0; i < firstDay; i++) {
    days.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }

  const getShiftsForDate = (day: number) => {
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return shifts.filter(s => s.date === dateStr);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-teal-600 text-white flex items-center justify-center shadow-lg">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Calendário de Escalas</h1>
              <p className="text-slate-600">Visualize todos os plantões da equipe uFetal</p>
            </div>
          </div>
        </div>

        {/* Calendar Navigation */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={handlePreviousMonth}
              className="p-2 rounded-xl hover:bg-slate-100 text-slate-600 transition cursor-pointer"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-bold text-slate-900 capitalize min-w-[200px] text-center">
              {monthName}
            </h2>
            <button
              onClick={handleNextMonth}
              className="p-2 rounded-xl hover:bg-slate-100 text-slate-600 transition cursor-pointer"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Day Headers */}
          <div className="grid grid-cols-7 gap-2 mb-4">
            {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'].map(day => (
              <div key={day} className="text-center font-semibold text-xs text-slate-600 py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-2">
            {days.map((day, idx) => {
              const dayShifts = day ? getShiftsForDate(day) : [];
              return (
                <div
                  key={idx}
                  className={`min-h-[120px] p-2 rounded-xl border-2 ${
                    day
                      ? 'bg-white border-slate-200 hover:border-slate-300'
                      : 'bg-slate-50 border-transparent'
                  }`}
                >
                  {day && (
                    <>
                      <div className="font-semibold text-slate-900 text-sm mb-2">{day}</div>
                      <div className="space-y-1">
                        {dayShifts.map(shift => (
                          <div
                            key={shift.id}
                            className="text-[10px] p-1.5 rounded-lg text-white font-medium truncate"
                            style={{ backgroundColor: getDoctorColor(shift.doctor_id) }}
                            title={`${getDoctorName(shift.doctor_id)} - ${shift.start_time}`}
                          >
                            {getDoctorName(shift.doctor_id).split(' ')[0]}
                          </div>
                        ))}
                        {dayShifts.length === 0 && (
                          <div className="text-[10px] text-slate-400 font-medium py-1">-</div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Legend */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <h3 className="font-bold text-slate-900 mb-4">Equipe de Médicos</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {doctors.map(doctor => (
              <div key={doctor.id} className="flex items-center gap-2">
                <div
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: doctor.color }}
                />
                <span className="text-xs font-medium text-slate-700">{doctor.name.split(' ')[0]}</span>
              </div>
            ))}
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-slate-200" />
              <span className="text-xs font-medium text-slate-700">Vago</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
