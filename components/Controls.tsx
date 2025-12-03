import React from 'react';
import { PlayIcon, PauseIcon, MoreHorizontalIcon, SkipBackIcon, SkipForwardIcon, ChaptersIcon, Rewind10Icon, Forward10Icon } from './Icons';

interface ControlsProps {
  isPlaying: boolean;
  onPlayPause: () => void;
  progress: number; // 0 to 100
  duration: number;
  segmentMarkers?: number[],
  currentTime: number;
  onSeek: (value: number) => void;
  onOpenMetadata: () => void;
  onOpenChapters: () => void;
  onNext: () => void;
  onPrevious: () => void;
  onSkipForward: () => void;
  onSkipBackward: () => void;
  hasNext: boolean;
  hasPrevious: boolean;
}

const formatTime = (time: number) => {
  if (isNaN(time)) return "0:00";
  const minutes = Math.floor(time / 60);
  const seconds = Math.floor(time % 60);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

export const Controls: React.FC<ControlsProps> = ({
  isPlaying,
  onPlayPause,
  progress,
  duration,
  segmentMarkers,
  currentTime,
  onSeek,
  onOpenMetadata,
  onOpenChapters,
  onNext,
  onPrevious,
  onSkipForward,
  onSkipBackward,
  hasNext,
  hasPrevious
}) => {
  return (
    <div className="flex flex-col gap-2 w-full max-w-lg mx-auto relative">
      {/* Progress Bar */}
      <div className="w-full px-4">
        <div className="relative w-full h-3 flex items-center cursor-pointer">

          {/* Invisible input */}
          <input
              type="range"
              min="0"
              max="100"
              value={progress || 0}
              onChange={(e) => onSeek(Number(e.target.value))}
              className="absolute z-20 inset-0 opacity-0 cursor-pointer"
          />

          {/* Segment Markers */}
          {segmentMarkers?.map((time, i) => (
             <div
                key={i}
                className="absolute top-0 bottom-0 w-[2px] h-3 bg-audible-orange z-10 pointer-events-none"
                style={{ left: `${(time / duration) * 100}%` }}
             />
          ))}

          {/* Track */}
          <div className="w-full h-1 bg-audible-separator relative">
            <div
                className="h-full bg-audible-orange transition-all duration-100 ease-linear"
                style={{width: `${progress}%`}}
            />
          </div>

          {/* Knob */}
          <div
              className="absolute top-1/2 h-4 w-4 bg-white rounded-full pointer-events-none transition-all duration-100 ease-linear"
              style={{
                left: `${progress}%`,
                transform: "translate(-50%, -50%)"
              }}
          />
        </div>
      </div>

      <div className="flex px-4 justify-between items-center text-[10px] font-medium text-gray-400 -mt-2">
        <span>{formatTime(currentTime)}</span>
        <span>{formatTime(duration)}</span>
      </div>

      {/* Main Controls */}
      <div className="flex items-center justify-center mt-1 relative gap-x-3">

        {/* Chapters Button (Left aligned absolute) */}
        <button
            onClick={onOpenChapters}
            className="text-gray-400 hover:text-white transition-colors rounded-full hover:bg-white/10"
        >
          <ChaptersIcon className="w-6 h-6"/>
        </button>

        {/* Previous Button */}
        <button
            onClick={onPrevious}
            disabled={!hasPrevious}
            className="w-10 h-10 flex items-center justify-center text-gray-300 hover:text-white rounded-full hover:bg-white/10 transition-all active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <SkipBackIcon className="w-9 h-9" />
        </button>

         {/* Rewind 10s */}
        <button
          onClick={onSkipBackward}
          className="p-2 text-gray-400 hover:text-white rounded-full hover:bg-white/10 transition-colors"
        >
          <Rewind10Icon className="w-9 h-9 stroke-audible-orange" />
        </button>

        {/* Play Button */}
        <button
          onClick={onPlayPause}
          className="w-14 h-14 flex items-center justify-center bg-white text-black rounded-full hover:scale-105 active:scale-95 transition-all shadow-audible-orange/10 z-10"
        >
          {isPlaying ? <PauseIcon className="w-6 h-6 scale-125" /> : <PlayIcon className="w-6 h-6 ml-0 scale-125" />}
        </button>

         {/* Forward 10s */}
        <button
          onClick={onSkipForward}
          className="p-2 text-gray-400 hover:text-white rounded-full hover:bg-white/10 transition-colors"
        >
          <Forward10Icon className="w-9 h-9 stroke-audible-orange" />
        </button>

        {/* Next Button */}
        <button
          onClick={onNext}
          disabled={!hasNext}
          className="w-10 h-10 flex items-center justify-center text-gray-300 hover:text-white rounded-full hover:bg-white/10 transition-all active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <SkipForwardIcon className="w-9 h-9" />
        </button>

        {/* Metadata Button (Right aligned absolute) */}
        <button
          onClick={onOpenMetadata}
          className="text-gray-400 hover:text-white transition-colors rounded-full hover:bg-white/10"
        >
          <MoreHorizontalIcon className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
};
