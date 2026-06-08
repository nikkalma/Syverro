// src/context/LightingContext.tsx
import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { useTheme } from './ThemeContext';

interface OrbPosition {
  x: number;
  y: number;
}

interface AmbientTint {
  color: string;
  blend: string;
}

interface LightingContextType {
  orbPosition: OrbPosition;
  ambientTint: AmbientTint | null;
  lightIntensity: number;
  themeMode: string;
}

const LightingContext = createContext<LightingContextType | undefined>(undefined);

export const useLighting = (): LightingContextType => {
  const context = useContext(LightingContext);
  if (!context) {
    throw new Error('useLighting must be used within a LightingProvider');
  }
  return context;
};

export const LightingProvider = ({ children }: { children: ReactNode }) => {
  const { mode } = useTheme();
  const [orbPosition, setOrbPosition] = useState<OrbPosition>({ x: 0.8, y: 0.2 });
  const [ambientTint, setAmbientTint] = useState<AmbientTint | null>(null);
  const [lightIntensity, setLightIntensity] = useState<number>(0.6);
  
  const orbDrift = useRef({ x: 0, y: 0 });
  
  useEffect(() => {
    const interval = setInterval(() => {
      orbDrift.current = {
        x: Math.sin(Date.now() / 15000) * 0.03,
        y: Math.cos(Date.now() / 18000) * 0.02,
      };
      setOrbPosition({
        x: 0.8 + orbDrift.current.x,
        y: 0.2 + orbDrift.current.y,
      });
    }, 100);
    
    return () => clearInterval(interval);
  }, []);
  
  useEffect(() => {
    if (mode === 'dark') {
      setAmbientTint({
        color: 'rgba(28, 40, 58, 0.15)',
        blend: 'overlay',
      });
      setLightIntensity(0.5);
    } else {
      setAmbientTint({
        color: 'rgba(176, 162, 144, 0.12)',
        blend: 'soft-light',
      });
      setLightIntensity(0.35);
    }
  }, [mode]);
  
  return (
    <LightingContext.Provider
      value={{
        orbPosition,
        ambientTint,
        lightIntensity,
        themeMode: mode,
      }}
    >
      {children}
    </LightingContext.Provider>
  );
};