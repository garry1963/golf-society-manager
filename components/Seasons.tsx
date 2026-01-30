
import React, { useState, useMemo } from 'react';
import { MOCK_SEASONS, MOCK_EVENTS, MOCK_MEMBERS } from '../constants';
import { Season, Member, Event, ScoringSystem } from '../types';
import { 
  Plus, 
  Calendar, 
  Flag, 
  CheckCircle2, 
  Clock, 
  X, 
  MoreVertical,
  ChevronRight,
  Info,
  Trophy,
  Medal as MedalIcon,
  ChevronLeft,
  Award,
  Hash,
  Target,
  Printer,
  Link as LinkIcon,
  Search,
  Zap,
  CheckCircle,
  LayoutList,
  Calculator,
  Crown,
  FileText,
  Download,
  ChevronDown,
  Table,
  Timer
} from 'lucide-react';

interface LeaderboardEntry {
  member: Member;
  totalPoints: number;
  eventsPlayed: number;
  bestFinish: number;
  avgScore: number;
}

const Seasons: React.FC = () => {
  const [seasons, setSeasons] = useState<Season[]>(MOCK_SEASONS);
  const [events, setEvents] = useState<Event[]>(MOCK_EVENTS);
  const [viewingRankings, setViewingRankings] = useState<Season | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showLinkEventModal, setShowLinkEventModal] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [showExportMenu, setShowExportMenu] = useState(false);
  
  const [newSeason, setNewSeason] = useState<{
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

  // Points mapping for Order of Merit
  const POINTS_SYSTEM = [25, 18, 15, 12, 10, 8, 6, 4, 2, 1];

  const seasonLeaderboard = useMemo(() => {
    if (!viewingRankings) return [];

    const leaderboardMap = new Map<string, LeaderboardEntry>();
    const seasonEvents = events.filter(e => e.seasonId === viewingRankings.id && e.status === 'completed');
    const system = viewingRankings.scoringSystem || 'points';

    seasonEvents.forEach(event => {
      if (!event.results) return;

      // Sort results based on score (ascending) for ranking
      const sortedResults = [...event.results].sort((a, b) => a.score - b.score);
      const majorMultiplier = event.isMajor ? 2.0 : 1.0;

      sortedResults.forEach((result, index) => {
        const member = MOCK_MEMBERS.find(m => m.id === result.memberId);
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
          // Assume for mock purposes strokes around 72 = 36 points.
          const simulatedPoints = Math.max(0, 108 - result.score); 
          currentEntry.totalPoints += simulatedPoints * majorMultiplier;
        } else if (system === 'medal') {
          // For medal, totalPoints is the aggregate weighted strokes (lower is better).
          // We double the score for majors so it carries twice the weight in the final aggregate.
          currentEntry.totalPoints += result.score * majorMultiplier;
        }

        currentEntry.eventsPlayed += 1;
        currentEntry.bestFinish = Math.min(currentEntry.bestFinish, index + 1);
        currentEntry.avgScore = (currentEntry.avgScore * (currentEntry.eventsPlayed - 1) + result.score) / currentEntry.eventsPlayed;

        leaderboardMap.set(member.id, currentEntry);
      });
    });

    const entries = Array.from(leaderboardMap.values());
    if (system === 'medal') {
      // For medal, lower total points (weighted strokes) is better
      return entries.sort((a, b) => a.totalPoints - b.totalPoints);
    }
    // For points and stableford, higher is better
    return entries.sort((a, b) => b.totalPoints - a.totalPoints);
  }, [viewingRankings, events]);

  const handlePrintPDF = () => {
    setShowExportMenu(false);
    window.print();
  };

  const handleExportCSV = () => {
    setShowExportMenu(false);
    if (!viewingRankings) return;
    
    const headers = ["Rank", "Member", "Events Played", "Avg Score", "Best Finish", "Season Total"];
    const rows = seasonLeaderboard.map((entry, idx) => [
      (idx + 1).toString(),
      entry.member.name,
      entry.eventsPlayed.toString(),
      entry.avgScore.toFixed(2),
      entry.bestFinish.toString(),
      entry.totalPoints.toFixed(0)
    ]);
    
    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `${viewingRankings.name.replace(/\s+/g, '_')}_Leaderboard.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const unassignedEvents = useMemo(() => {
    return events.filter(e => !e.seasonId);
  }, [events]);

  const handleAddSeason = (e: React.FormEvent) => {
    e.preventDefault();
    const id = `s${seasons.length + 1}`;
    const seasonToAdd: Season = {
      ...newSeason,
      id,
      totalEvents: 0
    };
    setSeasons([seasonToAdd, ...seasons]);
    setShowAddModal(false);
    setNewSeason({
      name: '',
      startDate: '',
      endDate: '',
      description: '',
      status: 'planned',
      scoringSystem: 'points'
    });
  };

  const linkEventToSeason = (eventId: string) => {
    if (!viewingRankings) return;
    
    setEvents(prev => prev.map(e => e.id === eventId ? { ...e, seasonId: viewingRankings.id } : e));
    setSeasons(prev => prev.map(s => s.id === viewingRankings.id ? { ...s, totalEvents: s.totalEvents + 1 } : s));
    
    setViewingRankings(prev => prev ? { ...prev, totalEvents: prev.totalEvents + 1 } : null);
    setShowLinkEventModal(false);
  };

  const updateSeasonStatus = (id: string, newStatus: 'active' | 'planned' | 'completed') => {
    setSeasons(prev => prev.map(s => s.id === id ? { ...s, status: newStatus } : s));
    setActiveMenuId(null);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-100 text-emerald-700 uppercase tracking-wider"><CheckCircle2 className="w-3.5 h-3.5" /> Active</span>;
      case 'planned':
        return <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-100 text-blue-700 uppercase tracking-wider"><Clock className="w-3.5 h-3.5" /> Planned</span>;
      case 'completed':
        return <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 text-slate-600 uppercase tracking-wider">Completed</span>;
      default:
        return null;
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
    const linkedEvents = events.filter(e => e.seasonId === viewingRankings.id);

    return (
      <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500 pb-20 printable-area">
        {/* Hidden Print Header */}
        <div className="print-header">
          <div className="flex items-center gap-4">
            <div className="bg-emerald-900 p-3 rounded-2xl">
              <Trophy className="w-8 h-8 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-2xl font-black uppercase text-slate-900 tracking-tight">FairwayConnect Official Leaderboard</h1>
              <p className="text-sm font-bold text-emerald-700 tracking-widest uppercase">{viewingRankings.name} • {getScoringLabel(viewingRankings.scoringSystem)}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs font-black text-slate-400 uppercase">Season Period</p>
            <p className="text-sm font-bold text-slate-900">
              {new Date(viewingRankings.startDate).toLocaleDateString()} - {new Date(viewingRankings.endDate).toLocaleDateString()}
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setViewingRankings(null)}
              className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-400 hover:text-slate-600 no-print"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <div>
              <h3 className="text-2xl font-black text-slate-800">{viewingRankings.name} Leaderboard</h3>
              <p className="text-sm text-slate-500 font-medium tracking-tight">
                {getScoringLabel(viewingRankings.scoringSystem)} • {viewingRankings.totalEvents} Linked Events
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 no-print">
            <button 
              onClick={() => setShowLinkEventModal(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all shadow-xl bg-emerald-600 text-white hover:bg-emerald-700 active:scale-95"
            >
              <Plus className="w-4 h-4" />
              Add Event
            </button>
            
            <div className="relative">
              <button 
                onClick={() => setShowExportMenu(!showExportMenu)}
                className="flex items-center gap-3 px-5 py-2.5 bg-slate-900 text-white font-black text-xs uppercase tracking-widest rounded-xl hover:bg-slate-800 transition-all shadow-xl group active:scale-95"
              >
                <Download className="w-4 h-4 text-emerald-400" />
                Export Center
                <ChevronDown className={`w-4 h-4 transition-transform ${showExportMenu ? 'rotate-180' : ''}`} />
              </button>

              {showExportMenu && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowExportMenu(false)} />
                  <div className="absolute right-0 mt-3 w-64 bg-white border border-slate-100 rounded-[2rem] shadow-2xl p-3 z-20 animate-in zoom-in-95 duration-200">
                    <p className="px-4 py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 mb-1">Leaderboard Reports</p>
                    <button 
                      onClick={handlePrintPDF}
                      className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 transition-colors group"
                    >
                      <div className="p-2 bg-emerald-100 rounded-xl group-hover:bg-emerald-200"><FileText className="w-4 h-4" /></div>
                      <div className="text-left">
                        <p className="text-xs font-black">PDF Standings</p>
                        <p className="text-[10px] font-medium opacity-60">Professional print layout</p>
                      </div>
                    </button>
                    <button 
                      onClick={handleExportCSV}
                      className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl hover:bg-blue-50 text-slate-700 hover:text-blue-700 transition-colors group"
                    >
                      <div className="p-2 bg-blue-100 rounded-xl group-hover:bg-blue-200"><Table className="w-4 h-4" /></div>
                      <div className="text-left">
                        <p className="text-xs font-black">Standings (CSV)</p>
                        <p className="text-[10px] font-medium opacity-60">Raw data for analysis</p>
                      </div>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-3 bg-slate-50 border border-slate-100 rounded-[2rem] p-6 no-print">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Tournament Schedule
              </h4>
              <span className="text-[10px] font-bold text-slate-400">{linkedEvents.length} Events</span>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
              {linkedEvents.length > 0 ? (
                linkedEvents.map(event => (
                  <div key={event.id} className={`min-w-[240px] bg-white p-4 rounded-2xl border transition-all shadow-sm ${event.isMajor ? 'border-amber-200 ring-1 ring-amber-100' : 'border-slate-200/50'}`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex gap-1.5">
                        <span className={`text-[9px] font-black px-1.5 py-0.5 rounded uppercase ${event.status === 'completed' ? 'bg-slate-100 text-slate-500' : 'bg-emerald-100 text-emerald-700'}`}>
                          {event.status}
                        </span>
                        {event.isMajor && (
                          <span className="text-[9px] font-black px-1.5 py-0.5 rounded uppercase bg-amber-500 text-white flex items-center gap-1">
                            <Crown className="w-2 h-2" /> Major
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] font-bold text-slate-400">{new Date(event.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>
                    </div>
                    <p className="text-sm font-black text-slate-800 truncate">{event.title}</p>
                    <p className="text-[10px] font-bold text-slate-400 mt-1 truncate">{event.courseName}</p>
                  </div>
                ))
              ) : (
                <div className="w-full py-4 text-center text-slate-400 text-xs italic">
                  No events linked to this season yet. Click "Add Event" to begin.
                </div>
              )}
            </div>
          </div>

          {seasonLeaderboard.length > 0 ? (
            <>
              <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-6">
                {seasonLeaderboard.slice(0, 3).map((entry, idx) => (
                  <div key={entry.member.id} className={`relative p-8 rounded-[2.5rem] border overflow-hidden flex flex-col items-center text-center shadow-xl transition-transform hover:scale-[1.02] avoid-break ${
                    idx === 0 ? 'bg-slate-900 text-white border-slate-800 scale-105 z-10' : 'bg-white text-slate-800 border-slate-100'
                  }`}>
                    <div className={`absolute top-6 right-6 w-12 h-12 rounded-full flex items-center justify-center font-black text-xl border-4 ${
                      idx === 0 ? 'bg-amber-400 text-amber-950 border-amber-300' :
                      idx === 1 ? 'bg-slate-100 text-slate-600 border-slate-200' :
                      'bg-amber-700 text-amber-100 border-amber-600'
                    }`}>
                      {idx + 1}
                    </div>
                    
                    <img 
                      src={entry.member.avatar} 
                      className={`w-24 h-24 rounded-full mb-4 border-4 ${idx === 0 ? 'border-amber-400 shadow-amber-400/20 shadow-2xl' : 'border-slate-50'}`} 
                      alt="" 
                    />
                    <h4 className="text-xl font-black mb-1">{entry.member.name}</h4>
                    
                    <div className="flex items-center gap-2 mb-4">
                      {entry.member.roundsPlayed >= 3 ? (
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-tighter ${
                          idx === 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-50 text-emerald-600'
                        }`}>
                          HCP {entry.member.handicap.toFixed(1)}
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest bg-slate-100 text-slate-400 border border-slate-200 flex items-center gap-1">
                          <Timer className="w-2 h-2" /> Evaluation {entry.member.roundsPlayed}/3
                        </span>
                      )}
                    </div>

                    <p className={`text-xs font-bold uppercase tracking-[0.2em] mb-8 ${idx === 0 ? 'text-amber-400' : 'text-emerald-600'}`}>
                      {entry.totalPoints.toFixed(0)} {viewingRankings.scoringSystem === 'medal' ? 'Strokes' : 'Season Points'}
                    </p>

                    <div className={`grid grid-cols-2 gap-4 w-full pt-6 border-t ${idx === 0 ? 'border-white/10' : 'border-slate-100'}`}>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-wider mb-0.5 text-slate-400">Season Avg</p>
                        <p className="font-black text-lg">{entry.avgScore.toFixed(1)}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-wider mb-0.5 text-slate-400">Best Finish</p>
                        <p className="font-black text-lg">#{entry.bestFinish}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="lg:col-span-3 bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden avoid-break">
                <div className="overflow-x-auto">
                  <table className="w-full text-left min-w-[1000px]">
                    <thead className="bg-slate-50 border-b border-slate-100">
                      <tr>
                        <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center w-20">Rank</th>
                        <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Member & HCP</th>
                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Rounds</th>
                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Season Avg</th>
                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Best Finish</th>
                        <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Total {viewingRankings.scoringSystem === 'medal' ? 'Weighted Strokes' : 'Points'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {seasonLeaderboard.map((entry, idx) => (
                        <tr key={entry.member.id} className="hover:bg-slate-50/50 transition-colors group">
                          <td className="px-8 py-5 text-center">
                            <span className={`text-sm font-black ${idx < 3 ? 'text-emerald-600' : 'text-slate-300'}`}>
                              #{idx + 1}
                            </span>
                          </td>
                          <td className="px-8 py-5">
                            <div className="flex items-center gap-3">
                              <img src={entry.member.avatar} className="w-10 h-10 rounded-full border border-slate-100 shadow-sm no-print" alt="" />
                              <div>
                                <p className="text-sm font-black text-slate-800">{entry.member.name}</p>
                                {entry.member.roundsPlayed >= 3 ? (
                                  <span className="text-[9px] font-black text-emerald-600 uppercase bg-emerald-50 px-1 py-0.5 rounded">WHS {entry.member.handicap.toFixed(1)}</span>
                                ) : (
                                  <span className="text-[8px] font-black text-slate-400 uppercase bg-slate-100 px-1 py-0.5 rounded border border-slate-200 inline-flex items-center gap-1">
                                    <Timer className="w-2.5 h-2.5" /> Evalu {entry.member.roundsPlayed}/3
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-5">
                            <span className="text-sm font-black text-slate-700">{entry.eventsPlayed}</span>
                          </td>
                          <td className="px-6 py-5">
                            <span className="text-sm font-black text-emerald-600">{entry.avgScore.toFixed(1)}</span>
                          </td>
                          <td className="px-6 py-5 text-center">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 rounded-lg text-[10px] font-black text-slate-600 uppercase">
                              {entry.bestFinish === 1 ? <Award className="w-3.5 h-3.5 text-amber-500" /> : <Hash className="w-3 h-3 text-slate-400" />}
                              {entry.bestFinish}
                            </span>
                          </td>
                          <td className="px-8 py-5 text-right">
                            <span className="text-xl font-black text-emerald-600 group-hover:scale-110 transition-transform inline-block origin-right">
                              {entry.totalPoints.toFixed(0)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : (
            <div className="lg:col-span-3 bg-white p-24 rounded-[3rem] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-center no-print">
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                <MedalIcon className="w-10 h-10 text-slate-300" />
              </div>
              <h3 className="text-2xl font-black text-slate-800 mb-2">No Results Recorded Yet</h3>
              <p className="text-slate-500 max-w-sm font-medium">
                Complete tournaments within this season to see the {getScoringLabel(viewingRankings.scoringSystem)} leaderboard populate.
              </p>
              <div className="flex items-center gap-4 mt-8">
                <button onClick={() => setViewingRankings(null)} className="px-8 py-3 text-slate-600 font-bold hover:bg-slate-50 rounded-2xl transition-all">Back to Seasons</button>
                <button onClick={() => setShowLinkEventModal(true)} className="px-8 py-3 bg-slate-900 text-white font-black rounded-2xl shadow-xl hover:bg-slate-800 transition-all active:scale-95">Link Your First Event</button>
              </div>
            </div>
          )}
        </div>

        {showLinkEventModal && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowLinkEventModal(false)} />
            <div className="relative bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="bg-slate-900 p-6 text-white flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-emerald-500 p-2 rounded-xl">
                    <LinkIcon className="w-5 h-5" />
                  </div>
                  <h3 className="text-xl font-bold">Link Event to Season</h3>
                </div>
                <button onClick={() => setShowLinkEventModal(false)} className="p-2 hover:bg-white/10 rounded-lg"><X className="w-5 h-5" /></button>
              </div>
              <div className="p-8">
                <div className="space-y-3 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
                  {unassignedEvents.length > 0 ? (
                    unassignedEvents.map(event => (
                      <button 
                        key={event.id}
                        onClick={() => linkEventToSeason(event.id)}
                        className={`w-full flex items-center justify-between p-4 bg-slate-50 border transition-all group ${event.isMajor ? 'hover:bg-amber-50 border-slate-100 hover:border-amber-200' : 'hover:bg-emerald-50 border-slate-100 hover:border-emerald-200'} rounded-2xl`}
                      >
                        <div className="text-left">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-black text-slate-800 group-hover:text-emerald-700">{event.title}</p>
                            {event.isMajor && <Crown className="w-3 h-3 text-amber-500" />}
                          </div>
                          <p className="text-[10px] font-bold text-slate-400 mt-1">{event.courseName} • {new Date(event.date).toLocaleDateString()}</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-emerald-500 transition-transform group-hover:translate-x-1" />
                      </button>
                    ))
                  ) : (
                    <div className="py-12 text-center text-slate-400 font-medium">No unassigned events found. Create some in the Tournaments tab!</div>
                  )}
                </div>
                <button onClick={() => setShowLinkEventModal(false)} className="w-full mt-6 py-3 text-slate-600 font-bold hover:text-slate-800 transition-colors">Close</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-slate-800">Season Management</h3>
          <p className="text-sm text-slate-500">Group your tournaments into seasonal championships</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white font-bold rounded-2xl hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-600/20 active:scale-95"
        >
          <Plus className="w-5 h-5" />
          Create Season
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {seasons.map((season) => (
          <div key={season.id} className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 hover:shadow-md transition-all group relative">
            <div className="flex items-start justify-between mb-4">
              <div className="bg-slate-50 p-3 rounded-2xl text-slate-600 group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-colors">
                <Flag className="w-6 h-6" />
              </div>
              <div className="flex items-center gap-2 relative">
                {getStatusBadge(season.status)}
                
                <div className="relative">
                  <button 
                    onClick={() => setActiveMenuId(activeMenuId === season.id ? null : season.id)}
                    className={`p-2 rounded-lg transition-colors ${activeMenuId === season.id ? 'bg-slate-100 text-slate-900' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>

                  {activeMenuId === season.id && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setActiveMenuId(null)} />
                      <div className="absolute right-0 top-10 w-48 bg-white border border-slate-100 rounded-2xl shadow-2xl p-2 z-50">
                        <p className="px-3 py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50">Update Status</p>
                        <button onClick={() => updateSeasonStatus(season.id, 'planned')} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-blue-50 text-slate-600 text-xs font-bold">
                          <div className="p-1.5 bg-blue-100 rounded-lg"><Clock className="w-3 h-3" /></div> Set as Planned
                        </button>
                        <button onClick={() => updateSeasonStatus(season.id, 'active')} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-emerald-50 text-slate-600 text-xs font-bold">
                          <div className="p-1.5 bg-emerald-100 rounded-lg"><Zap className="w-3 h-3" /></div> Set as Active
                        </button>
                        <button onClick={() => updateSeasonStatus(season.id, 'completed')} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-100 text-slate-600 text-xs font-bold">
                          <div className="p-1.5 bg-slate-200 rounded-lg"><CheckCircle className="w-3 h-3" /></div> Set as Completed
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            <h4 className="text-xl font-bold text-slate-800 mb-2 group-hover:text-emerald-700 transition-colors">{season.name}</h4>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded uppercase border border-emerald-100">
                {getScoringLabel(season.scoringSystem)}
              </span>
            </div>
            <p className="text-sm text-slate-500 mb-6 line-clamp-2 leading-relaxed">{season.description}</p>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-100/50">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  <span className="text-xs font-bold text-slate-600">Season Duration</span>
                </div>
                <span className="text-xs font-bold text-slate-800">
                  {new Date(season.startDate).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })} - {new Date(season.endDate).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}
                </span>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-100/50">
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-slate-400" />
                  <span className="text-xs font-bold text-slate-600">Events Linked</span>
                </div>
                <span className="text-xs font-bold text-emerald-600">{season.totalEvents} Tournaments</span>
              </div>
            </div>

            <button 
              onClick={() => setViewingRankings(season)}
              className="w-full mt-6 py-4 px-4 flex items-center justify-center gap-2 text-sm font-black text-slate-800 hover:text-white bg-slate-50 hover:bg-emerald-600 rounded-[1.25rem] transition-all border border-slate-100 hover:border-emerald-500 shadow-sm active:scale-[0.98]"
            >
              <Trophy className="w-4 h-4" />
              View Season Leaderboard
              <ChevronRight className="w-4 h-4 ml-1" />
            </button>
          </div>
        ))}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowAddModal(false)} />
          <div className="relative bg-white w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="bg-slate-900 p-6 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-emerald-500 p-2 rounded-xl">
                  <Flag className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-bold">Launch New Season</h3>
              </div>
              <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-white/10 rounded-lg"><X className="w-5 h-5" /></button>
            </div>
            
            <form onSubmit={handleAddSeason} className="p-8 space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Season Name</label>
                  <input required type="text" placeholder="e.g., 2025 Summer Championship" className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none" value={newSeason.name} onChange={e => setNewSeason({...newSeason, name: e.target.value})} />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                    <LayoutList className="w-3.5 h-3.5" /> Scoring System
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <ScoringOption 
                      active={newSeason.scoringSystem === 'points'} 
                      onClick={() => setNewSeason({...newSeason, scoringSystem: 'points'})}
                      icon={Trophy}
                      label="Points"
                      sub="Order of Merit"
                    />
                    <ScoringOption 
                      active={newSeason.scoringSystem === 'stableford'} 
                      onClick={() => setNewSeason({...newSeason, scoringSystem: 'stableford'})}
                      icon={Calculator}
                      label="Stableford"
                      sub="Aggregate"
                    />
                    <ScoringOption 
                      active={newSeason.scoringSystem === 'medal'} 
                      onClick={() => setNewSeason({...newSeason, scoringSystem: 'medal'})}
                      icon={Zap}
                      label="Medal"
                      sub="Net Strokes"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Start Date</label>
                    <input required type="date" className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none" value={newSeason.startDate} onChange={e => setNewSeason({...newSeason, startDate: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">End Date</label>
                    <input required type="date" className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none" value={newSeason.endDate} onChange={e => setNewSeason({...newSeason, endDate: e.target.value})} />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Description</label>
                  <textarea rows={2} placeholder="Season goals..." className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none text-sm" value={newSeason.description} onChange={e => setNewSeason({...newSeason, description: e.target.value})} />
                </div>
              </div>

              <div className="flex items-center gap-4 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-3 text-slate-600 font-bold hover:text-slate-800 transition-colors">Cancel</button>
                <button type="submit" className="flex-[2] py-4 bg-slate-900 text-white font-bold rounded-xl shadow-lg hover:bg-slate-800 transition-all active:scale-[0.98]">Create Season</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const ScoringOption = ({ active, onClick, icon: Icon, label, sub }: any) => (
  <button 
    type="button"
    onClick={onClick}
    className={`p-4 rounded-2xl border text-center transition-all flex flex-col items-center gap-2 ${
      active 
      ? 'bg-emerald-50 border-emerald-500 text-emerald-700 shadow-sm' 
      : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200'
    }`}
  >
    <div className={`p-2 rounded-xl ${active ? 'bg-emerald-100' : 'bg-slate-50'}`}>
      <Icon className="w-4 h-4" />
    </div>
    <div>
      <p className="text-[10px] font-black uppercase tracking-tight">{label}</p>
      <p className="text-[8px] font-bold opacity-60 leading-none">{sub}</p>
    </div>
  </button>
);

export default Seasons;
