
import React, { useMemo } from 'react';
import { PlayerView } from './PlayerView';
import { AudioFileState, SubtitleFileState } from '../types';

interface PlayerContainerProps {
  audioState: AudioFileState;
  subtitleState: SubtitleFileState;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  
  // Navigation
  currentTrackIndex: number;
  playlistLength: number;
  onNext: () => void;
  onPrevious: () => void;
  onSkipForward: () => void;
  onSkipBackward: () => void;
  onBack: () => void;
  
  // Controls
  onTogglePlay: () => void;
  onSeek: (percentage: number) => void;
  onSubtitleClick: (time: number) => void;
  
  // Metadata Action
  onOpenMetadata: () => void;
  
  // Segment Actions
  onSegmentChange: (index: number) => void;
}

const CUES_PER_SEGMENT = 100;

export const PlayerContainer: React.FC<PlayerContainerProps> = ({
  audioState,
  subtitleState,
  isPlaying,
  currentTime,
  duration,
  currentTrackIndex,
  playlistLength,
  onNext,
  onPrevious,
  onSkipForward,
  onSkipBackward,
  onBack,
  onTogglePlay,
  onSeek,
  onSubtitleClick,
  onOpenMetadata,
  onSegmentChange
}) => {

  // --- Segment Logic based on Content (Lines) ---
  
  // 1. Calculate Global Cue Index
  const currentCueIndex = useMemo(() => {
    if (subtitleState.cues.length === 0) return -1;
    return subtitleState.cues.findIndex(cue => 
      currentTime >= cue.start && currentTime <= cue.end
    );
  }, [currentTime, subtitleState.cues]);

  // 2. Determine Current Segment Index based on line count
  let currentSegmentIndex = 0;
  if (currentCueIndex !== -1) {
      currentSegmentIndex = Math.floor(currentCueIndex / CUES_PER_SEGMENT);
  } else if (subtitleState.cues.length > 0) {
      // Fallback if between cues: find the cue that comes next
      const nextCueIndex = subtitleState.cues.findIndex(c => c.start > currentTime);
      const targetIndex = nextCueIndex > 0 ? nextCueIndex - 1 : (nextCueIndex === 0 ? 0 : subtitleState.cues.length - 1);
      currentSegmentIndex = Math.floor(targetIndex / CUES_PER_SEGMENT);
  }

  // 3. Slice Subtitles for Current Segment
  const currentSegmentCues = useMemo(() => {
    if (subtitleState.cues.length === 0) return [];
    const start = currentSegmentIndex * CUES_PER_SEGMENT;
    const end = start + CUES_PER_SEGMENT;
    return subtitleState.cues.slice(start, end);
  }, [subtitleState.cues, currentSegmentIndex]);

  // 4. Calculate Segment Time Bounds
  const { segmentDuration, segmentCurrentTime } = useMemo(() => {
      if (currentSegmentCues.length === 0) return { segmentDuration: 0, segmentCurrentTime: 0 };
      
      const firstCue = currentSegmentCues[0];
      const lastCue = currentSegmentCues[currentSegmentCues.length - 1];
      
      // We use the start of the first cue as the "0" point for the segment display
      const segStart = firstCue.start;
      const segEnd = lastCue.end;
      const duration = segEnd - segStart;
      const current = Math.max(0, currentTime - segStart);
      
      return { segmentDuration: duration, segmentCurrentTime: current };
  }, [currentSegmentCues, currentTime]);

  const totalSegments = subtitleState.cues.length > 0 
      ? Math.ceil(subtitleState.cues.length / CUES_PER_SEGMENT) 
      : 1;

  // Re-calculate local cue index relative to the slice
  const relativeCueIndex = currentCueIndex !== -1 ? currentCueIndex % CUES_PER_SEGMENT : -1;

  return (
    <PlayerView 
      audioState={audioState}
      subtitleState={subtitleState}
      displayedCues={currentSegmentCues}
      currentCueIndex={relativeCueIndex}
      currentTime={currentTime}
      duration={duration}
      segmentCurrentTime={segmentCurrentTime}
      segmentDuration={segmentDuration}
      currentSegmentIndex={currentSegmentIndex}
      totalSegments={totalSegments}
      onSegmentChange={onSegmentChange}
      isPlaying={isPlaying}
      onBack={onBack}
      onTogglePlay={onTogglePlay}
      onSeek={onSeek}
      onSubtitleClick={onSubtitleClick}
      onNext={onNext}
      onPrevious={onPrevious}
      onSkipForward={onSkipForward}
      onSkipBackward={onSkipBackward}
      onOpenMetadata={onOpenMetadata}
      hasNext={currentTrackIndex < playlistLength - 1}
      hasPrevious={currentTrackIndex > 0}
    />
  );
};
