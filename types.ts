export interface SubtitleCue {
  id: string;
  start: number; // in seconds
  end: number;   // in seconds
  text: string;
}

export interface Track {
  id: string;
  name: string;
  audioFile: File;
  subtitleFile: File | null;
  coverFile?: File | null;
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

export interface AppData {
  progress: Record<string, { 
    currentTime: number; 
    duration: number; 
    percentage: number; 
    updatedAt: number;
    segmentHistory?: Record<number, number>; // Index -> timestamp
  }>;
  playlists: Playlist[];
  settings: {
    volume: number;
    isAutoPlay: boolean;
  };
  exportedAt: number;
}