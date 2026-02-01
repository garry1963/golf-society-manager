import React, { useMemo } from 'react';
import { Member, Score, Tournament, ScoringType, SeasonResult } from '../types';
import { Medal } from 'lucide-react';

interface LeagueTableProps {
  members: Member[];
  tournaments: Tournament[];
  scores: Score[];
}

const POINTS_SYSTEM = [25, 18, 15, 12, 10, 8, 6, 4, 2, 1]; // F1 Style

const LeagueTable: React.FC<LeagueTableProps> = ({ members, tournaments, scores }) => {
  
  const leaderboard = useMemo(() => {
    const results: Record<string, SeasonResult> = {};

    // Initialize
    members.forEach(m => {
      results[m.id] = { memberId: m.id, totalPoints: 0, eventsPlayed: 0, wins: 0 };
    });

    // Process each COMPLETED tournament
    tournaments.filter(t => t.completed).forEach(t => {
      // Get scores for this tournament
      const tScores = scores.filter(s => s.tournamentId === t.id);
      
      // Sort scores based on format
      let sortedScores = [];
      if (t.scoringType === ScoringType.STABLEFORD) {
        sortedScores = tScores.sort((a, b) => (b.points || 0) - (a.points || 0));
      } else {
        // Stroke play - Net score usually wins in societies
        sortedScores = tScores.sort((a, b) => {
           const memberA = members.find(m => m.id === a.memberId);
           const memberB = members.find(m => m.id === b.memberId);
           const netA = (a.grossScore || 999) - (memberA?.handicap || 0);
           const netB = (b.grossScore || 999) - (memberB?.handicap || 0);
           return netA - netB;
        });
      }

      // Assign points
      sortedScores.forEach((score, index) => {
        const points = POINTS_SYSTEM[index] || 0;
        if (results[score.memberId]) {
          results[score.memberId].totalPoints += points;
          results[score.memberId].eventsPlayed += 1;
          if (index === 0) results[score.memberId].wins += 1;
        }
      });
    });

    return Object.values(results).sort((a, b) => b.totalPoints - a.totalPoints);
  }, [members, tournaments, scores]);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">League Standings</h2>
      
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-emerald-900 text-white">
            <tr>
              <th className="p-4 font-semibold w-16 text-center">Pos</th>
              <th className="p-4 font-semibold">Golfer</th>
              <th className="p-4 font-semibold text-center">Events</th>
              <th className="p-4 font-semibold text-center">Wins</th>
              <th className="p-4 font-semibold text-right">Points</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {leaderboard.map((entry, index) => {
              const member = members.find(m => m.id === entry.memberId);
              if (!member) return null;
              
              let posClass = "font-bold text-gray-500";
              let rowClass = "hover:bg-gray-50";
              let medal = null;

              if (index === 0) { 
                posClass = "text-yellow-500"; 
                rowClass = "bg-yellow-50/50 hover:bg-yellow-50";
                medal = <Medal className="inline text-yellow-500 mr-2" size={16} />;
              } else if (index === 1) {
                posClass = "text-gray-400";
                medal = <Medal className="inline text-gray-400 mr-2" size={16} />;
              } else if (index === 2) {
                posClass = "text-amber-600";
                medal = <Medal className="inline text-amber-600 mr-2" size={16} />;
              }

              return (
                <tr key={entry.memberId} className={rowClass}>
                  <td className={`p-4 text-center text-lg ${posClass}`}>
                    {index + 1}
                  </td>
                  <td className="p-4 font-medium text-gray-900 flex items-center">
                    {medal}
                    {member.name}
                  </td>
                  <td className="p-4 text-center text-gray-600">{entry.eventsPlayed}</td>
                  <td className="p-4 text-center text-gray-600">{entry.wins}</td>
                  <td className="p-4 text-right font-bold text-emerald-700 text-lg">{entry.totalPoints}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {leaderboard.length === 0 && (
           <div className="p-8 text-center text-gray-500">
             No completed tournaments yet. Finish a tournament to see the standings!
           </div>
        )}
      </div>
      
      <div className="bg-gray-100 p-4 rounded-lg text-sm text-gray-500">
        <span className="font-bold">Scoring System:</span> 1st: 25pts, 2nd: 18pts, 3rd: 15pts, 4th: 12pts, 5th: 10pts...
      </div>
    </div>
  );
};

export default LeagueTable;
