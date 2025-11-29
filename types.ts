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
}

export interface AudioFileState {
  file: File | null;
  url: string | null;
  name: string;
}

export interface SubtitleFileState {
  file: File | null;
  cues: SubtitleCue[];
  name: string;
}