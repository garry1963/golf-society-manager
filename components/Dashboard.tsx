import React from 'react';
import { Member, Tournament, SeasonResult } from '../types';
import { Trophy, Calendar, TrendingUp, User, Users } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

interface DashboardProps {
  members: Member[];
  tournaments: Tournament[];
  leaderboard: SeasonResult[];
  onNavigate: (view: any) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ members, tournaments, leaderboard, onNavigate }) => {
  const nextTournament = tournaments
    .filter(t => !t.completed)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0];

  const topPlayer = leaderboard.length > 0 
    ? members.find(m => m.id === leaderboard[0].memberId) 
    : null;

  const recentCompletion = tournaments
    .filter(t => t.completed)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];

  const chartData = leaderboard.slice(0, 5).map(entry => {
    const member = members.find(m => m.id === entry.memberId);
    return {
      name: member?.name || 'Unknown',
      points: entry.totalPoints
    };
  });

  return (
    <div className="space-y-6">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Season Dashboard</h1>
        <p className="text-gray-500">Welcome back to the society management system.</p>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4">
          <div className="p-3 bg-emerald-100 text-emerald-600 rounded-full">
            <Users size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500">Total Members</p>
            <p className="text-2xl font-bold text-gray-900">{members.length}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4">
          <div className="p-3 bg-blue-100 text-blue-600 rounded-full">
            <Calendar size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500">Tournaments</p>
            <p className="text-2xl font-bold text-gray-900">{tournaments.length}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4">
          <div className="p-3 bg-amber-100 text-amber-600 rounded-full">
            <Trophy size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500">Current Leader</p>
            <p className="text-lg font-bold text-gray-900 truncate max-w-[120px]">
              {topPlayer ? topPlayer.name : '-'}
            </p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4">
          <div className="p-3 bg-purple-100 text-purple-600 rounded-full">
            <TrendingUp size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500">Season Progress</p>
            <p className="text-2xl font-bold text-gray-900">
              {Math.round((tournaments.filter(t => t.completed).length / (tournaments.length || 1)) * 100)}%
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Next Event Card */}
        <div className="bg-gradient-to-br from-emerald-800 to-emerald-600 rounded-xl p-6 text-white shadow-lg lg:col-span-2 relative overflow-hidden">
          <div className="relative z-10">
            <h2 className="text-emerald-100 text-sm font-semibold uppercase tracking-wider mb-1">Up Next</h2>
            {nextTournament ? (
              <>
                <h3 className="text-3xl font-bold mb-2">{nextTournament.name}</h3>
                <div className="flex items-center space-x-4 text-emerald-100 mb-6">
                  <span className="flex items-center"><Calendar size={16} className="mr-1" /> {new Date(nextTournament.date).toLocaleDateString()}</span>
                  <span className="bg-emerald-700/50 px-2 py-1 rounded text-xs">{nextTournament.scoringType}</span>
                </div>
                <button 
                  onClick={() => onNavigate('TOURNAMENTS')}
                  className="bg-white text-emerald-800 px-6 py-2 rounded-lg font-semibold hover:bg-emerald-50 transition-colors"
                >
                  Manage Tournament
                </button>
              </>
            ) : (
              <div className="py-8">
                <h3 className="text-2xl font-bold mb-2">No upcoming events</h3>
                <button 
                  onClick={() => onNavigate('TOURNAMENTS')}
                  className="text-emerald-100 underline hover:text-white"
                >
                  Schedule one now
                </button>
              </div>
            )}
          </div>
          <div className="absolute right-0 bottom-0 opacity-10 transform translate-x-1/4 translate-y-1/4">
            <Trophy size={300} />
          </div>
        </div>

        {/* Top 5 Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Leaderboard Top 5</h3>
          {chartData.length > 0 ? (
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} layout="vertical" margin={{ left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" width={80} tick={{fontSize: 12}} />
                  <Tooltip cursor={{fill: 'transparent'}} />
                  <Bar dataKey="points" fill="#10b981" radius={[0, 4, 4, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-48 flex items-center justify-center text-gray-400 text-sm">
              No data available
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;