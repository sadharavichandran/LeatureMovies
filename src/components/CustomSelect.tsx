import { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

interface CustomSelectProps {
  options: string[];
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export default function CustomSelect({ options, value, onChange, placeholder = '', disabled = false }: CustomSelectProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleSelect = (v: string) => {
    onChange(v);
    setOpen(false);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((s) => !s)}
        className={`w-full text-left px-2 py-1.5 bg-black/40 border border-white/10 rounded-lg text-stone-200 text-xs outline-none cursor-pointer transition-all ${
          disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-[#C5A059]/20'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className={`truncate ${value ? '' : 'text-stone-400'}`}>{value || placeholder}</span>
          <ChevronDown className="w-4 h-4 text-stone-400 ml-2" />
        </div>
      </button>

      {open && !disabled && (
        <div className="absolute z-40 mt-1 w-full max-h-56 overflow-auto bg-stone-900 border border-white/5 rounded-lg shadow-lg">
          <button
            className="w-full text-left px-3 py-2 text-xs text-stone-300 hover:bg-white/5"
            onClick={() => handleSelect('')}
          >
            All
          </button>
          {options.map((opt) => (
            <button
              key={opt}
              className={`w-full text-left px-3 py-2 text-xs ${opt === value ? 'bg-[#C5A059]/10 text-[#C5A059]' : 'text-stone-300 hover:bg-white/5'}`}
              onClick={() => handleSelect(opt)}
            >
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
