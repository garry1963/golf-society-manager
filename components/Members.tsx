
import React, { useState, useMemo } from 'react';
import { MOCK_MEMBERS } from '../constants';
import { Member } from '../types';
import { 
  Search, 
  UserPlus, 
  Filter, 
  MoreVertical, 
  Mail, 
  ChevronLeft, 
  TrendingUp, 
  Compass, 
  Target, 
  Award,
  History,
  X,
  LineChart as LineIcon,
  Calculator,
  Calendar,
  CheckCircle2,
  ArrowUpRight,
  ArrowDownRight,
  Timer,
  // Added Info to fix line 414 error
  Info
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const Members: React.FC = () => {
  const [members, setMembers] = useState<Member[]>(MOCK_MEMBERS);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showScoreModal, setShowScoreModal] = useState(false);

  // Score Calculator State
  const [roundData, setRoundData] = useState({
    score: 85,
    rating: 72.0,
    slope: 113,
    date: new Date().toISOString().split('T')[0]
  });

  // New Member Form State
  const [newMember, setNewMember] = useState({
    name: '',
    handicap: 18,
    bestScore: 90,
    averageScore: 95,
    longestDrive: 220,
    gir: 25,
    joinedDate: new Date().toISOString().split('T')[0]
  });

  const filteredMembers = members.filter(m => 
    m.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedMember = members.find(m => m.id === selectedMemberId);

  // Derived calculation for current differential in modal
  const currentDifferential = useMemo(() => {
    return ((roundData.score - roundData.rating) * (113 / roundData.slope)).toFixed(1);
  }, [roundData]);

  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    const id = (members.length + 1).toString();
    const memberToAdd: Member = {
      ...newMember,
      id,
      avatar: `https://picsum.photos/seed/${id}/200`,
      roundsPlayed: 0,
      handicap: Number(newMember.handicap),
      bestScore: Number(newMember.bestScore),
      averageScore: Number(newMember.averageScore),
      longestDrive: Number(newMember.longestDrive),
      gir: Number(newMember.gir),
      handicapHistory: [
        { date: 'Initial', value: Number(newMember.handicap) }
      ]
    };

    setMembers([memberToAdd, ...members]);
    setShowAddModal(false);
    setNewMember({
      name: '',
      handicap: 18,
      bestScore: 90,
      averageScore: 95,
      longestDrive: 220,
      gir: 25,
      joinedDate: new Date().toISOString().split('T')[0]
    });
  };

  const handleRecordRound = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMember) return;

    const diff = parseFloat(currentDifferential);
    const newRoundsPlayed = selectedMember.roundsPlayed + 1;
    
    // Calculate new handicap ONLY if rounds >= 3
    let newHandicap = selectedMember.handicap;
    if (newRoundsPlayed >= 3) {
      // Simplified handicap update: 75% old, 25% new round differential
      newHandicap = (selectedMember.handicap * 0.75 + diff * 0.25);
    }

    const dateLabel = new Date(roundData.date).toLocaleDateString('en-GB', { month: 'short', day: 'numeric' });

    const updatedMembers = members.map(m => {
      if (m.id === selectedMember.id) {
        const historyEntry = { date: dateLabel, value: parseFloat(newHandicap.toFixed(1)) };
        return {
          ...m,
          handicap: newHandicap,
          roundsPlayed: newRoundsPlayed,
          bestScore: Math.min(m.bestScore, roundData.score),
          handicapHistory: [
            ...(m.handicapHistory || []),
            historyEntry
          ]
        };
      }
      return m;
    });

    setMembers(updatedMembers);
    setShowScoreModal(false);
  };

  const renderHandicapBadge = (member: Member) => {
    if (member.roundsPlayed < 3) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black bg-slate-100 text-slate-500 uppercase border border-slate-200">
          <Timer className="w-3 h-3" />
          Pending {member.roundsPlayed}/3
        </span>
      );
    }

    return (
      <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold ${
        member.handicap < 10 ? 'bg-emerald-100 text-emerald-700' :
        member.handicap < 20 ? 'bg-blue-100 text-blue-700' :
        'bg-amber-100 text-amber-700'
      }`}>
        {member.handicap.toFixed(1)}
      </span>
    );
  };

  if (selectedMember) {
    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500 pb-20">
        <button 
          onClick={() => setSelectedMemberId(null)}
          className="flex items-center gap-2 text-slate-500 hover:text-emerald-600 font-bold text-sm transition-colors mb-4 group"
        >
          <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Back to Member List
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile & Quick Actions */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 flex flex-col items-center text-center">
              <img 
                src={selectedMember.avatar} 
                className="w-32 h-32 rounded-full border-4 border-emerald-50 shadow-xl mb-4" 
                alt={selectedMember.name} 
              />
              <h2 className="text-2xl font-bold text-slate-800">{selectedMember.name}</h2>
              <div className="flex items-center gap-2 mb-4">
                {selectedMember.roundsPlayed >= 3 ? (
                  <>
                    <span className="text-emerald-600 font-black text-xl tracking-tight">HCP {selectedMember.handicap.toFixed(1)}</span>
                    <span className="flex items-center text-[10px] font-bold px-1.5 py-0.5 bg-emerald-50 text-emerald-600 rounded">
                      <ArrowDownRight className="w-3 h-3" />
                      -0.4
                    </span>
                  </>
                ) : (
                  <div className="flex flex-col items-center">
                    <span className="text-slate-400 font-black text-xl tracking-tight uppercase">Index Pending</span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Evaluation Round {selectedMember.roundsPlayed} of 3</span>
                  </div>
                )}
              </div>
              
              <div className="w-full pt-6 border-t border-slate-50 flex justify-around text-center">
                <div>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Joined</p>
                  <p className="text-sm font-bold text-slate-700">
                    {new Date(selectedMember.joinedDate).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Total Rounds</p>
                  <p className="text-sm font-bold text-slate-700">{selectedMember.roundsPlayed}</p>
                </div>
              </div>

              <div className="w-full mt-8 space-y-3">
                <button 
                  onClick={() => setShowScoreModal(true)}
                  className="w-full flex items-center justify-center gap-2 py-4 bg-emerald-600 text-white rounded-2xl font-bold text-sm shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 transition-all hover:-translate-y-0.5 active:translate-y-0"
                >
                  <Calculator className="w-4 h-4" />
                  Record New Round
                </button>
                <div className="grid grid-cols-2 gap-3">
                  <button className="flex items-center justify-center gap-2 py-3 bg-slate-50 text-slate-600 rounded-2xl font-bold text-xs hover:bg-slate-100 transition-all">
                    <Mail className="w-3.5 h-3.5" />
                    Message
                  </button>
                  <button className="flex items-center justify-center gap-2 py-3 bg-slate-50 text-slate-600 rounded-2xl font-bold text-xs hover:bg-slate-100 transition-all">
                    Edit Profile
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-emerald-900 text-white p-6 rounded-3xl shadow-xl relative overflow-hidden">
               <div className="absolute top-0 right-0 p-4 opacity-10">
                 <Award className="w-24 h-24" />
               </div>
               <h3 className="text-lg font-bold mb-2">Season Status</h3>
               <p className="text-emerald-200 text-sm leading-relaxed">
                 {selectedMember.roundsPlayed < 3 
                   ? "Currently in evaluation period. Complete 3 rounds to join the official Order of Merit."
                   : "Ranked #14 in current season. Trending upwards over the last 3 events."}
               </p>
            </div>
          </div>

          {/* Stats & Charts */}
          <div className="lg:col-span-2 space-y-6">
            <h3 className="text-xl font-bold text-slate-800">Performance Metrics</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <PerformanceCard 
                label="Average Score" 
                value={selectedMember.averageScore.toString()} 
                icon={TrendingUp} 
                color="blue"
                subValue="Season Average"
              />
              <PerformanceCard 
                label="Longest Drive" 
                value={`${selectedMember.longestDrive} yds`} 
                icon={Compass} 
                color="emerald"
                subValue="Personal Record"
              />
              <PerformanceCard 
                label="Greens in Reg" 
                value={`${selectedMember.gir}%`} 
                icon={Target} 
                color="purple"
                subValue="Consistency Rate"
              />
              <PerformanceCard 
                label="Best Round" 
                value={selectedMember.bestScore.toString()} 
                icon={Award} 
                color="amber"
                subValue="Course: The Belfry"
              />
            </div>

            {/* Handicap History Chart */}
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 mt-6 overflow-hidden relative">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <LineIcon className="w-5 h-5 text-emerald-600" />
                    Handicap Tracker
                  </h3>
                  <p className="text-xs text-slate-400 font-medium">Monitoring progress through the 2024 season</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    <span className="text-[10px] font-bold text-slate-500 uppercase">WHS Index</span>
                  </div>
                </div>
              </div>
              <div className="h-64 w-full">
                {selectedMember.handicapHistory && selectedMember.handicapHistory.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={selectedMember.handicapHistory}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis 
                        dataKey="date" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{fill: '#94a3b8', fontSize: 11, fontWeight: 500}} 
                        dy={10}
                      />
                      <YAxis 
                        reversed
                        axisLine={false} 
                        tickLine={false} 
                        tick={{fill: '#94a3b8', fontSize: 11, fontWeight: 500}}
                        domain={['dataMin - 1', 'dataMax + 1']}
                        dx={-10}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          borderRadius: '16px', 
                          border: 'none', 
                          boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)', 
                          fontSize: '12px',
                          padding: '12px'
                        }}
                        itemStyle={{ fontWeight: '800', color: '#10b981' }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="value" 
                        stroke="#10b981" 
                        strokeWidth={4} 
                        dot={{ fill: '#10b981', strokeWidth: 3, r: 5, stroke: '#fff' }}
                        activeDot={{ r: 8, strokeWidth: 0, fill: '#059669' }}
                        animationDuration={1500}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-slate-400 italic text-sm bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                    No history data available yet. Record a round to begin tracking.
                  </div>
                )}
              </div>
              {selectedMember.roundsPlayed < 3 && (
                <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] z-10 flex items-center justify-center">
                   <div className="bg-slate-900 text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3">
                     <Timer className="w-5 h-5 text-emerald-400" />
                     <p className="text-sm font-bold">Calculation Locked: {selectedMember.roundsPlayed}/3 Rounds Completed</p>
                   </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Record Score Modal */}
        {showScoreModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowScoreModal(false)} />
            <div className="relative bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="bg-emerald-900 p-6 text-white flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-emerald-500 p-2 rounded-xl">
                    <Calculator className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">Record Round Score</h3>
                    <p className="text-xs text-emerald-300">WHS Handicap Calculator</p>
                  </div>
                </div>
                <button onClick={() => setShowScoreModal(false)} className="p-2 hover:bg-white/10 rounded-lg"><X className="w-5 h-5" /></button>
              </div>

              <form onSubmit={handleRecordRound} className="p-8 space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="col-span-2">
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Round Date</label>
                    <input 
                      required type="date"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:ring-2 ring-emerald-500/20"
                      value={roundData.date}
                      onChange={e => setRoundData({...roundData, date: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Gross Score</label>
                    <input 
                      required type="number"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:ring-2 ring-emerald-500/20"
                      value={roundData.score}
                      onChange={e => setRoundData({...roundData, score: parseInt(e.target.value)})}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Course Rating</label>
                    <input 
                      required type="number" step="0.1"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:ring-2 ring-emerald-500/20"
                      value={roundData.rating}
                      onChange={e => setRoundData({...roundData, rating: parseFloat(e.target.value)})}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Slope Rating</label>
                    <input 
                      required type="number"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:ring-2 ring-emerald-500/20"
                      value={roundData.slope}
                      onChange={e => setRoundData({...roundData, slope: parseInt(e.target.value)})}
                    />
                  </div>
                  <div className="flex items-center justify-center bg-emerald-50 rounded-2xl p-4">
                    <div className="text-center">
                      <p className="text-[10px] font-bold text-emerald-600 uppercase mb-1">Differential</p>
                      <p className="text-3xl font-black text-emerald-700">{currentDifferential}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl flex items-start gap-3">
                  <div className="p-2 bg-white rounded-lg shadow-sm">
                    <Info className="w-4 h-4 text-emerald-600" />
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
                    {selectedMember.roundsPlayed < 2 ? (
                      <span className="text-blue-600 font-bold">Evaluate Period:</span>
                    ) : (
                      <span className="text-emerald-600 font-bold">WHS Update:</span>
                    )}
                    {" "}This is round <strong>{selectedMember.roundsPlayed + 1}</strong>.
                    {selectedMember.roundsPlayed < 2 ? (
                      " Handicap index updates will activate after your 3rd tournament."
                    ) : (
                      ` Index will adjust from ${selectedMember.handicap.toFixed(1)} to ${(selectedMember.handicap * 0.75 + parseFloat(currentDifferential) * 0.25).toFixed(1)}.`
                    )}
                  </p>
                </div>

                <div className="flex items-center gap-4 pt-4 border-t border-slate-100">
                  <button type="button" onClick={() => setShowScoreModal(false)} className="flex-1 py-3 text-slate-600 font-bold">Cancel</button>
                  <button type="submit" className="flex-[2] py-4 bg-emerald-600 text-white font-bold rounded-2xl shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 transition-all">Record Round</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
      {/* Search & Add Section */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search members..." 
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border-none rounded-xl text-sm outline-none focus:ring-2 ring-emerald-500/20"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 border border-slate-200 text-slate-600 text-sm font-bold rounded-xl hover:bg-slate-50 transition-colors">
            <Filter className="w-4 h-4" />
            Filter
          </button>
          <button 
            onClick={() => setShowAddModal(true)}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2 bg-emerald-600 text-white text-sm font-bold rounded-xl hover:bg-emerald-700 transition-shadow shadow-lg shadow-emerald-600/20"
          >
            <UserPlus className="w-4 h-4" />
            Add Member
          </button>
        </div>
      </div>

      {/* Member Table */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Member</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Handicap</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Rounds</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Best Score</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Joined</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredMembers.map((member) => (
                <tr 
                  key={member.id} 
                  onClick={() => setSelectedMemberId(member.id)}
                  className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <img src={member.avatar} className="w-10 h-10 rounded-full border border-slate-100" alt={member.name} />
                      <div>
                        <p className="text-sm font-bold text-slate-800 group-hover:text-emerald-600 transition-colors">{member.name}</p>
                        <p className="text-xs text-slate-400 font-medium">@id-{member.id.padStart(4, '0')}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {renderHandicapBadge(member)}
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-slate-600 font-medium">{member.roundsPlayed}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-bold text-slate-800">{member.bestScore}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-slate-500 font-medium">{new Date(member.joinedDate).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}</span>
                  </td>
                  <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center gap-2">
                      <button className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors">
                        <Mail className="w-4 h-4" />
                      </button>
                      <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Member Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowAddModal(false)} />
          <div className="relative bg-white w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="bg-emerald-900 p-6 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-emerald-500 p-2 rounded-xl">
                  <UserPlus className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-bold">Add New Society Member</h3>
              </div>
              <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-white/10 rounded-lg"><X className="w-5 h-5" /></button>
            </div>
            
            <form onSubmit={handleAddMember} className="p-8 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Full Name</label>
                  <input 
                    required type="text" placeholder="Enter player name"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:ring-2 ring-emerald-500/20 focus:border-emerald-500 transition-all"
                    value={newMember.name}
                    onChange={e => setNewMember({...newMember, name: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Current Handicap</label>
                  <input 
                    required type="number" step="0.1"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:ring-2 ring-emerald-500/20 focus:border-emerald-500 transition-all"
                    value={newMember.handicap}
                    onChange={e => setNewMember({...newMember, handicap: parseFloat(e.target.value)})}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Joined Date</label>
                  <input 
                    required type="date"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:ring-2 ring-emerald-500/20 focus:border-emerald-500 transition-all"
                    value={newMember.joinedDate}
                    onChange={e => setNewMember({...newMember, joinedDate: e.target.value})}
                  />
                </div>
              </div>
              <div className="flex items-center gap-4 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-3 text-slate-600 font-bold">Cancel</button>
                <button type="submit" className="flex-[2] py-4 bg-emerald-600 text-white font-bold rounded-xl shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 transition-all">Create Member Profile</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const PerformanceCard = ({ label, value, icon: Icon, color, subValue }: any) => {
  const colorMap: any = {
    blue: 'bg-blue-50 text-blue-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600',
    purple: 'bg-purple-50 text-purple-600',
  };

  return (
    <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 transition-all hover:shadow-md group">
      <div className="flex items-center gap-4 mb-4">
        <div className={`p-3 rounded-2xl transition-transform group-hover:scale-110 duration-300 ${colorMap[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
        <div>
          <p className="text-sm font-bold text-slate-800">{label}</p>
          <p className="text-xs text-slate-400 font-medium">{subValue}</p>
        </div>
      </div>
      <p className="text-3xl font-black text-slate-800">{value}</p>
    </div>
  );
};

export default Members;
