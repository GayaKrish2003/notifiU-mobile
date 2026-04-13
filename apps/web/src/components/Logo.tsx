import React from 'react';

interface LogoProps {
  className?: string;
}

const Logo: React.FC<LogoProps> = ({ className = "" }) => {
  return (
    <div className={`flex items-center justify-center font-bold text-4xl tracking-tight ${className}`}>
      <span className="text-[#2D3A5D]">notifi</span>
      <span className="text-[#FBB017]">U</span>
    </div>
  );
};

export default Logo;
