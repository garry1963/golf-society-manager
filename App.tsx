import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import Members from './components/Members';
import Tournaments from './components/Tournaments';
import LeagueTable from './components/LeagueTable';
import CourseFinder from './components/CourseFinder';
import Seasons from './components/Seasons';
import { ViewState, Member, Tournament, Course, Score, ScoringType, Season } from './types';

// Helper to generate default holes
const generateDefaultHoles = (par = 72) => {
  return Array(18).fill(null).map((_, i) => ({
    number: i + 1,
    par: i < 4 ? 4 : (i < 13 ? 4 : 4), // Simplified distribution
    index: i + 1
  }));
};

// Mock Data
const MOCK_MEMBERS: Member[] = [
  { id: '1', name: 'Tiger Woods', handicap: 0.5, joinedDate: '2023-01-01', handicapHistory: [], email: 'tiger@golf.com' },
  { id: '2', name: 'Rory McIlroy', handicap: -2.0, joinedDate: '2023-01-15', handicapHistory: [] },
  { id: '3', name: 'Happy Gilmore', handicap: 18, joinedDate: '2023-02-01', handicapHistory: [] },
];

const MOCK_COURSES: Course[] = [
  { id: 'c1', name: 'Augusta National', par: 72, holes: generateDefaultHoles(72) },
  { id: 'c2', name: 'St Andrews', par: 72, holes: generateDefaultHoles(72) },
  { id: 'c3', name: 'Pebble Beach', par: 71, holes: generateDefaultHoles(71) },
];

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>('DASHBOARD');
  
  // State
  const [members, setMembers] = useState<Member[]>(() => {
    const saved = localStorage.getItem('members');
    return saved ? JSON.parse(saved) : MOCK_MEMBERS;
  });
  
  const [courses, setCourses] = useState<Course[]>(() => {
    const saved = localStorage.getItem('courses');
    return saved ? JSON.parse(saved) : MOCK_COURSES;
  });

  const [seasons, setSeasons] = useState<Season[]>(() => {
    const saved = localStorage.getItem('seasons');
    return saved ? JSON.parse(saved) : [];
  });

  const [tournaments, setTournaments] = useState<Tournament[]>(() => {
    const saved = localStorage.getItem('tournaments');
    return saved ? JSON.parse(saved) : [];
  });

  const [scores, setScores] = useState<Score[]>(() => {
    const saved = localStorage.getItem('scores');
    return saved ? JSON.parse(saved) : [];
  });

  // Helper State for navigation with context
  const [preSelectedSeasonId, setPreSelectedSeasonId] = useState<string | null>(null);
  const [preSelectedCourseId, setPreSelectedCourseId] = useState<string | null>(null);

  // Persistence
  useEffect(() => { localStorage.setItem('members', JSON.stringify(members)); }, [members]);
  useEffect(() => { localStorage.setItem('courses', JSON.stringify(courses)); }, [courses]);
  useEffect(() => { localStorage.setItem('seasons', JSON.stringify(seasons)); }, [seasons]);
  useEffect(() => { localStorage.setItem('tournaments', JSON.stringify(tournaments)); }, [tournaments]);
  useEffect(() => { localStorage.setItem('scores', JSON.stringify(scores)); }, [scores]);

  const handleAddCourse = (course: Course) => {
    // Check for duplicates by name roughly
    if (!courses.some(c => c.name === course.name)) {
      setCourses(prev => [...prev, course]);
    }
  };

  const handleCreateEventFromCourse = (course: Course) => {
    let courseId = course.id;
    const existing = courses.find(c => c.name === course.name);
    
    if (existing) {
      courseId = existing.id;
    } else {
      setCourses(prev => [...prev, course]);
    }
    
    setPreSelectedCourseId(courseId);
    setView('TOURNAMENTS');
  };

  const handleScheduleInSeason = (seasonId: string) => {
    setPreSelectedSeasonId(seasonId);
    setView('TOURNAMENTS');
  };

  // Handicap Calculation Logic
  const handleFinalizeTournament = (tournament: Tournament, tScores: Score[]) => {
    const updatedMembers = [...members];
    
    tScores.forEach(score => {
      const memberIndex = updatedMembers.findIndex(m => m.id === score.memberId);
      if (memberIndex === -1) return;
      
      const member = updatedMembers[memberIndex];
      let newHandicap = member.handicap;
      let changeReason = `Tournament: ${tournament.name}`;
      
      // Society General Play Rules (Simplified WHS)
      if (tournament.scoringType === ScoringType.STABLEFORD && score.points !== undefined) {
         // Buffer Zone: 32-36 points (inclusive)
         if (score.points > 36) {
           // Cut: 0.3 per point above 36
           const diff = score.points - 36;
           newHandicap -= (diff * 0.3);
         } else if (score.points < 32) {
           // Increase: 0.1 total
           newHandicap += 0.1;
         }
      } else if (tournament.scoringType === ScoringType.STROKE_PLAY && score.grossScore !== undefined) {
         const net = score.grossScore - member.handicap;
         const course = courses.find(c => c.id === tournament.courseId);
         const par = course?.par || 72;
         
         if (net < par) {
           // Cut
           const diff = par - net;
           newHandicap -= (diff * 0.3);
         } else if (net > par + 4) { // Buffer of 4
           newHandicap += 0.1;
         }
      }

      // Round to 1 decimal
      newHandicap = Math.round(newHandicap * 10) / 10;
      
      // Update history only if changed (or force record it?)
      // Let's record every tournament play for history tracking even if no change
      const historyEntry = {
        date: tournament.startDate,
        oldHandicap: member.handicap,
        newHandicap: newHandicap,
        reason: changeReason
      };

      updatedMembers[memberIndex] = {
        ...member,
        handicap: newHandicap,
        handicapHistory: [...(member.handicapHistory || []), historyEntry]
      };
    });

    setMembers(updatedMembers);
    
    // Mark completed
    const updatedTournaments = tournaments.map(t => 
       t.id === tournament.id ? { ...t, completed: true } : t
    );
    setTournaments(updatedTournaments);
  };

  const renderView = () => {
    switch (view) {
      case 'DASHBOARD':
        // Calculate simple Global Leaderboard for dashboard
        const stats: Record<string, number> = {};
        members.forEach(m => stats[m.id] = 0);
        tournaments.filter(t => t.completed).forEach(t => {
           const tScores = scores.filter(s => s.tournamentId === t.id);
           tScores.sort((a,b) => (b.points || 0) - (a.points || 0)); // Default sort
           tScores.forEach((s, idx) => {
             const points = [25, 18, 15, 12, 10][idx] || 0;
             if(stats[s.memberId] !== undefined) stats[s.memberId] += points;
           });
        });
        const dashboardLeaderboard = Object.entries(stats)
           .map(([id, total]) => ({ memberId: id, totalPoints: total, eventsPlayed: 0, wins: 0 }))
           .sort((a,b) => b.totalPoints - a.totalPoints);

        return <Dashboard members={members} tournaments={tournaments} leaderboard={dashboardLeaderboard} onNavigate={setView} />;
      
      case 'MEMBERS':
        return <Members members={members} setMembers={setMembers} scores={scores} tournaments={tournaments} />;
      
      case 'SEASONS':
        return (
          <Seasons 
            seasons={seasons} 
            setSeasons={setSeasons} 
            tournaments={tournaments} 
            members={members} 
            scores={scores}
            onScheduleTournament={handleScheduleInSeason}
          />
        );

      case 'TOURNAMENTS':
        return (
          <Tournaments 
            tournaments={tournaments} 
            setTournaments={setTournaments}
            courses={courses}
            members={members}
            scores={scores}
            setScores={setScores}
            seasons={seasons}
            onFinalizeTournament={handleFinalizeTournament}
            preSelectedSeasonId={preSelectedSeasonId}
            preSelectedCourseId={preSelectedCourseId}
            onClearPreSelectedCourse={() => setPreSelectedCourseId(null)}
          />
        );
      
      case 'LEAGUE':
        return <LeagueTable members={members} tournaments={tournaments} scores={scores} />;
      
      case 'COURSES':
        return (
          <CourseFinder 
            courses={courses} 
            onAddCourse={handleAddCourse} 
            onCreateEvent={handleCreateEventFromCourse} 
          />
        );
        
      default:
        return <Dashboard members={members} tournaments={tournaments} leaderboard={[]} onNavigate={setView} />;
    }
  };

  return (
    <Layout currentView={view} setView={setView}>
      {renderView()}
    </Layout>
  );
};

export default App;