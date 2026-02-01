import React from 'react';
import { ViewState } from '../types';
import { Trophy, Users, Calendar, MapPin, LayoutDashboard, Menu, X, Flag } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  currentView: ViewState;
  setView: (view: ViewState) => void;
}

const Layout: React.FC<LayoutProps> = ({ children, currentView, setView }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  const NavItem = ({ view, icon: Icon, label }: { view: ViewState; icon: any; label: string }) => (
    <button
      onClick={() => {
        setView(view);
        setIsMobileMenuOpen(false);
      }}
      className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors w-full ${
        currentView === view
          ? 'bg-emerald-100 text-emerald-800 font-semibold'
          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
      }`}
    >
      <Icon size={20} />
      <span>{label}</span>
    </button>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      {/* Mobile Header */}
      <div className="md:hidden bg-white border-b border-gray-200 p-4 flex justify-between items-center sticky top-0 z-20">
        <div className="flex items-center space-x-2 text-emerald-700 font-bold text-xl">
          <Trophy size={24} />
          <span>Fairway Society</span>
        </div>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 text-gray-600">
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Sidebar Navigation */}
      <aside
        className={`fixed inset-y-0 left-0 z-10 w-64 bg-white border-r border-gray-200 transform transition-transform duration-200 ease-in-out md:translate-x-0 md:relative md:block ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-6 border-b border-gray-100 hidden md:flex items-center space-x-2 text-emerald-700 font-bold text-2xl">
          <Trophy size={28} />
          <span>Fairway</span>
        </div>
        
        <nav className="p-4 space-y-2">
          <NavItem view="DASHBOARD" icon={LayoutDashboard} label="Dashboard" />
          <NavItem view="SEASONS" icon={Flag} label="Seasons" />
          <NavItem view="TOURNAMENTS" icon={Calendar} label="Tournaments" />
          <NavItem view="MEMBERS" icon={Users} label="Members" />
          <NavItem view="LEAGUE" icon={Trophy} label="Global League" />
          <NavItem view="COURSES" icon={MapPin} label="Course Finder" />
        </nav>

        <div className="absolute bottom-0 w-full p-6 border-t border-gray-100">
          <div className="text-xs text-gray-400">
            v2.0.0 &bull; Built with Gemini
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto h-[calc(100vh-60px)] md:h-screen">
        {/* Header Image */}
        <div className="relative h-48 md:h-64 bg-gray-900">
          <img 
            src="https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?auto=format&fit=crop&q=80&w=2000" 
            alt="Golf Course" 
            className="w-full h-full object-cover opacity-60"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 to-transparent flex items-end">
            <div className="p-6 md:p-8 max-w-6xl mx-auto w-full">
               <h1 className="text-white text-3xl md:text-4xl font-bold shadow-sm">Fairway Society Manager</h1>
               <p className="text-emerald-200 font-medium">Professional Management for Amateur Golf</p>
            </div>
          </div>
        </div>

        <div className="p-4 md:p-8 max-w-6xl mx-auto -mt-8 relative z-0">
          {children}
        </div>
      </main>

      {/* Overlay for mobile menu */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-0 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </div>
  );
};

export default Layout;
