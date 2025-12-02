import React from 'react';
import { PlayIcon, PauseIcon, MoreHorizontalIcon, SkipBackIcon, SkipForwardIcon, ChaptersIcon, Rewind10Icon, Forward10Icon } from './Icons';

interface ControlsProps {
  isPlaying: boolean;
  onPlayPause: () => void;
  progress: number; // 0 to 100
  duration: number;
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
    <div className="flex flex-col gap-2 w-full max-w-lg mx-auto relative" style={{"paddingBottom": `calc(env(safe-area-inset-bottom) + 30px)`}}>
      {/* Progress Bar */}
      <div className="group relative w-full h-3 flex items-center cursor-pointer">
        <input
          type="range"
          min="0"
          max="100"
          value={progress || 0}
          onChange={(e) => onSeek(Number(e.target.value))}
          className="absolute z-20 w-full h-full opacity-0 cursor-pointer"
        />
        <div className="w-full h-1 bg-audible-separator rounded-0 overflow-hidden">
          <div 
            className="h-full bg-audible-orange rounded-0 transition-all duration-100 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>
        {/* Scrubber Knob (Visual only, moves with progress) */}
        <div 
          className="absolute h-4 w-4 bg-white rounded-full shadow-lg pointer-events-none transition-all duration-100 ease-linear"
          style={{ left: `calc(${progress}% - 4px)` }}
        />
      </div>

      <div className="flex justify-between items-center text-[10px] font-medium text-gray-400 -mt-2 px-1">
        <span>{formatTime(currentTime)}</span>
        <span>{formatTime(duration)}</span>
      </div>

      {/* Main Controls */}
      <div className="flex items-center justify-center mt-1 relative gap-4">
        
        {/* Chapters Button (Left aligned absolute) */}
        <button
          onClick={onOpenChapters}
          className="absolute left-0 p-2 text-gray-400 hover:text-white transition-colors rounded-full hover:bg-white/10"
        >
          <ChaptersIcon className="w-6 h-6" />
        </button>

        {/* Previous Button */}
        <button
          onClick={onPrevious}
          disabled={!hasPrevious}
          className="w-10 h-10 flex items-center justify-center text-gray-300 hover:text-white rounded-full hover:bg-white/10 transition-all active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <SkipBackIcon className="w-6 h-6" />
        </button>

         {/* Rewind 10s */}
        <button
          onClick={onSkipBackward}
          className="p-2 text-gray-400 hover:text-white rounded-full hover:bg-white/10 transition-colors"
        >
          <Rewind10Icon className="w-6 h-6" />
        </button>

        {/* Play Button */}
        <button
          onClick={onPlayPause}
          className="w-12 h-12 flex items-center justify-center bg-white text-black rounded-full hover:scale-105 active:scale-95 transition-all shadow-xl shadow-audible-orange/10 z-10"
        >
          {isPlaying ? <PauseIcon className="w-6 h-6" /> : <PlayIcon className="w-6 h-6 ml-0" />}
        </button>

         {/* Forward 10s */}
        <button
          onClick={onSkipForward}
          className="p-2 text-gray-400 hover:text-white rounded-full hover:bg-white/10 transition-colors"
        >
          <Forward10Icon className="w-6 h-6" />
        </button>

        {/* Next Button */}
        <button
          onClick={onNext}
          disabled={!hasNext}
          className="w-10 h-10 flex items-center justify-center text-gray-300 hover:text-white rounded-full hover:bg-white/10 transition-all active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <SkipForwardIcon className="w-6 h-6" />
        </button>

        {/* Metadata Button (Right aligned absolute) */}
        <button
          onClick={onOpenMetadata}
          className="absolute right-0 p-2 text-gray-400 hover:text-white transition-colors rounded-full hover:bg-white/10"
        >
          <MoreHorizontalIcon className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
};
