
import React, { useState, useEffect, useMemo } from 'react';
import { Event, Member, Facility, Season } from '../types';
import { 
  Calendar, 
  MapPin, 
  Users, 
  Trophy, 
  ChevronRight, 
  Plus, 
  Minus,
  X, 
  Flag, 
  Edit3,
  Trash2,
  AlertTriangle,
  Crown,
  Layers,
  Hash,
  ChevronDown,
  BookMarked,
  CalendarDays,
  Check,
  Search,
  CheckCircle2,
  Settings2,
  UserCheck
} from 'lucide-react';

interface EventsProps {
  events: Event[];
  setEvents: React.Dispatch<React.SetStateAction<Event[]>>;
  members: Member[];
  setMembers: React.Dispatch<React.SetStateAction<Member[]>>;
  seasons: Season[];
  prefilled?: { courseName: string, location: string, facilityId?: string } | null;
  onModalClose?: () => void;
  savedFacilities?: Facility[];
  onSearchCourse?: () => void;
}

const Events: React.FC<EventsProps> = ({ 
  events, 
  setEvents, 
  members, 
  setMembers,
  seasons,
  prefilled, 
  onModalClose, 
  savedFacilities = [] 
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showResultsModal, setShowResultsModal] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  
  const [tempResults, setTempResults] = useState<{ memberId: string; score: number }[]>([]);
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([]);
  const [participantSearch, setParticipantSearch] = useState('');

  const [newEvent, setNewEvent] = useState({
    title: '',
    date: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    numberOfRounds: 1,
    courseName: '',
    location: '',
    facilityId: '',
    seasonId: '',
    isMajor: false
  });

  // Handle prefilled data from Course Search
  useEffect(() => {
    if (prefilled) {
      setNewEvent(prev => ({
        ...prev,
        courseName: prefilled.courseName,
        location: prefilled.location,
        facilityId: prefilled.facilityId || '',
        date: new Date().toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
      }));
      setSelectedParticipants(members.map(m => m.id)); // Default to all members for prefilled
      setSelectedEventId(null);
      setShowAddModal(true);
    }
  }, [prefilled, members]);

  const sortedEvents = useMemo(() => {
    return [...events].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [events]);

  const handleCreateEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEvent.title || !newEvent.courseName) {
      alert("Please provide at least a Title and a Venue Course.");
      return;
    }

    if (selectedEventId) {
      // Update existing
      setEvents(prev => prev.map(evt => evt.id === selectedEventId ? {
        ...evt,
        ...newEvent,
        participants: selectedParticipants
      } : evt));
    } else {
      // Create new
      const id = `e${Date.now()}`;
      const eventToAdd: Event = {
        ...newEvent,
        id,
        status: 'upcoming',
        participants: selectedParticipants.length > 0 ? selectedParticipants : members.map(m => m.id)
      };
      setEvents(prev => [eventToAdd, ...prev]);
    }
    handleCloseAddModal();
  };

  const handleCloseAddModal = () => {
    setShowAddModal(false);
    setSelectedEventId(null);
    setParticipantSearch('');
    setNewEvent({
      title: '',
      date: new Date().toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0],
      numberOfRounds: 1,
      courseName: '',
      location: '',
      facilityId: '',
      seasonId: '',
      isMajor: false
    });
    setSelectedParticipants([]);
    if (onModalClose) onModalClose();
  };

  const handleEditEvent = (event: Event) => {
    setNewEvent({
      title: event.title,
      date: event.date,
      endDate: event.endDate || event.date,
      numberOfRounds: event.numberOfRounds || 1,
      courseName: event.courseName,
      location: event.location,
      facilityId: event.facilityId || '',
      seasonId: event.seasonId || '',
      isMajor: event.isMajor || false
    });
    setSelectedParticipants(event.participants);
    setSelectedEventId(event.id);
    setShowAddModal(true);
  };

  const handleDeleteEvent = (id: string) => {
    setEvents(prev => prev.filter(e => e.id !== id));
    setConfirmDeleteId(null);
  };

  const handleFacilitySelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const facId = e.target.value;
    if (!facId) {
      setNewEvent(prev => ({ ...prev, facilityId: '', courseName: '', location: '' }));
      return;
    }
    const facility = savedFacilities.find(f => f.id === facId);
    if (facility) {
      setNewEvent(prev => ({ 
        ...prev, 
        facilityId: facility.id,
        courseName: facility.name, 
        location: facility.address 
      }));
    }
  };

  const toggleParticipant = (memberId: string) => {
    setSelectedParticipants(prev => 
      prev.includes(memberId) 
        ? prev.filter(id => id !== memberId) 
        : [...prev, memberId]
    );
  };

  const selectAllParticipants = () => {
    setSelectedParticipants(members.map(m => m.id));
  };

  const clearParticipants = () => {
    setSelectedParticipants([]);
  };

  const openResultsModal = (event: Event) => {
    setSelectedEventId(event.id);
    const existingResults = event.results || [];
    const validParticipants = event.participants.filter(pId => members.some(m => m.id === pId));
    
    const initializedResults = validParticipants.map(pId => {
      const existing = existingResults.find(r => r.memberId === pId);
      if (existing) return { ...existing };
      const member = members.find(m => m.id === pId);
      return { memberId: pId, score: member ? Math.round(member.averageScore) : 72 };
    });
    setTempResults(initializedResults);
    setShowResultsModal(true);
  };

  const handleSaveResults = () => {
    if (!selectedEventId) return;
    const event = events.find(e => e.id === selectedEventId);
    if (!event) return;

    const updatedEvents = events.map(e => {
      if (e.id === selectedEventId) {
        return { 
          ...e, 
          results: [...tempResults].sort((a, b) => a.score - b.score),
          status: 'completed' as const 
        };
      }
      return e;
    });
    setEvents(updatedEvents);

    const updatedMembers = members.map(member => {
      const result = tempResults.find(r => r.memberId === member.id);
      if (result) {
        const newRoundsPlayed = member.roundsPlayed + 1;
        const diff = (result.score - 72.0);
        const newHandicap = member.roundsPlayed >= 3 ? (member.handicap * 0.8 + (72 + diff) * 0.2) : member.handicap;
        return {
          ...member,
          roundsPlayed: newRoundsPlayed,
          bestScore: Math.min(member.bestScore, result.score),
          averageScore: (member.averageScore * member.roundsPlayed + result.score) / newRoundsPlayed,
          handicap: parseFloat(newHandicap.toFixed(1)),
          handicapHistory: [...(member.handicapHistory || []), { 
            date: new Date(event.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }), 
            value: parseFloat(newHandicap.toFixed(1)) 
          }]
        };
      }
      return member;
    });
    
    setMembers(updatedMembers);
    setShowResultsModal(false);
    setSelectedEventId(null);
  };

  const adjustScore = (index: number, delta: number) => {
    setTempResults(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], score: Math.max(1, updated[index].score + delta) };
      return updated;
    });
  };

  const filteredMembersForSearch = members.filter(m => 
    m.name.toLowerCase().includes(participantSearch.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-left-4 duration-500 pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-slate-800">Tournament Schedule</h3>
          <p className="text-sm text-slate-500">Manage outings for {members.length} members</p>
        </div>
        <button 
          onClick={() => { setSelectedParticipants(members.map(m => m.id)); setSelectedEventId(null); setShowAddModal(true); }} 
          className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white font-bold rounded-2xl hover:bg-slate-800 transition-all shadow-xl active:scale-95"
        >
          <Plus className="w-5 h-5" />
          Create Event
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {sortedEvents.length > 0 ? sortedEvents.map((event) => {
          const isCompleted = event.status === 'completed';
          const activeParticipants = event.participants.filter(pId => members.some(m => m.id === pId));
          const isConfirmingDelete = confirmDeleteId === event.id;
          
          const startDate = new Date(event.date);
          const endDate = event.endDate ? new Date(event.endDate) : startDate;
          const isMultiDay = endDate.getTime() > startDate.getTime();

          return (
            <div key={event.id} className={`bg-white rounded-3xl border shadow-sm overflow-hidden flex flex-col md:flex-row group transition-all duration-500 relative ${
              event.isMajor ? 'border-amber-200 ring-2 ring-amber-500/10' : 'border-slate-100'
            } ${isCompleted ? 'opacity-70 grayscale-[0.5]' : ''}`}>
              
              {isConfirmingDelete && (
                <div className="absolute inset-0 bg-rose-600/95 backdrop-blur-sm z-30 flex items-center justify-center p-6 text-white animate-in fade-in duration-300">
                  <div className="flex flex-col items-center text-center gap-4">
                    <AlertTriangle className="w-10 h-10" />
                    <div>
                      <h4 className="text-xl font-black">Remove Tournament?</h4>
                      <p className="text-sm font-bold opacity-80">This will permanently delete "{event.title}".</p>
                    </div>
                    <div className="flex gap-3">
                      <button onClick={() => handleDeleteEvent(event.id)} className="px-8 py-3 bg-white text-rose-600 font-black rounded-xl hover:bg-rose-50 transition-all shadow-lg">Confirm</button>
                      <button onClick={() => setConfirmDeleteId(null)} className="px-8 py-3 bg-rose-700 text-white font-black rounded-xl hover:bg-rose-800 transition-all">Cancel</button>
                    </div>
                  </div>
                </div>
              )}

              <div className={`w-full md:w-48 p-6 flex flex-col items-center justify-center text-center ${
                event.isMajor ? 'bg-amber-50' : isCompleted ? 'bg-slate-50' : 'bg-emerald-50'
              }`}>
                <p className="text-[10px] font-bold uppercase tracking-widest mb-1 text-slate-400">
                  {startDate.toLocaleDateString('en-GB', { month: 'short' })}
                </p>
                <div className="flex items-baseline gap-1">
                  <p className={`text-4xl font-black ${event.isMajor ? 'text-amber-600' : 'text-emerald-600'}`}>
                    {startDate.toLocaleDateString('en-GB', { day: '2-digit' })}
                  </p>
                  {isMultiDay && (
                    <>
                      <span className="text-slate-300 text-xl font-black">-</span>
                      <p className={`text-4xl font-black ${event.isMajor ? 'text-amber-600' : 'text-emerald-600'}`}>
                        {endDate.toLocaleDateString('en-GB', { day: '2-digit' })}
                      </p>
                    </>
                  )}
                </div>
                {event.facilityId && (
                  <div className="mt-2 text-[10px] font-black text-emerald-600 uppercase flex items-center gap-1">
                    <BookMarked className="w-3 h-3" /> Linked
                  </div>
                )}
              </div>

              <div className="flex-1 p-6 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-black px-2 py-1 rounded-md uppercase ${isCompleted ? 'bg-slate-200 text-slate-500' : 'bg-emerald-100 text-emerald-700'}`}>
                        {event.status}
                      </span>
                      {event.isMajor && <span className="text-[10px] font-black px-2 py-1 rounded-md bg-amber-500 text-white uppercase"><Crown className="w-3 h-3 inline mr-1" />Major</span>}
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity no-print">
                      <button onClick={() => handleEditEvent(event)} className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all" title="Edit Details"><Edit3 className="w-4 h-4" /></button>
                      <button onClick={() => setConfirmDeleteId(event.id)} className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all" title="Remove Event"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                  <h4 className="text-xl font-black text-slate-800 mb-1">{event.title}</h4>
                  <div className="flex flex-wrap items-center gap-4 text-[11px] font-bold text-slate-400">
                    <div className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{event.courseName}</div>
                    <div className="flex items-center gap-1"><Users className="w-3.5 h-3.5" />{activeParticipants.length} Players</div>
                    {event.numberOfRounds && event.numberOfRounds > 1 && <div className="flex items-center gap-1"><Layers className="w-3.5 h-3.5" />{event.numberOfRounds} Rds</div>}
                  </div>
                </div>

                <div className="mt-6 flex items-center justify-between">
                  <div className="flex -space-x-2">
                    {activeParticipants.slice(0, 4).map(id => {
                      const m = members.find(member => member.id === id);
                      return m ? <img key={id} src={m.avatar} className="w-8 h-8 rounded-full border-2 border-white shadow-sm" alt="" /> : null;
                    })}
                    {activeParticipants.length > 4 && (
                      <div className="w-8 h-8 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center text-[10px] font-black text-slate-500">
                        +{activeParticipants.length - 4}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => openResultsModal(event)} className="flex items-center gap-1 text-xs font-black text-slate-800 hover:text-emerald-600 transition-colors">
                      {isCompleted ? 'View Standings' : 'Score Management'}
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        }) : (
          <div className="py-24 text-center bg-white rounded-[3.5rem] border-2 border-dashed border-slate-100 shadow-inner flex flex-col items-center">
            <Calendar className="w-16 h-16 text-slate-100 mb-4" />
            <h4 className="text-xl font-black text-slate-900">No Events Scheduled</h4>
            <p className="text-slate-400 font-bold max-w-xs mx-auto mt-2">Create a tournament or pick a facility from the registry to begin.</p>
          </div>
        )}
      </div>

      {showResultsModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowResultsModal(false)} />
          <div className="relative bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="bg-slate-900 p-8 text-white flex items-center justify-between">
              <h3 className="text-2xl font-black">Score Input</h3>
              <button onClick={() => setShowResultsModal(false)} className="p-2 hover:bg-white/10 rounded-xl"><X className="w-6 h-6" /></button>
            </div>
            <div className="p-8 max-h-[60vh] overflow-y-auto custom-scrollbar">
              {tempResults.map((result, idx) => {
                const member = members.find(m => m.id === result.memberId);
                return (
                  <div key={result.memberId} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl mb-4 border border-slate-100">
                    <div className="flex items-center gap-4">
                      <img src={member?.avatar} className="w-10 h-10 rounded-full border border-white shadow-sm" alt="" />
                      <div>
                        <p className="font-black text-slate-800">{member?.name}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Index: {member?.handicap}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <button onClick={() => adjustScore(idx, -1)} className="w-10 h-10 flex items-center justify-center bg-white rounded-xl shadow-sm hover:bg-slate-50 active:scale-90 transition-all"><Minus className="w-4 h-4 text-slate-600" /></button>
                      <span className="text-2xl font-black w-12 text-center text-slate-900">{result.score}</span>
                      <button onClick={() => adjustScore(idx, 1)} className="w-10 h-10 flex items-center justify-center bg-white rounded-xl shadow-sm hover:bg-slate-50 active:scale-90 transition-all"><Plus className="w-4 h-4 text-slate-600" /></button>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="p-8 border-t border-slate-100 flex gap-4">
              <button onClick={() => setShowResultsModal(false)} className="flex-1 py-4 font-bold text-slate-500 hover:bg-slate-50 rounded-2xl transition-all">Cancel</button>
              <button onClick={handleSaveResults} className="flex-[2] py-4 bg-emerald-600 text-white font-black rounded-2xl shadow-xl hover:bg-emerald-700 transition-all active:scale-[0.98]">Save and Close Out</button>
            </div>
          </div>
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={handleCloseAddModal} />
          <div className="relative bg-white w-full max-w-4xl h-[90vh] rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col">
            <div className="bg-slate-900 p-8 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-4">
                <div className="bg-emerald-500 p-3 rounded-2xl shadow-lg shadow-emerald-500/20">
                  {selectedEventId ? <Edit3 className="w-6 h-6" /> : <Plus className="w-6 h-6" />}
                </div>
                <div>
                  <h3 className="text-2xl font-black tracking-tight">{selectedEventId ? 'Modify Tournament' : 'Establish Tournament'}</h3>
                  <p className="text-[10px] text-emerald-400 font-black uppercase tracking-[0.3em]">{selectedEventId ? 'Revision Mode' : 'New Society Entry'}</p>
                </div>
              </div>
              <button onClick={handleCloseAddModal} className="p-3 hover:bg-white/10 rounded-2xl transition-all"><X className="w-6 h-6" /></button>
            </div>

            <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
              {/* Form Side */}
              <form onSubmit={handleCreateEvent} className="flex-1 overflow-y-auto custom-scrollbar p-8 space-y-8 border-r border-slate-100">
                <section className="space-y-6">
                  <div className="flex items-center gap-2 mb-2">
                    <Settings2 className="w-4 h-4 text-emerald-500" />
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">General Specifications</h4>
                  </div>
                  
                  <div className="space-y-4">
                    <div onClick={() => setNewEvent(prev => ({ ...prev, isMajor: !prev.isMajor }))} className={`p-5 rounded-3xl border-2 transition-all cursor-pointer flex items-center justify-between ${newEvent.isMajor ? 'bg-amber-50 border-amber-300 shadow-lg shadow-amber-500/10' : 'bg-slate-50 border-slate-100'}`}>
                      <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-2xl transition-colors ${newEvent.isMajor ? 'bg-amber-400 text-white shadow-lg' : 'bg-slate-200 text-slate-400'}`}><Crown className="w-6 h-6" /></div>
                        <div>
                          <h4 className={`font-black uppercase tracking-tight ${newEvent.isMajor ? 'text-amber-700' : 'text-slate-500'}`}>Major Championship</h4>
                          <p className="text-[10px] font-bold opacity-70">Elevated status • Tier 1 Recognition</p>
                        </div>
                      </div>
                      <div className={`w-12 h-6 rounded-full relative transition-colors ${newEvent.isMajor ? 'bg-amber-400' : 'bg-slate-300'}`}>
                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-300 ${newEvent.isMajor ? 'left-7' : 'left-1'}`}></div>
                      </div>
                    </div>

                    <div className="relative">
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Tournament Title</label>
                      <input required type="text" placeholder="e.g. Invitational 2025" className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 ring-emerald-500/10 transition-all font-bold text-slate-800" value={newEvent.title} onChange={e => setNewEvent({...newEvent, title: e.target.value})} />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Link to Season</label>
                        <div className="relative">
                          <select className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold text-slate-800 appearance-none cursor-pointer" value={newEvent.seasonId} onChange={e => setNewEvent({...newEvent, seasonId: e.target.value})}>
                            <option value="">Exhibition (None)</option>
                            {seasons.map(s => (<option key={s.id} value={s.id}>{s.name} ({s.status})</option>))}
                          </select>
                          <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Rounds Format</label>
                        <div className="relative">
                          <input required type="number" min="1" max="10" className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold text-slate-800" value={newEvent.numberOfRounds} onChange={e => setNewEvent({...newEvent, numberOfRounds: parseInt(e.target.value) || 1})} />
                          <Layers className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                        </div>
                      </div>
                    </div>
                  </div>
                </section>

                <section className="space-y-6">
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin className="w-4 h-4 text-emerald-500" />
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Venue & Logistics</h4>
                  </div>

                  <div className="space-y-4">
                    {savedFacilities.length > 0 && (
                      <div className="relative p-5 bg-emerald-50/50 rounded-3xl border border-emerald-100">
                        <label className="block text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-3 flex items-center gap-1.5"><BookMarked className="w-3.5 h-3.5" /> Synchronize from Registry</label>
                        <div className="relative">
                          <select value={newEvent.facilityId} onChange={handleFacilitySelect} className="w-full px-5 py-4 bg-white border border-emerald-200 rounded-2xl outline-none font-bold text-emerald-900 appearance-none cursor-pointer focus:ring-4 ring-emerald-500/10 transition-all">
                            <option value="">Manual Entry...</option>
                            {savedFacilities.map(f => (<option key={f.id} value={f.id}>{f.name}</option>))}
                          </select>
                          <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-600 pointer-events-none" />
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Venue Course</label>
                        <input required type="text" placeholder="Course Name" className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold text-slate-800 focus:ring-4 ring-emerald-500/10 transition-all" value={newEvent.courseName} onChange={e => setNewEvent({...newEvent, courseName: e.target.value})} />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Location / City</label>
                        <input required type="text" placeholder="Address" className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold text-slate-800" value={newEvent.location} onChange={e => setNewEvent({...newEvent, location: e.target.value})} />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Start Date</label>
                        <input required type="date" className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold text-slate-800" value={newEvent.date} onChange={e => setNewEvent({...newEvent, date: e.target.value, endDate: e.target.value > newEvent.endDate ? e.target.value : newEvent.endDate})} />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Conclusion Date</label>
                        <input required type="date" min={newEvent.date} className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold text-slate-800" value={newEvent.endDate} onChange={e => setNewEvent({...newEvent, endDate: e.target.value})} />
                      </div>
                    </div>
                  </div>
                </section>

                <div className="pt-8 flex gap-4">
                  <button type="button" onClick={handleCloseAddModal} className="flex-1 py-5 text-slate-500 font-bold hover:bg-slate-100 rounded-[1.5rem] transition-all">Discard</button>
                  <button type="submit" className="flex-[2] py-5 bg-slate-950 text-white font-black rounded-[1.5rem] shadow-2xl hover:bg-slate-800 transition-all active:scale-[0.98] flex items-center justify-center gap-3">
                    {selectedEventId ? <CheckCircle2 className="w-5 h-5" /> : <Trophy className="w-5 h-5" />}
                    {selectedEventId ? 'Commit Changes' : 'Launch Tournament'}
                  </button>
                </div>
              </form>

              {/* Participants Side */}
              <div className="w-full md:w-80 bg-slate-50 overflow-hidden flex flex-col border-l border-slate-100">
                <div className="p-6 border-b border-slate-100 bg-white">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <UserCheck className="w-4 h-4 text-emerald-600" />
                      <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Attendance</h4>
                    </div>
                    <span className="text-xs font-black text-emerald-600 bg-emerald-100 px-2 py-1 rounded-lg">
                      {selectedParticipants.length} / {members.length}
                    </span>
                  </div>
                  <div className="relative mb-4">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                    <input 
                      type="text" 
                      placeholder="Search roster..." 
                      className="w-full pl-9 pr-4 py-2.5 bg-slate-100 border-none rounded-xl text-xs outline-none focus:ring-2 ring-emerald-500/20 font-bold"
                      value={participantSearch}
                      onChange={e => setParticipantSearch(e.target.value)}
                    />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={selectAllParticipants} className="flex-1 py-2 text-[9px] font-black uppercase text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-all">Select All</button>
                    <button onClick={clearParticipants} className="flex-1 py-2 text-[9px] font-black uppercase text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-all">Clear</button>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
                  {filteredMembersForSearch.length > 0 ? filteredMembersForSearch.map(member => {
                    const isSelected = selectedParticipants.includes(member.id);
                    return (
                      <button 
                        key={member.id} 
                        onClick={() => toggleParticipant(member.id)}
                        className={`w-full p-3 rounded-2xl flex items-center justify-between transition-all border ${
                          isSelected ? 'bg-white border-emerald-200 shadow-sm' : 'bg-transparent border-transparent hover:bg-slate-100'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <img src={member.avatar} className="w-8 h-8 rounded-xl border border-white shadow-sm" alt="" />
                          <div className="text-left">
                            <p className={`text-xs font-bold leading-none mb-1 ${isSelected ? 'text-slate-900' : 'text-slate-500'}`}>{member.name}</p>
                            <p className="text-[9px] font-black text-slate-400 uppercase">Hcp: {member.handicap}</p>
                          </div>
                        </div>
                        <div className={`w-5 h-5 rounded-lg flex items-center justify-center transition-all ${
                          isSelected ? 'bg-emerald-500 text-white' : 'bg-slate-200'
                        }`}>
                          {isSelected && <Check className="w-3 h-3" />}
                        </div>
                      </button>
                    );
                  }) : (
                    <div className="py-12 text-center">
                      <Users className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                      <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">No Members Found</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Events;
