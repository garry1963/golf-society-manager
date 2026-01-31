
import React, { useState } from 'react';
import { Member } from '../types';
import { 
  Search, 
  UserPlus, 
  ChevronLeft, 
  X,
  LineChart as LineIcon,
  Calculator,
  Timer,
  Trash2,
  Users,
  UserMinus,
  AlertTriangle,
  Check
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface MembersProps {
  members: Member[];
  setMembers: React.Dispatch<React.SetStateAction<Member[]>>;
}

const Members: React.FC<MembersProps> = ({ members, setMembers }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showScoreModal, setShowScoreModal] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [isPurging, setIsPurging] = useState(false);

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

  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    const id = `m-${Date.now()}`;
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
      handicapHistory: [{ date: 'Initial', value: Number(newMember.handicap) }]
    };

    setMembers(prev => [memberToAdd, ...prev]);
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

  const executeDelete = (id: string) => {
    setMembers(prev => prev.filter(m => m.id !== id));
    setConfirmDeleteId(null);
    if (selectedMemberId === id) setSelectedMemberId(null);
  };

  const handlePurgeRoster = () => {
    setMembers([]);
    setIsPurging(false);
    setSelectedMemberId(null);
  };

  const renderHandicapBadge = (member: Member) => {
    if (member.roundsPlayed < 3) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black bg-slate-100 text-slate-500 uppercase border border-slate-200">
          <Timer className="w-3 h-3" /> Pending {member.roundsPlayed}/3
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
        <button onClick={() => { setSelectedMemberId(null); setConfirmDeleteId(null); }} className="flex items-center gap-2 text-slate-500 hover:text-emerald-600 font-bold text-sm transition-colors mb-4 group">
          <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Back to Society Roster
        </button>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col items-center text-center relative overflow-hidden">
              <img src={selectedMember.avatar} className="w-32 h-32 rounded-3xl border-4 border-slate-50 shadow-xl mb-6 object-cover" alt="" />
              <h2 className="text-3xl font-black text-slate-900 mb-1">{selectedMember.name}</h2>
              <div className="mb-8">{renderHandicapBadge(selectedMember)}</div>
              <div className="grid grid-cols-2 gap-4 w-full mb-8">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100"><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Low Score</p><p className="text-xl font-black text-slate-800">{selectedMember.bestScore}</p></div>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100"><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Rounds</p><p className="text-xl font-black text-slate-800">{selectedMember.roundsPlayed}</p></div>
              </div>
              <div className="w-full space-y-3">
                <button onClick={() => setShowScoreModal(true)} className="w-full py-4 bg-emerald-600 text-white font-black rounded-2xl shadow-xl hover:bg-emerald-700 transition-all flex items-center justify-center gap-2"><Calculator className="w-4 h-4" /> Record Performance</button>
                {confirmDeleteId === selectedMember.id ? (
                  <div className="flex flex-col gap-2 w-full animate-in zoom-in-95 duration-200">
                    <p className="text-[10px] font-black text-rose-600 uppercase mb-1">Confirm Removal?</p>
                    <div className="flex gap-2">
                      <button onClick={() => executeDelete(selectedMember.id)} className="flex-1 py-3 bg-rose-600 text-white font-black rounded-xl hover:bg-rose-700 transition-all">Confirm</button>
                      <button onClick={() => setConfirmDeleteId(null)} className="flex-1 py-3 bg-slate-100 text-slate-600 font-black rounded-xl hover:bg-slate-200 transition-all">Cancel</button>
                    </div>
                  </div>
                ) : (
                  <button onClick={() => setConfirmDeleteId(selectedMember.id)} className="w-full py-4 bg-rose-50 text-rose-600 font-black rounded-2xl border border-rose-100 hover:bg-rose-100 transition-all flex items-center justify-center gap-2"><UserMinus className="w-4 h-4" /> Remove from Society</button>
                )}
              </div>
            </div>
          </div>
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
              <div className="flex items-center justify-between mb-8"><div><h3 className="text-xl font-black text-slate-800">Handicap Trajectory</h3><p className="text-xs text-slate-400 font-bold uppercase tracking-widest">WHS History Records</p></div><LineIcon className="w-5 h-5 text-slate-300" /></div>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={selectedMember.handicapHistory || []}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} reversed />
                    <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }} />
                    <Line type="monotone" dataKey="value" stroke="#10b981" strokeWidth={4} dot={{ r: 4, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div><h2 className="text-2xl font-black text-slate-900 tracking-tight">Society Roster</h2><p className="text-sm text-slate-500 font-medium">Managing {members.length} registered members</p></div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input type="text" placeholder="Search members..." className="pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-sm outline-none focus:ring-2 ring-emerald-500/20 transition-all min-w-[280px] font-medium" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
          <button onClick={() => setShowAddModal(true)} className="flex items-center gap-2 px-6 py-2.5 bg-slate-900 text-white font-black rounded-2xl hover:bg-slate-800 transition-all shadow-xl active:scale-95"><UserPlus className="w-4 h-4" /> Add Member</button>
          <div className="relative">
            {isPurging ? (
              <div className="absolute right-0 top-0 flex items-center gap-1 animate-in slide-in-from-right-2">
                <button onClick={handlePurgeRoster} className="p-2.5 bg-rose-600 text-white rounded-xl shadow-lg hover:bg-rose-700 transition-all"><Check className="w-4 h-4" /></button>
                <button onClick={() => setIsPurging(false)} className="p-2.5 bg-slate-200 text-slate-600 rounded-xl hover:bg-slate-300 transition-all"><X className="w-4 h-4" /></button>
              </div>
            ) : (
              <button onClick={() => setIsPurging(true)} className="p-2.5 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-2xl transition-all border border-transparent hover:border-rose-100" title="Purge Entire Roster"><Trash2 className="w-5 h-5" /></button>
            )}
          </div>
        </div>
      </div>

      {filteredMembers.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredMembers.map((member) => (
            <div key={member.id} onClick={() => confirmDeleteId !== member.id && setSelectedMemberId(member.id)} className={`bg-white p-6 rounded-[2.5rem] border shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 cursor-pointer group relative overflow-hidden ${confirmDeleteId === member.id ? 'border-rose-300 ring-2 ring-rose-500/10' : 'border-slate-100'}`}>
              {confirmDeleteId === member.id ? (
                <div className="absolute inset-0 bg-rose-50/95 backdrop-blur-sm z-20 flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-300">
                  <AlertTriangle className="w-8 h-8 text-rose-600 mb-2" />
                  <p className="text-[10px] font-black text-rose-800 uppercase tracking-widest mb-4">Confirm Removal?</p>
                  <div className="flex gap-2 w-full">
                    <button onClick={(e) => { e.stopPropagation(); executeDelete(member.id); }} className="flex-1 py-3 bg-rose-600 text-white font-black rounded-xl hover:bg-rose-700 shadow-lg">Delete</button>
                    <button onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(null); }} className="flex-1 py-3 bg-white text-slate-600 font-black rounded-xl border border-rose-200 hover:bg-rose-100">Cancel</button>
                  </div>
                </div>
              ) : (
                <button onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(member.id); }} className="absolute top-4 right-4 p-2 text-slate-200 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all opacity-0 group-hover:opacity-100 z-10" title="Remove Member"><Trash2 className="w-4 h-4" /></button>
              )}
              <div className="flex items-start justify-between mb-6">
                <img src={member.avatar} className="w-16 h-16 rounded-2xl border-2 border-slate-50 shadow-md group-hover:scale-105 transition-transform object-cover" alt="" />
                <div className="text-right"><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Index</p>{renderHandicapBadge(member)}</div>
              </div>
              <h4 className="text-xl font-black text-slate-800 mb-1 group-hover:text-emerald-600 transition-colors">{member.name}</h4>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-1">Joined {new Date(member.joinedDate).toLocaleDateString()}</p>
              <div className="grid grid-cols-2 gap-3 pt-6 border-t border-slate-50">
                <div><p className="text-[9px] font-black text-slate-400 uppercase mb-1">Personal Best</p><p className="text-sm font-black text-slate-700">{member.bestScore}</p></div>
                <div><p className="text-[9px] font-black text-slate-400 uppercase mb-1">Society Rounds</p><p className="text-sm font-black text-slate-700">{member.roundsPlayed}</p></div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-32 text-center bg-white rounded-[3.5rem] border-2 border-dashed border-slate-100 shadow-inner">
          <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center mx-auto mb-6"><Users className="w-10 h-10 text-slate-200" /></div>
          <h3 className="text-xl font-black text-slate-900 mb-2">Empty Society Roster</h3>
          <p className="text-slate-400 font-bold mb-8 max-w-xs mx-auto">Start by adding individual members to begin tracking society performance.</p>
          <button onClick={() => setShowAddModal(true)} className="inline-flex items-center gap-2 px-8 py-4 bg-emerald-600 text-white font-black rounded-[1.5rem] shadow-xl hover:bg-emerald-700 transition-all active:scale-95"><UserPlus className="w-5 h-5" /> Add First Member</button>
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowAddModal(false)} />
          <div className="relative bg-white w-full max-w-xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="bg-slate-900 p-8 text-white flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="bg-emerald-500 p-3 rounded-2xl shadow-lg shadow-emerald-500/20"><UserPlus className="w-6 h-6" /></div>
                <div><h3 className="text-2xl font-black">Enroll Member</h3><p className="text-[10px] text-emerald-400 font-bold uppercase tracking-[0.2em]">New Society Entry</p></div>
              </div>
              <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-white/10 rounded-xl transition-colors"><X className="w-6 h-6" /></button>
            </div>
            <form onSubmit={handleAddMember} className="p-10 space-y-8">
              <div className="space-y-6">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Member Full Name</label>
                  <input required type="text" placeholder="e.g. Robert Jones" className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 ring-emerald-500/10 transition-all font-bold text-slate-800" value={newMember.name} onChange={e => setNewMember({...newMember, name: e.target.value})} />
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Initial Handicap</label>
                    <input required type="number" step="0.1" className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold text-slate-800" value={newMember.handicap} onChange={e => setNewMember({...newMember, handicap: Number(e.target.value)})} />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Joined Date</label>
                    <input required type="date" className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold text-slate-800" value={newMember.joinedDate} onChange={e => setNewMember({...newMember, joinedDate: e.target.value})} />
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4 pt-6 border-t border-slate-100">
                <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-4 text-slate-500 font-bold hover:bg-slate-50 rounded-2xl transition-all">Cancel</button>
                <button type="submit" className="flex-[2] py-4 bg-slate-900 text-white font-black rounded-2xl shadow-xl hover:bg-slate-800 transition-all active:scale-[0.98]">Confirm Enrollment</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Members;
