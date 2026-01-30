
import React from 'react';
import { CourseSpecs } from '../types';
import { 
  Flag, 
  Ruler, 
  TrendingUp, 
  Target, 
  Info, 
  Sparkles, 
  MapPin, 
  Trophy, 
  Zap, 
  Flame, 
  Compass,
  Crown,
  ShieldCheck,
  ChevronRight,
  ListOrdered,
  Users2,
  TrendingDown
} from 'lucide-react';

interface CourseSpecsDisplayProps {
  name: string;
  address?: string;
  specs: CourseSpecs;
  onClose?: () => void;
}

const CourseSpecsDisplay: React.FC<CourseSpecsDisplayProps> = ({ name, address, specs, onClose }) => {
  const getDifficultyTheme = (difficulty: string) => {
    switch (difficulty) {
      case 'Elite':
        return {
          bg: 'bg-slate-950',
          accent: 'text-amber-400',
          badge: 'bg-amber-400 text-amber-950',
          icon: Crown,
          gradient: 'from-amber-500/20 to-transparent',
          label: 'Masterclass Venue'
        };
      case 'Challenging':
        return {
          bg: 'bg-rose-950',
          accent: 'text-rose-400',
          badge: 'bg-rose-500 text-white',
          icon: Flame,
          gradient: 'from-rose-500/20 to-transparent',
          label: 'High Difficulty'
        };
      case 'Moderate':
        return {
          bg: 'bg-blue-950',
          accent: 'text-blue-400',
          badge: 'bg-blue-500 text-white',
          icon: Compass,
          gradient: 'from-blue-500/20 to-transparent',
          label: 'Standard Test'
        };
      case 'Easy':
      default:
        return {
          bg: 'bg-emerald-950',
          accent: 'text-emerald-400',
          badge: 'bg-emerald-500 text-white',
          icon: ShieldCheck,
          gradient: 'from-emerald-500/20 to-transparent',
          label: 'Beginner Friendly'
        };
    }
  };

  const theme = getDifficultyTheme(specs.difficulty);
  const DifficultyIcon = theme.icon;

  // Helper to chunk holes for Front 9 / Back 9
  const frontNine = specs.holePars.slice(0, 9);
  const backNine = specs.holePars.slice(9, 18);
  const frontTotal = frontNine.reduce((a, b) => a + b, 0);
  const backTotal = backNine.reduce((a, b) => a + b, 0);

  return (
    <div className="bg-white rounded-[2.5rem] overflow-hidden shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-500">
      {/* Dynamic Header */}
      <div className={`${theme.bg} p-10 text-white relative overflow-hidden transition-colors duration-500`}>
        <div className={`absolute inset-0 bg-gradient-to-br ${theme.gradient} opacity-50`}></div>
        <div className="absolute right-0 top-0 p-10 opacity-10 pointer-events-none">
          <DifficultyIcon className="w-32 h-32 rotate-12" />
        </div>
        
        <div className="relative z-10">
          <div className="flex flex-wrap items-center gap-3 mb-6">
            <div className={`px-4 py-1.5 rounded-full text-[11px] font-black uppercase tracking-[0.2em] shadow-lg flex items-center gap-2 ${theme.badge}`}>
              <DifficultyIcon className="w-3.5 h-3.5" />
              {specs.difficulty} Level
            </div>
            <div className="px-4 py-1.5 rounded-full text-[11px] font-black uppercase tracking-[0.2em] bg-white/10 backdrop-blur-md text-white border border-white/10">
              {theme.label}
            </div>
          </div>
          
          <h2 className="text-4xl sm:text-5xl font-black mb-3 leading-tight tracking-tight">{name}</h2>
          
          {address && (
            <div className="flex items-center gap-2 text-white/60 text-base font-medium">
              <MapPin className="w-4 h-4 text-emerald-400" />
              {address}
            </div>
          )}
        </div>
      </div>

      {/* Hero Difficulty Meter */}
      <div className="px-10 py-6 bg-slate-50 border-b border-slate-100">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Difficulty Profile</span>
          <span className={`text-[10px] font-black uppercase tracking-widest ${theme.accent}`}>{specs.difficulty} Status</span>
        </div>
        <div className="h-2 w-full bg-slate-200 rounded-full flex overflow-hidden">
          <div className={`h-full transition-all duration-1000 ease-out ${specs.difficulty === 'Easy' ? 'w-1/4 bg-emerald-500' : 'w-1/4 bg-emerald-200'}`}></div>
          <div className={`h-full transition-all duration-1000 ease-out delay-100 ${specs.difficulty === 'Moderate' ? 'w-1/4 bg-blue-500' : specs.difficulty === 'Easy' ? 'w-1/4 bg-slate-200' : 'w-1/4 bg-blue-200'}`}></div>
          <div className={`h-full transition-all duration-1000 ease-out delay-200 ${specs.difficulty === 'Challenging' ? 'w-1/4 bg-rose-500' : (specs.difficulty === 'Elite') ? 'w-1/4 bg-rose-200' : 'w-1/4 bg-slate-200'}`}></div>
          <div className={`h-full transition-all duration-1000 ease-out delay-300 ${specs.difficulty === 'Elite' ? 'w-1/4 bg-amber-500' : 'w-1/4 bg-slate-200'}`}></div>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="p-10 grid grid-cols-2 sm:grid-cols-4 gap-6 bg-white">
        <StatItem icon={Flag} label="Total Par" value={specs.par.toString()} themeColor={theme.accent} />
        <StatItem icon={Ruler} label="Total Yards" value={specs.length} themeColor={theme.accent} />
        <StatItem icon={TrendingUp} label="Men's Slope" value={specs.menSlope.toString()} themeColor={theme.accent} />
        <StatItem icon={Target} label="Men's Rating" value={specs.menRating.toFixed(1)} themeColor={theme.accent} />
      </div>

      {/* Gender Specific Rating Analysis Section */}
      <div className="px-10 pb-8">
        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
          <Users2 className="w-4 h-4" />
          WHS Rating Analysis
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Men's Card */}
          <div className="bg-blue-50/50 rounded-3xl p-6 border border-blue-100 relative group transition-all hover:bg-white hover:shadow-xl">
             <div className="absolute top-4 right-4 p-2 bg-blue-100 rounded-xl text-blue-600">
               <span className="text-[10px] font-black uppercase">Men</span>
             </div>
             <div className="flex items-center gap-4 mb-6">
               <div className="p-3 bg-white rounded-2xl shadow-sm text-blue-600">
                 <Flag className="w-6 h-6" />
               </div>
               <div>
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Standard Tees</p>
                 <h4 className="text-lg font-black text-slate-800">Men's Rating</h4>
               </div>
             </div>
             <div className="grid grid-cols-2 gap-4">
               <div className="bg-white rounded-2xl p-4 border border-blue-100/50">
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter mb-1">Course Rating</p>
                 <p className="text-2xl font-black text-blue-600">{specs.menRating.toFixed(1)}</p>
               </div>
               <div className="bg-white rounded-2xl p-4 border border-blue-100/50">
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter mb-1">Slope Rating</p>
                 <p className="text-2xl font-black text-blue-600">{specs.menSlope}</p>
               </div>
             </div>
          </div>

          {/* Women's Card */}
          <div className="bg-rose-50/50 rounded-3xl p-6 border border-rose-100 relative group transition-all hover:bg-white hover:shadow-xl">
             <div className="absolute top-4 right-4 p-2 bg-rose-100 rounded-xl text-rose-600">
               <span className="text-[10px] font-black uppercase">Women</span>
             </div>
             <div className="flex items-center gap-4 mb-6">
               <div className="p-3 bg-white rounded-2xl shadow-sm text-rose-600">
                 <Flag className="w-6 h-6" />
               </div>
               <div>
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Standard Tees</p>
                 <h4 className="text-lg font-black text-slate-800">Women's Rating</h4>
               </div>
             </div>
             <div className="grid grid-cols-2 gap-4">
               <div className="bg-white rounded-2xl p-4 border border-rose-100/50">
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter mb-1">Course Rating</p>
                 <p className="text-2xl font-black text-rose-600">{specs.womenRating.toFixed(1)}</p>
               </div>
               <div className="bg-white rounded-2xl p-4 border border-rose-100/50">
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter mb-1">Slope Rating</p>
                 <p className="text-2xl font-black text-rose-600">{specs.womenSlope}</p>
               </div>
             </div>
          </div>
        </div>
      </div>

      {/* Structured Scorecard Section */}
      <div className="px-10 pb-8">
        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
          <ListOrdered className="w-4 h-4" />
          Hole-by-Hole Scorecard
        </h3>
        
        <div className="space-y-4">
          {/* Front 9 Row */}
          <div className="bg-slate-50/50 rounded-3xl p-1 border border-slate-100">
            <div className="flex items-stretch gap-1.5 p-1.5 overflow-x-auto custom-scrollbar scrollbar-hide">
              <div className="flex flex-col items-center justify-center bg-slate-200/50 rounded-2xl p-3 min-w-[70px]">
                <span className="text-[9px] font-black text-slate-500 uppercase">Front</span>
              </div>
              {frontNine.map((par, index) => (
                <div key={index} className="flex-1 flex flex-col items-center bg-white border border-slate-100 rounded-2xl p-3 min-w-[50px] transition-all hover:shadow-lg hover:border-emerald-200 group">
                  <span className="text-[9px] font-black text-slate-400 mb-1 group-hover:text-emerald-400">{index + 1}</span>
                  <span className="text-xl font-black text-slate-800 group-hover:scale-110 transition-transform">{par}</span>
                </div>
              ))}
              <div className="flex flex-col items-center justify-center bg-emerald-100/50 border border-emerald-200 rounded-2xl p-3 min-w-[60px] shadow-sm">
                <span className="text-[9px] font-black text-emerald-600 uppercase mb-1">Out</span>
                <span className="text-xl font-black text-emerald-700">{frontTotal}</span>
              </div>
            </div>
          </div>

          {/* Back 9 Row (Only if 18 holes) */}
          {specs.holePars.length > 9 && (
            <div className="bg-slate-50/50 rounded-3xl p-1 border border-slate-100">
              <div className="flex items-stretch gap-1.5 p-1.5 overflow-x-auto custom-scrollbar scrollbar-hide">
                <div className="flex flex-col items-center justify-center bg-slate-200/50 rounded-2xl p-3 min-w-[70px]">
                  <span className="text-[9px] font-black text-slate-500 uppercase">Back</span>
                </div>
                {backNine.map((par, index) => (
                  <div key={index + 9} className="flex-1 flex flex-col items-center bg-white border border-slate-100 rounded-2xl p-3 min-w-[50px] transition-all hover:shadow-lg hover:border-emerald-200 group">
                    <span className="text-[9px] font-black text-slate-400 mb-1 group-hover:text-emerald-400">{index + 10}</span>
                    <span className="text-xl font-black text-slate-800 group-hover:scale-110 transition-transform">{par}</span>
                  </div>
                ))}
                <div className="flex flex-col items-center justify-center bg-emerald-100/50 border border-emerald-200 rounded-2xl p-3 min-w-[60px] shadow-sm">
                  <span className="text-[9px] font-black text-emerald-600 uppercase mb-1">In</span>
                  <span className="text-xl font-black text-emerald-700">{backTotal}</span>
                </div>
              </div>
            </div>
          )}

          {/* Overall Course Par Summary */}
          <div className="flex items-center justify-between px-6 py-4 bg-emerald-900 rounded-[1.5rem] shadow-xl shadow-emerald-900/10">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-500 rounded-xl">
                <Trophy className="w-4 h-4 text-white" />
              </div>
              <span className="text-sm font-black text-emerald-100 uppercase tracking-widest">Tournament Total</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-xs font-bold text-emerald-400">Total Par</span>
              <span className="text-3xl font-black text-white">{specs.par}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Description & Intelligence */}
      <div className="px-10 pb-10 space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          <div>
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Info className="w-4 h-4" />
              Course Intelligence
            </h3>
            <p className="text-slate-600 text-base leading-relaxed font-medium">
              {specs.description}
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              Pro Insights
            </h3>
            <div className="bg-slate-50 rounded-[2rem] p-8 border border-slate-100 relative group transition-all hover:border-emerald-200 hover:bg-emerald-50/30">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-white rounded-xl shadow-sm">
                  <Trophy className="w-5 h-5 text-emerald-600" />
                </div>
                <h4 className="text-sm font-black text-slate-800 uppercase tracking-wider">The Signature Hole</h4>
              </div>
              <p className="text-slate-700 font-bold leading-relaxed italic">
                "{specs.notableHole}"
              </p>
            </div>
          </div>
        </div>

        {onClose && (
          <div className="pt-6 border-t border-slate-100">
            <button 
              onClick={onClose}
              className="w-full py-5 bg-slate-900 text-white font-black rounded-2xl shadow-2xl shadow-slate-900/20 hover:bg-slate-800 transition-all active:scale-[0.98] flex items-center justify-center gap-3 group"
            >
              Return to Scouts
              <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

const StatItem = ({ icon: Icon, label, value, themeColor }: { icon: any, label: string, value: string, themeColor: string }) => (
  <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 flex flex-col items-center text-center shadow-sm group hover:bg-white hover:shadow-xl transition-all duration-300">
    <div className={`w-12 h-12 rounded-2xl bg-white flex items-center justify-center mb-4 shadow-sm group-hover:scale-110 transition-transform ${themeColor}`}>
      <Icon className="w-6 h-6" />
    </div>
    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1.5">{label}</p>
    <p className="text-xl font-black text-slate-800">{value}</p>
  </div>
);

export default CourseSpecsDisplay;
