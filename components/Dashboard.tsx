
import React, { useState } from 'react';
import { Event, Member } from '../types';
import { Trophy, Users, Calendar, TrendingUp, Clock, MapPin, FileText, Download, ChevronDown, Table } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const StatCard = ({ title, value, icon: Icon, trend, color }: any) => {
  const colorClasses: any = {
    blue: 'text-blue-600 bg-blue-50',
    emerald: 'text-emerald-600 bg-emerald-50',
    amber: 'text-amber-600 bg-amber-50',
    purple: 'text-purple-600 bg-purple-50',
  };
  return (
    <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-4">
      <div className={`p-3 rounded-2xl ${colorClasses[color] || 'text-slate-600 bg-slate-50'}`}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{title}</p>
        <div className="flex items-baseline gap-2">
          <h4 className="text-2xl font-black text-slate-900 tracking-tighter">{value}</h4>
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">{trend}</span>
        </div>
      </div>
    </div>
  );
};

const chartData = [
  { name: 'Jan', avg: 18.2 },
  { name: 'Feb', avg: 17.8 },
  { name: 'Mar', avg: 17.5 },
  { name: 'Apr', avg: 17.2 },
  { name: 'May', avg: 16.9 },
  { name: 'Jun', avg: 16.5 },
];

interface DashboardProps {
  events: Event[];
  members: Member[];
  onManageEvent?: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ events, members, onManageEvent }) => {
  const [showPrintMenu, setShowPrintMenu] = useState(false);
  
  const nextEvent = events.find(e => e.status === 'upcoming');
  const recentWinnerData = events.find(e => e.status === 'completed')?.results?.[0];
  const winnerName = recentWinnerData ? members.find(m => m.id === recentWinnerData.memberId)?.name : null;

  const qualifiedMembers = members.filter(m => m.roundsPlayed >= 3);
  const societyHandicap = qualifiedMembers.length > 0 
    ? (qualifiedMembers.reduce((acc, m) => acc + m.handicap, 0) / qualifiedMembers.length).toFixed(1)
    : "---";

  const handlePrintPDF = () => {
    setShowPrintMenu(false);
    window.print();
  };

  const handleExportCSV = () => {
    setShowPrintMenu(false);
    const headers = ["Name", "Handicap", "Rounds Played", "Best Score", "Joined Date"];
    const rows = members.map(m => [
      m.name,
      m.roundsPlayed >= 3 ? m.handicap.toString() : "Pending",
      m.roundsPlayed.toString(),
      m.bestScore.toString(),
      m.joinedDate
    ]);
    
    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `society_summary_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 printable-area">
      <div className="print-header hidden print:flex items-center justify-between mb-8 pb-8 border-b-2 border-slate-100">
        <div className="flex items-center gap-4">
          <div className="bg-emerald-900 p-3 rounded-2xl"><Trophy className="w-8 h-8 text-emerald-400" /></div>
          <div>
            <h1 className="text-2xl font-black uppercase text-slate-900 tracking-tight">FairwayConnect Official Summary</h1>
            <p className="text-sm font-bold text-emerald-700 tracking-widest uppercase">Executive Administration Report</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs font-black text-slate-400 uppercase">Generated On</p>
          <p className="text-sm font-bold text-slate-900">{new Date().toLocaleDateString('en-GB', { dateStyle: 'full' })}</p>
        </div>
      </div>

      <div className="flex items-center justify-between no-print">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Executive Dashboard</h2>
          <p className="text-sm text-slate-500">Real-time society performance overview</p>
        </div>
        <div className="relative">
          <button onClick={() => setShowPrintMenu(!showPrintMenu)} className="flex items-center gap-3 px-6 py-3 bg-slate-900 text-white font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/20 group active:scale-95">
            <Download className="w-4 h-4 text-emerald-400" />
            Export Center
            <ChevronDown className={`w-4 h-4 transition-transform ${showPrintMenu ? 'rotate-180' : ''}`} />
          </button>
          {showPrintMenu && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowPrintMenu(false)} />
              <div className="absolute right-0 mt-3 w-64 bg-white border border-slate-100 rounded-[2rem] shadow-2xl p-3 z-20 animate-in zoom-in-95 duration-200">
                <p className="px-4 py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 mb-1">Select Format</p>
                <button onClick={handlePrintPDF} className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 transition-colors group">
                  <div className="p-2 bg-emerald-100 rounded-xl group-hover:bg-emerald-200"><FileText className="w-4 h-4" /></div>
                  <div className="text-left"><p className="text-xs font-black">Executive PDF</p><p className="text-[10px] font-medium opacity-60">Full visual report</p></div>
                </button>
                <button onClick={handleExportCSV} className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl hover:bg-blue-50 text-slate-700 hover:text-blue-700 transition-colors group">
                  <div className="p-2 bg-blue-100 rounded-xl group-hover:bg-blue-200"><Table className="w-4 h-4" /></div>
                  <div className="text-left"><p className="text-xs font-black">Data Sheet (CSV)</p><p className="text-[10px] font-medium opacity-60">Raw society records</p></div>
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Members" value={members.length.toString()} icon={Users} trend="Active Roster" color="blue" />
        <StatCard title="Society Handicap" value={societyHandicap} icon={TrendingUp} trend="Qualified Avg" color="emerald" />
        <StatCard title="Upcoming Events" value={events.filter(e => e.status === 'upcoming').length.toString()} icon={Calendar} trend="Scheduled" color="amber" />
        <StatCard title="Total Rounds" value={(members.reduce((acc, m) => acc + m.roundsPlayed, 0)).toString()} icon={Trophy} trend="Lifetime" color="purple" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl shadow-sm border border-slate-100 avoid-break">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-slate-800">Society Handicap Trend</h3>
            <select className="bg-slate-50 border-none text-sm font-medium rounded-lg px-3 py-1 text-slate-600 outline-none no-print">
              <option>Last 6 Months</option>
              <option>Year to Date</option>
            </select>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs><linearGradient id="colorAvg" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/><stop offset="95%" stopColor="#10b981" stopOpacity={0}/></linearGradient></defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                <Area type="monotone" dataKey="avg" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorAvg)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {nextEvent && (
          <div className="bg-emerald-900 text-white p-8 rounded-3xl relative overflow-hidden flex flex-col justify-between shadow-xl avoid-break">
            <div className="absolute -right-8 -top-8 w-40 h-40 bg-emerald-800/50 rounded-full blur-2xl"></div>
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-6"><Calendar className="w-5 h-5 text-emerald-400" /><span className="text-emerald-300 font-semibold tracking-wider text-xs uppercase">Next Outing</span></div>
              <h2 className="text-3xl font-bold mb-2 leading-tight">{nextEvent.title}</h2>
              <div className="space-y-3 mb-8">
                <div className="flex items-center gap-3 text-emerald-100 text-sm font-medium">
                  <MapPin className="w-4 h-4 text-emerald-400" />
                  {nextEvent.courseName}
                </div>
                <div className="flex items-center gap-3 text-emerald-100 text-sm font-medium">
                  <Clock className="w-4 h-4 text-emerald-400" />
                  {new Date(nextEvent.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                </div>
              </div>
              <button 
                onClick={onManageEvent}
                className="w-full py-4 bg-white text-emerald-900 font-black rounded-2xl shadow-xl hover:bg-emerald-50 transition-all flex items-center justify-center gap-2 active:scale-95"
              >
                Manage Entry
                <ChevronDown className="w-4 h-4 -rotate-90" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
