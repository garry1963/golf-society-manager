import React, { useState, useEffect } from 'react';
import { Tournament, Course, Member, Score, ScoringType, Season, CourseHole } from '../types';
import { Calendar, MapPin, CheckCircle, Trophy, Edit3, Loader2, Sparkles, Users, UserPlus, Trash2, FileSpreadsheet, ChevronDown, ChevronUp } from 'lucide-react';
import { generateMatchReport } from '../services/gemini';

interface TournamentsProps {
  tournaments: Tournament[];
  setTournaments: React.Dispatch<React.SetStateAction<Tournament[]>>;
  courses: Course[];
  members: Member[];
  scores: Score[];
  setScores: React.Dispatch<React.SetStateAction<Score[]>>;
  seasons: Season[];
  onFinalizeTournament: (tournament: Tournament, scores: Score[]) => void;
  preSelectedSeasonId?: string | null;
  preSelectedCourseId?: string | null;
  onClearPreSelectedCourse?: () => void;
}

const Tournaments: React.FC<TournamentsProps> = ({ 
  tournaments, setTournaments, courses, members, scores, setScores, seasons, onFinalizeTournament, preSelectedSeasonId, preSelectedCourseId, onClearPreSelectedCourse 
}) => {
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [matchReport, setMatchReport] = useState<string | null>(null);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  
  // Scorecard Modal State
  const [scorecardMemberId, setScorecardMemberId] = useState<string | null>(null);
  
  // New Tournament State
  const [newTourney, setNewTourney] = useState<{
    name: string; 
    startDate: string; 
    endDate: string;
    courseId: string; 
    scoringType: ScoringType; 
    rounds: number;
    seasonId: string;
    rosterIds: string[];
  }>({
    name: '',
    startDate: '',
    endDate: '',
    courseId: courses[0]?.id || '',
    scoringType: ScoringType.STABLEFORD,
    rounds: 1,
    seasonId: preSelectedSeasonId || '',
    rosterIds: []
  });

  // Effect to handle pre-selection of Course (from CourseFinder)
  useEffect(() => {
    if (preSelectedCourseId) {
      setIsCreating(true);
      setNewTourney(prev => ({
        ...prev,
        courseId: preSelectedCourseId
      }));
      // Clean up the prop so it doesn't re-trigger unnecessarily if we implement complex navigation later
      if (onClearPreSelectedCourse) {
        onClearPreSelectedCourse();
      }
    }
  }, [preSelectedCourseId, onClearPreSelectedCourse]);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const t: Tournament = {
      id: crypto.randomUUID(),
      ...newTourney,
      completed: false,
    };
    setTournaments([...tournaments, t]);
    setIsCreating(false);
  };

  const handleScoreUpdate = (tournamentId: string, memberId: string, value: string, type: 'gross' | 'points') => {
    const numValue = parseFloat(value);
    const existingScore = scores.find(s => s.tournamentId === tournamentId && s.memberId === memberId);

    const updatedScoreData = type === 'gross' 
        ? { grossScore: numValue }
        : { points: numValue };

    if (existingScore) {
      setScores(scores.map(s => {
        if (s.id === existingScore.id) {
          return { ...s, ...updatedScoreData };
        }
        return s;
      }));
    } else {
      const newScore: Score = {
        id: crypto.randomUUID(),
        tournamentId,
        memberId,
        ...updatedScoreData
      };
      setScores([...scores, newScore]);
    }
  };

  const handleHoleScoresUpdate = (tournamentId: string, memberId: string, holeScores: number[]) => {
    // Determine the course
    const course = courses.find(c => c.id === selectedTournament?.courseId);
    const member = members.find(m => m.id === memberId);
    
    if(!selectedTournament || !course || !member) return;

    // Calculate Totals
    const totalGross = holeScores.reduce((a, b) => a + (b || 0), 0);
    let totalPoints = 0;

    // Auto-Calc Stableford if course data exists
    if (selectedTournament.scoringType === ScoringType.STABLEFORD) {
       const playingHandicap = Math.round(member.handicap); // Simplified allocation
       
       totalPoints = holeScores.reduce((acc, score, idx) => {
          if (!score || score === 0) return acc; // Scratch or not played
          const holeIndex = idx + 1;
          // Find hole data
          const holeData = course.holes?.find(h => h.number === holeIndex);
          const par = holeData?.par || 4; // Default to par 4 if missing
          const strokeIndex = holeData?.index || holeIndex; // Default to 1-18 sequence

          // Calculate Strokes Received for this hole
          // Basic logic: 1 stroke if SI <= handicap
          let strokesReceived = 0;
          if (playingHandicap > 0) {
             strokesReceived = Math.floor(playingHandicap / 18);
             const remainder = playingHandicap % 18;
             if (strokeIndex <= remainder) strokesReceived += 1;
          } else if (playingHandicap < 0) {
             // Plus handicap logic (simplified: giving strokes back on hardest holes)
             // Not implementing full Plus handicap logic for brevity, assume 0 alloc for plus
             strokesReceived = 0;
          }

          const netScore = score - strokesReceived;
          const holePoints = Math.max(0, 2 + par - netScore);
          return acc + holePoints;
       }, 0);
    }

    const existingScore = scores.find(s => s.tournamentId === tournamentId && s.memberId === memberId);

    if (existingScore) {
       setScores(scores.map(s => s.id === existingScore.id ? { ...s, holeScores, grossScore: totalGross, points: totalPoints } : s));
    } else {
       setScores([...scores, {
          id: crypto.randomUUID(),
          tournamentId,
          memberId,
          holeScores,
          grossScore: totalGross,
          points: totalPoints
       }]);
    }
  };

  const finalizeTournament = async (t: Tournament) => {
    if(!window.confirm("End tournament, calculate results, and update handicaps? This cannot be undone.")) return;
    const tScores = scores.filter(s => s.tournamentId === t.id);
    onFinalizeTournament(t, tScores);
    
    setIsGeneratingReport(true);
    setMatchReport(null);
    
    let winner = null;
    let winningScore = 0;

    if (tScores.length > 0) {
      if (t.scoringType === ScoringType.STABLEFORD) {
         tScores.sort((a, b) => (b.points || 0) - (a.points || 0));
         winningScore = tScores[0].points || 0;
      } else {
         tScores.sort((a, b) => (a.grossScore || 999) - (b.grossScore || 999));
         winningScore = tScores[0].grossScore || 0;
      }
      winner = members.find(m => m.id === tScores[0].memberId);
    }

    if (winner) {
      const courseName = courses.find(c => c.id === t.courseId)?.name || 'Unknown Course';
      const report = await generateMatchReport(t.name, winner.name, courseName, winningScore, t.scoringType);
      setMatchReport(report);
    }
    setIsGeneratingReport(false);
  };

  const toggleRosterMember = (id: string) => {
    if (newTourney.rosterIds.includes(id)) {
      setNewTourney({ ...newTourney, rosterIds: newTourney.rosterIds.filter(m => m !== id) });
    } else {
      setNewTourney({ ...newTourney, rosterIds: [...newTourney.rosterIds, id] });
    }
  };

  const getParticipatingMembers = (t: Tournament) => {
    if (t.rosterIds && t.rosterIds.length > 0) {
      return members.filter(m => t.rosterIds?.includes(m.id));
    }
    return members;
  };

  const addMemberToActiveTournament = (memberId: string) => {
     if (selectedTournament) {
        const currentRoster = selectedTournament.rosterIds || members.map(m => m.id);
        if (!currentRoster.includes(memberId)) {
           const updatedTournaments = tournaments.map(t => 
             t.id === selectedTournament.id ? { ...t, rosterIds: [...currentRoster, memberId] } : t
           );
           setTournaments(updatedTournaments);
           setSelectedTournament({ ...selectedTournament, rosterIds: [...currentRoster, memberId] });
        }
     }
  };

  // Scorecard Modal Component
  const ScorecardModal = () => {
     if (!scorecardMemberId || !selectedTournament) return null;
     
     const member = members.find(m => m.id === scorecardMemberId);
     const course = courses.find(c => c.id === selectedTournament.courseId);
     const score = scores.find(s => s.tournamentId === selectedTournament.id && s.memberId === scorecardMemberId);
     
     if (!member || !course) return null;

     // Ensure we have 18 holes of data even if course is missing it
     const holesData = course.holes || Array(18).fill(null).map((_, i) => ({ number: i+1, par: 4, index: i+1 }));
     const currentHoleScores = score?.holeScores || Array(18).fill(0);
     const playingHandicap = Math.round(member.handicap);

     const updateHole = (index: number, val: string) => {
        const newVal = parseInt(val) || 0;
        const newScores = [...currentHoleScores];
        newScores[index] = newVal;
        handleHoleScoresUpdate(selectedTournament.id, member.id, newScores);
     };

     // Calculation Helpers
     const calculateNet = (holeIndex: number, gross: number) => {
       if (!gross) return 0;
       const hole = holesData[holeIndex];
       const strokeIndex = hole.index;
       
       let strokesReceived = 0;
       if (playingHandicap > 0) {
          strokesReceived = Math.floor(playingHandicap / 18);
          if (strokeIndex <= (playingHandicap % 18)) strokesReceived += 1;
       }
       return gross - strokesReceived;
     };

     const netScores = currentHoleScores.map((s, i) => calculateNet(i, s));

     const front9Gross = currentHoleScores.slice(0, 9).reduce((a,b) => a+b, 0);
     const back9Gross = currentHoleScores.slice(9, 18).reduce((a,b) => a+b, 0);
     const totalGross = front9Gross + back9Gross;

     const front9Net = netScores.slice(0, 9).reduce((a,b) => a+b, 0);
     const back9Net = netScores.slice(9, 18).reduce((a,b) => a+b, 0);
     const totalNet = front9Net + back9Net;

     return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
           <div className="bg-white rounded-xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto flex flex-col">
              <div className="bg-emerald-900 text-white p-4 flex justify-between items-center sticky top-0 z-10">
                 <div>
                    <h3 className="text-xl font-bold">{member.name} - Scorecard</h3>
                    <p className="text-emerald-200 text-sm">{course.name} (PH: {playingHandicap})</p>
                 </div>
                 <button onClick={() => setScorecardMemberId(null)} className="text-white hover:text-gray-300 text-2xl">&times;</button>
              </div>
              
              <div className="p-6 space-y-8">
                 <div className="flex justify-between items-center bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <div>
                       <span className="text-gray-500 text-sm block">Scoring Mode</span>
                       <span className="font-bold text-gray-800">{selectedTournament.scoringType}</span>
                    </div>
                    <div className="flex gap-8">
                       <div className="text-right">
                          <span className="text-gray-500 text-sm block">Current Gross</span>
                          <span className="text-3xl font-bold text-emerald-700">{totalGross}</span>
                       </div>
                       <div className="text-right border-l pl-8 border-gray-200">
                          <span className="text-gray-500 text-sm block">Current Net</span>
                          <span className="text-3xl font-bold text-emerald-700">{totalNet}</span>
                       </div>
                       {selectedTournament.scoringType === ScoringType.STABLEFORD && (
                          <div className="text-right border-l pl-8 border-gray-200">
                             <span className="text-gray-500 text-sm block">Points (Calc)</span>
                             <span className="text-3xl font-bold text-amber-600">{score?.points || 0}</span>
                          </div>
                       )}
                    </div>
                 </div>

                 {/* Front 9 */}
                 <div>
                    <h4 className="font-bold text-gray-700 mb-2 border-b pb-1">Front 9</h4>
                    <div className="grid grid-cols-10 gap-1 text-center text-sm">
                       <div className="font-bold text-gray-500 flex flex-col justify-end pb-2">Hole</div>
                       {holesData.slice(0,9).map(h => <div key={h.number} className="bg-gray-100 py-1 rounded-t">{h.number}</div>)}
                       
                       <div className="font-bold text-gray-500 py-2">Par</div>
                       {holesData.slice(0,9).map(h => <div key={h.number} className="py-2 border bg-gray-50 text-gray-400">{h.par}</div>)}

                       <div className="font-bold text-gray-500 py-2">SI</div>
                       {holesData.slice(0,9).map(h => <div key={h.number} className="py-2 border bg-gray-50 text-xs text-gray-400">{h.index}</div>)}

                       <div className="font-bold text-emerald-700 py-2">Gross</div>
                       {currentHoleScores.slice(0,9).map((s, i) => (
                          <input 
                             key={i} 
                             type="number" 
                             min="0"
                             value={s || ''} 
                             onChange={(e) => updateHole(i, e.target.value)}
                             className="w-full text-center border-2 border-emerald-100 focus:border-emerald-500 rounded py-2 font-bold text-lg" 
                          />
                       ))}
                       
                       <div className="font-bold text-emerald-600 py-2 bg-emerald-50">Net</div>
                       {netScores.slice(0,9).map((s, i) => (
                          <div key={i} className="py-2 border bg-emerald-50 text-emerald-800 font-bold flex items-center justify-center">
                             {currentHoleScores[i] ? s : '-'}
                          </div>
                       ))}
                    </div>
                    <div className="text-right mt-2 font-bold text-gray-600 space-x-4">
                       <span>Front 9 Gross: {front9Gross}</span>
                       <span>Front 9 Net: {front9Net}</span>
                    </div>
                 </div>

                 {/* Back 9 */}
                 <div>
                    <h4 className="font-bold text-gray-700 mb-2 border-b pb-1">Back 9</h4>
                    <div className="grid grid-cols-10 gap-1 text-center text-sm">
                       <div className="font-bold text-gray-500 flex flex-col justify-end pb-2">Hole</div>
                       {holesData.slice(9,18).map(h => <div key={h.number} className="bg-gray-100 py-1 rounded-t">{h.number}</div>)}
                       
                       <div className="font-bold text-gray-500 py-2">Par</div>
                       {holesData.slice(9,18).map(h => <div key={h.number} className="py-2 border bg-gray-50 text-gray-400">{h.par}</div>)}

                       <div className="font-bold text-gray-500 py-2">SI</div>
                       {holesData.slice(9,18).map(h => <div key={h.number} className="py-2 border bg-gray-50 text-xs text-gray-400">{h.index}</div>)}

                       <div className="font-bold text-emerald-700 py-2">Gross</div>
                       {currentHoleScores.slice(9,18).map((s, i) => (
                          <input 
                             key={i+9} 
                             type="number" 
                             min="0"
                             value={s || ''} 
                             onChange={(e) => updateHole(i+9, e.target.value)}
                             className="w-full text-center border-2 border-emerald-100 focus:border-emerald-500 rounded py-2 font-bold text-lg" 
                          />
                       ))}
                       
                       <div className="font-bold text-emerald-600 py-2 bg-emerald-50">Net</div>
                       {netScores.slice(9,18).map((s, i) => (
                          <div key={i+9} className="py-2 border bg-emerald-50 text-emerald-800 font-bold flex items-center justify-center">
                             {currentHoleScores[i+9] ? s : '-'}
                          </div>
                       ))}
                    </div>
                    <div className="text-right mt-2 font-bold text-gray-600 space-x-4">
                       <span>Back 9 Gross: {back9Gross}</span>
                       <span>Back 9 Net: {back9Net}</span>
                    </div>
                 </div>
              </div>
              
              <div className="p-4 border-t bg-gray-50 flex justify-end">
                 <button onClick={() => setScorecardMemberId(null)} className="px-6 py-2 bg-emerald-600 text-white rounded font-bold hover:bg-emerald-700">Done</button>
              </div>
           </div>
        </div>
     );
  };

  return (
    <div className="space-y-6">
      {!selectedTournament ? (
        <>
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-900">Tournaments</h2>
            <button 
              onClick={() => setIsCreating(true)}
              className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2"
            >
              <Calendar size={18} /> Schedule Event
            </button>
          </div>

          {/* Creation Form */}
          {isCreating && (
            <div className="bg-white p-6 rounded-xl border border-gray-200 mb-6 animate-fade-in shadow-lg">
               <h3 className="font-bold mb-4 text-xl">Schedule New Tournament</h3>
               <form onSubmit={handleCreate} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Tournament Name</label>
                      <input required className="w-full border p-2 rounded" value={newTourney.name} onChange={e => setNewTourney({...newTourney, name: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Season</label>
                      <select className="w-full border p-2 rounded" value={newTourney.seasonId} onChange={e => setNewTourney({...newTourney, seasonId: e.target.value})}>
                        <option value="">No Season / Exhibition</option>
                        {seasons.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Start Date</label>
                      <input required type="date" className="w-full border p-2 rounded" value={newTourney.startDate} onChange={e => setNewTourney({...newTourney, startDate: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">End Date</label>
                      <input type="date" className="w-full border p-2 rounded" value={newTourney.endDate} onChange={e => setNewTourney({...newTourney, endDate: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Course</label>
                      <select className="w-full border p-2 rounded" value={newTourney.courseId} onChange={e => setNewTourney({...newTourney, courseId: e.target.value})}>
                        {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>
                    <div>
                       <label className="block text-sm font-medium text-gray-700">Format</label>
                       <select className="w-full border p-2 rounded" value={newTourney.scoringType} onChange={e => setNewTourney({...newTourney, scoringType: e.target.value as ScoringType})}>
                        <option value={ScoringType.STABLEFORD}>Stableford</option>
                        <option value={ScoringType.STROKE_PLAY}>Stroke Play</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Rounds</label>
                      <input type="number" min="1" className="w-full border p-2 rounded" value={newTourney.rounds} onChange={e => setNewTourney({...newTourney, rounds: parseInt(e.target.value)})} />
                    </div>
                  </div>

                  {/* Roster Selection */}
                  <div className="border-t pt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Select Roster (Leave empty for all members)</label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 max-h-40 overflow-y-auto p-2 bg-gray-50 rounded">
                       {members.map(m => (
                         <label key={m.id} className="flex items-center space-x-2 text-sm cursor-pointer hover:bg-gray-100 p-1 rounded">
                           <input 
                              type="checkbox" 
                              checked={newTourney.rosterIds.includes(m.id)} 
                              onChange={() => toggleRosterMember(m.id)}
                              className="rounded text-emerald-600 focus:ring-emerald-500"
                           />
                           <span>{m.name}</span>
                         </label>
                       ))}
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-4">
                    <button type="button" onClick={() => setIsCreating(false)} className="px-4 py-2 text-gray-600">Cancel</button>
                    <button type="submit" className="px-4 py-2 bg-emerald-600 text-white rounded font-medium">Create Event</button>
                  </div>
               </form>
            </div>
          )}

          {/* List */}
          <div className="grid gap-4">
            {tournaments.length === 0 && <p className="text-gray-400">No tournaments scheduled.</p>}
            {tournaments.sort((a,b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()).map(t => {
              const course = courses.find(c => c.id === t.courseId);
              const season = seasons.find(s => s.id === t.seasonId);
              return (
                <div key={t.id} className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center">
                  <div className="mb-4 md:mb-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-xl font-bold text-gray-900">{t.name}</h3>
                      {t.completed && <span className="bg-emerald-100 text-emerald-700 text-xs px-2 py-0.5 rounded-full font-medium">Finalized</span>}
                      {season && <span className="bg-blue-50 text-blue-700 text-xs px-2 py-0.5 rounded-full border border-blue-100">{season.name}</span>}
                    </div>
                    <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1"><Calendar size={14} /> {new Date(t.startDate).toLocaleDateString()}</span>
                      <span className="flex items-center gap-1"><MapPin size={14} /> {course?.name}</span>
                      <span className="flex items-center gap-1"><Trophy size={14} /> {t.scoringType}</span>
                    </div>
                  </div>
                  <button 
                    onClick={() => setSelectedTournament(t)}
                    className="px-4 py-2 bg-gray-50 text-emerald-700 font-medium rounded-lg hover:bg-emerald-50 transition-colors w-full md:w-auto"
                  >
                    {t.completed ? 'View Results' : 'Manage Event'}
                  </button>
                </div>
              );
            })}
          </div>
        </>
      ) : (
        /* Tournament Detail View */
        <div className="space-y-6 animate-fade-in">
          <button onClick={() => { setSelectedTournament(null); setMatchReport(null); }} className="text-sm text-gray-500 hover:text-emerald-600 mb-2">&larr; Back to Tournaments</button>
          
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex flex-col md:flex-row justify-between items-start mb-6 gap-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{selectedTournament.name}</h1>
                <p className="text-gray-500">{new Date(selectedTournament.startDate).toDateString()} &bull; {selectedTournament.scoringType} &bull; {selectedTournament.rounds} Round(s)</p>
              </div>
              {!selectedTournament.completed && (
                <div className="flex gap-2">
                   <div className="relative group">
                      <button className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 flex items-center gap-2">
                         <UserPlus size={18} /> Add Player
                      </button>
                      <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-xl hidden group-hover:block z-10 max-h-60 overflow-y-auto">
                         {members.filter(m => !selectedTournament.rosterIds?.includes(m.id)).map(m => (
                           <button 
                             key={m.id} 
                             onClick={() => addMemberToActiveTournament(m.id)}
                             className="block w-full text-left px-4 py-2 hover:bg-gray-50 text-sm"
                           >
                             {m.name}
                           </button>
                         ))}
                         {members.filter(m => !selectedTournament.rosterIds?.includes(m.id)).length === 0 && <div className="p-2 text-xs text-gray-400">All members added</div>}
                      </div>
                   </div>
                   <button 
                    onClick={() => finalizeTournament(selectedTournament)}
                    className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 flex items-center gap-2 shadow-sm"
                   >
                    <CheckCircle size={18} /> Finalize
                   </button>
                </div>
              )}
            </div>
            
            {/* AI Report Section */}
            {(isGeneratingReport || matchReport) && (
              <div className="mb-8 bg-gradient-to-r from-emerald-50 to-teal-50 p-6 rounded-lg border border-emerald-100">
                <div className="flex items-center gap-2 text-emerald-800 font-bold mb-2">
                  <Sparkles size={20} />
                  <span>AI Match Reporter</span>
                </div>
                {isGeneratingReport ? (
                   <div className="flex items-center gap-2 text-emerald-600">
                     <Loader2 className="animate-spin" size={18} />
                     Writing press release...
                   </div>
                ) : (
                  <p className="text-emerald-900 italic leading-relaxed">"{matchReport}"</p>
                )}
              </div>
            )}

            {/* Score Entry Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="p-4 font-semibold text-gray-700">Player</th>
                    <th className="p-4 font-semibold text-gray-700">Handicap</th>
                    <th className="p-4 font-semibold text-gray-700 w-32">
                      {selectedTournament.scoringType === ScoringType.STABLEFORD ? 'Points' : 'Gross Score'}
                    </th>
                    {selectedTournament.scoringType === ScoringType.STROKE_PLAY && (
                       <th className="p-4 font-semibold text-gray-700 w-32">Net Score</th>
                    )}
                    <th className="p-4 font-semibold text-gray-700 w-24">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {getParticipatingMembers(selectedTournament).map(member => {
                    const score = scores.find(s => s.tournamentId === selectedTournament.id && s.memberId === member.id);
                    const inputValue = selectedTournament.scoringType === ScoringType.STABLEFORD 
                      ? score?.points 
                      : score?.grossScore;
                    
                    const netScore = (score?.grossScore || 0) - member.handicap;

                    return (
                      <tr key={member.id} className="hover:bg-gray-50">
                        <td className="p-4 font-medium text-gray-900">{member.name}</td>
                        <td className="p-4 text-gray-500">{member.handicap}</td>
                        <td className="p-4">
                          {selectedTournament.completed ? (
                            <span className="font-bold text-lg">{inputValue || '-'}</span>
                          ) : (
                            <input 
                              type="number"
                              className="w-24 p-2 border border-gray-300 rounded focus:ring-2 focus:ring-emerald-500 outline-none font-mono"
                              placeholder="0"
                              value={inputValue || ''}
                              onChange={(e) => handleScoreUpdate(
                                selectedTournament.id, 
                                member.id, 
                                e.target.value, 
                                selectedTournament.scoringType === ScoringType.STABLEFORD ? 'points' : 'gross'
                              )}
                            />
                          )}
                        </td>
                         {selectedTournament.scoringType === ScoringType.STROKE_PLAY && (
                            <td className="p-4 font-bold text-gray-700">
                              {score?.grossScore ? netScore.toFixed(1) : '-'}
                            </td>
                         )}
                         <td className="p-4">
                            <button 
                               onClick={() => setScorecardMemberId(member.id)}
                               className="text-emerald-600 hover:bg-emerald-50 p-2 rounded-lg transition-colors flex items-center gap-1 text-sm font-medium"
                               title="Open Scorecard"
                            >
                               <FileSpreadsheet size={18} />
                               {score?.holeScores?.some(s => s > 0) ? 'Edit Card' : 'Add Card'}
                            </button>
                         </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
          
          {/* Render Scorecard Modal if active */}
          <ScorecardModal />
        </div>
      )}
    </div>
  );
};

export default Tournaments;