export enum ScoringType {
  STABLEFORD = 'Stableford',
  STROKE_PLAY = 'Stroke Play',
}

export interface HandicapHistory {
  date: string;
  oldHandicap: number;
  newHandicap: number;
  reason: string;
}

export interface Member {
  id: string;
  name: string;
  handicap: number;
  joinedDate: string;
  email?: string;
  phone?: string;
  avatarUrl?: string;
  handicapHistory: HandicapHistory[];
}

export interface CourseHole {
  number: number;
  par: number;
  index: number; // Stroke Index
}

export interface Course {
  id: string;
  name: string;
  par: number;
  location?: string;
  rating?: number;
  slope?: number;
  holes?: CourseHole[]; // Array of 18 holes
}

export interface Season {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
}

export interface Tournament {
  id: string;
  name: string;
  startDate: string;
  endDate?: string;
  rounds: number;
  seasonId?: string;
  courseId: string;
  scoringType: ScoringType;
  completed: boolean;
  rosterIds?: string[]; // Optional: if defined, only these members are in the event
}

export interface Score {
  id: string;
  tournamentId: string;
  memberId: string;
  grossScore?: number;
  netScore?: number;
  points?: number; 
  holeScores?: number[]; // Array of 18 scores. 0 or null represents not played/scratch
}

export interface SeasonResult {
  memberId: string;
  totalPoints: number;
  eventsPlayed: number;
  wins: number;
}

export type ViewState = 'DASHBOARD' | 'MEMBERS' | 'SEASONS' | 'TOURNAMENTS' | 'LEAGUE' | 'COURSES';
