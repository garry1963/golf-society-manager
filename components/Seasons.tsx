
import React, { useState, useMemo } from 'react';
import { Season, Member, Event, ScoringSystem } from '../types';
import { 
  Plus, Calendar, Flag, CheckCircle2, Clock, X, MoreVertical, ChevronRight, Trophy,
  ChevronLeft, Award, Zap, FileText, Download, ChevronDown, Table, Trash2, Edit3, AlignLeft, BarChart3, MapPin, Link as LinkIcon, Crown,
  User,
  Medal,
  Users,
  Layers,
  Map as MapIcon,
  CircleDot,
  BarChart,
  Target,
  UserCheck,
  Star,
  Activity,
  ArrowUpRight,
  ClipboardList,
  Building2
} from 'lucide-react';

interface LeaderboardEntry {
  member: Member;
  totalPoints: number;
  eventsPlayed: number;
  bestFinish: number;
  avgScore: number;
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
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingSeasonId, setEditingSeasonId] = useState<string | null>(null);
  const [showLinkEventModal, setShowLinkEventModal] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [showExportMenu, setShowExportMenu] = useState(false);
  
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
      if (!event.results) return;
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
          avgScore: 0
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
    const headers = ["Rank", "Member", "Events Played", "Avg Score", "Best Finish", "Season Total"];
    const rows = seasonLeaderboard.map((entry, idx) => [(idx + 1).toString(), entry.member.name, entry.eventsPlayed.toString(), entry.avgScore.toFixed(2), entry.bestFinish.toString(), entry.totalPoints.toFixed(0)]);
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
    setActiveMenuId(null);
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

  const handleDeleteSeason = (id: string) => {
    if (window.confirm(`Delete this season?`)) {
      setSeasons(prev => prev.filter(s => s.id !== id));
      setEvents(prev => prev.map(e => e.seasonId === id ? { ...e, seasonId: undefined } : e));
      setActiveMenuId(null);
    }
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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button onClick={() => setViewingRankings(null)} className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-600 no-print">
              <ChevronLeft className="w-6 h-6" />
            </button>
            <div>
              <h3 className="text-2xl font-black text-slate-800">{viewingRankings.name} Leaderboard</h3>
              <p className="text-sm text-slate-500 font-medium">{getScoringLabel(viewingRankings.scoringSystem)} • {linkedEvents.length} Official Tournaments</p>
            </div>
          </div>
          <div className="flex items-center gap-3 no-print">
            <button onClick={() => setShowLinkEventModal(true)} className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-black text-xs uppercase bg-emerald-600 text-white shadow-xl hover:bg-emerald-700">Link Event</button>
            <div className="relative">
              <button onClick={() => setShowExportMenu(!showExportMenu)} className="flex items-center gap-3 px-5 py-2.5 bg-slate-900 text-white font-black text-xs uppercase rounded-xl hover:bg-slate-800 transition-all shadow-xl group"><Download className="w-4 h-4 text-emerald-400" />Export Center <ChevronDown className={`w-4 h-4 transition-transform ${showExportMenu ? 'rotate-180' : ''}`} /></button>
              {showExportMenu && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowExportMenu(false)} />
                  <div className="absolute right-0 mt-3 w-64 bg-white border border-slate-100 rounded-[2rem] shadow-2xl p-3 z-20"><button onClick={handlePrintPDF} className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl hover:bg-emerald-50 text-slate-700 font-black text-xs uppercase"><FileText className="w-4 h-4" /> PDF Report</button><button onClick={handleExportCSV} className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl hover:bg-blue-50 text-slate-700 font-black text-xs uppercase"><Table className="w-4 h-4" /> Export CSV</button></div>
                </>
              )}
            </div>
          </div>
        </div>
        
        {/* Championship Schedule Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-3 bg-slate-100 border border-slate-200 rounded-[3.5rem] p-12 no-print overflow-hidden relative shadow-inner">
            <div className="absolute top-0 right-0 p-12 opacity-[0.03] pointer-events-none">
              <ClipboardList className="w-64 h-64" />
            </div>
            
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 relative z-10">
              <div>
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-3 mb-2">
                  <Calendar className="w-5 h-5 text-emerald-600" /> Tournament Lineup & Venues
                </h4>
                <p className="text-sm font-bold text-slate-500 max-w-xl">A complete record of all golf courses visited during this championship season.</p>
              </div>
              <div className="flex items-center gap-4 bg-white/80 backdrop-blur-sm p-4 rounded-3xl border border-slate-200">
                <div className="flex flex-col items-center px-4 border-r border-slate-100">
                   <span className="text-xl font-black text-emerald-600">{linkedEvents.length}</span>
                   <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Total Events</span>
                </div>
                <div className="flex flex-col items-center px-4">
                   <span className="text-xl font-black text-slate-800">{new Set(linkedEvents.map(e => e.courseName)).size}</span>
                   <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Venues</span>
                </div>
              </div>
            </div>

            <div className="flex gap-8 overflow-x-auto pb-12 scrollbar-hide px-2">
              {linkedEvents.length > 0 ? linkedEvents.map(event => {
                  const isCompleted = event.status === 'completed';
                  const eventWinner = isCompleted && event.results && event.results.length > 0 
                    ? members.find(m => m.id === event.results![0].memberId) 
                    : null;
                  const winningScore = isCompleted && event.results && event.results.length > 0 
                    ? event.results[0].score 
                    : null;
                  
                  const majorMultiplier = event.isMajor ? 2.0 : 1.0;
                  const winnerPointsAwarded = isCompleted ? (POINTS_SYSTEM[0] || 0) * majorMultiplier : (POINTS_SYSTEM[0] || 0) * majorMultiplier;
                  
                  const fieldAvg = isCompleted && event.results 
                    ? (event.results.reduce((acc, r) => acc + r.score, 0) / event.results.length).toFixed(1)
                    : null;

                  return (
                    <div 
                      key={event.id} 
                      className={`min-w-[440px] bg-white p-12 rounded-[4rem] border shadow-2xl flex flex-col justify-between transition-all duration-700 group relative overflow-hidden ${
                        event.isMajor ? 'border-amber-300 ring-8 ring-amber-500/5' : 'border-slate-100 hover:border-emerald-300'
                      }`}
                    >
                      <div className="absolute top-0 left-0 w-2 h-full bg-slate-50 group-hover:bg-emerald-500 transition-colors"></div>
                      
                      <div>
                        <div className="flex items-center justify-between mb-8">
                          <div className="flex items-center gap-3">
                            <span className={`text-[10px] font-black px-4 py-2 rounded-2xl uppercase tracking-widest border ${
                              isCompleted ? 'bg-slate-100 text-slate-500 border-slate-200' : 'bg-emerald-100 text-emerald-700 border-emerald-200'
                            }`}>
                              {event.status}
                            </span>
                            {event.isMajor && (
                              <div className="flex items-center gap-2 bg-slate-900 text-amber-400 px-4 py-2 rounded-2xl shadow-xl">
                                <Crown className="w-4 h-4" />
                                <span className="text-[10px] font-black uppercase tracking-[0.1em]">Major</span>
                              </div>
                            )}
                          </div>
                          <div className="flex flex-col items-end">
                            <p className="text-[11px] font-black text-slate-300 uppercase tracking-widest">Date</p>
                            <p className="text-sm font-black text-slate-600">
                              {new Date(event.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </p>
                          </div>
                        </div>

                        <div className="mb-8">
                          <p className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.3em] mb-2">Tournament Name</p>
                          <h5 className="text-3xl font-black text-slate-900 leading-[1.1] mb-6 line-clamp-2">
                            {event.title}
                          </h5>
                          
                          <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 group-hover:bg-white transition-all group-hover:shadow-lg">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-3 flex items-center gap-2">
                              <MapPin className="w-3.5 h-3.5" /> Venue & Course
                            </p>
                            <h6 className="text-xl font-black text-slate-800 mb-1">{event.courseName}</h6>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{event.location}</p>
                          </div>
                        </div>

                        {isCompleted && eventWinner ? (
                          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-8 duration-700">
                            <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white flex items-center justify-between shadow-2xl relative overflow-hidden">
                              <div className="absolute top-0 right-0 p-4 opacity-10">
                                <Trophy className="w-16 h-16" />
                              </div>
                              <div className="flex items-center gap-5 relative z-10">
                                <img src={eventWinner.avatar} className="w-16 h-16 rounded-[1.5rem] border-4 border-white/10 shadow-2xl object-cover" alt="" />
                                <div>
                                  <p className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.25em] mb-1">Champion</p>
                                  <p className="text-xl font-black">{eventWinner.name}</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-3xl font-black text-emerald-400 tracking-tighter leading-none">{winningScore}</p>
                                <p className="text-[9px] font-black text-white/40 uppercase tracking-widest mt-1">Net</p>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="grid grid-cols-2 gap-4">
                            <div className="p-6 bg-blue-50/50 rounded-[2rem] border border-blue-100 flex flex-col items-center text-center">
                              <Users className="w-6 h-6 text-blue-500 mb-2" />
                              <p className="text-2xl font-black text-blue-900 leading-none">{event.participants.length}</p>
                              <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mt-1">Field Size</p>
                            </div>
                            <div className="p-6 bg-emerald-50/50 rounded-[2rem] border border-emerald-100 flex flex-col items-center text-center">
                              <Star className="w-6 h-6 text-emerald-500 mb-2" />
                              <p className="text-2xl font-black text-emerald-900 leading-none">{winnerPointsAwarded}</p>
                              <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mt-1">Win Points</p>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="pt-10 mt-10 border-t border-slate-50 flex items-center justify-between">
                         <div className="flex items-center gap-4">
                           <div className="flex -space-x-3">
                             {event.participants.slice(0, 5).map(pId => {
                               const m = members.find(member => member.id === pId);
                               return m ? (
                                 <img key={pId} src={m.avatar} className="w-10 h-10 rounded-full border-4 border-white shadow-xl object-cover" alt="" />
                               ) : null;
                             })}
                           </div>
                           {event.participants.length > 5 && (
                             <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">+{event.participants.length - 5} Registered</span>
                           )}
                         </div>
                         <button className="flex items-center gap-4 text-[11px] font-black text-emerald-600 uppercase tracking-[0.2em] group/btn hover:text-emerald-700 transition-colors">
                           Analytics
                           <div className="w-10 h-10 bg-slate-50 rounded-2xl flex items-center justify-center group-hover/btn:bg-emerald-600 group-hover/btn:text-white transition-all shadow-sm">
                             <ArrowUpRight className="w-5 h-5" />
                           </div>
                         </button>
                      </div>
                    </div>
                  );
                }) : (
                <div className="col-span-full py-32 text-center bg-white rounded-[5rem] border-4 border-dashed border-slate-200 shadow-inner flex flex-col items-center justify-center">
                  <Activity className="w-20 h-20 text-slate-200 mb-8" />
                  <h5 className="text-3xl font-black text-slate-800 mb-4 tracking-tight">Season Schedule Empty</h5>
                  <p className="text-slate-400 font-bold italic max-w-sm leading-relaxed text-lg">You haven't linked any tournaments to this season yet. Use the "Link Event" button to add society outings.</p>
                </div>
              )}
            </div>
          </div>

          {/* Standings Section */}
          {seasonLeaderboard.length > 0 ? (
            <>
              <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-10">
                {seasonLeaderboard.slice(0, 3).map((entry, idx) => (
                  <div key={entry.member.id} className={`relative p-12 rounded-[4rem] border overflow-hidden flex flex-col items-center text-center shadow-2xl transition-all duration-700 hover:-translate-y-4 avoid-break ${idx === 0 ? 'bg-slate-950 text-white scale-105 z-10 border-slate-900 shadow-emerald-500/10' : 'bg-white text-slate-800 border-slate-100'}`}>
                    <div className={`absolute top-10 right-10 w-16 h-16 rounded-3xl flex items-center justify-center font-black text-2xl border-4 ${idx === 0 ? 'bg-amber-400 text-amber-950 border-amber-300 shadow-2xl' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>{idx + 1}</div>
                    <div className="relative mb-8">
                      <img src={entry.member.avatar} className={`w-40 h-40 rounded-[3rem] border-8 shadow-2xl object-cover ${idx === 0 ? 'border-emerald-500 shadow-emerald-500/20' : 'border-slate-50'}`} alt="" />
                      {idx === 0 && <Crown className="absolute -top-6 left-1/2 -translate-x-1/2 w-12 h-12 text-amber-400 drop-shadow-lg" />}
                    </div>
                    <h4 className="text-3xl font-black mb-1 tracking-tighter">{entry.member.name}</h4>
                    <p className={`text-xs font-black uppercase tracking-[0.3em] mb-12 ${idx === 0 ? 'text-emerald-400' : 'text-slate-400'}`}>Official Leader</p>
                    <div className={`w-full py-6 rounded-3xl flex flex-col items-center justify-center ${idx === 0 ? 'bg-white/5 border border-white/10' : 'bg-slate-50 border border-slate-100'}`}>
                      <div className="flex items-center gap-2">
                        <span className="text-5xl font-black tracking-tighter">{entry.totalPoints.toFixed(0)}</span>
                        <Zap className={`w-6 h-6 fill-current ${idx === 0 ? 'text-emerald-500' : 'text-slate-300'}`} />
                      </div>
                      <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest mt-2">{viewingRankings.scoringSystem === 'medal' ? 'Total Net Strokes' : 'Championship Points'}</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="lg:col-span-3 bg-white rounded-[4rem] border border-slate-100 shadow-2xl overflow-hidden avoid-break">
                <table className="w-full text-left min-w-[1000px]">
                  <thead className="bg-slate-950 border-b border-slate-800"><tr className="text-[10px] font-black uppercase text-slate-500 tracking-[0.3em]"><th className="px-12 py-8 text-center">Rank</th><th className="px-12 py-8">Championship Roster</th><th className="px-10 py-8 text-center">Events Played</th><th className="px-10 py-8 text-center">Season Average</th><th className="px-12 py-8 text-right">Season Aggregate</th></tr></thead>
                  <tbody className="divide-y divide-slate-100">
                    {seasonLeaderboard.map((entry, idx) => (
                      <tr key={entry.member.id} className="hover:bg-slate-50/50 transition-colors group"><td className="px-12 py-8 text-center font-black text-2xl text-slate-200 group-hover:text-emerald-600 transition-colors">#{idx + 1}</td><td className="px-12 py-8"><div className="flex items-center gap-6"><img src={entry.member.avatar} className="w-14 h-14 rounded-2xl no-print border-2 border-slate-100 shadow-sm object-cover" alt="" /><div><p className="text-lg font-black text-slate-900 group-hover:text-emerald-600 transition-colors">{entry.member.name}</p><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Handicap Index: {entry.member.handicap}</p></div></div></td><td className="px-10 py-8 text-center font-black text-slate-600">{entry.eventsPlayed} Outings</td><td className="px-10 py-8 text-center"><span className="text-base font-black text-emerald-600 bg-emerald-50 px-4 py-2 rounded-2xl border border-emerald-100">{entry.avgScore.toFixed(1)}</span></td><td className="px-12 py-8 text-right"><div className="flex flex-col items-end"><p className="text-3xl font-black text-slate-900 tracking-tighter">{entry.totalPoints.toFixed(0)}</p><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{viewingRankings.scoringSystem === 'medal' ? 'Total Strokes' : 'OOM Points'}</p></div></td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div className="lg:col-span-3 py-40 text-center bg-white rounded-[5rem] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center">
              <BarChart3 className="w-24 h-24 text-slate-100 mb-8" />
              <h4 className="text-3xl font-black text-slate-900 tracking-tight">Merit Table Empty</h4>
              <p className="text-slate-400 font-bold max-w-sm mt-4 text-lg">Complete tournaments in this season to start tracking member performance and rankings.</p>
            </div>
          )}
        </div>
        
        {/* Link Event Modal */}
        {showLinkEventModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowLinkEventModal(false)} />
            <div className="relative bg-white w-full max-w-xl rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="bg-slate-900 p-8 text-white flex items-center justify-between"><div className="flex items-center gap-4"><div className="bg-emerald-500 p-3 rounded-[1.5rem]"><LinkIcon className="w-6 h-6" /></div><h3 className="text-2xl font-black">Assign Tournament</h3></div><button onClick={() => setShowLinkEventModal(false)} className="p-3 hover:bg-white/10 rounded-2xl"><X className="w-6 h-6" /></button></div>
              <div className="p-10 space-y-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
                {events.filter(e => !e.seasonId).length > 0 ? events.filter(e => !e.seasonId).map(event => (
                    <button key={event.id} onClick={() => linkEventToSeason(event.id)} className="w-full flex items-center justify-between p-8 bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 rounded-[2.5rem] transition-all group">
                      <div className="text-left"><p className="text-xl font-black text-slate-900 group-hover:text-emerald-700">{event.title}</p><p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{event.courseName} • {event.location}</p></div>
                      <div className="p-4 bg-white rounded-3xl shadow-xl group-hover:bg-emerald-600 group-hover:text-white transition-all">
                        <Plus className="w-6 h-6" />
                      </div>
                    </button>
                  )) : <div className="text-center py-20"><div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center mx-auto mb-6"><LinkIcon className="w-10 h-10 text-slate-200" /></div><p className="text-slate-400 font-black uppercase text-xs tracking-[0.2em]">All scheduled events are assigned.</p></div>}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-black text-slate-900 tracking-tight">Society Season Management</h3>
          <p className="text-sm text-slate-500 font-bold uppercase tracking-widest mt-1">Group official outings into championship series</p>
        </div>
        <button onClick={handleOpenAddModal} className="flex items-center gap-3 px-8 py-4 bg-emerald-600 text-white font-black rounded-3xl hover:bg-emerald-700 shadow-2xl active:scale-95 transition-all">
          <Plus className="w-6 h-6" />
          Establish Season
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {seasons.map((season) => {
          const linkedEvents = events.filter(e => e.seasonId === season.id);
          const completedCount = linkedEvents.filter(e => e.status === 'completed').length;
          
          return (
            <div key={season.id} className="bg-white rounded-[3.5rem] border border-slate-100 shadow-xl p-10 hover:shadow-2xl transition-all group relative overflow-hidden">
              <div className="absolute top-0 right-0 w-1.5 h-full bg-slate-50 group-hover:bg-emerald-500 transition-colors"></div>
              
              <div className="flex items-start justify-between mb-8">
                <div className="bg-slate-50 p-4 rounded-[1.5rem] text-slate-400 group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-colors">
                  <Flag className="w-8 h-8" />
                </div>
                <div className="flex items-center gap-3 relative">
                  {getStatusBadge(season.status)}
                  <button onClick={() => setActiveMenuId(activeMenuId === season.id ? null : season.id)} className="p-3 text-slate-300 hover:text-slate-600 transition-colors hover:bg-slate-50 rounded-2xl">
                    <MoreVertical className="w-5 h-5" />
                  </button>
                  {activeMenuId === season.id && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setActiveMenuId(null)} />
                      <div className="absolute right-0 top-14 w-56 bg-white border border-slate-100 rounded-[2rem] shadow-2xl p-3 z-50 animate-in zoom-in-95 duration-200">
                        <button onClick={() => handleOpenEditModal(season)} className="w-full flex items-center gap-4 px-4 py-4 rounded-2xl hover:bg-slate-50 text-slate-700 text-sm font-black uppercase tracking-widest">
                          <Edit3 className="w-4 h-4 text-emerald-500" /> Modify
                        </button>
                        <button onClick={() => handleDeleteSeason(season.id)} className="w-full flex items-center gap-4 px-4 py-4 rounded-2xl hover:bg-rose-50 text-rose-600 text-sm font-black uppercase tracking-widest">
                          <Trash2 className="w-4 h-4" /> Delete
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
              
              <h4 className="text-3xl font-black text-slate-900 mb-2 tracking-tight group-hover:text-emerald-600 transition-colors">{season.name}</h4>
              <div className="flex items-center gap-3 mb-8">
                <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-xl border border-emerald-100">
                  <Target className="w-4 h-4" />
                  <span className="text-[10px] font-black uppercase tracking-widest">{getScoringLabel(season.scoringSystem)}</span>
                </div>
              </div>

              {/* Tournament & Venue Detailed Summary Snippet */}
              <div className="mb-8 space-y-4">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] flex items-center gap-2 mb-2">
                  <ClipboardList className="w-3.5 h-3.5" /> Championship Tournaments & Venues
                </p>
                {linkedEvents.length > 0 ? (
                  <div className="space-y-2">
                    {linkedEvents.slice(0, 4).map(event => (
                      <div key={event.id} className="bg-slate-50/80 px-5 py-4 rounded-[1.5rem] border border-slate-100 group-hover:border-emerald-100 group-hover:bg-white transition-all flex items-center justify-between shadow-sm">
                        <div className="flex-1 min-w-0 pr-4">
                          <p className="text-xs font-black text-slate-900 line-clamp-1">{event.title}</p>
                          <div className="flex items-center gap-1.5 mt-1">
                            <Building2 className="w-2.5 h-2.5 text-emerald-500" />
                            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest truncate">{event.courseName}</p>
                          </div>
                        </div>
                        <div className="flex flex-col items-end shrink-0">
                          <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest">{new Date(event.date).toLocaleDateString('en-GB', { month: 'short', year: '2-digit' })}</p>
                          <span className={`text-[8px] font-black px-1.5 py-0.5 rounded uppercase mt-1 ${event.status === 'completed' ? 'bg-slate-200 text-slate-500' : 'bg-emerald-100 text-emerald-600'}`}>
                            {event.status}
                          </span>
                        </div>
                      </div>
                    ))}
                    {linkedEvents.length > 4 && (
                      <div className="bg-white/50 px-4 py-2 rounded-xl border border-dashed border-slate-200 flex items-center justify-center">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">+{linkedEvents.length - 4} More Official Outings</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="py-10 px-8 rounded-[2.5rem] border-2 border-dashed border-slate-100 flex flex-col items-center justify-center text-center">
                    <Activity className="w-8 h-8 text-slate-200 mb-3" />
                    <p className="text-[10px] font-black text-slate-300 uppercase italic tracking-widest">Season Registry Empty</p>
                  </div>
                )}
              </div>
              
              <div className="space-y-4 py-8 border-t border-slate-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-slate-300" />
                    <span className="text-sm font-bold text-slate-600">Event Roster</span>
                  </div>
                  <span className="text-sm font-black text-emerald-600 bg-emerald-50 px-3 py-1 rounded-xl">{linkedEvents.length} Rounds</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <BarChart className="w-5 h-5 text-slate-300" />
                    <span className="text-sm font-bold text-slate-600">Season Progress</span>
                  </div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    {completedCount} / {linkedEvents.length} Official Scores
                  </span>
                </div>
              </div>

              <button onClick={() => setViewingRankings(season)} className="w-full mt-6 py-6 px-6 flex items-center justify-center gap-4 text-sm font-black text-slate-800 bg-slate-50 hover:bg-emerald-600 hover:text-white rounded-[2rem] transition-all group/btn shadow-sm hover:shadow-2xl">
                <Trophy className="w-5 h-5" /> 
                Open Season Intelligence
                <ChevronRight className="w-5 h-5 group-hover/btn:translate-x-2 transition-transform" />
              </button>
            </div>
          );
        })}
      </div>
      {showAddModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowAddModal(false)} />
          <div className="relative bg-white w-full max-w-xl rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="bg-slate-900 p-8 text-white flex items-center justify-between"><div className="flex items-center gap-4"><div className="bg-emerald-500 p-3 rounded-[1.5rem]"><Flag className="w-6 h-6" /></div><h3 className="text-2xl font-black">{editingSeasonId ? 'Commit Changes' : 'Launch New Season'}</h3></div><button onClick={() => setShowAddModal(false)} className="p-3 hover:bg-white/10 rounded-2xl"><X className="w-6 h-6" /></button></div>
            <form onSubmit={handleSaveSeason} className="p-10 space-y-8 max-h-[75vh] overflow-y-auto custom-scrollbar">
              <div className="space-y-6">
                <div><label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2"><Zap className="w-4 h-4" /> Championship Designation</label><input required type="text" className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-black text-slate-800 focus:ring-4 ring-emerald-500/10 transition-all" value={seasonForm.name} onChange={e => setSeasonForm({...seasonForm, name: e.target.value})} /></div>
                <div className="grid grid-cols-2 gap-6">
                  <div><label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2"><Calendar className="w-4 h-4" /> Start</label><input required type="date" className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold text-slate-800" value={seasonForm.startDate} onChange={e => setSeasonForm({...seasonForm, startDate: e.target.value})} /></div>
                  <div><label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2"><Calendar className="w-4 h-4" /> Conclusion</label><input required type="date" className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold text-slate-800" value={seasonForm.endDate} onChange={e => setSeasonForm({...seasonForm, endDate: e.target.value})} /></div>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2"><BarChart3 className="w-4 h-4" /> Scoring Engine</label>
                  <div className="relative">
                    <select className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-black text-slate-800 appearance-none cursor-pointer focus:ring-4 ring-emerald-500/10 transition-all" value={seasonForm.scoringSystem} onChange={e => setSeasonForm({...seasonForm, scoringSystem: e.target.value as ScoringSystem})}>
                      <option value="points">Order of Merit (Points)</option>
                      <option value="stableford">Stableford Aggregate</option>
                      <option value="medal">Medal (Net Aggregate)</option>
                    </select>
                    <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                  </div>
                </div>
                <div><label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2"><AlignLeft className="w-4 h-4" /> Society Description</label><textarea className="w-full h-40 px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold resize-none" value={seasonForm.description} onChange={e => setSeasonForm({...seasonForm, description: e.target.value})} /></div>
              </div>
              <div className="flex items-center gap-6 pt-6 border-t border-slate-100"><button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-5 text-slate-500 font-black uppercase tracking-widest hover:bg-slate-50 rounded-2xl transition-all">Cancel</button><button type="submit" className="flex-[2] py-5 bg-slate-900 text-white font-black rounded-2xl shadow-2xl hover:bg-slate-800 transition-all active:scale-[0.98]">{editingSeasonId ? 'Commit Changes' : 'Launch Season'}</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Seasons;
