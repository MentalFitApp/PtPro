import React from 'react';
import { Outlet } from 'react-router-dom';

export default function ClientLayout() { 
  try {
    return (
      <div className="overflow-x-hidden w-full min-h-screen">
        <div className="relative min-h-screen flex flex-col">
          {/* Background statico identico a MainLayout/Dashboard - compatibile iOS */}
          <div className="starry-background"></div>
          <Outlet />
        </div>
      </div>
    );
  } catch (error) {
    console.error('Errore in ClientLayout:', error);
    return <div className="min-h-screen bg-slate-900 text-red-400 flex justify-center items-center">Errore di caricamento: {error.message}</div>;
  }
}