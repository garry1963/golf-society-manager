
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
  Building2,
  AlertTriangle,
  Trash
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
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingSeasonId, setEditingSeasonId] = useState<string | null>(null);
  const [showLinkEventModal, setShowLinkEventModal] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
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
            <button 
              onClick={() => setDeletingSeasonId(viewingRankings.id)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-black text-[10px] uppercase bg-rose-50 text-rose-600 border border-rose-100 hover:bg-rose-100"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Retire Season
            </button>
            <button onClick={() => setShowLinkEventModal(true)} className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-black text-xs uppercase bg-emerald-600 text-white shadow-xl hover:bg-emerald-700">Link Event</button>
            <div className="relative">
              <button onClick={() => setShowExportMenu(!showExportMenu)} className="flex items-center gap-3 px-5 py-2.5 bg-slate-900 text-white font-black text-xs uppercase rounded-xl hover:bg-slate-800 transition-all shadow-xl group"><Download className="w-4 h-4 text-emerald-400" />Export Center <ChevronDown className={`w-4 h-4 transition-transform ${showExportMenu ? 'rotate-180' : ''}`} /></button>
              {showExportMenu && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowExportMenu(false)} />
                  <div className="absolute right-0 mt-3 w-64 bg-white border border-slate-100 rounded-[2rem] shadow-2xl p-3 z-20">
                    <button onClick={handlePrintPDF} className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl hover:bg-emerald-50 text-slate-700 font-black text-xs uppercase"><FileText className="w-4 h-4" /> PDF Report</button>
                    <button onClick={handleExportCSV} className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl hover:bg-blue-50 text-slate-700 font-black text-xs uppercase"><Table className="w-4 h-4" /> Export CSV</button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-3 bg-slate-100 border border-slate-200 rounded-[3.5rem] p-12 no-print overflow-hidden relative shadow-inner">
            <div className="absolute top-0 right-0 p-12 opacity-[0.03] pointer-events-none">
              <ClipboardList className="w-64 h-64" />
            </div>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 relative z-10">
              <div>
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-3 mb-2">
                  <Calendar className="w-5 h-5 text-emerald-600" /> Championship Venues
                </h4>
                <p className="text-sm font-bold text-slate-500">Historical record of all society courses visited this season.</p>
              </div>
            </div>
            <div className="flex gap-8 overflow-x-auto pb-8 scrollbar-hide px-2">
              {linkedEvents.length > 0 ? linkedEvents.map(event => (
                <div key={event.id} className="min-w-[320px] bg-white p-8 rounded-[3rem] border border-slate-100 shadow-xl flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-[10px] font-black px-3 py-1 bg-emerald-100 text-emerald-700 rounded-lg uppercase">{event.status}</span>
                      <p className="text-[10px] font-black text-slate-400 uppercase">{event.date}</p>
                    </div>
                    <h5 className="text-xl font-black text-slate-900 mb-2">{event.title}</h5>
                    <p className="text-xs font-bold text-slate-500 mb-4 flex items-center gap-1"><MapPin className="w-3 h-3" />{event.courseName}</p>
                  </div>
                  <div className="pt-4 border-t border-slate-50 flex items-center justify-between">
                    <div className="flex -space-x-2">
                      {event.participants.slice(0, 3).map(pId => {
                        const m = members.find(member => member.id === pId);
                        return m ? <img key={pId} src={m.avatar} className="w-8 h-8 rounded-full border-2 border-white shadow-sm" alt="" /> : null;
                      })}
                    </div>
                    <button className="text-[10px] font-black text-emerald-600 uppercase">Details</button>
                  </div>
                </div>
              )) : (
                <div className="w-full py-20 text-center">
                  <Activity className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                  <p className="text-slate-400 font-black uppercase text-xs">No Events Linked to Season</p>
                </div>
              )}
            </div>
          </div>

          {seasonLeaderboard.length > 0 ? (
            <div className="lg:col-span-3 bg-white rounded-[4rem] border border-slate-100 shadow-2xl overflow-hidden avoid-break">
              <table className="w-full text-left">
                <thead className="bg-slate-950 border-b border-slate-800">
                  <tr className="text-[10px] font-black uppercase text-slate-500 tracking-[0.4em]">
                    <th className="px-12 py-8 text-center">Rank</th>
                    <th className="px-12 py-8">Roster Member</th>
                    <th className="px-10 py-8 text-center">Appearances</th>
                    <th className="px-10 py-8 text-center">Scoring Avg</th>
                    <th className="px-12 py-8 text-right">Aggregate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {seasonLeaderboard.map((entry, idx) => (
                    <tr key={entry.member.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-12 py-8 text-center font-black text-2xl text-slate-300 group-hover:text-emerald-600">#{idx + 1}</td>
                      <td className="px-12 py-8">
                        <div className="flex items-center gap-5">
                          <img src={entry.member.avatar} className="w-12 h-12 rounded-2xl border border-slate-100 shadow-sm" alt="" />
                          <div>
                            <p className="text-lg font-black text-slate-900">{entry.member.name}</p>
                            <p className="text-[10px] font-black text-slate-400 uppercase">Hcp: {entry.member.handicap}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-10 py-8 text-center font-black text-slate-600">{entry.eventsPlayed}</td>
                      <td className="px-10 py-8 text-center"><span className="text-sm font-black text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-100">{entry.avgScore.toFixed(1)}</span></td>
                      <td className="px-12 py-8 text-right font-black text-2xl text-slate-950">{entry.totalPoints.toFixed(0)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="lg:col-span-3 py-32 text-center bg-white rounded-[4rem] border-2 border-dashed border-slate-100">
              <BarChart3 className="w-16 h-16 text-slate-200 mx-auto mb-4" />
              <h4 className="text-2xl font-black text-slate-800">No Season Data</h4>
              <p className="text-slate-400 font-bold max-w-xs mx-auto">Complete linked tournaments to generate rankings.</p>
            </div>
          )}
        </div>

        {showLinkEventModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowLinkEventModal(false)} />
            <div className="relative bg-white w-full max-w-xl rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="bg-slate-900 p-8 text-white flex items-center justify-between">
                <h3 className="text-2xl font-black">Link Society Outing</h3>
                <button onClick={() => setShowLinkEventModal(false)} className="p-2 hover:bg-white/10 rounded-xl"><X className="w-6 h-6" /></button>
              </div>
              <div className="p-8 space-y-4 max-h-[60vh] overflow-y-auto">
                {events.filter(e => !e.seasonId).map(event => (
                  <button key={event.id} onClick={() => linkEventToSeason(event.id)} className="w-full flex items-center justify-between p-6 bg-slate-50 hover:bg-emerald-50 border border-slate-200 rounded-2xl transition-all text-left">
                    <div>
                      <p className="font-black text-slate-900">{event.title}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">{event.courseName}</p>
                    </div>
                    <Plus className="w-5 h-5 text-emerald-600" />
                  </button>
                ))}
                {events.filter(e => !e.seasonId).length === 0 && <p className="text-center text-slate-400 font-bold">All events linked.</p>}
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
          <h3 className="text-2xl font-black text-slate-900">Season Administration</h3>
          <p className="text-sm text-slate-500">Official championship series and Order of Merit</p>
        </div>
        <button onClick={handleOpenAddModal} className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white font-black rounded-2xl hover:bg-slate-800 shadow-xl active:scale-95 transition-all">
          <Plus className="w-5 h-5" />
          Create Season
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {seasons.map((season) => {
          const linkedEvents = events.filter(e => e.seasonId === season.id);
          return (
            <div key={season.id} className="bg-white rounded-[3.5rem] border border-slate-100 shadow-xl p-10 hover:shadow-2xl transition-all group relative overflow-hidden flex flex-col">
              <div className="absolute top-0 right-0 w-2 h-full bg-slate-50 group-hover:bg-emerald-500 transition-colors"></div>
              <div className="flex items-start justify-between mb-8">
                <div className="bg-slate-50 p-4 rounded-3xl text-slate-400 group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-colors">
                  <Flag className="w-8 h-8" />
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => handleOpenEditModal(season)} className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl"><Edit3 className="w-4 h-4" /></button>
                  <button onClick={() => setDeletingSeasonId(season.id)} className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
              <div className="mb-8">
                <div className="mb-2">{getStatusBadge(season.status)}</div>
                <h4 className="text-2xl font-black text-slate-900 group-hover:text-emerald-700 transition-colors">{season.name}</h4>
                <p className="text-sm text-slate-500 font-medium line-clamp-2 mt-2">{season.description}</p>
              </div>
              <div className="grid grid-cols-3 gap-4 mb-8 pt-8 border-t border-slate-50">
                <div className="text-center"><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Scoring</p><p className="text-xs font-bold text-slate-800">{season.scoringSystem?.toUpperCase()}</p></div>
                <div className="text-center"><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Events</p><p className="text-xs font-bold text-slate-800">{linkedEvents.length}</p></div>
                <div className="text-center"><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Period</p><p className="text-xs font-bold text-slate-800">{new Date(season.startDate).getFullYear()}</p></div>
              </div>
              <button onClick={() => setViewingRankings(season)} className="w-full py-4 bg-slate-950 text-white font-black rounded-2xl shadow-xl hover:bg-emerald-600 transition-all flex items-center justify-center gap-2 group/btn active:scale-[0.98]">
                View Leaderboard
                <ChevronRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
              </button>
            </div>
          );
        })}
      </div>

      {/* Confirmation Modal for Deletion */}
      {deletingSeasonId && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setDeletingSeasonId(null)} />
          <div className="relative bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl p-10 text-center animate-in zoom-in-95 duration-200">
            <div className="w-20 h-20 bg-rose-50 rounded-[2rem] flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="w-10 h-10 text-rose-600" />
            </div>
            <h3 className="text-2xl font-black text-slate-900 mb-2">Retire Series?</h3>
            <p className="text-slate-500 font-medium text-sm leading-relaxed mb-8">
              Deleting this championship series will unlink all associated tournaments. All results will be preserved but the series rankings will be permanently removed.
            </p>
            <div className="flex flex-col gap-3">
              <button 
                onClick={executeSeasonDeletion}
                className="w-full py-4 bg-rose-600 text-white font-black rounded-2xl shadow-xl shadow-rose-900/20 hover:bg-rose-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              >
                <Trash className="w-4 h-4" />
                Confirm Deletion
              </button>
              <button 
                onClick={() => setDeletingSeasonId(null)}
                className="w-full py-4 bg-slate-100 text-slate-600 font-black rounded-2xl hover:bg-slate-200 active:scale-[0.98] transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowAddModal(false)} />
          <div className="relative bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="bg-slate-900 p-8 text-white flex items-center justify-between">
              <h3 className="text-2xl font-black">{editingSeasonId ? 'Edit Season' : 'New Championship Series'}</h3>
              <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-white/10 rounded-xl"><X className="w-6 h-6" /></button>
            </div>
            <form onSubmit={handleSaveSeason} className="p-8 space-y-6">
              <div className="grid grid-cols-1 gap-6">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Series Title</label>
                  <input required type="text" className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 ring-emerald-500/10 font-bold" value={seasonForm.name} onChange={e => setSeasonForm({...seasonForm, name: e.target.value})} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Start Date</label>
                    <input required type="date" className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold" value={seasonForm.startDate} onChange={e => setSeasonForm({...seasonForm, startDate: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">End Date</label>
                    <input required type="date" className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold" value={seasonForm.endDate} onChange={e => setSeasonForm({...seasonForm, endDate: e.target.value})} />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Scoring Methodology</label>
                  <select className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold" value={seasonForm.scoringSystem} onChange={e => setSeasonForm({...seasonForm, scoringSystem: e.target.value as ScoringSystem})}>
                    <option value="points">Standard Order of Merit (Points)</option>
                    <option value="stableford">Aggregate Stableford</option>
                    <option value="medal">Net Medal Aggregate</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Series Status</label>
                  <select className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold" value={seasonForm.status} onChange={e => setSeasonForm({...seasonForm, status: e.target.value as any})}>
                    <option value="planned">Planned</option>
                    <option value="active">Active</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-4 pt-6 border-t border-slate-100">
                <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-4 font-bold text-slate-500 hover:bg-slate-50 rounded-2xl transition-all">Cancel</button>
                <button type="submit" className="flex-[2] py-4 bg-slate-900 text-white font-black rounded-2xl shadow-xl hover:bg-slate-800 transition-all active:scale-[0.98]">Save Season</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Seasons;
