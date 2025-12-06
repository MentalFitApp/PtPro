import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Menu } from 'lucide-react';
import UnifiedSidebar from './UnifiedSidebar';
import { colors } from '../../config/designSystem';

export const UnifiedLayout = ({ 
  children, 
  role = 'admin',
  userName = 'User',
  userEmail = ''
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className={`min-h-screen ${colors.bg.primary}`}>
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <UnifiedSidebar 
          role={role}
          userName={userName}
          userEmail={userEmail}
        />
      </div>

      {/* Mobile Sidebar */}
      {sidebarOpen && (
        <UnifiedSidebar 
          role={role}
          userName={userName}
          userEmail={userEmail}
          onClose={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="lg:pl-72">
        {/* Mobile Header */}
        <div className="lg:hidden sticky top-0 z-30 bg-slate-900/95 backdrop-blur-xl border-b border-slate-700/50 p-4">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg hover:bg-slate-800/50 transition-colors"
          >
            <Menu size={24} className="text-slate-400" />
          </button>
        </div>

        {/* Page Content */}
        <motion.main 
          className="min-h-screen p-3 sm:p-4 md:p-5 lg:p-6 xl:p-8 bg-slate-900/40 backdrop-blur-xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {children}
        </motion.main>
      </div>
    </div>
  );
};

export default UnifiedLayout;
