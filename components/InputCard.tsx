
import React from 'react';

interface InputCardProps {
  label: string;
  value: number;
  onChange: (val: number) => void;
  type?: string;
  suffix?: string;
  step?: string;
}

const InputCard: React.FC<InputCardProps> = ({ label, value, onChange, suffix, step = "1" }) => {
  return (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
      <label className="block text-sm font-medium text-slate-600 mb-2">{label}</label>
      <div className="relative">
        <input
          type="number"
          step={step}
          value={value || ''}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          className="w-full pl-3 pr-12 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
        />
        {suffix && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-medium">
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
};

export default InputCard;
