
import { Member, Event, Season } from './types';

export const MOCK_SEASONS: Season[] = [
  {
    id: 's1',
    name: '2024 Championship Season',
    startDate: '2024-03-01',
    endDate: '2024-10-31',
    status: 'active',
    totalEvents: 2,
    description: 'The premier championship season featuring the Order of Merit race.',
    scoringSystem: 'points'
  },
  {
    id: 's2',
    name: '2023 Winter Series',
    startDate: '2023-11-01',
    endDate: '2024-02-28',
    status: 'completed',
    totalEvents: 1,
    description: 'Off-season stableford events for the hardy golfers.',
    scoringSystem: 'stableford'
  }
];

export const MOCK_MEMBERS: Member[] = [
  { 
    id: '1', 
    name: 'John Miller', 
    handicap: 12.4, 
    roundsPlayed: 45, 
    joinedDate: '2022-01-15', 
    bestScore: 76, 
    avatar: 'https://picsum.photos/seed/john/200',
    averageScore: 82.5,
    longestDrive: 285,
    gir: 42,
    handicapHistory: [
      { date: 'Jan', value: 14.2 },
      { date: 'Feb', value: 13.8 },
      { date: 'Mar', value: 13.5 },
      { date: 'Apr', value: 12.8 },
      { date: 'May', value: 12.4 }
    ]
  },
  { 
    id: '2', 
    name: 'Sarah Thompson', 
    handicap: 18.2, 
    roundsPlayed: 32, 
    joinedDate: '2022-03-10', 
    bestScore: 84, 
    avatar: 'https://picsum.photos/seed/sarah/200',
    averageScore: 91.2,
    longestDrive: 210,
    gir: 28,
    handicapHistory: [
      { date: 'Jan', value: 19.5 },
      { date: 'Feb', value: 19.2 },
      { date: 'Mar', value: 18.8 },
      { date: 'Apr', value: 18.5 },
      { date: 'May', value: 18.2 }
    ]
  },
  { 
    id: '3', 
    name: 'Mike Ross', 
    handicap: 8.1, 
    roundsPlayed: 60, 
    joinedDate: '2021-11-20', 
    bestScore: 71, 
    avatar: 'https://picsum.photos/seed/mike/200',
    averageScore: 75.8,
    longestDrive: 305,
    gir: 58,
    handicapHistory: [
      { date: 'Jan', value: 9.5 },
      { date: 'Feb', value: 9.0 },
      { date: 'Mar', value: 8.8 },
      { date: 'Apr', value: 8.4 },
      { date: 'May', value: 8.1 }
    ]
  },
  { 
    id: '4', 
    name: 'Emma Wilson', 
    handicap: 24.5, 
    roundsPlayed: 12, 
    joinedDate: '2023-05-01', 
    bestScore: 92, 
    avatar: 'https://picsum.photos/seed/emma/200',
    averageScore: 102.4,
    longestDrive: 185,
    gir: 15,
    handicapHistory: [
      { date: 'Mar', value: 26.0 },
      { date: 'Apr', value: 25.2 },
      { date: 'May', value: 24.5 }
    ]
  },
  { 
    id: '5', 
    name: 'David Beckham', 
    handicap: 15.0, 
    roundsPlayed: 28, 
    joinedDate: '2022-08-14', 
    bestScore: 80, 
    avatar: 'https://picsum.photos/seed/david/200',
    averageScore: 86.1,
    longestDrive: 265,
    gir: 35,
    handicapHistory: [
      { date: 'Jan', value: 16.5 },
      { date: 'Feb', value: 16.0 },
      { date: 'Mar', value: 15.8 },
      { date: 'Apr', value: 15.2 },
      { date: 'May', value: 15.0 }
    ]
  },
  { 
    id: '6', 
    name: 'Rookie Green', 
    handicap: 18.0, 
    roundsPlayed: 1, 
    joinedDate: '2024-05-01', 
    bestScore: 95, 
    avatar: 'https://picsum.photos/seed/rookie/200',
    averageScore: 95.0,
    longestDrive: 230,
    gir: 20,
    handicapHistory: [
      { date: 'Initial', value: 18.0 }
    ]
  },
];

export const MOCK_EVENTS: Event[] = [
  {
    id: 'e1',
    title: 'Spring Classic',
    date: '2024-05-15',
    endDate: '2024-05-15',
    courseName: 'Royal St. Georges',
    location: 'Sandwich, Kent',
    status: 'upcoming',
    participants: ['1', '2', '3', '4', '5', '6'],
    seasonId: 's1',
    isMajor: false
  },
  {
    id: 'e2',
    title: 'Summer Invitational',
    date: '2024-07-20',
    endDate: '2024-07-22',
    courseName: 'Old Course at St Andrews',
    location: 'St Andrews, Fife',
    status: 'upcoming',
    participants: ['1', '3', '5'],
    seasonId: 's1',
    isMajor: true
  },
  {
    id: 'e3',
    title: 'Winter Open 2023',
    date: '2023-12-10',
    endDate: '2023-12-10',
    courseName: 'Belfry Golf Club',
    location: 'Wishaw, Warwickshire',
    status: 'completed',
    participants: ['1', '2', '3'],
    results: [
      { memberId: '3', score: 74 },
      { memberId: '1', score: 79 },
      { memberId: '2', score: 88 }
    ],
    seasonId: 's2',
    isMajor: false
  }
];
