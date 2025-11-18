import React from 'react';
import { Outlet } from 'react-router-dom';

// Layout pulito per CLIENT - NESSUNA SIDEBAR, solo background e contenuto
export default function SimpleLayout() {
  return (
    <div className="min-h-screen overflow-x-hidden w-full">
      <div className="relative min-h-screen flex flex-col">
        {/* Background statico identico a MainLayout - compatibile iOS */}
        <div className="starry-background"></div>
        
        {/* Contenuto senza sidebar */}
        <div className="relative z-10 w-full">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
