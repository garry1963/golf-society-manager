
import React, { useState, useMemo } from 'react';
import { Season, Member, Event, ScoringSystem } from '../types';
import { 
  Plus, Calendar, Flag, CheckCircle2, Clock, X, ChevronRight, Trophy,
  ChevronLeft, Award, Zap, FileText, Download, ChevronDown, Table, Trash2, Edit3, BarChart3, MapPin, Crown,
  Medal,
  Users,
  Layers,
  Target,
  Activity,
  ClipboardList,
  AlertTriangle,
  Trash,
  LayoutGrid,
  ListOrdered,
  Star,
  ChevronUp,
  // Added missing CalendarDays import
  CalendarDays
} from 'lucide-react';

interface LeaderboardEntry {
  member: Member;
  totalPoints: number;
  eventsPlayed: number;
  bestFinish: number;
  avgScore: number;
  wonVenues: string[];
}

interface SeasonsProps {
  seasons: Season[];
  setSeasons: React.Dispatch<React.SetStateAction<Season[]>>;
  events: Event[];
  setEvents: React.Dispatch<React.SetStateAction<Event[]>>;
  members: Member[];
}

const Seasons: React.FC<SeasonsProps> = ({ seasons, setSeasons, events, setEvents, members }) => {
  const [viewingRankings, setViewingRankings] = useState<Season | null>(null);
  const [seasonSubView, setSeasonSubView] = useState<'leaderboard' | 'schedule'>('leaderboard');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingSeasonId, setEditingSeasonId] = useState<string | null>(null);
  const [showLinkEventModal, setShowLinkEventModal] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [deletingSeasonId, setDeletingSeasonId] = useState<string | null>(null);
  
  const [seasonForm, setSeasonForm] = useState<{
    name: string;
    startDate: string;
    endDate: string;
    description: string;
    status: 'active' | 'planned' | 'completed';
    scoringSystem: ScoringSystem;
  }>({
    name: '',
    startDate: '',
    endDate: '',
    description: '',
    status: 'planned',
    scoringSystem: 'points'
  });

  const POINTS_SYSTEM = [25, 18, 15, 12, 10, 8, 6, 4, 2, 1];

  const seasonLeaderboard = useMemo(() => {
    if (!viewingRankings) return [];
    const leaderboardMap = new Map<string, LeaderboardEntry>();
    const seasonEvents = events.filter(e => e.seasonId === viewingRankings.id && e.status === 'completed');
    const system = viewingRankings.scoringSystem || 'points';

    seasonEvents.forEach(event => {
      if (!event.results || event.results.length === 0) return;
      const sortedResults = [...event.results].sort((a, b) => a.score - b.score);
      const majorMultiplier = event.isMajor ? 2.0 : 1.0;

      sortedResults.forEach((result, index) => {
        const member = members.find(m => m.id === result.memberId);
        if (!member) return;

        const currentEntry = leaderboardMap.get(member.id) || {
          member,
          totalPoints: 0,
          eventsPlayed: 0,
          bestFinish: 99,
          avgScore: 0,
          wonVenues: []
        };

        if (system === 'points') {
          const points = POINTS_SYSTEM[index] || 1;
          currentEntry.totalPoints += points * majorMultiplier;
        } else if (system === 'stableford') {
          const simulatedPoints = Math.max(0, 108 - result.score); 
          currentEntry.totalPoints += simulatedPoints * majorMultiplier;
        } else if (system === 'medal') {
          currentEntry.totalPoints += result.score * majorMultiplier;
        }

        currentEntry.eventsPlayed += 1;
        currentEntry.bestFinish = Math.min(currentEntry.bestFinish, index + 1);
        currentEntry.avgScore = (currentEntry.avgScore * (currentEntry.eventsPlayed - 1) + result.score) / currentEntry.eventsPlayed;
        
        if (index === 0) {
          currentEntry.wonVenues = [...currentEntry.wonVenues, event.courseName];
        }
        
        leaderboardMap.set(member.id, currentEntry);
      });
    });

    const entries = Array.from(leaderboardMap.values());
    if (system === 'medal') return entries.sort((a, b) => a.totalPoints - b.totalPoints);
    return entries.sort((a, b) => b.totalPoints - a.totalPoints);
  }, [viewingRankings, events, members]);

  const handlePrintPDF = () => { setShowExportMenu(false); window.print(); };
  const handleExportCSV = () => {
    setShowExportMenu(false);
    if (!viewingRankings) return;
    const headers = ["Rank", "Member", "Events Played", "Avg Score", "Wins", "Season Total"];
    const rows = seasonLeaderboard.map((entry, idx) => [
      (idx + 1).toString(), 
      entry.member.name, 
      entry.eventsPlayed.toString(), 
      entry.avgScore.toFixed(2), 
      entry.wonVenues.join("; "),
      entry.totalPoints.toFixed(0)
    ]);
    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `${viewingRankings.name.replace(/\s+/g, '_')}_Leaderboard.csv`);
    link.click();
  };

  const handleOpenAddModal = () => {
    setEditingSeasonId(null);
    setSeasonForm({ name: '', startDate: '', endDate: '', description: '', status: 'planned', scoringSystem: 'points' });
    setShowAddModal(true);
  };

  const handleOpenEditModal = (season: Season) => {
    setEditingSeasonId(season.id);
    setSeasonForm({ 
      name: season.name, 
      startDate: season.startDate, 
      endDate: season.endDate, 
      description: season.description || '', 
      status: season.status, 
      scoringSystem: season.scoringSystem || 'points' 
    });
    setShowAddModal(true);
  };

  const handleSaveSeason = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingSeasonId) {
      setSeasons(prev => prev.map(s => s.id === editingSeasonId ? { ...s, ...seasonForm } : s));
    } else {
      const id = `s${Date.now()}`;
      const seasonToAdd: Season = { ...seasonForm, id, totalEvents: 0 };
      setSeasons(prev => [seasonToAdd, ...prev]);
    }
    setShowAddModal(false);
  };

  const linkEventToSeason = (eventId: string) => {
    if (!viewingRankings) return;
    setEvents(prev => prev.map(e => e.id === eventId ? { ...e, seasonId: viewingRankings.id } : e));
    setSeasons(prev => prev.map(s => s.id === viewingRankings.id ? { ...s, totalEvents: (s.totalEvents || 0) + 1 } : s));
    setShowLinkEventModal(false);
  };

  const executeSeasonDeletion = () => {
    if (!deletingSeasonId) return;
    setSeasons(prev => prev.filter(s => s.id !== deletingSeasonId));
    setEvents(prev => prev.map(e => e.seasonId === deletingSeasonId ? { ...e, seasonId: undefined } : e));
    setDeletingSeasonId(null);
    setViewingRankings(null);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active': return <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-100 text-emerald-700 uppercase tracking-wider"><CheckCircle2 className="w-3.5 h-3.5" /> Active</span>;
      case 'planned': return <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-100 text-blue-700 uppercase tracking-wider"><Clock className="w-3.5 h-3.5" /> Planned</span>;
      case 'completed': return <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 text-slate-600 uppercase tracking-wider">Completed</span>;
      default: return null;
    }
  };

  const getScoringLabel = (system?: ScoringSystem) => {
    switch (system) {
      case 'points': return 'Order of Merit (Points)';
      case 'stableford': return 'Stableford Aggregate';
      case 'medal': return 'Medal (Net Aggregate)';
      default: return 'Standard Points';
    }
  };

  if (viewingRankings) {
    const linkedEvents = events.filter(e => e.seasonId === viewingRankings.id).sort((a, b) => a.date.localeCompare(b.date));
    
    return (
      <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500 pb-20 printable-area">
        <div className="print-header hidden print:flex items-center justify-between mb-8 pb-8 border-b-2 border-slate-100">
          <div className="flex items-center gap-4">
            <div className="bg-emerald-900 p-3 rounded-2xl"><Trophy className="w-8 h-8 text-emerald-400" /></div>
            <div><h1 className="text-2xl font-black uppercase text-slate-900 tracking-tight">FairwayConnect Official Leaderboard</h1><p className="text-sm font-bold text-emerald-700 tracking-widest uppercase">{viewingRankings.name}</p></div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <button onClick={() => setViewingRankings(null)} className="p-3 bg-white border border-slate-200 hover:border-emerald-500 rounded-2xl text-slate-400 hover:text-emerald-600 transition-all shadow-sm no-print">
              <ChevronLeft className="w-6 h-6" />
            </button>
            <div>
              <h3 className="text-3xl font-black text-slate-900 tracking-tight">{viewingRankings.name}</h3>
              <p className="text-sm text-slate-500 font-bold uppercase tracking-widest mt-0.5">{getScoringLabel(viewingRankings.scoringSystem)} • {linkedEvents.length} Fixtures</p>
            </div>
          </div>

          <div className="flex items-center gap-3 no-print p-1 bg-slate-200/50 rounded-2xl w-fit">
            <button 
              onClick={() => setSeasonSubView('leaderboard')}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                seasonSubView === 'leaderboard' ? 'bg-slate-900 text-white shadow-xl' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <ListOrdered className="w-4 h-4" />
              Leaderboard
            </button>
            <button 
              onClick={() => setSeasonSubView('schedule')}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                seasonSubView === 'schedule' ? 'bg-slate-900 text-white shadow-xl' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <CalendarDays className="w-4 h-4" />
              Schedule
            </button>
          </div>
        </div>

        {seasonSubView === 'leaderboard' ? (
          <div className="space-y-8">
            {seasonLeaderboard.length > 0 ? (
              <div className="bg-white rounded-[4rem] border border-slate-100 shadow-2xl overflow-hidden avoid-break">
                <table className="w-full text-left">
                  <thead className="bg-slate-950 border-b border-slate-800">
                    <tr className="text-[10px] font-black uppercase text-slate-500 tracking-[0.4em]">
                      <th className="px-12 py-8 text-center">Rank</th>
                      <th className="px-12 py-8">Roster Member</th>
                      <th className="px-10 py-8 text-center">Fixtures</th>
                      <th className="px-10 py-8 text-center">Scoring Avg</th>
                      <th className="px-12 py-8 text-right">Aggregate Points</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {seasonLeaderboard.map((entry, idx) => (
                      <tr key={entry.member.id} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="px-12 py-8 text-center font-black text-3xl text-slate-200 group-hover:text-emerald-600 transition-colors italic">
                          {idx === 0 ? <Medal className="w-8 h-8 text-amber-500 mx-auto" /> : idx === 1 ? <Medal className="w-8 h-8 text-slate-400 mx-auto" /> : idx === 2 ? <Medal className="w-8 h-8 text-amber-700 mx-auto" /> : `#${idx + 1}`}
                        </td>
                        <td className="px-12 py-8">
                          <div className="flex items-center gap-5">
                            <img src={entry.member.avatar} className="w-14 h-14 rounded-2xl border border-slate-100 shadow-sm object-cover" alt="" />
                            <div>
                              <p className="text-xl font-black text-slate-900 leading-tight">{entry.member.name}</p>
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Hcp Index: {entry.member.handicap}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-10 py-8 text-center font-black text-slate-600 text-lg">{entry.eventsPlayed}</td>
                        <td className="px-10 py-8 text-center">
                          <div className="flex flex-col items-center">
                            <span className="text-lg font-black text-emerald-600 bg-emerald-50 px-4 py-2 rounded-2xl border border-emerald-100 shadow-sm">{entry.avgScore.toFixed(1)}</span>
                          </div>
                        </td>
                        <td className="px-12 py-8 text-right font-black text-3xl text-slate-950 tabular-nums">{entry.totalPoints.toFixed(0)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-40 text-center bg-white rounded-[4rem] border-2 border-dashed border-slate-100">
                <BarChart3 className="w-20 h-20 text-slate-200 mx-auto mb-6" />
                <h4 className="text-3xl font-black text-slate-800 tracking-tight">Data Sync Pending</h4>
                <p className="text-slate-400 font-bold max-w-sm mx-auto mt-2 leading-relaxed">The season results table is currently empty. Conclude linked tournaments to generate Order of Merit points.</p>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-slate-950 p-12 rounded-[4rem] text-white relative overflow-hidden shadow-2xl border border-white/5">
              <div className="absolute right-0 top-0 p-16 opacity-5 pointer-events-none rotate-12">
                <ClipboardList className="w-64 h-64" />
              </div>
              <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
                <div>
                  <h4 className="text-xs font-black text-emerald-400 uppercase tracking-[0.4em] mb-4">WHS Fixture Explorer</h4>
                  <h3 className="text-4xl font-black italic tracking-tight">Championship Schedule</h3>
                  <p className="text-slate-400 font-medium max-w-xl mt-4 leading-relaxed">Track every venue in this series. Major championships are highlighted with gold accents and provide 2x points for the overall standings.</p>
                </div>
                <div className="flex items-center gap-3">
                  <button onClick={() => setShowLinkEventModal(true)} className="px-8 py-4 bg-emerald-600 text-white font-black rounded-2xl shadow-xl hover:bg-emerald-500 transition-all flex items-center gap-3 active:scale-95">
                    <Plus className="w-5 h-5" /> Link Official Event
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {linkedEvents.map((event) => {
                const isCompleted = event.status === 'completed';
                const podium = isCompleted && event.results ? [...event.results].sort((a, b) => a.score - b.score).slice(0, 3) : [];
                
                return (
                  <div key={event.id} className={`bg-white rounded-[3rem] border shadow-sm group overflow-hidden flex flex-col transition-all duration-500 hover:shadow-2xl hover:-translate-y-2 ${event.isMajor ? 'border-amber-200 ring-2 ring-amber-500/10' : 'border-slate-100'}`}>
                    <div className={`h-32 p-8 flex items-center justify-between relative overflow-hidden ${event.isMajor ? 'bg-amber-50' : 'bg-slate-50'}`}>
                      {event.isMajor && <div className="absolute top-0 right-0 p-4"><Crown className="w-24 h-24 text-amber-500 opacity-5 -rotate-12" /></div>}
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{new Date(event.date).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}</p>
                        <h4 className="text-2xl font-black text-slate-900 group-hover:text-emerald-600 transition-colors line-clamp-1">{event.title}</h4>
                      </div>
                      <div className={`p-4 rounded-2xl flex flex-col items-center justify-center min-w-[70px] ${event.isMajor ? 'bg-amber-500 text-white shadow-lg' : 'bg-white text-slate-900 shadow-sm border border-slate-100'}`}>
                        <span className="text-[9px] font-black uppercase tracking-tighter">Day</span>
                        <span className="text-2xl font-black">{new Date(event.date).getDate()}</span>
                      </div>
                    </div>

                    <div className="p-8 flex-1 flex flex-col">
                      <div className="flex items-center gap-4 mb-8">
                        <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 text-slate-400">
                          <MapPin className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Venue Details</p>
                          <p className="text-sm font-bold text-slate-700 leading-tight">{event.courseName}</p>
                        </div>
                      </div>

                      {isCompleted ? (
                        <div className="space-y-4 mb-8">
                          <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                            <Trophy className="w-3.5 h-3.5 text-amber-500" /> Event Podium
                          </h5>
                          <div className="grid grid-cols-1 gap-2">
                            {podium.map((res, i) => {
                              const member = members.find(m => m.id === res.memberId);
                              return (
                                <div key={res.memberId} className={`flex items-center justify-between p-3 rounded-2xl border ${i === 0 ? 'bg-emerald-50 border-emerald-100' : 'bg-slate-50 border-slate-100'}`}>
                                  <div className="flex items-center gap-3">
                                    <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black ${i === 0 ? 'bg-amber-500 text-white shadow-sm' : i === 1 ? 'bg-slate-300 text-slate-600' : 'bg-amber-700 text-white'}`}>
                                      {i + 1}
                                    </div>
                                    <span className="text-xs font-black text-slate-800">{member?.name}</span>
                                  </div>
                                  <span className="text-xs font-black text-slate-600">{res.score} Net</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ) : (
                        <div className="bg-emerald-50/50 rounded-3xl p-6 border border-emerald-100 mb-8 flex flex-col items-center text-center">
                          <Activity className="w-8 h-8 text-emerald-500 mb-3" />
                          <h5 className="text-sm font-black text-emerald-900 mb-1">Entry Active</h5>
                          <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">{event.participants.length} Society Players Registered</p>
                        </div>
                      )}

                      <div className="mt-auto grid grid-cols-2 gap-3">
                        <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Base Points</p>
                          <p className="text-sm font-black text-slate-900">{event.isMajor ? '50 MAX (2X)' : '25 MAX'}</p>
                        </div>
                        <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Rounds</p>
                          <p className="text-sm font-black text-slate-900">{event.numberOfRounds || 1} Official</p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              {linkedEvents.length === 0 && (
                <div className="col-span-full py-40 text-center bg-white rounded-[4rem] border-2 border-dashed border-slate-100">
                  <ClipboardList className="w-20 h-20 text-slate-100 mx-auto mb-6" />
                  <h4 className="text-2xl font-black text-slate-900 tracking-tight">Schedule Unpopulated</h4>
                  <p className="text-slate-400 font-bold max-w-xs mx-auto mt-2 leading-relaxed">No society outings have been linked to this series. Link fixtures from the master calendar to begin tracking.</p>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between pt-12 border-t border-slate-100 no-print">
          <div className="flex items-center gap-6">
            <button 
              onClick={() => setDeletingSeasonId(viewingRankings.id)}
              className="flex items-center gap-3 px-6 py-4 bg-rose-50 text-rose-600 rounded-[1.5rem] border border-rose-100 hover:bg-rose-600 hover:text-white transition-all font-black text-xs uppercase tracking-widest active:scale-95 group"
            >
              <Trash2 className="w-5 h-5 group-hover:animate-bounce" />
              Retire Series
            </button>
            <div className="relative">
              <button onClick={() => setShowExportMenu(!showExportMenu)} className="flex items-center gap-3 px-8 py-4 bg-slate-950 text-white font-black text-xs uppercase rounded-[1.5rem] hover:bg-slate-800 transition-all shadow-2xl active:scale-95 group">
                <Download className="w-5 h-5 text-emerald-400" />
                Executive Export
                <ChevronUp className={`w-4 h-4 transition-transform ${showExportMenu ? 'rotate-0' : 'rotate-180'}`} />
              </button>
              {showExportMenu && (
                <div className="absolute bottom-full mb-4 right-0 w-64 bg-white border border-slate-100 rounded-[2.5rem] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.14)] p-4 z-20 animate-in slide-in-from-bottom-4 duration-300">
                  <p className="px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 mb-2">Authenticated Export</p>
                  <button onClick={handlePrintPDF} className="w-full flex items-center gap-3 px-5 py-4 rounded-2xl hover:bg-emerald-50 text-slate-700 font-black text-xs uppercase group">
                    <div className="p-2 bg-emerald-100 rounded-xl group-hover:bg-emerald-200 transition-colors"><FileText className="w-4 h-4" /></div>
                    Official PDF
                  </button>
                  <button onClick={handleExportCSV} className="w-full flex items-center gap-3 px-5 py-4 rounded-2xl hover:bg-blue-50 text-slate-700 font-black text-xs uppercase group">
                    <div className="p-2 bg-blue-100 rounded-xl group-hover:bg-blue-200 transition-colors"><Table className="w-4 h-4" /></div>
                    Raw Data (CSV)
                  </button>
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Authenticity Protocol</p>
            <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/50"></div>
          </div>
        </div>

        {showLinkEventModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-500" onClick={() => setShowLinkEventModal(false)} />
            <div className="relative bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-12 duration-500">
              <div className="bg-slate-900 p-10 text-white flex items-center justify-between">
                <div>
                  <h3 className="text-3xl font-black italic tracking-tight">Sync Master Fixtures</h3>
                  <p className="text-[10px] text-emerald-400 font-black uppercase tracking-[0.4em] mt-1">Season Registry Handshake</p>
                </div>
                <button onClick={() => setShowLinkEventModal(false)} className="p-4 hover:bg-white/10 rounded-2xl transition-all border border-white/10 shadow-inner"><X className="w-6 h-6" /></button>
              </div>
              <div className="p-10 space-y-4 max-h-[60vh] overflow-y-auto custom-scrollbar">
                {events.filter(e => !e.seasonId).length > 0 ? events.filter(e => !e.seasonId).map(event => (
                  <button key={event.id} onClick={() => linkEventToSeason(event.id)} className="w-full group flex items-center justify-between p-8 bg-slate-50 hover:bg-emerald-50 border border-slate-100 hover:border-emerald-200 rounded-[2rem] transition-all text-left">
                    <div className="flex items-center gap-6">
                      <div className="p-4 bg-white rounded-2xl shadow-sm border border-slate-100 text-slate-400 group-hover:text-emerald-600 transition-colors">
                        <MapPin className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-xl font-black text-slate-900 group-hover:text-emerald-700 transition-colors">{event.title}</p>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{event.courseName} • {new Date(event.date).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="p-3 bg-white rounded-xl shadow-sm border border-slate-100 text-emerald-600 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                      <Plus className="w-5 h-5" />
                    </div>
                  </button>
                )) : (
                  <div className="py-20 text-center flex flex-col items-center">
                    <Activity className="w-16 h-16 text-slate-100 mb-6" />
                    <h4 className="text-xl font-black text-slate-900">All Fixtures Synced</h4>
                    <p className="text-sm font-bold text-slate-400 mt-2">Every event on the calendar is already linked to a championship series.</p>
                  </div>
                )}
              </div>
              <div className="p-10 bg-slate-50 border-t border-slate-100 text-center">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Select an event to add it to this season's Order of Merit</p>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-3xl font-black text-slate-900 italic tracking-tight">Season Administration</h3>
          <p className="text-sm text-slate-500 font-bold uppercase tracking-widest mt-1">Official championship series and Order of Merit registry</p>
        </div>
        <button onClick={handleOpenAddModal} className="flex items-center gap-3 px-8 py-4 bg-slate-950 text-white font-black rounded-2xl shadow-2xl hover:bg-slate-800 transition-all active:scale-95 group">
          <Plus className="w-6 h-6 text-emerald-500 group-hover:rotate-90 transition-transform" />
          Establish New Series
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {seasons.map((season) => {
          const linkedEvents = events.filter(e => e.seasonId === season.id);
          const activePlayers = members.length;
          
          return (
            <div key={season.id} className="bg-white rounded-[4rem] border border-slate-100 shadow-xl p-12 hover:shadow-2xl transition-all group relative overflow-hidden flex flex-col">
              <div className={`absolute top-0 right-0 w-2 h-full transition-colors ${season.status === 'active' ? 'bg-emerald-500' : 'bg-slate-200'}`}></div>
              <div className="flex items-start justify-between mb-10">
                <div className={`p-5 rounded-[2rem] transition-all shadow-xl shadow-slate-900/5 ${season.status === 'active' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-400'}`}>
                  <Flag className="w-10 h-10" />
                </div>
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                  <button onClick={() => handleOpenEditModal(season)} className="p-3 bg-white text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl border border-slate-100 shadow-sm transition-all"><Edit3 className="w-5 h-5" /></button>
                  <button onClick={() => setDeletingSeasonId(season.id)} className="p-3 bg-white text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl border border-slate-100 shadow-sm transition-all"><Trash2 className="w-5 h-5" /></button>
                </div>
              </div>

              <div className="mb-10 flex-1">
                <div className="mb-3">{getStatusBadge(season.status)}</div>
                <h4 className="text-3xl font-black text-slate-900 leading-tight group-hover:text-emerald-700 transition-colors italic">{season.name}</h4>
                <p className="text-base text-slate-500 font-medium leading-relaxed mt-4 line-clamp-3">{season.description}</p>
              </div>

              <div className="grid grid-cols-3 gap-6 mb-10 pt-10 border-t border-slate-100">
                <div className="flex flex-col">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Scoring Engine</p>
                  <div className="flex items-center gap-2">
                    <Target className="w-3.5 h-3.5 text-emerald-500" />
                    <p className="text-xs font-black text-slate-800 uppercase">{season.scoringSystem?.toUpperCase()}</p>
                  </div>
                </div>
                <div className="flex flex-col">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Fixtures</p>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-blue-500" />
                    <p className="text-xs font-black text-slate-800">{linkedEvents.length} Official</p>
                  </div>
                </div>
                <div className="flex flex-col">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Active Field</p>
                  <div className="flex items-center gap-2">
                    <Users className="w-3.5 h-3.5 text-amber-500" />
                    <p className="text-xs font-black text-slate-800">{activePlayers} Players</p>
                  </div>
                </div>
              </div>

              <button onClick={() => setViewingRankings(season)} className="w-full py-5 bg-slate-950 text-white font-black rounded-3xl shadow-2xl hover:bg-emerald-600 transition-all flex items-center justify-center gap-3 group/btn active:scale-[0.98]">
                Open Championship Hub
                <ChevronRight className="w-5 h-5 group-hover/btn:translate-x-2 transition-transform" />
              </button>
            </div>
          );
        })}

        {seasons.length === 0 && (
          <div className="col-span-full py-40 text-center bg-white rounded-[4rem] border-2 border-dashed border-slate-100 shadow-inner flex flex-col items-center">
            <Trophy className="w-20 h-20 text-slate-100 mb-6" />
            <h4 className="text-2xl font-black text-slate-900">No Active Series</h4>
            <p className="text-slate-400 font-bold max-w-sm mx-auto mt-2 leading-relaxed">Establish a new championship series to begin tracking order of merit points across multiple tournaments.</p>
          </div>
        )}
      </div>

      {deletingSeasonId && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-500" onClick={() => setDeletingSeasonId(null)} />
          <div className="relative bg-white w-full max-w-md rounded-[3rem] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.2)] p-12 text-center animate-in zoom-in-95 duration-300">
            <div className="w-24 h-24 bg-rose-50 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 shadow-inner">
              <AlertTriangle className="w-12 h-12 text-rose-600" />
            </div>
            <h3 className="text-3xl font-black text-slate-900 tracking-tight italic">Retire Series?</h3>
            <p className="text-slate-500 font-bold text-sm leading-relaxed mb-10 px-4">
              Deleting this championship series will unlink all associated tournaments. Roster data will be preserved, but season rankings will be permanently wiped.
            </p>
            <div className="flex flex-col gap-3">
              <button 
                onClick={executeSeasonDeletion}
                className="w-full py-5 bg-rose-600 text-white font-black rounded-2xl shadow-xl shadow-rose-900/20 hover:bg-rose-700 active:scale-[0.98] transition-all flex items-center justify-center gap-3"
              >
                <Trash className="w-5 h-5" />
                Confirm Retirement
              </button>
              <button 
                onClick={() => setDeletingSeasonId(null)}
                className="w-full py-5 bg-slate-100 text-slate-600 font-black rounded-2xl hover:bg-slate-200 active:scale-[0.98] transition-all"
              >
                Cancel Deletion
              </button>
            </div>
          </div>
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-500" onClick={() => setShowAddModal(false)} />
          <div className="relative bg-white w-full max-w-2xl rounded-[3.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-8 duration-500">
            <div className="bg-slate-900 p-10 text-white flex items-center justify-between">
              <div>
                <h3 className="text-3xl font-black italic tracking-tight">{editingSeasonId ? 'Reconfigure Series' : 'Establish Championship'}</h3>
                <p className="text-[10px] text-emerald-400 font-black uppercase tracking-[0.4em] mt-1">Series Registry Protocol</p>
              </div>
              <button onClick={() => setShowAddModal(false)} className="p-4 hover:bg-white/10 rounded-2xl transition-all border border-white/10 shadow-inner"><X className="w-6 h-6" /></button>
            </div>
            <form onSubmit={handleSaveSeason} className="p-10 space-y-8">
              <div className="space-y-6">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 px-1">Championship Title</label>
                  <input required type="text" placeholder="e.g. 2025 Order of Merit" className="w-full px-6 py-5 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 ring-emerald-500/10 font-black text-slate-900 transition-all" value={seasonForm.name} onChange={e => setSeasonForm({...seasonForm, name: e.target.value})} />
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 px-1">Series Start</label>
                    <div className="relative">
                      <input required type="date" className="w-full px-6 py-5 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-black text-slate-900 appearance-none" value={seasonForm.startDate} onChange={e => setSeasonForm({...seasonForm, startDate: e.target.value})} />
                      <Calendar className="absolute right-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 px-1">Series Conclusion</label>
                    <div className="relative">
                      <input required type="date" className="w-full px-6 py-5 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-black text-slate-900 appearance-none" value={seasonForm.endDate} onChange={e => setSeasonForm({...seasonForm, endDate: e.target.value})} />
                      <Calendar className="absolute right-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 px-1">Administrative Notes</label>
                  <textarea rows={3} placeholder="Brief summary of series rules or major dates..." className="w-full px-6 py-5 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 ring-emerald-500/10 font-bold text-slate-700 transition-all resize-none" value={seasonForm.description} onChange={e => setSeasonForm({...seasonForm, description: e.target.value})} />
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 px-1">Scoring Methodology</label>
                    <div className="relative">
                      <select className="w-full px-6 py-5 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-black text-slate-900 appearance-none cursor-pointer" value={seasonForm.scoringSystem} onChange={e => setSeasonForm({...seasonForm, scoringSystem: e.target.value as ScoringSystem})}>
                        <option value="points">Order of Merit (Points)</option>
                        <option value="stableford">Aggregate Stableford</option>
                        <option value="medal">Net Medal Aggregate</option>
                      </select>
                      <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 px-1">Registry Status</label>
                    <div className="relative">
                      <select className="w-full px-6 py-5 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-black text-slate-900 appearance-none cursor-pointer" value={seasonForm.status} onChange={e => setSeasonForm({...seasonForm, status: e.target.value as any})}>
                        <option value="planned">Planned</option>
                        <option value="active">Active</option>
                        <option value="completed">Completed</option>
                      </select>
                      <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex gap-4 pt-6">
                <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-5 font-black text-slate-500 hover:bg-slate-50 rounded-2xl transition-all uppercase text-[10px] tracking-widest">Discard</button>
                <button type="submit" className="flex-[2] py-5 bg-slate-950 text-white font-black rounded-2xl shadow-2xl hover:bg-slate-800 transition-all active:scale-[0.98] uppercase text-xs tracking-widest">Commit to Registry</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Seasons;
