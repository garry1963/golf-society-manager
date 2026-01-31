
import { Member, Event, Season } from './types';

export const MOCK_SEASONS: Season[] = [
  {
    id: 's1',
    name: '2024 Championship Series',
    startDate: '2024-03-01',
    endDate: '2024-11-30',
    status: 'active',
    totalEvents: 3,
    description: 'The premier annual society championship featuring our 10 major outings.',
    scoringSystem: 'points'
  }
];

export const MOCK_MEMBERS: Member[] = [
  {
    id: 'm1',
    name: 'Marcus Fairway',
    handicap: 12.4,
    roundsPlayed: 15,
    joinedDate: '2023-01-15',
    bestScore: 76,
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200',
    averageScore: 84.2,
    longestDrive: 285,
    gir: 45,
    handicapHistory: [{ date: 'Jan', value: 14.2 }, { date: 'Feb', value: 13.5 }, { date: 'Mar', value: 12.4 }]
  },
  {
    id: 'm2',
    name: 'Sarah Greens',
    handicap: 8.2,
    roundsPlayed: 22,
    joinedDate: '2023-02-10',
    bestScore: 72,
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200',
    averageScore: 79.5,
    longestDrive: 240,
    gir: 58,
    handicapHistory: [{ date: 'Jan', value: 9.1 }, { date: 'Feb', value: 8.5 }, { date: 'Mar', value: 8.2 }]
  },
  {
    id: 'm3',
    name: 'David Bunker',
    handicap: 18.5,
    roundsPlayed: 8,
    joinedDate: '2023-05-20',
    bestScore: 88,
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200',
    averageScore: 92.1,
    longestDrive: 260,
    gir: 32,
    handicapHistory: [{ date: 'Jan', value: 20.1 }, { date: 'Feb', value: 19.5 }, { date: 'Mar', value: 18.5 }]
  }
];

export const MOCK_EVENTS: Event[] = [
  {
    id: 'e1',
    title: 'Spring Invitational',
    date: '2024-04-12',
    courseName: 'Royal St. Andrews',
    location: 'St Andrews, Scotland',
    status: 'completed',
    participants: ['m1', 'm2', 'm3'],
    results: [
      { memberId: 'm2', score: 72 },
      { memberId: 'm1', score: 78 },
      { memberId: 'm3', score: 89 }
    ],
    seasonId: 's1',
    isMajor: true
  },
  {
    id: 'e2',
    title: 'Summer Masters',
    date: '2025-07-20',
    courseName: 'Wentworth Club',
    location: 'Virginia Water, UK',
    status: 'upcoming',
    participants: ['m1', 'm2', 'm3'],
    seasonId: 's1',
    isMajor: true
  }
];
