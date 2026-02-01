import React, { useState } from 'react';
import { Member, Score, Tournament } from '../types';
import { UserPlus, Search, Edit2, Trash2, User, Phone, Mail, TrendingUp, History, Award } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';

interface MembersProps {
  members: Member[];
  setMembers: React.Dispatch<React.SetStateAction<Member[]>>;
  scores: Score[];
  tournaments: Tournament[];
}

const Members: React.FC<MembersProps> = ({ members, setMembers, scores, tournaments }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [activeTab, setActiveTab] = useState<'DETAILS' | 'HISTORY' | 'STATS'>('DETAILS');
  
  // Form State
  const [formData, setFormData] = useState({
    name: '',
    handicap: '',
    email: '',
    phone: ''
  });

  const handleOpenModal = (member?: Member) => {
    setActiveTab('DETAILS');
    if (member) {
      setEditingMember(member);
      setFormData({
        name: member.name,
        handicap: member.handicap.toString(),
        email: member.email || '',
        phone: member.phone || ''
      });
    } else {
      setEditingMember(null);
      setFormData({ name: '', handicap: '', email: '', phone: '' });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const hcp = parseFloat(formData.handicap);
    
    if (editingMember) {
      // Check if handicap changed manually to record history
      let updatedHistory = [...(editingMember.handicapHistory || [])];
      if (Math.abs(hcp - editingMember.handicap) > 0.01) {
         updatedHistory.push({
           date: new Date().toISOString(),
           oldHandicap: editingMember.handicap,
           newHandicap: hcp,
           reason: 'Manual Adjustment'
         });
      }

      setMembers(members.map(m => 
        m.id === editingMember.id 
          ? { 
              ...m, 
              name: formData.name, 
              handicap: hcp,
              email: formData.email,
              phone: formData.phone,
              handicapHistory: updatedHistory
            } 
          : m
      ));
    } else {
      const newMember: Member = {
        id: crypto.randomUUID(),
        name: formData.name,
        handicap: hcp,
        joinedDate: new Date().toISOString(),
        email: formData.email,
        phone: formData.phone,
        handicapHistory: [{
          date: new Date().toISOString(),
          oldHandicap: hcp,
          newHandicap: hcp,
          reason: 'Initial Handicap'
        }]
      };
      setMembers([...members, newMember]);
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to remove this member?')) {
      setMembers(members.filter(m => m.id !== id));
    }
  };

  const filteredMembers = members.filter(m => 
    m.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Stats Helpers
  const getMemberStats = (memberId: string) => {
    const memberScores = scores.filter(s => s.memberId === memberId);
    const eventsPlayed = memberScores.length;
    let wins = 0;
    
    // Calculate simple wins (assuming data is available)
    tournaments.filter(t => t.completed).forEach(t => {
       const tScores = scores.filter(s => s.tournamentId === t.id);
       // Simple win check logic (Stableford mainly)
       if(tScores.length > 0) {
          const winner = tScores.sort((a,b) => (b.points || 0) - (a.points || 0))[0];
          if(winner.memberId === memberId) wins++;
       }
    });

    const bestPoints = memberScores.reduce((max, s) => Math.max(max, s.points || 0), 0);
    
    return { eventsPlayed, wins, bestPoints };
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Members Directory</h2>
          <p className="text-gray-500 text-sm">Manage profiles, contact info, and handicaps.</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="flex items-center space-x-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors"
        >
          <UserPlus size={18} />
          <span>Add Member</span>
        </button>
      </div>

      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search size={18} className="text-gray-400" />
        </div>
        <input
          type="text"
          placeholder="Search members..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 w-full p-3 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredMembers.map(member => (
          <div key={member.id} className="bg-white p-5 rounded-xl border border-gray-100 hover:shadow-lg transition-all flex flex-col justify-between group">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-4">
                <div className="h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-xl">
                  {member.name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">{member.name}</h3>
                  <div className="text-sm text-gray-500">HI: <span className="font-mono font-bold text-gray-800">{member.handicap}</span></div>
                </div>
              </div>
              <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={() => handleOpenModal(member)}
                  className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-full"
                >
                  <Edit2 size={16} />
                </button>
              </div>
            </div>
            
            <div className="space-y-2 text-sm text-gray-600 border-t border-gray-50 pt-3">
              {member.email && <div className="flex items-center gap-2"><Mail size={14} /> {member.email}</div>}
              {member.phone && <div className="flex items-center gap-2"><Phone size={14} /> {member.phone}</div>}
              <div className="flex items-center gap-2"><History size={14} /> Joined {new Date(member.joinedDate).getFullYear()}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Profile Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full flex flex-col max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
               <h3 className="text-xl font-bold text-gray-800">{editingMember ? `Profile: ${editingMember.name}` : 'New Member'}</h3>
               <button onClick={() => setIsModalOpen(false)}><span className="text-2xl text-gray-400">&times;</span></button>
            </div>

            <div className="flex border-b border-gray-100">
               <button onClick={() => setActiveTab('DETAILS')} className={`flex-1 p-3 text-sm font-medium ${activeTab === 'DETAILS' ? 'text-emerald-600 border-b-2 border-emerald-600' : 'text-gray-500'}`}>Details</button>
               {editingMember && <button onClick={() => setActiveTab('HISTORY')} className={`flex-1 p-3 text-sm font-medium ${activeTab === 'HISTORY' ? 'text-emerald-600 border-b-2 border-emerald-600' : 'text-gray-500'}`}>Handicap History</button>}
               {editingMember && <button onClick={() => setActiveTab('STATS')} className={`flex-1 p-3 text-sm font-medium ${activeTab === 'STATS' ? 'text-emerald-600 border-b-2 border-emerald-600' : 'text-gray-500'}`}>Statistics</button>}
            </div>
            
            <div className="p-6 overflow-y-auto">
              {activeTab === 'DETAILS' && (
                <form id="memberForm" onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                      <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full p-2 border rounded focus:ring-emerald-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Current Handicap</label>
                      <input required type="number" step="0.1" value={formData.handicap} onChange={e => setFormData({...formData, handicap: e.target.value})} className="w-full p-2 border rounded focus:ring-emerald-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                      <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full p-2 border rounded focus:ring-emerald-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                      <input type="tel" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full p-2 border rounded focus:ring-emerald-500" />
                    </div>
                  </div>
                  <div className="mt-8 flex justify-end gap-3">
                     {editingMember && (
                       <button type="button" onClick={() => { handleDelete(editingMember.id); setIsModalOpen(false); }} className="px-4 py-2 text-red-600 hover:bg-red-50 rounded">Delete Profile</button>
                     )}
                     <button type="submit" className="px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700">Save Changes</button>
                  </div>
                </form>
              )}

              {activeTab === 'HISTORY' && editingMember && (
                <div className="space-y-6">
                   <div className="h-64 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                         <LineChart data={editingMember.handicapHistory || []}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="date" tickFormatter={(t) => new Date(t).toLocaleDateString()} hide />
                            <YAxis domain={['auto', 'auto']} />
                            <RechartsTooltip labelFormatter={(l) => new Date(l).toLocaleDateString()} />
                            <Line type="stepAfter" dataKey="newHandicap" stroke="#10b981" strokeWidth={3} dot={{r:4}} />
                         </LineChart>
                      </ResponsiveContainer>
                   </div>
                   <div className="border rounded-lg overflow-hidden">
                      <table className="w-full text-sm text-left">
                         <thead className="bg-gray-50"><tr><th className="p-3">Date</th><th className="p-3">Reason</th><th className="p-3 text-right">Change</th><th className="p-3 text-right">New HI</th></tr></thead>
                         <tbody className="divide-y">
                            {[...(editingMember.handicapHistory || [])].reverse().map((h, i) => (
                              <tr key={i}>
                                <td className="p-3">{new Date(h.date).toLocaleDateString()}</td>
                                <td className="p-3 text-gray-600">{h.reason}</td>
                                <td className={`p-3 text-right font-medium ${h.newHandicap < h.oldHandicap ? 'text-emerald-600' : 'text-red-500'}`}>
                                   {(h.newHandicap - h.oldHandicap).toFixed(1)}
                                </td>
                                <td className="p-3 text-right font-bold">{h.newHandicap}</td>
                              </tr>
                            ))}
                         </tbody>
                      </table>
                   </div>
                </div>
              )}

              {activeTab === 'STATS' && editingMember && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                   {(() => {
                      const stats = getMemberStats(editingMember.id);
                      return (
                         <>
                           <div className="p-4 bg-emerald-50 rounded-lg text-center border border-emerald-100">
                              <Award className="mx-auto text-emerald-600 mb-2" />
                              <div className="text-2xl font-bold text-gray-900">{stats.wins}</div>
                              <div className="text-xs text-gray-500 uppercase tracking-wide">Wins</div>
                           </div>
                           <div className="p-4 bg-blue-50 rounded-lg text-center border border-blue-100">
                              <TrendingUp className="mx-auto text-blue-600 mb-2" />
                              <div className="text-2xl font-bold text-gray-900">{stats.bestPoints}</div>
                              <div className="text-xs text-gray-500 uppercase tracking-wide">Best Points</div>
                           </div>
                           <div className="p-4 bg-purple-50 rounded-lg text-center border border-purple-100">
                              <History className="mx-auto text-purple-600 mb-2" />
                              <div className="text-2xl font-bold text-gray-900">{stats.eventsPlayed}</div>
                              <div className="text-xs text-gray-500 uppercase tracking-wide">Events Played</div>
                           </div>
                         </>
                      );
                   })()}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Members;
