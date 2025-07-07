import React from "react";

interface Props {
  value: number; // 0-100
  label?: string;
}

const size = 240;
const strokeWidth = 6;
const radius = (size - strokeWidth) / 2;
const circumference = 2 * Math.PI * radius;

const CircularProgressWithLabel: React.FC<Props> = ({ value, label }) => {
  const progress = Math.min(Math.max(value, 0), 100);
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className="flex flex-col items-center justify-center">
      <svg width={size} height={size} className="mb-4">
        <circle
          stroke="#e0eaff"
          fill="transparent"
          strokeWidth={strokeWidth}
          cx={size / 2}
          cy={size / 2}
          r={radius}
        />
        <circle
          stroke="#4094ff"
          fill="transparent"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          cx={size / 2}
          cy={size / 2}
          r={radius}
          style={{ transition: "stroke-dashoffset 0.5s" }}
        />
        <text
          x="50%"
          y="50%"
          textAnchor="middle"
          dy=".3em"
          fontSize="48"
          fill="#4094ff"
          fontWeight="bold"
        >
          {progress}%
        </text>
      </svg>
      {label && (
        <div className="text-2xl text-[#4094ff] font-medium mt-2">{label}</div>
      )}
    </div>
  );
};

export default CircularProgressWithLabel; 