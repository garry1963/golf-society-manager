import React, { useState } from 'react';
import { Season, Tournament, Member, Score } from '../types';
import { Plus, Calendar, Trophy, ChevronRight, Trash2 } from 'lucide-react';
import LeagueTable from './LeagueTable';

interface SeasonsProps {
  seasons: Season[];
  setSeasons: React.Dispatch<React.SetStateAction<Season[]>>;
  tournaments: Tournament[];
  members: Member[];
  scores: Score[];
  onScheduleTournament: (seasonId: string) => void;
}

const Seasons: React.FC<SeasonsProps> = ({ 
  seasons, setSeasons, tournaments, members, scores, onScheduleTournament 
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [selectedSeason, setSelectedSeason] = useState<Season | null>(null);
  
  const [newSeason, setNewSeason] = useState({ name: '', startDate: '', endDate: '' });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const s: Season = {
      id: crypto.randomUUID(),
      ...newSeason
    };
    setSeasons([...seasons, s]);
    setIsCreating(false);
    setNewSeason({ name: '', startDate: '', endDate: '' });
  };

  const handleDeleteSeason = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this season?')) {
      setSeasons(seasons.filter(s => s.id !== id));
      if (selectedSeason?.id === id) {
        setSelectedSeason(null);
      }
    }
  };

  const getSeasonTournaments = (seasonId: string) => {
    return tournaments.filter(t => t.seasonId === seasonId).sort((a,b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {!selectedSeason ? (
        <>
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Seasons</h2>
              <p className="text-gray-500">Manage competition seasons and view league history.</p>
            </div>
            <button 
              onClick={() => setIsCreating(true)}
              className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2"
            >
              <Plus size={18} /> New Season
            </button>
          </div>

          {isCreating && (
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm mb-6">
              <h3 className="font-bold mb-4 text-lg">Create New Season</h3>
              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">Season Name</label>
                   <p className="text-xs text-gray-500 mb-1">Enter a descriptive name for this competitive season.</p>
                   <input required placeholder="e.g. 2024 Winter League" className="w-full border p-2 rounded" value={newSeason.name} onChange={e => setNewSeason({...newSeason, name: e.target.value})} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                    <p className="text-xs text-gray-500 mb-1">When does the season begin?</p>
                    <input required type="date" className="w-full border p-2 rounded" value={newSeason.startDate} onChange={e => setNewSeason({...newSeason, startDate: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                    <p className="text-xs text-gray-500 mb-1">When does the season conclude?</p>
                    <input required type="date" className="w-full border p-2 rounded" value={newSeason.endDate} onChange={e => setNewSeason({...newSeason, endDate: e.target.value})} />
                  </div>
                </div>
                <div className="flex justify-end gap-2 mt-4">
                   <button type="button" onClick={() => setIsCreating(false)} className="px-4 py-2 text-gray-600">Cancel</button>
                   <button type="submit" className="px-4 py-2 bg-emerald-600 text-white rounded font-medium">Create Season</button>
                </div>
              </form>
            </div>
          )}

          <div className="grid gap-4">
             {seasons.length === 0 && <p className="text-gray-400 py-8 text-center">No seasons defined. Create one to get started!</p>}
             {seasons.sort((a,b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()).map(season => {
               const sTournaments = getSeasonTournaments(season.id);
               const isCurrent = new Date() >= new Date(season.startDate) && new Date() <= new Date(season.endDate);
               
               return (
                 <div key={season.id} className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow relative group">
                    <button 
                       onClick={(e) => handleDeleteSeason(season.id, e)}
                       className="absolute top-4 right-4 text-gray-300 hover:text-red-500 transition-colors p-2 z-10"
                       title="Delete Season"
                    >
                       <Trash2 size={18} />
                    </button>
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center cursor-pointer" onClick={() => setSelectedSeason(season)}>
                       <div>
                          <div className="flex items-center gap-3 mb-2">
                             <h3 className="text-xl font-bold text-gray-900">{season.name}</h3>
                             {isCurrent && <span className="bg-emerald-100 text-emerald-800 text-xs px-2 py-1 rounded-full font-bold">CURRENT</span>}
                          </div>
                          <div className="text-sm text-gray-500 flex items-center gap-4">
                             <span className="flex items-center gap-1"><Calendar size={14} /> {new Date(season.startDate).toLocaleDateString()} - {new Date(season.endDate).toLocaleDateString()}</span>
                             <span className="flex items-center gap-1"><Trophy size={14} /> {sTournaments.length} Events</span>
                          </div>
                       </div>
                       <div 
                         className="mt-4 md:mt-0 text-emerald-600 font-medium hover:text-emerald-800 flex items-center gap-1"
                       >
                         View Standings & Events <ChevronRight size={18} />
                       </div>
                    </div>
                 </div>
               );
             })}
          </div>
        </>
      ) : (
        <div className="space-y-8">
           <button onClick={() => setSelectedSeason(null)} className="text-gray-500 hover:text-emerald-600 flex items-center gap-1 mb-4">
             &larr; Back to Seasons
           </button>

           <div className="flex justify-between items-end border-b border-gray-200 pb-4">
             <div>
               <h1 className="text-3xl font-bold text-gray-900">{selectedSeason.name}</h1>
               <p className="text-gray-500">{new Date(selectedSeason.startDate).toLocaleDateString()} - {new Date(selectedSeason.endDate).toLocaleDateString()}</p>
             </div>
             <div className="flex gap-2">
                <button 
                   onClick={(e) => handleDeleteSeason(selectedSeason.id, e)}
                   className="bg-red-50 text-red-600 px-4 py-2 rounded-lg hover:bg-red-100 shadow-sm flex items-center gap-2"
                >
                  <Trash2 size={18} /> Delete
                </button>
                <button 
                  onClick={() => onScheduleTournament(selectedSeason.id)}
                  className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 shadow-sm flex items-center gap-2"
                >
                  <Calendar size={18} /> Schedule Event
                </button>
             </div>
           </div>

           <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* League Table Column */}
              <div className="lg:col-span-2">
                 <LeagueTable members={members} tournaments={getSeasonTournaments(selectedSeason.id)} scores={scores} />
              </div>

              {/* Tournament List Column */}
              <div>
                 <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><Calendar size={20} /> Season Schedule</h3>
                 <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    {getSeasonTournaments(selectedSeason.id).length === 0 ? (
                      <div className="p-6 text-center text-gray-400 text-sm">No events scheduled yet.</div>
                    ) : (
                      <div className="divide-y divide-gray-100">
                        {getSeasonTournaments(selectedSeason.id).map(t => (
                          <div key={t.id} className="p-4 hover:bg-gray-50">
                             <div className="flex justify-between items-start mb-1">
                                <span className="font-semibold text-gray-900">{t.name}</span>
                                {t.completed && <span className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">Done</span>}
                             </div>
                             <div className="text-xs text-gray-500">{new Date(t.startDate).toLocaleDateString()}</div>
                          </div>
                        ))}
                      </div>
                    )}
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default Seasons;