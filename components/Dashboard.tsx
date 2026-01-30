
import React, { useState } from 'react';
import { MOCK_MEMBERS, MOCK_EVENTS } from '../constants';
import { Trophy, Users, Calendar, TrendingUp, Clock, MapPin, Printer, FileText, Download, ChevronDown, Table } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const data = [
  { name: 'Jan', avg: 18.2 },
  { name: 'Feb', avg: 17.8 },
  { name: 'Mar', avg: 17.5 },
  { name: 'Apr', avg: 17.2 },
  { name: 'May', avg: 16.9 },
];

const Dashboard: React.FC = () => {
  const [showPrintMenu, setShowPrintMenu] = useState(false);
  const nextEvent = MOCK_EVENTS.find(e => e.status === 'upcoming');
  const recentWinner = MOCK_EVENTS.find(e => e.status === 'completed')?.results?.[0];
  const winnerName = MOCK_MEMBERS.find(m => m.id === recentWinner?.memberId)?.name;

  // Calculate society handicap based only on members with 3+ rounds
  const qualifiedMembers = MOCK_MEMBERS.filter(m => m.roundsPlayed >= 3);
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
    const rows = MOCK_MEMBERS.map(m => [
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
      {/* Hidden Print Header */}
      <div className="print-header">
        <div className="flex items-center gap-4">
          <div className="bg-emerald-900 p-3 rounded-2xl">
            <Trophy className="w-8 h-8 text-emerald-400" />
          </div>
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
          <button 
            onClick={() => setShowPrintMenu(!showPrintMenu)}
            className="flex items-center gap-3 px-6 py-3 bg-slate-900 text-white font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/20 group active:scale-95"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            Export Center
            <ChevronDown className={`w-4 h-4 transition-transform ${showPrintMenu ? 'rotate-180' : ''}`} />
          </button>

          {showPrintMenu && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowPrintMenu(false)} />
              <div className="absolute right-0 mt-3 w-64 bg-white border border-slate-100 rounded-[2rem] shadow-2xl p-3 z-20 animate-in zoom-in-95 duration-200">
                <p className="px-4 py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 mb-1">Select Format</p>
                <button 
                  onClick={handlePrintPDF}
                  className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 transition-colors group"
                >
                  <div className="p-2 bg-emerald-100 rounded-xl group-hover:bg-emerald-200"><FileText className="w-4 h-4" /></div>
                  <div className="text-left">
                    <p className="text-xs font-black">Executive PDF</p>
                    <p className="text-[10px] font-medium opacity-60">Full visual report</p>
                  </div>
                </button>
                <button 
                  onClick={handleExportCSV}
                  className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl hover:bg-blue-50 text-slate-700 hover:text-blue-700 transition-colors group"
                >
                  <div className="p-2 bg-blue-100 rounded-xl group-hover:bg-blue-200"><Table className="w-4 h-4" /></div>
                  <div className="text-left">
                    <p className="text-xs font-black">Data Sheet (CSV)</p>
                    <p className="text-[10px] font-medium opacity-60">Raw society records</p>
                  </div>
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Top Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Members" 
          value={MOCK_MEMBERS.length.toString()} 
          icon={Users} 
          trend="+2 this month" 
          color="blue" 
        />
        <StatCard 
          title="Society Handicap" 
          value={societyHandicap} 
          icon={TrendingUp} 
          trend="-0.4 last month" 
          color="emerald" 
        />
        <StatCard 
          title="Upcoming Events" 
          value="4" 
          icon={Calendar} 
          trend="Next: 12 days" 
          color="amber" 
        />
        <StatCard 
          title="Total Rounds" 
          value="1,240" 
          icon={Trophy} 
          trend="+45 this season" 
          color="purple" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Handicap Trend Chart */}
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
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="colorAvg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                />
                <Area type="monotone" dataKey="avg" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorAvg)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Next Event Card */}
        {nextEvent && (
          <div className="bg-emerald-900 text-white p-8 rounded-3xl relative overflow-hidden flex flex-col justify-between shadow-xl avoid-break">
            <div className="absolute -right-8 -top-8 w-40 h-40 bg-emerald-800/50 rounded-full blur-2xl"></div>
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-6">
                <Calendar className="w-5 h-5 text-emerald-400" />
                <span className="text-emerald-300 font-semibold tracking-wider text-xs uppercase">Next Outing</span>
              </div>
              <h2 className="text-3xl font-bold mb-2 leading-tight">{nextEvent.title}</h2>
              <div className="flex items-center gap-2 text-emerald-100/80 mb-6">
                <MapPin className="w-4 h-4" />
                <span className="text-sm">{nextEvent.courseName}</span>
              </div>
              <div className="flex items-center gap-6">
                <div>
                  <p className="text-xs text-emerald-400 font-medium mb-1">Date</p>
                  <p className="text-sm font-bold">{nextEvent.date}</p>
                </div>
                <div>
                  <p className="text-xs text-emerald-400 font-medium mb-1">Registered</p>
                  <p className="text-sm font-bold">{nextEvent.participants.length} Members</p>
                </div>
              </div>
            </div>
            <button className="mt-8 bg-white text-emerald-900 font-bold py-3 px-6 rounded-xl hover:bg-emerald-50 transition-colors relative z-10 shadow-lg no-print">
              Manage Event
            </button>
          </div>
        )}
      </div>

      {/* Bottom Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 avoid-break">
          <h3 className="text-lg font-bold text-slate-800 mb-6">Recent Activity</h3>
          <div className="space-y-6">
            <ActivityItem 
              icon={Trophy} 
              title="New Tournament Result" 
              desc={`${winnerName} won the Winter Open 2023 with 38 points.`} 
              time="2 days ago" 
              color="emerald" 
            />
            <ActivityItem 
              icon={Users} 
              title="New Member Joined" 
              desc="David Beckham has joined the FairwayConnect Society." 
              time="1 week ago" 
              color="blue" 
            />
            <ActivityItem 
              icon={TrendingUp} 
              title="Handicap Update" 
              desc="Mike Ross dropped his handicap by 0.5 to 8.1." 
              time="2 weeks ago" 
              color="purple" 
            />
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 avoid-break">
          <h3 className="text-lg font-bold text-slate-800 mb-6">Top Performers (Stableford)</h3>
          <div className="space-y-4">
            {MOCK_MEMBERS.sort((a,b) => a.bestScore - b.bestScore).slice(0, 4).map((member, i) => (
              <div key={member.id} className="flex items-center justify-between p-3 rounded-2xl hover:bg-slate-50 transition-colors group">
                <div className="flex items-center gap-4">
                  <span className="text-sm font-bold text-slate-400 w-4">#{i+1}</span>
                  <img src={member.avatar} className="w-10 h-10 rounded-full border-2 border-white shadow-sm" alt={member.name} />
                  <div>
                    <p className="text-sm font-bold text-slate-800">{member.name}</p>
                    <p className="text-xs text-slate-500">
                      HCP: {member.roundsPlayed >= 3 ? member.handicap.toFixed(1) : "Pending"}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-emerald-600">{member.bestScore}</p>
                  <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Best Round</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon: Icon, trend, color }: any) => {
  const colorMap: any = {
    blue: 'bg-blue-50 text-blue-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600',
    purple: 'bg-purple-50 text-purple-600',
  };

  return (
    <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 transition-all hover:shadow-md">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-2xl ${colorMap[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
        <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">
          {trend}
        </span>
      </div>
      <p className="text-slate-500 text-sm font-medium mb-1">{title}</p>
      <p className="text-2xl font-bold text-slate-800">{value}</p>
    </div>
  );
};

const ActivityItem = ({ icon: Icon, title, desc, time, color }: any) => {
  const colorMap: any = {
    emerald: 'bg-emerald-100 text-emerald-600',
    blue: 'bg-blue-100 text-blue-600',
    purple: 'bg-purple-100 text-purple-600',
  };

  return (
    <div className="flex gap-4">
      <div className={`mt-1 p-2 rounded-xl h-fit ${colorMap[color]}`}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex-1">
        <div className="flex items-center justify-between mb-1">
          <p className="text-sm font-bold text-slate-800">{title}</p>
          <span className="text-[10px] text-slate-400 flex items-center gap-1 font-medium">
            <Clock className="w-3 h-3" />
            {time}
          </span>
        </div>
        <p className="text-sm text-slate-600 leading-relaxed">{desc}</p>
      </div>
    </div>
  );
};

export default Dashboard;
