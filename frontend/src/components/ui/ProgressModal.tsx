import React from "react";
import {
  Dialog,
  DialogContent,
  DialogOverlay,
  DialogDescription,
} from "@/components/ui/dialog";
import CircularProgressWithLabel from "@/components/ui/CircularProgressWithLabel";

interface ProgressModalProps {
  open: boolean;
  value: number; // 0-100
  label?: string;
  onOpenChange?: (open: boolean) => void;
}

const ProgressModal: React.FC<ProgressModalProps> = ({ open, onOpenChange, value, label }) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogOverlay />
      <DialogContent className="flex flex-col items-center justify-center max-w-xl bg-transparent border-none shadow-none p-0">
        <DialogDescription className="sr-only">
          Progress indicator showing {value}% completion
        </DialogDescription>
        <CircularProgressWithLabel value={value} label={label} />
      </DialogContent>
    </Dialog>
  );
};

export default ProgressModal; 