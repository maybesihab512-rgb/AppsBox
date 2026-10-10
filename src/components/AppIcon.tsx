import React, { useState } from 'react';
import { 
  Shield, 
  Terminal, 
  Zap, 
  Headphones, 
  Layers, 
  Cpu, 
  Database, 
  Camera, 
  Compass, 
  LucideIcon 
} from 'lucide-react';

interface AppIconProps {
  iconName: string;
  iconBg?: string;
  className?: string;
  size?: number;
}

const iconMap: Record<string, LucideIcon> = {
  Shield,
  Terminal,
  Zap,
  Headphones,
  Layers,
  Cpu,
  Database,
  Camera,
  Compass,
};

export const AppIcon: React.FC<AppIconProps> = ({
  iconName,
  iconBg = 'from-red-600 to-rose-950',
  className = 'w-12 h-12',
  size = 22,
}) => {
  const [imgError, setImgError] = useState(false);
  const isCustomUrl = iconName && (iconName.startsWith('/uploads/') || iconName.startsWith('http://') || iconName.startsWith('https://') || iconName.startsWith('data:'));

  if (isCustomUrl && !imgError) {
    return (
      <div
        className={`relative flex items-center justify-center rounded-xl bg-zinc-900 border border-red-500/30 shadow-md shadow-red-950/40 shrink-0 overflow-hidden ${className}`}
      >
        <img
          src={iconName}
          alt="App Icon"
          onError={() => setImgError(true)}
          className="w-full h-full object-cover"
        />
      </div>
    );
  }

  const IconComponent = iconMap[iconName] || Shield;

  return (
    <div
      className={`relative flex items-center justify-center rounded-xl bg-gradient-to-br ${iconBg} border border-red-500/20 shadow-md shadow-red-950/40 shrink-0 overflow-hidden ${className}`}
    >
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent pointer-events-none" />
      <div className="absolute -bottom-2 -right-2 w-6 h-6 bg-red-500/20 rounded-full blur-sm pointer-events-none" />
      <IconComponent size={size} className="text-white relative z-10 transition-transform duration-300 group-hover:scale-105" />
    </div>
  );
};
