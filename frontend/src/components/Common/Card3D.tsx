import React from 'react';

interface Card3DProps {
  children: React.ReactNode;
  className?: string;
  depth?: number;
  glare?: boolean;
  onClick?: () => void;
}

export const Card3D: React.FC<Card3DProps> = ({
  children,
  className = '',
  onClick,
}) => {
  return (
    <div
      onClick={onClick}
      className={`relative rounded-lg bg-[#111827] border border-slate-800 hover:border-slate-700 transition-all duration-150 shadow-sm hover:shadow-md ${
        onClick ? 'cursor-pointer' : ''
      } ${className}`}
    >
      <div className="h-full w-full">
        {children}
      </div>
    </div>
  );
};
