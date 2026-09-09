import { useState } from "react";
import { Eye, EyeOff, type LucideIcon } from "lucide-react";

interface AuthFieldProps {
  label: string;
  icon: LucideIcon;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
  autoComplete?: string;
  password?: boolean;
  hint?: string;
}

export function AuthField({
  label,
  icon: Icon,
  value,
  onChange,
  type = "text",
  placeholder,
  autoComplete,
  password = false,
  hint,
}: AuthFieldProps) {
  const [visible, setVisible] = useState(false);
  const resolvedType = password ? (visible ? "text" : "password") : type;

  return (
    <div className="space-y-1.5">
      <label className="block text-[11px] font-semibold uppercase tracking-wider text-white/60">
        {label}
      </label>
      <div className="relative">
        <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/35 pointer-events-none" />
        <input
          type={resolvedType}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          spellCheck={false}
          className={
            "w-full h-11 pl-10 pr-11 rounded-xl bg-white/[0.06] border border-white/15 text-white text-sm placeholder-white/30 " +
            "hover:border-white/25 focus:outline-none focus:ring-2 focus:ring-[#fe6804]/60 focus:border-[#fe6804]/60 " +
            "transition-all duration-200 [&::-ms-reveal]:hidden"
          }
        />
        {password && (
          <button
            type="button"
            onClick={() => setVisible(!visible)}
            aria-label={visible ? "Hide password" : "Show password"}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/90 transition-colors p-1 focus:outline-none"
          >
            {visible ? (
              <EyeOff className="w-4 h-4" />
            ) : (
              <Eye className="w-4 h-4" />
            )}
          </button>
        )}
      </div>
      {hint && <p className="text-[11px] text-white/45">{hint}</p>}
    </div>
  );
}