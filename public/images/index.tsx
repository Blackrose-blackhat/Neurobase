
import Image from 'next/image';
import React from 'react';

interface LogoProps {
  width?: number;
  height?: number;
  alt?: string;
  className?: string; 
}

export const Logo: React.FC<LogoProps> = ({ 
  width = 32, 
  height = 32, 
  alt = "Application Logo", 
  className 
}) => {
  return (
    <Image 
      src="/images/icon.png" 
      alt={alt} 
      width={width} 
      height={height} 
      className={className}
      
    />
  );
};



export default Logo;

