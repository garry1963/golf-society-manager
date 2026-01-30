
import React from 'react';
import { AppView } from '../types';
import { 
  LayoutDashboard, 
  Users, 
  Calendar, 
  BarChart3, 
  MessageSquareQuote,
  Trophy,
  LogOut,
  ChevronRight,
  Flag,
  Search,
  Bell
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  activeView: AppView;
  setActiveView: (view: AppView) => void;
}

const Layout: React.FC<LayoutProps> = ({ children, activeView, setActiveView }) => {
  const menuItems = [
    { view: AppView.DASHBOARD, label: 'Dashboard', icon: LayoutDashboard },
    { view: AppView.MEMBERS, label: 'Members', icon: Users },
    { view: AppView.SEASONS, label: 'Seasons', icon: Flag },
    { view: AppView.COURSES, label: 'Course Search', icon: Search },
    { view: AppView.EVENTS, label: 'Tournaments', icon: Calendar },
    { view: AppView.STATS, label: 'Society Stats', icon: BarChart3 },
    { view: AppView.AI_PRO, label: 'The Society Pro', icon: MessageSquareQuote },
  ];

  const activeLabel = menuItems.find(i => i.view === activeView)?.label;

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-64 bg-slate-900 text-white flex flex-col z-50 shadow-2xl">
        <div className="p-6 flex items-center gap-3">
          <div className="bg-emerald-500 p-2 rounded-lg shadow-lg shadow-emerald-500/20">
            <Trophy className="w-6 h-6 text-white" />
          </div>
          <span className="text-xl font-black tracking-tight uppercase">Fairway</span>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.view;
            return (
              <button
                key={item.view}
                onClick={() => setActiveView(item.view)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-300 group ${
                  isActive 
                  ? 'bg-emerald-600 text-white shadow-xl shadow-emerald-900/40 translate-x-1' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-800 hover:translate-x-1'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-5 h-5 transition-transform group-hover:scale-110" />
                  <span className="font-bold text-sm tracking-tight">{item.label}</span>
                </div>
                {isActive && <ChevronRight className="w-4 h-4 animate-in slide-in-from-left-2" />}
              </button>
            );
          })}
        </nav>

        <div className="p-6 border-t border-slate-800">
          <div className="flex items-center gap-3 mb-6 p-3 rounded-2xl bg-slate-800/40 border border-slate-700/50">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white font-black text-sm shadow-inner">
              JD
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-black truncate leading-none mb-1">Jane Doe</p>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Admin</p>
            </div>
          </div>
          <button className="flex items-center gap-2 text-slate-500 hover:text-rose-400 transition-colors w-full px-2 group">
            <LogOut className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span className="text-xs font-black uppercase tracking-widest">Log out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-64 flex-1 overflow-y-auto">
        <header className="h-40 relative sticky top-0 z-40 overflow-hidden shadow-lg no-print">
          {/* Background Golf Image */}
          <div className="absolute inset-0">
            <img 
              src="https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?auto=format&fit=crop&q=80&w=2070" 
              alt="Golf Course Header" 
              className="w-full h-full object-cover object-center scale-105 group-hover:scale-100 transition-transform duration-1000"
            />
            {/* Elegant Dark Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-900/60 to-transparent"></div>
          </div>

          <div className="relative h-full px-10 flex items-center justify-between text-white">
            <div className="animate-in fade-in slide-in-from-left-8 duration-700">
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-400 mb-1">Management Suite</p>
              <h1 className="text-4xl font-black tracking-tighter">
                {activeLabel}
              </h1>
            </div>

            <div className="flex items-center gap-6 animate-in fade-in slide-in-from-right-8 duration-700">
              <div className="hidden lg:flex flex-col items-end px-6 py-3 bg-white/10 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl">
                <div className="flex items-center gap-2 mb-1">
                  <Calendar className="w-3 h-3 text-emerald-400" />
                  <p className="text-[10px] text-white/60 font-black uppercase tracking-widest">Next Tournament</p>
                </div>
                <p className="text-sm font-black tracking-tight">Spring Classic • May 15</p>
              </div>
              
              <button className="p-3 bg-emerald-500 hover:bg-emerald-400 text-white rounded-2xl shadow-xl shadow-emerald-500/20 transition-all hover:scale-105 active:scale-95 group">
                <Bell className="w-5 h-5 group-hover:animate-bounce" />
              </button>
            </div>
          </div>
        </header>

        <div className="p-10 max-w-[1600px] mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
