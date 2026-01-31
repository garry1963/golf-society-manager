
export enum AppView {
  DASHBOARD = 'DASHBOARD',
  MEMBERS = 'MEMBERS',
  EVENTS = 'EVENTS',
  SEASONS = 'SEASONS',
  COURSES = 'COURSES',
  STATS = 'STATS',
  AI_PRO = 'AI_PRO'
}

export interface CourseSpecs {
  par: number;
  length: string;
  menSlope: number;
  menRating: number;
  womenSlope: number;
  womenRating: number;
  notableHole: string;
  difficulty: 'Easy' | 'Moderate' | 'Challenging' | 'Elite';
  description: string;
  holePars: number[];
}

export interface GroundingSource {
  title: string;
  uri: string;
}

export interface Facility {
  id: string;
  name: string;
  address: string;
  usgaId?: string;
  rating?: string;
  courseStyle: string;
  difficulty: string;
  addedAt: string;
  groundingSources?: GroundingSource[];
}

export interface CourseDatabaseEntry {
  title: string;
  address: string;
  whsId: string;
  difficulty: 'Easy' | 'Moderate' | 'Challenging' | 'Elite';
  courseStyle: string;
  isvVerified: boolean;
  lastSynced: string;
  uri: string;
  insight: string;
  groundingSources?: GroundingSource[];
}

export type ScoringSystem = 'points' | 'stableford' | 'medal';

export interface Season {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  status: 'active' | 'planned' | 'completed';
  totalEvents: number;
  description: string;
  scoringSystem?: ScoringSystem;
}

export interface Member {
  id: string;
  name: string;
  handicap: number;
  roundsPlayed: number;
  joinedDate: string;
  bestScore: number;
  avatar: string;
  averageScore: number;
  longestDrive: number;
  gir: number; // Greens in Regulation percentage
  handicapHistory?: { date: string; value: number }[];
}

export interface Round {
  id: string;
  memberId: string;
  strokes: number;
  date: string;
  course: string;
  stablefordPoints?: number;
}

export interface Event {
  id: string;
  title: string;
  date: string;
  endDate?: string;
  numberOfRounds?: number;
  courseName: string;
  location: string;
  facilityId?: string;
  status: 'upcoming' | 'completed';
  participants: string[]; // Member IDs
  results?: { memberId: string; score: number }[];
  seasonId?: string;
  lastReminderSent?: string;
  isMajor?: boolean;
}

export interface SocietyStats {
  averageHandicap: number;
  totalMembers: number;
  upcomingEvents: number;
  totalRoundsPlayed: number;
}
