import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { AlertTriangle, Sparkles, Trash2, HelpCircle } from "lucide-react";

export interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "warning" | "info" | "primary";
  isLoading?: boolean;
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "primary",
  isLoading = false,
}: ConfirmDialogProps) {
  const getIcon = () => {
    switch (variant) {
      case "danger":
        return <Trash2 className="w-5 h-5 text-red-400" />;
      case "warning":
        return <AlertTriangle className="w-5 h-5 text-amber-400" />;
      case "info":
        return <Sparkles className="w-5 h-5 text-[#00BCD4]" />;
      default:
        return <HelpCircle className="w-5 h-5 text-[#fe6804]" />;
    }
  };

  const getIconBg = () => {
    switch (variant) {
      case "danger":
        return "bg-red-500/15 border-red-500/30";
      case "warning":
        return "bg-amber-500/15 border-amber-500/30";
      case "info":
        return "bg-[#00BCD4]/15 border-[#00BCD4]/30";
      default:
        return "bg-[#fe6804]/15 border-[#fe6804]/30";
    }
  };

  const getConfirmButtonClasses = () => {
    switch (variant) {
      case "danger":
        return "bg-red-600 hover:bg-red-500 text-white";
      case "warning":
        return "bg-amber-600 hover:bg-amber-500 text-white";
      case "info":
        return "bg-[#00BCD4] hover:bg-[#00BCD4]/90 text-black font-bold";
      default:
        return "bg-[#fe6804] hover:bg-[#fe6804]/90 text-white font-bold";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="bg-[#141a2e] border border-white/15 text-white max-w-md p-6 rounded-2xl shadow-2xl [font-family:'Work_Sans',Helvetica]">
        <div className="flex items-start gap-4">
          <div className={`p-3 rounded-xl border ${getIconBg()} shrink-0`}>
            {getIcon()}
          </div>
          <div className="space-y-1.5 flex-1">
            <DialogHeader className="text-left">
              <DialogTitle className="text-base font-bold text-white tracking-tight">
                {title}
              </DialogTitle>
            </DialogHeader>
            <DialogDescription className="text-xs sm:text-sm text-white/70 leading-relaxed">
              {description}
            </DialogDescription>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2.5 mt-6 pt-4 border-t border-white/10">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold border border-white/15 hover:border-white/30 transition-all active:scale-95 disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={async () => {
              await onConfirm();
              onClose();
            }}
            disabled={isLoading}
            className={`px-5 py-2 rounded-xl text-xs font-semibold shadow-lg transition-all disabled:opacity-50 flex items-center gap-2 ${getConfirmButtonClasses()}`}
          >
            {isLoading && (
              <div className="w-3.5 h-3.5 rounded-full border-2 border-current border-t-transparent animate-spin" />
            )}
            {confirmText}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
