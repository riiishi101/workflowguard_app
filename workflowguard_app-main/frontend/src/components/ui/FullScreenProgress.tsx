import React from "react";
import CircularProgressWithLabel from "@/components/ui/CircularProgressWithLabel";

interface FullScreenProgressProps {
  value: number;
  label?: string;
}

const FullScreenProgress: React.FC<FullScreenProgressProps> = ({ value, label }) => (
  <div className="fixed inset-0 flex items-center justify-center bg-white z-[9999]">
    <CircularProgressWithLabel value={value} label={label} />
  </div>
);

export default FullScreenProgress; 