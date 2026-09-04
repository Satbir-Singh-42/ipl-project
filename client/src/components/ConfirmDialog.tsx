import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

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
  const getConfirmButtonClasses = () => {
    switch (variant) {
      case "danger":
        return "bg-[#ef4444] hover:bg-[#dc2626] text-white shadow-red-500/20";
      case "warning":
        return "bg-[#fe6804] hover:bg-[#e05b03] text-white shadow-orange-500/20";
      case "info":
        return "bg-[#00BCD4] hover:bg-[#00acc1] text-black shadow-cyan-500/20";
      default:
        return "bg-[#fe6804] hover:bg-[#e05b03] text-white shadow-orange-500/20";
    }
  };

  // Format title with clean question mark if not present
  const formattedTitle = title.endsWith("?") ? title : `${title}?`;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        style={{ backgroundColor: "#181820" }}
        className="!bg-[#181820] border border-white/10 text-white max-w-md w-[92vw] sm:w-full p-5 sm:p-6 rounded-2xl sm:rounded-3xl shadow-2xl [font-family:'Work_Sans',Helvetica] gap-0"
      >
        <DialogHeader className="text-left space-y-1.5 pr-6">
          <DialogTitle className="text-base sm:text-lg font-bold text-white tracking-tight leading-snug">
            {formattedTitle}
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm text-zinc-300 leading-relaxed font-normal whitespace-pre-line">
            {description}
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center justify-end gap-2.5 mt-4 pt-1">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-1.5 rounded-full bg-[#272732] hover:bg-[#333342] text-white text-xs sm:text-sm font-medium border border-white/10 transition-all active:scale-95 disabled:opacity-50"
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
            className={`px-4 py-1.5 rounded-full text-xs sm:text-sm font-semibold shadow-md transition-all active:scale-95 disabled:opacity-50 flex items-center gap-1.5 ${getConfirmButtonClasses()}`}
          >
            {isLoading && (
              <div className="w-3 h-3 rounded-full border-2 border-current border-t-transparent animate-spin" />
            )}
            {confirmText}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

