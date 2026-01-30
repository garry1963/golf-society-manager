
import React, { useState, useEffect } from 'react';
import { MOCK_EVENTS, MOCK_MEMBERS, MOCK_SEASONS } from '../constants';
import { Event, Member, Facility } from '../types';
import { generateEventReminder } from '../services/geminiService';
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
  LayoutGrid, 
  Ruler, 
  Clock,
  Save,
  Award,
  ListOrdered,
  Bell,
  Send,
  Loader2,
  Sparkles,
  MailCheck,
  Info,
  RotateCcw,
  History,
  Building2,
  Crown,
  Zap,
  SearchCheck,
  Search,
  Layers
} from 'lucide-react';

interface EventsProps {
  prefilled?: { courseName: string, location: string } | null;
  onModalClose?: () => void;
  savedFacilities?: Facility[];
  onSearchCourse?: () => void;
}

const Events: React.FC<EventsProps> = ({ prefilled, onModalClose, savedFacilities = [], onSearchCourse }) => {
  const [events, setEvents] = useState<Event[]>(MOCK_EVENTS);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showResultsModal, setShowResultsModal] = useState(false);
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  
  // States for reminders
  const [isGeneratingReminder, setIsGeneratingReminder] = useState(false);
  const [reminderDraft, setReminderDraft] = useState('');
  const [isSendingReminders, setIsSendingReminders] = useState(false);

  // Temporary state for editing results
  const [tempResults, setTempResults] = useState<{ memberId: string; score: number }[]>([]);

  const [newEvent, setNewEvent] = useState({
    title: '',
    date: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    numberOfRounds: 1,
    courseName: '',
    location: '',
    seasonId: '',
    isMajor: false
  });

  // Handle prefilled data from navigation
  useEffect(() => {
    if (prefilled) {
      setNewEvent(prev => ({
        ...prev,
        courseName: prefilled.courseName,
        location: prefilled.location
      }));
      setShowAddModal(true);
    }
  }, [prefilled]);

  const handleCreateEvent = (e: React.FormEvent) => {
    e.preventDefault();
    const id = `e${events.length + 1}`;
    const eventToAdd: Event = {
      ...newEvent,
      id,
      status: 'upcoming',
      participants: []
    };
    setEvents([eventToAdd, ...events]);
    handleCloseAddModal();
  };

  const handleCloseAddModal = () => {
    setShowAddModal(false);
    setNewEvent({
      title: '',
      date: new Date().toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0],
      numberOfRounds: 1,
      courseName: '',
      location: '',
      seasonId: '',
      isMajor: false
    });
    if (onModalClose) onModalClose();
  };

  const handleFacilitySelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const facilityId = e.target.value;
    const facility = savedFacilities.find(f => f.id === facilityId);
    if (facility) {
      setNewEvent(prev => ({
        ...prev,
        courseName: facility.name,
        location: facility.address
      }));
    }
  };

  const openResultsModal = (event: Event) => {
    setSelectedEventId(event.id);
    const existingResults = event.results || [];
    const initializedResults = event.participants.map(pId => {
      const existing = existingResults.find(r => r.memberId === pId);
      if (existing) return { ...existing };
      
      const member = MOCK_MEMBERS.find(m => m.id === pId);
      return { 
        memberId: pId, 
        score: member ? Math.round(member.averageScore) : 72 
      };
    });
    setTempResults(initializedResults);
    setShowResultsModal(true);
  };

  const handleSaveResults = () => {
    if (!selectedEventId) return;
    
    setEvents(prev => prev.map(e => {
      if (e.id === selectedEventId) {
        return { 
          ...e, 
          results: [...tempResults].sort((a, b) => a.score - b.score),
          status: 'completed' 
        };
      }
      return e;
    }));
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

  const resetScoreToAverage = (index: number, memberId: string) => {
    const member = MOCK_MEMBERS.find(m => m.id === memberId);
    if (!member) return;
    setTempResults(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], score: Math.round(member.averageScore) };
      return updated;
    });
  };

  const openReminderModal = async (event: Event) => {
    setSelectedEventId(event.id);
    setShowReminderModal(true);
    setIsGeneratingReminder(true);
    
    const draft = await generateEventReminder(
      event.title, 
      event.courseName, 
      event.date, 
      event.participants.length
    );
    
    setReminderDraft(draft);
    setIsGeneratingReminder(false);
  };

  const handleSendReminders = async () => {
    setIsSendingReminders(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setEvents(prev => prev.map(e => {
      if (e.id === selectedEventId) {
        return { ...e, lastReminderSent: new Date().toISOString() };
      }
      return e;
    }));
    
    setIsSendingReminders(false);
    setShowReminderModal(false);
    setSelectedEventId(null);
  };

  const formatDateRange = (startDate: string, endDate?: string) => {
    if (!endDate || startDate === endDate) {
      return new Date(startDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    }
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear()) {
      return `${start.getDate()} - ${end.getDate()} ${start.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}`;
    }
    
    return `${start.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} - ${end.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`;
  };

  const selectedEvent = events.find(e => e.id === selectedEventId);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-left-4 duration-500 pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-slate-800">Tournament Schedule</h3>
          <p className="text-sm text-slate-500">Manage upcoming and past society outings</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white font-bold rounded-2xl hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/10 active:scale-95"
        >
          <Plus className="w-5 h-5" />
          Create Event
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {events.map((event) => {
          const isCompleted = event.status === 'completed';
          const season = MOCK_SEASONS.find(s => s.id === event.seasonId);
          const isMultiDay = event.endDate && event.date !== event.endDate;
          const topPerformers = event.results?.slice(0, 3) || [];
          
          return (
            <div key={event.id} className={`bg-white rounded-3xl border shadow-sm overflow-hidden flex flex-col md:flex-row group transition-all duration-500 hover:shadow-md ${
              event.isMajor ? 'border-amber-200 ring-2 ring-amber-500/10 shadow-amber-500/5' : 'border-slate-100'
            } ${
              isCompleted ? 'opacity-70 saturate-50' : 'opacity-100'
            }`}>
              <div className={`w-full md:w-48 p-6 flex flex-col items-center justify-center text-center transition-colors duration-500 ${
                event.isMajor && !isCompleted ? 'bg-amber-50' : isCompleted ? 'bg-slate-100' : 'bg-emerald-50'
              }`}>
                <p className="text-[10px] font-bold uppercase tracking-widest mb-1 text-slate-400">
                  {new Date(event.date).toLocaleDateString('en-GB', { month: 'short' })}
                </p>
                <div className="flex items-center justify-center gap-1">
                  <p className={`text-4xl font-black transition-colors ${
                    isCompleted ? 'text-slate-400' : event.isMajor ? 'text-amber-600' : 'text-emerald-600'
                  }`}>
                    {new Date(event.date).toLocaleDateString('en-GB', { day: '2-digit' })}
                  </p>
                  {isMultiDay && (
                    <>
                      <span className="text-slate-300 font-bold">-</span>
                      <p className={`text-4xl font-black transition-colors ${
                        isCompleted ? 'text-slate-400' : event.isMajor ? 'text-amber-600' : 'text-emerald-600'
                      }`}>
                        {new Date(event.endDate!).toLocaleDateString('en-GB', { day: '2-digit' })}
                      </p>
                    </>
                  )}
                </div>
                <p className="text-[10px] font-bold text-slate-500 mt-1 uppercase tracking-tighter">
                  {isMultiDay ? 'Championship Weekend' : new Date(event.date).toLocaleDateString('en-GB', { weekday: 'long' })}
                </p>
              </div>

              <div className="flex-1 p-6 flex flex-col justify-between relative">
                {isCompleted && (
                  <div className="absolute top-6 right-6 no-print">
                    <History className="w-12 h-12 text-slate-100 rotate-12" />
                  </div>
                )}
                
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-black px-2 py-1 rounded-md uppercase tracking-wider ${
                        isCompleted ? 'bg-slate-200 text-slate-500' : 'bg-emerald-100 text-emerald-700'
                      }`}>
                        {event.status}
                      </span>
                      {event.isMajor && (
                        <span className="flex items-center gap-1 text-[10px] font-black px-2 py-1 rounded-md uppercase tracking-wider bg-amber-500 text-white shadow-sm shadow-amber-500/20">
                          <Crown className="w-3 h-3" />
                          Major Championship
                        </span>
                      )}
                      {season && (
                        <span className={`flex items-center gap-1 text-[10px] font-black px-2 py-1 rounded-md uppercase tracking-wider ${
                          isCompleted ? 'bg-slate-100 text-slate-400' : 'bg-slate-800 text-white'
                        }`}>
                          <Flag className="w-3 h-3" />
                          {season.name}
                        </span>
                      )}
                    </div>
                    {isCompleted && event.results && event.results.length > 0 && <Trophy className="w-5 h-5 text-amber-400" />}
                  </div>
                  
                  <h4 className={`text-xl font-black mb-1 transition-all ${
                    isCompleted ? 'line-through text-slate-400 italic' : 'text-slate-800'
                  }`}>
                    {event.title}
                  </h4>

                  <div className="flex flex-wrap items-center gap-4 text-[11px] font-bold text-slate-400 mb-4">
                    <div className="flex items-center gap-1">
                      <Calendar className={`w-3.5 h-3.5 ${isCompleted ? 'text-slate-300' : 'text-emerald-500'}`} />
                      {formatDateRange(event.date, event.endDate)}
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPin className={`w-3.5 h-3.5 ${isCompleted ? 'text-slate-300' : 'text-emerald-500'}`} />
                      {event.courseName}
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className={`w-3.5 h-3.5 ${isCompleted ? 'text-slate-300' : 'text-emerald-500'}`} />
                      {event.participants.length} Members
                    </div>
                    {(event.numberOfRounds || 1) > 1 && (
                      <div className="flex items-center gap-1 text-emerald-600">
                        <Layers className="w-3.5 h-3.5" />
                        {event.numberOfRounds} Rounds
                      </div>
                    )}
                  </div>
                  
                  {isCompleted && event.results && event.results.length > 0 ? (
                    <div className="bg-slate-50/50 rounded-2xl p-4 border border-slate-100/50 mb-4">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                        <Award className="w-3 h-3 text-amber-500/50" />
                        Final Leaderboard
                      </p>
                      <div className="space-y-2">
                        {topPerformers.map((res, i) => {
                          const member = MOCK_MEMBERS.find(m => m.id === res.memberId);
                          return (
                            <div key={res.memberId} className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className={`text-[10px] font-black w-4 ${i === 0 ? 'text-amber-500' : 'text-slate-300'}`}>#{i+1}</span>
                                <span className="text-[10px] font-black text-slate-600">{member?.name}</span>
                              </div>
                              <span className="text-[10px] font-black text-slate-900">{res.score}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between bg-slate-50 rounded-2xl p-3 border border-slate-100">
                      <div className="inline-flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                        <Ruler className="w-3.5 h-3.5 text-emerald-600" />
                        Scout Course in Search
                      </div>
                      {event.lastReminderSent && (
                        <div className="flex items-center gap-1.5 text-[10px] font-black text-emerald-600 uppercase">
                          <MailCheck className="w-3.5 h-3.5" />
                          Reminders Sent
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="mt-6 flex items-center justify-between">
                  <div className="flex -space-x-2">
                    {event.participants.slice(0, 4).map((id, idx) => {
                      const member = MOCK_MEMBERS.find(m => m.id === id);
                      return (
                        <img 
                          key={idx}
                          src={member?.avatar} 
                          className={`w-8 h-8 rounded-full border-2 border-white shadow-sm transition-all ${isCompleted ? 'grayscale opacity-50' : ''}`}
                          title={member?.name}
                          alt=""
                        />
                      );
                    })}
                    {event.participants.length > 4 && (
                      <div className="w-8 h-8 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-500 shadow-sm">
                        +{event.participants.length - 4}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {!isCompleted && (
                      <button 
                        onClick={() => openReminderModal(event)}
                        className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all no-print"
                        title="Send Reminders"
                      >
                        <Bell className="w-5 h-5" />
                      </button>
                    )}
                    <button 
                      onClick={() => openResultsModal(event)}
                      className="flex items-center gap-1 text-xs font-black text-slate-800 hover:text-emerald-600 transition-colors group no-print"
                    >
                      {isCompleted ? 'Update Results' : 'Finalize Event'}
                      <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {showReminderModal && selectedEvent && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowReminderModal(false)} />
          <div className="relative bg-white w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="bg-emerald-900 p-6 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-emerald-500 p-2 rounded-xl">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">Smart Reminders</h3>
                  <p className="text-xs text-emerald-300">Personalized for {selectedEvent.participants.length} players</p>
                </div>
              </div>
              <button onClick={() => setShowReminderModal(false)} className="p-2 hover:bg-white/10 rounded-lg"><X className="w-5 h-5" /></button>
            </div>

            <div className="p-8 space-y-6">
              {isGeneratingReminder ? (
                <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
                  <div className="w-16 h-16 bg-emerald-50 rounded-3xl flex items-center justify-center animate-pulse">
                    <Sparkles className="w-8 h-8 text-emerald-600 animate-spin" />
                  </div>
                  <div>
                    <p className="text-lg font-bold text-slate-800">The Pro is drafting...</p>
                    <p className="text-sm text-slate-500">Creating a witty reminder for your society</p>
                  </div>
                </div>
              ) : (
                <>
                  <div className="space-y-4">
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest">Message Preview</label>
                    <textarea 
                      className="w-full h-48 px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm leading-relaxed text-slate-700 outline-none focus:ring-2 ring-emerald-500/20 focus:border-emerald-500 transition-all resize-none custom-scrollbar"
                      value={reminderDraft}
                      onChange={(e) => setReminderDraft(e.target.value)}
                    />
                  </div>

                  <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 flex gap-3">
                    <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                    <p className="text-xs text-blue-800 leading-relaxed font-medium">
                      This reminder will be sent to all <strong>{selectedEvent.participants.length}</strong> participants via email and in-app notification.
                    </p>
                  </div>
                </>
              )}
            </div>

            <div className="p-8 border-t border-slate-100 flex items-center gap-4 bg-slate-50/50">
              <button 
                onClick={() => setShowReminderModal(false)}
                className="flex-1 py-4 text-slate-600 font-bold hover:bg-slate-50 rounded-2xl transition-all"
              >
                Discard
              </button>
              <button 
                onClick={handleSendReminders}
                disabled={isGeneratingReminder || isSendingReminders || !reminderDraft}
                className="flex-[2] flex items-center justify-center gap-3 py-4 bg-slate-900 text-white font-bold rounded-2xl shadow-xl shadow-slate-900/20 hover:bg-slate-800 transition-all disabled:opacity-50"
              >
                {isSendingReminders ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Deploying Reminders...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    Broadcast Now
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {showResultsModal && selectedEvent && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowResultsModal(false)} />
          <div className="relative bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="bg-slate-900 p-8 text-white flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="bg-emerald-500 p-3 rounded-2xl">
                  <ListOrdered className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-2xl font-black">Score Input</h3>
                  <p className="text-xs text-emerald-300 font-bold uppercase tracking-widest">{selectedEvent.title} • {selectedEvent.courseName}</p>
                </div>
              </div>
              <button onClick={() => setShowResultsModal(false)} className="p-2 hover:bg-white/10 rounded-xl transition-colors"><X className="w-6 h-6" /></button>
            </div>

            <div className="p-8 max-h-[60vh] overflow-y-auto custom-scrollbar bg-slate-50/30">
              <div className="space-y-4">
                {selectedEvent.participants.length === 0 ? (
                  <div className="py-20 text-center">
                    <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
                      <Users className="w-10 h-10 text-slate-300" />
                    </div>
                    <p className="text-slate-500 font-bold">No participants registered for this event.</p>
                  </div>
                ) : (
                  tempResults.map((result, idx) => {
                    const member = MOCK_MEMBERS.find(m => m.id === result.memberId);
                    return (
                      <div key={result.memberId} className="flex flex-col sm:flex-row items-center justify-between p-5 bg-white rounded-3xl border border-slate-100 shadow-sm hover:border-emerald-200 transition-all gap-4">
                        <div className="flex items-center gap-4 flex-1">
                          <img src={member?.avatar} className="w-12 h-12 rounded-full border-2 border-slate-50 shadow-sm" alt="" />
                          <div>
                            <p className="text-base font-black text-slate-800">{member?.name}</p>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">HCP {member?.handicap}</span>
                              <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded uppercase tracking-tighter">Avg: {member?.averageScore}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-4 bg-slate-50 p-2 rounded-2xl border border-slate-100">
                          <button 
                            type="button"
                            onClick={() => adjustScore(idx, -1)}
                            className="w-10 h-10 flex items-center justify-center bg-white hover:bg-rose-50 hover:text-rose-600 text-slate-400 rounded-xl shadow-sm border border-slate-100 transition-all active:scale-90"
                          >
                            <Minus className="w-5 h-5" />
                          </button>
                          
                          <div className="flex flex-col items-center min-w-[60px]">
                            <input 
                              type="number"
                              className="w-full bg-transparent text-center text-xl font-black text-slate-800 outline-none p-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                              value={result.score}
                              onChange={(e) => {
                                const newResults = [...tempResults];
                                newResults[idx].score = parseInt(e.target.value) || 0;
                                setTempResults(newResults);
                              }}
                            />
                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Gross</span>
                          </div>

                          <button 
                            type="button"
                            onClick={() => adjustScore(idx, 1)}
                            className="w-10 h-10 flex items-center justify-center bg-white hover:bg-emerald-50 hover:text-emerald-600 text-slate-400 rounded-xl shadow-sm border border-slate-100 transition-all active:scale-90"
                          >
                            <Plus className="w-5 h-5" />
                          </button>

                          <div className="w-px h-8 bg-slate-200 mx-1"></div>

                          <button 
                            type="button"
                            onClick={() => resetScoreToAverage(idx, result.memberId)}
                            className="p-2.5 text-slate-400 hover:text-blue-600 transition-colors"
                            title="Reset to member average"
                          >
                            <RotateCcw className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div className="p-8 border-t border-slate-100 flex items-center gap-4 bg-white">
              <button 
                onClick={() => setShowResultsModal(false)}
                className="flex-1 py-4 text-slate-600 font-bold hover:bg-slate-50 rounded-2xl transition-all"
              >
                Discard
              </button>
              <button 
                onClick={handleSaveResults}
                disabled={selectedEvent.participants.length === 0}
                className="flex-[2] flex items-center justify-center gap-3 py-5 bg-slate-900 text-white font-black rounded-2xl shadow-2xl shadow-slate-900/20 hover:bg-slate-800 transition-all disabled:opacity-50"
              >
                <Save className="w-5 h-5" />
                Finalize Results
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Event Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={handleCloseAddModal}
          />
          <div className="relative bg-white w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="bg-slate-900 p-6 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-emerald-500 p-2 rounded-xl">
                  <LayoutGrid className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-bold">Organize New Tournament</h3>
              </div>
              <button 
                onClick={handleCloseAddModal}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleCreateEvent} className="p-8 space-y-6">
              <div className="space-y-4">
                {savedFacilities.length > 0 && (
                  <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100 mb-2">
                    <label className="block text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-2 flex items-center gap-2">
                      <Building2 className="w-3.5 h-3.5" />
                      Select from Society Registry
                    </label>
                    <select 
                      onChange={handleFacilitySelect}
                      className="w-full px-4 py-2 bg-white border border-emerald-100 rounded-xl outline-none focus:ring-2 ring-emerald-500/20 text-sm font-bold text-slate-800"
                    >
                      <option value="">-- Choose a Saved Facility --</option>
                      {savedFacilities.map(f => (
                        <option key={f.id} value={f.id}>{f.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Event Title</label>
                  <input 
                    required
                    type="text" 
                    placeholder="e.g., Summer Invitational"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:ring-2 ring-emerald-500/20 focus:border-emerald-500 transition-all"
                    value={newEvent.title}
                    onChange={e => setNewEvent({...newEvent, title: e.target.value})}
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-amber-50 rounded-2xl border border-amber-100">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-amber-500 rounded-lg text-white">
                      <Crown className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-black text-amber-800 uppercase tracking-wider">Major Tournament</p>
                        <span className="px-1.5 py-0.5 bg-amber-200 text-amber-900 rounded text-[8px] font-black">2.0x MULTIPLIER</span>
                      </div>
                      <p className="text-[10px] text-amber-600 font-bold leading-tight">Double Points, Stableford or Medal weighting applies</p>
                    </div>
                  </div>
                  <button 
                    type="button"
                    onClick={() => setNewEvent({...newEvent, isMajor: !newEvent.isMajor})}
                    className={`w-12 h-6 rounded-full transition-all relative ${newEvent.isMajor ? 'bg-amber-500 shadow-inner' : 'bg-slate-300 shadow-inner'}`}
                  >
                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow-md transition-all ${newEvent.isMajor ? 'left-7' : 'left-1'}`} />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Start Date</label>
                    <input 
                      required
                      type="date" 
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:ring-2 ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm"
                      value={newEvent.date}
                      onChange={e => {
                        const newDate = e.target.value;
                        setNewEvent({
                          ...newEvent, 
                          date: newDate,
                          endDate: newDate > newEvent.endDate ? newDate : newEvent.endDate
                        });
                      }}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">End Date (Optional)</label>
                    <input 
                      required
                      type="date" 
                      min={newEvent.date}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:ring-2 ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm"
                      value={newEvent.endDate}
                      onChange={e => setNewEvent({...newEvent, endDate: e.target.value})}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Tournament Rounds</label>
                    <div className="flex items-center gap-3 bg-slate-50 p-2 rounded-xl border border-slate-100">
                      <button 
                        type="button"
                        onClick={() => setNewEvent({...newEvent, numberOfRounds: Math.max(1, newEvent.numberOfRounds - 1)})}
                        className="w-10 h-10 flex items-center justify-center bg-white border border-slate-100 rounded-lg text-slate-500 hover:text-emerald-600 transition-colors shadow-sm"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="flex-1 text-center font-black text-slate-800">{newEvent.numberOfRounds}</span>
                      <button 
                        type="button"
                        onClick={() => setNewEvent({...newEvent, numberOfRounds: Math.min(4, newEvent.numberOfRounds + 1)})}
                        className="w-10 h-10 flex items-center justify-center bg-white border border-slate-100 rounded-lg text-slate-500 hover:text-emerald-600 transition-colors shadow-sm"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Course Name</label>
                    <div className="relative group/input">
                      <input 
                        required
                        type="text" 
                        placeholder="e.g., Wentworth Club"
                        className="w-full pl-4 pr-12 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:ring-2 ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm"
                        value={newEvent.courseName}
                        onChange={e => setNewEvent({...newEvent, courseName: e.target.value})}
                      />
                      <button 
                        type="button"
                        onClick={onSearchCourse}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-600 hover:text-white transition-all shadow-sm border border-emerald-100"
                        title="Search USGA Database"
                      >
                        <Search className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Location</label>
                    <input 
                      required
                      type="text" 
                      placeholder="e.g., Virginia Water"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:ring-2 ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm"
                      value={newEvent.location}
                      onChange={e => setNewEvent({...newEvent, location: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Link to Season (Optional)</label>
                    <select 
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:ring-2 ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm font-medium"
                      value={newEvent.seasonId}
                      onChange={e => setNewEvent({...newEvent, seasonId: e.target.value})}
                    >
                      <option value="">None / One-off Event</option>
                      {MOCK_SEASONS.map(season => (
                        <option key={season.id} value={season.id}>{season.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 pt-4 border-t border-slate-100">
                <button 
                  type="button" 
                  onClick={handleCloseAddModal}
                  className="flex-1 py-3 text-slate-600 font-bold hover:bg-slate-50 rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-[2] py-4 bg-slate-900 text-white font-bold rounded-xl shadow-lg shadow-slate-900/20 hover:bg-slate-800 transition-all"
                >
                  Finalize Event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Events;
