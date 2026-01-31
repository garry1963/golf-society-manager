
import React, { useState, useEffect, useMemo } from 'react';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import Members from './components/Members';
import Events from './components/Events';
import Seasons from './components/Seasons';
import CourseSearch from './components/CourseSearch';
import AIPro from './components/AIPro';
import { AppView, Facility, Event as GolfEvent, Member, Season } from './types';
import { MOCK_EVENTS, MOCK_MEMBERS, MOCK_SEASONS } from './constants';

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<AppView>(AppView.DASHBOARD);
  
  // --- Centralized State ---
  const [events, setEvents] = useState<GolfEvent[]>(() => {
    const saved = localStorage.getItem('fairway_events');
    return saved ? JSON.parse(saved) : MOCK_EVENTS;
  });

  const [members, setMembers] = useState<Member[]>(() => {
    const saved = localStorage.getItem('fairway_members');
    return saved ? JSON.parse(saved) : MOCK_MEMBERS;
  });

  const [seasons, setSeasons] = useState<Season[]>(() => {
    const saved = localStorage.getItem('fairway_seasons');
    return saved ? JSON.parse(saved) : MOCK_SEASONS;
  });

  const [facilities, setFacilities] = useState<Facility[]>(() => {
    const saved = localStorage.getItem('fairway_facilities');
    return saved ? JSON.parse(saved) : [];
  });

  const [prefilledEvent, setPrefilledEvent] = useState<{ courseName: string, location: string, facilityId?: string } | null>(null);

  // --- Persistence & Sync ---
  useEffect(() => {
    localStorage.setItem('fairway_events', JSON.stringify(events));
    localStorage.setItem('fairway_members', JSON.stringify(members));
    localStorage.setItem('fairway_seasons', JSON.stringify(seasons));
    localStorage.setItem('fairway_facilities', JSON.stringify(facilities));
    // Dispatch custom event for cross-tab sync if needed, though props handle same-tab sync
    window.dispatchEvent(new Event('storage'));
  }, [events, members, seasons, facilities]);

  // Sync state from localStorage if changed elsewhere (e.g., other tabs)
  useEffect(() => {
    const handleStorageChange = () => {
      const savedEvents = localStorage.getItem('fairway_events');
      if (savedEvents) setEvents(JSON.parse(savedEvents));
      
      const savedMembers = localStorage.getItem('fairway_members');
      if (savedMembers) setMembers(JSON.parse(savedMembers));
      
      const savedSeasons = localStorage.getItem('fairway_seasons');
      if (savedSeasons) setSeasons(JSON.parse(savedSeasons));
      
      const savedFacilities = localStorage.getItem('fairway_facilities');
      if (savedFacilities) setFacilities(JSON.parse(savedFacilities));
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const nextEvent = useMemo(() => {
    return events
      .filter(e => e.status === 'upcoming')
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0] || null;
  }, [events]);

  // --- Actions ---
  const handlePlanTournament = (courseName: string, location: string, facilityId?: string) => {
    setPrefilledEvent({ courseName, location, facilityId });
    setActiveView(AppView.EVENTS);
  };

  const handleAddFacility = (facility: Facility) => {
    setFacilities(prev => {
      if (prev.find(f => f.name === facility.name)) return prev;
      return [...prev, facility];
    });
  };

  const handleRemoveFacility = (id: string) => {
    setFacilities(prev => prev.filter(f => f.id !== id));
  };

  const renderView = () => {
    switch (activeView) {
      case AppView.DASHBOARD:
        return (
          <Dashboard 
            events={events} 
            members={members} 
            onManageEvent={() => setActiveView(AppView.EVENTS)} 
          />
        );
      case AppView.MEMBERS:
        return (
          <Members 
            members={members} 
            setMembers={setMembers} 
          />
        );
      case AppView.EVENTS:
        return (
          <Events 
            events={events}
            setEvents={setEvents}
            members={members}
            setMembers={setMembers}
            seasons={seasons}
            prefilled={prefilledEvent} 
            onModalClose={() => setPrefilledEvent(null)} 
            savedFacilities={facilities}
            onSearchCourse={() => setActiveView(AppView.COURSES)}
          />
        );
      case AppView.SEASONS:
        return (
          <Seasons 
            seasons={seasons}
            setSeasons={setSeasons}
            events={events}
            setEvents={setEvents}
            members={members}
          />
        );
      case AppView.COURSES:
        return (
          <CourseSearch 
            onSaveFacility={handleAddFacility} 
            onRemoveFacility={handleRemoveFacility}
            onPlanTournament={handlePlanTournament}
            savedFacilities={facilities}
          />
        );
      case AppView.AI_PRO:
        return <AIPro />;
      case AppView.STATS:
        return (
          <div className="bg-white p-12 rounded-3xl border border-dashed border-slate-300 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
              <span className="text-3xl">📊</span>
            </div>
            <h3 className="text-lg font-bold text-slate-800">In-Depth Analytics Coming Soon</h3>
            <p className="text-slate-500 text-sm max-w-xs mt-2">We are currently crunching the data for advanced society performance metrics.</p>
          </div>
        );
      default:
        return (
          <Dashboard 
            events={events} 
            members={members} 
            onManageEvent={() => setActiveView(AppView.EVENTS)} 
          />
        );
    }
  };

  return (
    <Layout 
      activeView={activeView} 
      setActiveView={setActiveView}
      nextEvent={nextEvent}
    >
      {renderView()}
    </Layout>
  );
};

export default App;
