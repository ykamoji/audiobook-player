import React from 'react';
import { PlayIcon, PauseIcon, VolumeMaxIcon, VolumeMinIcon, RepeatIcon } from './Icons';

interface ControlsProps {
  isPlaying: boolean;
  onPlayPause: () => void;
  progress: number; // 0 to 100
  duration: number;
  currentTime: number;
  onSeek: (value: number) => void;
  volume: number;
  onVolumeChange: (value: number) => void;
  isAutoPlay: boolean;
  onToggleAutoPlay: () => void;
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
  volume,
  onVolumeChange,
  isAutoPlay,
  onToggleAutoPlay
}) => {
  return (
    <div className="flex flex-col gap-4 w-full">
      {/* Progress Bar */}
      <div className="group relative w-full h-6 flex items-center cursor-pointer">
        <input
          type="range"
          min="0"
          max="100"
          value={progress || 0}
          onChange={(e) => onSeek(Number(e.target.value))}
          className="absolute z-20 w-full h-full opacity-0 cursor-pointer"
        />
        <div className="w-full h-1 bg-audible-separator rounded-full overflow-hidden">
          <div 
            className="h-full bg-audible-orange rounded-full transition-all duration-100 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>
        {/* Scrubber Knob (Visual only, moves with progress) */}
        <div 
          className="absolute h-4 w-4 bg-white rounded-full shadow-lg pointer-events-none transition-all duration-100 ease-linear"
          style={{ left: `calc(${progress}% - 8px)` }}
        />
      </div>

      <div className="flex justify-between items-center text-xs font-medium text-gray-400 -mt-2">
        <span>{formatTime(currentTime)}</span>
        <span>{formatTime(duration)}</span>
      </div>

      {/* Main Controls & Volume */}
      <div className="flex flex-col items-center justify-center gap-6 mt-2">
        <div className="flex items-center justify-center gap-10 w-full">
          {/* Auto Play Toggle */}
          <button
            onClick={onToggleAutoPlay}
            className={`p-3 rounded-full transition-all ${isAutoPlay ? 'bg-audible-orange/20 text-audible-orange' : 'bg-transparent text-gray-500 hover:text-white'}`}
            title="Auto-play next track"
          >
            <RepeatIcon className="w-5 h-5" />
          </button>

          {/* Play Button */}
          <button
            onClick={onPlayPause}
            className="w-16 h-16 flex items-center justify-center bg-white text-black rounded-full hover:scale-105 active:scale-95 transition-all shadow-xl shadow-audible-orange/10"
          >
            {isPlaying ? <PauseIcon className="w-8 h-8" /> : <PlayIcon className="w-8 h-8 ml-1" />}
          </button>

          {/* Spacer to balance layout since we removed previous buttons or added auto play to the side */}
          <div className="w-11"></div> 
        </div>

        {/* Volume Slider */}
        <div className="flex items-center gap-3 w-full max-w-[80%] mt-2">
            <VolumeMinIcon className="w-4 h-4 text-gray-500" />
            
            <div className="group relative w-full h-6 flex items-center cursor-pointer">
                <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={volume}
                    onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
                    className="absolute z-20 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="w-full h-1 bg-audible-separator rounded-full overflow-hidden">
                    <div 
                        className="h-full bg-gray-500 group-hover:bg-audible-orange rounded-full transition-all duration-100 ease-linear"
                        style={{ width: `${volume * 100}%` }}
                    />
                </div>
                 {/* Visual Knob for volume */}
                 <div 
                    className="absolute h-3 w-3 bg-white rounded-full shadow-lg pointer-events-none transition-all duration-100 ease-linear opacity-0 group-hover:opacity-100"
                    style={{ left: `calc(${volume * 100}% - 6px)` }}
                />
            </div>

            <VolumeMaxIcon className="w-4 h-4 text-gray-500" />
        </div>
      </div>
    </div>
  );
};