import React from 'react';
import { Track } from '../types';
import { MusicIcon, FileTextIcon, ChevronLeftIcon } from './Icons';

interface LibraryProps {
  tracks: Track[];
  onSelectTrack: (track: Track, index: number) => void;
  onBack: () => void;
}

export const Library: React.FC<LibraryProps> = ({ tracks, onSelectTrack, onBack }) => {
  return (
    <div className="min-h-screen bg-audible-bg text-white p-4 animate-fade-in">
      <div className="sticky top-0 z-10 bg-audible-bg/95 backdrop-blur-md pb-4 pt-2 border-b border-audible-separator mb-2">
        <div className="flex items-center gap-4 mb-4">
          <button 
            onClick={onBack}
            className="p-2 -ml-2 rounded-full hover:bg-white/10 text-audible-orange"
          >
            <ChevronLeftIcon />
          </button>
          <h1 className="text-2xl font-bold">Library</h1>
        </div>
        <p className="text-gray-400 text-sm pl-1">{tracks.length} titles</p>
      </div>

      <div className="space-y-1 pb-20 mt-4">
        {tracks.map((track, index) => (
          <div 
            key={track.id}
            onClick={() => onSelectTrack(track, index)}
            className="group flex items-center gap-4 p-3 rounded-lg hover:bg-audible-card cursor-pointer transition-colors"
          >
            <div className="w-14 h-14 rounded bg-gray-800 flex items-center justify-center text-gray-500 group-hover:text-black group-hover:bg-audible-orange transition-colors">
              <MusicIcon className="w-8 h-8" />
            </div>
            
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-white truncate text-base leading-snug">{track.name}</h3>
              <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                <span>{(track.audioFile.size / 1024 / 1024).toFixed(1)} MB</span>
                {track.subtitleFile && (
                  <>
                    <span className="w-1 h-1 rounded-full bg-gray-600"></span>
                    <span className="flex items-center gap-1 text-audible-orange">
                       <FileTextIcon className="w-3 h-3" /> Lyrics
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}

        {tracks.length === 0 && (
          <div className="text-center text-gray-500 mt-20">
            No audio files found in the selected directory.
          </div>
        )}
      </div>
    </div>
  );
};