import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";

export interface DropdownOption {
  value: string | number;
  label: string;
  description?: string;
  badge?: string;
  badgeColor?: string;
  icon?: React.ReactNode;
}

export interface CustomDropdownProps {
  value: string | number | null | undefined;
  onChange: (value: any) => void;
  options: DropdownOption[];
  placeholder?: string;
  className?: string;
  triggerClassName?: string;
  menuClassName?: string;
  size?: "sm" | "md";
  disabled?: boolean;
}

export function CustomDropdown({
  value,
  onChange,
  options,
  placeholder = "Select an option...",
  className = "",
  triggerClassName = "",
  menuClassName = "",
  size = "md",
  disabled = false,
}: CustomDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent | TouchEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const selectedOption = options.find(
    (opt) =>
      value !== null &&
      value !== undefined &&
      String(opt.value).toLowerCase() === String(value).toLowerCase()
  );

  const isSmall = size === "sm";

  return (
    <div
      ref={containerRef}
      className={`relative inline-block ${className || "w-full"}`}
    >
      {/* Trigger button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen((prev) => !prev)}
        className={`w-full flex items-center justify-between gap-1.5 rounded-lg bg-[#1a2332] border border-[#2a3441] hover:border-[#fe6804]/60 text-white transition-all focus:outline-none focus:ring-1 focus:ring-[#fe6804] disabled:opacity-50 disabled:cursor-not-allowed ${
          isSmall ? "px-2.5 py-1 text-[11px]" : "px-3 py-1.5 text-xs"
        } ${isOpen ? "ring-1 ring-[#fe6804] border-[#fe6804]" : ""} ${triggerClassName}`}
      >
        <div className="flex items-center gap-1.5 truncate">
          {selectedOption ? (
            <>
              {selectedOption.icon}
              {selectedOption.badge ? (
                <span
                  className={`px-1.5 py-0.5 rounded text-[10px] font-bold border shrink-0 ${
                    selectedOption.badgeColor || "bg-white/10 text-white border-white/20"
                  }`}
                >
                  {selectedOption.badge}
                </span>
              ) : null}
              <span className="truncate font-medium text-white">
                {selectedOption.label}
              </span>
            </>
          ) : (
            <span className="text-white/40 truncate">{placeholder}</span>
          )}
        </div>

        <ChevronDown
          className={`shrink-0 transition-transform duration-200 ${
            isSmall ? "w-3 h-3" : "w-3.5 h-3.5"
          } ${isOpen ? "rotate-180 text-[#fe6804]" : "text-white/60"}`}
        />
      </button>

      {/* Floating Menu Popover */}
      {isOpen && (
        <div
          className={`absolute top-full left-0 mt-1 z-50 ${
            isSmall
              ? "min-w-[170px] p-1 space-y-0.5 rounded-lg text-[11px]"
              : "min-w-full p-1.5 space-y-0.5 rounded-xl text-xs"
          } max-h-56 overflow-y-auto bg-[#0f1629] border border-[#2a3441] shadow-2xl backdrop-blur-md animate-in fade-in zoom-in-95 duration-150 scrollbar-hide ${menuClassName}`}
        >
          {options.map((opt) => {
            const isSelected =
              value !== null &&
              value !== undefined &&
              String(opt.value).toLowerCase() === String(value).toLowerCase();

            return (
              <button
                type="button"
                key={String(opt.value)}
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between gap-2 ${
                  isSmall
                    ? "px-2 py-1 rounded-md text-[11px]"
                    : "px-2.5 py-1.5 rounded-lg text-xs"
                } text-left transition-all whitespace-nowrap ${
                  isSelected
                    ? "bg-[#fe6804]/20 border border-[#fe6804]/40 text-white font-semibold"
                    : "hover:bg-[#1a2332] text-white/80 hover:text-white border border-transparent"
                }`}
              >
                <div className="flex flex-col min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    {opt.icon}
                    {opt.badge ? (
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold border shrink-0 ${
                          opt.badgeColor || "bg-white/10 text-white border-white/20"
                        }`}
                      >
                        {opt.badge}
                      </span>
                    ) : (
                      <span className="font-medium text-white truncate">{opt.label}</span>
                    )}
                  </div>

                  {opt.description && (
                    <span className="text-[10px] text-white/40 leading-none mt-0.5 truncate">
                      {opt.description}
                    </span>
                  )}
                </div>

                {isSelected && (
                  <Check
                    className={`shrink-0 text-[#fe6804] ${
                      isSmall ? "w-3 h-3" : "w-3.5 h-3.5"
                    }`}
                  />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
