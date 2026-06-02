// mobile-app/src/context/LightingContext.js
import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useTheme } from './ThemeContext';  // ← ИСПРАВЛЕНО (было ../context/ThemeContext)

const LightingContext = createContext();

export const useLighting = () => useContext(LightingContext);

export const LightingProvider = ({ children }) => {
  const { mode } = useTheme();  // ← ИСПРАВЛЕНО (themeMode → mode)
  const [orbPosition, setOrbPosition] = useState({ x: 0.8, y: 0.2 });
  const [ambientTint, setAmbientTint] = useState(null);
  const [lightIntensity, setLightIntensity] = useState(0.6);
  
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