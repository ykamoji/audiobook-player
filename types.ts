export interface SubtitleCue {
  id: string;
  start: number; // in seconds
  end: number;   // in seconds
  text: string;
}

export interface Track {
  id: string;
  name: string;
  audioFile?: File; // Web
  subtitleFile?: File | null; // Web
  coverFile?: File | null; // Web
  
  // Native properties
  audioPath?: string;
  subtitlePath?: string;
  coverPath?: string;
}

export interface Playlist {
  id: string;
  name: string;
  trackNames: string[]; // We store names because IDs regenerate on file reload
  createdAt: number;
}

export interface AudioFileState {
  file: File | null;
  url: string | null;
  name: string;
  coverUrl?: string | null;
}

export interface SubtitleFileState {
  file: File | null;
  cues: SubtitleCue[];
  name: string;
}

export interface ProgressData {
  currentTime: number;
  duration: number;
  percentage: number;
  updatedAt: number;
  segmentHistory?: Record<number, number>; // Index -> timestamp
}

export interface AppSettings {
  volume: number;
  isAutoPlay: boolean;
}

export interface AppData {
  progress: Record<string, ProgressData>;
  playlists: Playlist[];
  settings: AppSettings;
  exportedAt: number;
}
