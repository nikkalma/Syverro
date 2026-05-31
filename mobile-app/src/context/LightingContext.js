// mobile-app/src/context/LightingContext.js
import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useTheme } from '../context/ThemeContext';

const LightingContext = createContext();

export const useLighting = () => useContext(LightingContext);

export const LightingProvider = ({ children }) => {
  const { themeMode } = useTheme();
  const [orbPosition, setOrbPosition] = useState({ x: 0.8, y: 0.2 }); // относительные координаты (0-1)
  const [ambientTint, setAmbientTint] = useState(null);
  const [lightIntensity, setLightIntensity] = useState(0.6);
  
  // Анимация орба (микро-дрейф)
  const orbDrift = useRef({ x: 0, y: 0 });
  
  useEffect(() => {
    // Медленный дрейф орба (атмосферное движение)
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
  
  // Ambient tint зависит от темы
  useEffect(() => {
    if (themeMode === 'dark') {
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
  }, [themeMode]);
  
  return (
    <LightingContext.Provider
      value={{
        orbPosition,
        ambientTint,
        lightIntensity,
        themeMode,
      }}
    >
      {children}
    </LightingContext.Provider>
  );
};