import React, { useState } from 'react';
import type { PrefectureData } from '../types/prefecture';

const SEAT_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'] as const;
const BARCODE_BAR_COUNT = 20;

interface TicketDetails {
  dateStr: string;
  timeStr: string;
  seat: string;
  barcodeWidths: number[];
  serialNumber: string;
}

/** 発券時に一度だけ生成するチケット情報（日時・座席・バーコードはランダム） */
const issueTicket = (): TicketDetails => {
  const issuedAt = new Date();
  return {
    dateStr: issuedAt.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
    timeStr: issuedAt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    seat: `${Math.floor(Math.random() * 30 + 1)}${SEAT_LETTERS[Math.floor(Math.random() * SEAT_LETTERS.length)]}`,
    barcodeWidths: Array.from({ length: BARCODE_BAR_COUNT }, () => Math.random() * 4 + 1),
    serialNumber: Math.random().toString().substring(2, 14),
  };
};

interface UtopiaBoardingPassProps {
  prefecture: PrefectureData;
  onClose: () => void;
}

export const UtopiaBoardingPass: React.FC<UtopiaBoardingPassProps> = ({ prefecture, onClose }) => {
  // ランダム要素はマウント時に一度だけ確定させ、再レンダーで座席やバーコードが変わらないようにする
  const [{ dateStr, timeStr, seat, barcodeWidths, serialNumber }] = useState(issueTicket);
  const flightNum = `UX-${prefecture.prefCode.toString().padStart(3, '0')}`;

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <style>{`
        .animate-fade-in { animation: fadeIn 0.4s ease-out forwards; }
        .animate-slide-up-ticket { animation: slideUpTicket 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUpTicket { from { transform: translateY(50px) scale(0.95); opacity: 0; } to { transform: translateY(0) scale(1); opacity: 1; } }
        .barcode-font { font-family: 'Libre Barcode 39', 'Courier New', monospace; font-size: 2.5rem; letter-spacing: -2px; }
      `}</style>
      
      <div 
        className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row animate-slide-up-ticket"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Main Ticket Area */}
        <div className="flex-1 p-6 md:p-8 relative overflow-hidden">
          {/* Background decoration */}
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-indigo-50 dark:bg-indigo-900/20 rounded-full blur-3xl opacity-60 pointer-events-none" />
          
          {/* Header */}
          <div className="flex items-center justify-between mb-8 border-b-2 border-slate-100 dark:border-slate-800 pb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-black text-lg">
                U
              </div>
              <div>
                <h2 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-widest leading-none">
                  Utopia Airlines
                </h2>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                  First Class One-Way
                </span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Date</p>
              <p className="font-bold text-slate-700 dark:text-slate-300">{dateStr}</p>
            </div>
          </div>

          {/* Route Info */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex-1">
              <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1">Origin</p>
              <h1 className="text-4xl font-black text-slate-800 dark:text-white tracking-tighter">
                TKY
              </h1>
              <p className="text-xs text-slate-500 font-bold">Tokyo</p>
            </div>
            
            <div className="px-4 flex flex-col items-center justify-center text-indigo-500">
              <span className="text-2xl animate-pulse">✈️</span>
              <div className="w-full h-0.5 bg-indigo-200 dark:bg-indigo-800/50 mt-2 relative">
                <div className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-indigo-500" />
              </div>
              <span className="text-[10px] mt-1 font-bold">DIRECT</span>
            </div>

            <div className="flex-1 text-right">
              <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1">Destination</p>
              <h1 className="text-4xl font-black text-indigo-600 dark:text-indigo-400 tracking-tighter">
                {prefecture.prefName.substring(0, 3).toUpperCase()}
              </h1>
              <p className="text-xs text-slate-500 font-bold">{prefecture.prefName}</p>
            </div>
          </div>

          {/* Passenger & Flight Details */}
          <div className="grid grid-cols-3 gap-4 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl">
            <div>
              <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Passenger</p>
              <p className="font-bold text-slate-700 dark:text-slate-200 truncate">V.I.P.</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Flight</p>
              <p className="font-bold text-slate-700 dark:text-slate-200">{flightNum}</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Boarding</p>
              <p className="font-bold text-slate-700 dark:text-slate-200">{timeStr}</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Gate</p>
              <p className="font-bold text-slate-700 dark:text-slate-200">G-{prefecture.prefCode}</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Seat</p>
              <p className="font-bold text-slate-700 dark:text-slate-200">{seat}</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Class</p>
              <p className="font-bold text-indigo-600 dark:text-indigo-400">UTOPIA</p>
            </div>
          </div>
        </div>

        {/* Stub Area (Tear-off part) */}
        <div className="w-full md:w-64 bg-indigo-600 text-white p-6 md:p-8 flex flex-col justify-between relative border-t-2 md:border-t-0 md:border-l-2 border-dashed border-indigo-400">
          <div className="absolute top-0 -left-3 md:-top-3 md:-left-3 w-6 h-6 rounded-full bg-slate-900/60 shadow-inner" />
          <div className="absolute bottom-0 -left-3 md:-bottom-3 md:-left-3 w-6 h-6 rounded-full bg-slate-900/60 shadow-inner" />
          
          <div>
            <h3 className="text-xl font-black mb-1">UTOPIA PASS</h3>
            <p className="text-indigo-200 text-xs font-bold uppercase tracking-widest mb-6">First Class</p>
            
            <div className="space-y-4">
              <div>
                <p className="text-[10px] text-indigo-300 uppercase font-bold tracking-wider">Destination</p>
                <p className="font-black text-lg">{prefecture.prefName}</p>
              </div>
              <div className="flex justify-between">
                <div>
                  <p className="text-[10px] text-indigo-300 uppercase font-bold tracking-wider">Flight</p>
                  <p className="font-bold">{flightNum}</p>
                </div>
                <div>
                  <p className="text-[10px] text-indigo-300 uppercase font-bold tracking-wider">Seat</p>
                  <p className="font-bold">{seat}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 text-center">
            {/* Fake barcode using a simple striped div pattern if font isn't loaded */}
            <div className="w-full h-12 bg-white/20 rounded-md mb-2 flex items-center justify-between px-2 opacity-80">
              {barcodeWidths.map((width, i) => (
                <div key={i} className="bg-white h-full" style={{ width: `${width}px` }} />
              ))}
            </div>
            <p className="text-[8px] text-indigo-200 tracking-[0.2em]">{serialNumber}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
