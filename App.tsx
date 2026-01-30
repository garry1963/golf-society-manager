
import React, { useState } from 'react';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import Members from './components/Members';
import Events from './components/Events';
import Seasons from './components/Seasons';
import CourseSearch from './components/CourseSearch';
import AIPro from './components/AIPro';
import { AppView, Facility } from './types';

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<AppView>(AppView.DASHBOARD);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [prefilledEvent, setPrefilledEvent] = useState<{ courseName: string, location: string } | null>(null);

  const handleAddFacility = (facility: Facility) => {
    setFacilities(prev => {
      if (prev.find(f => f.name === facility.name)) return prev;
      return [...prev, facility];
    });
  };

  const handlePlanTournament = (courseName: string, location: string) => {
    setPrefilledEvent({ courseName, location });
    setActiveView(AppView.EVENTS);
  };

  const renderView = () => {
    switch (activeView) {
      case AppView.DASHBOARD:
        return <Dashboard />;
      case AppView.MEMBERS:
        return <Members />;
      case AppView.EVENTS:
        return (
          <Events 
            prefilled={prefilledEvent} 
            onModalClose={() => setPrefilledEvent(null)} 
            savedFacilities={facilities}
            onSearchCourse={() => setActiveView(AppView.COURSES)}
          />
        );
      case AppView.SEASONS:
        return <Seasons />;
      case AppView.COURSES:
        return (
          <CourseSearch 
            onSaveFacility={handleAddFacility} 
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
        return <Dashboard />;
    }
  };

  return (
    <Layout activeView={activeView} setActiveView={setActiveView}>
      {renderView()}
    </Layout>
  );
};

export default App;
