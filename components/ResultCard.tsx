
import React from 'react';

interface ResultCardProps {
  title: string;
  value?: string | number;
  min?: string | number;
  max?: string | number;
  icon: React.ReactNode;
  color: 'blue' | 'green' | 'amber' | 'purple' | 'red';
}

const colorClasses = {
  blue: 'bg-blue-50 text-blue-700 border-blue-100',
  green: 'bg-green-50 text-green-700 border-green-100',
  amber: 'bg-amber-50 text-amber-700 border-amber-100',
  purple: 'bg-purple-50 text-purple-700 border-purple-100',
  red: 'bg-red-50 text-red-700 border-red-100',
};

const ResultCard: React.FC<ResultCardProps> = ({ title, value, min, max, icon, color }) => {
  return (
    <div className={`p-5 rounded-2xl border-2 ${colorClasses[color]} flex flex-col gap-3 transition-transform hover:scale-[1.02] shadow-sm`}>
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-white/50">{icon}</div>
        <h3 className="font-bold text-sm uppercase tracking-tight">{title}</h3>
      </div>
      
      {value !== undefined ? (
        <div className="mt-1">
          <p className="text-2xl font-black">{value}</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 mt-1 border-t border-current/10 pt-2">
          <div>
            <p className="text-[10px] uppercase tracking-wider opacity-70 font-bold">Scénario Min</p>
            <p className="text-lg font-black">{min}</p>
          </div>
          <div className="border-l border-current/10 pl-4">
            <p className="text-[10px] uppercase tracking-wider opacity-70 font-bold">Scénario Max</p>
            <p className="text-lg font-black">{max}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResultCard;
