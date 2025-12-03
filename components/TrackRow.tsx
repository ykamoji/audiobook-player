
import React, { useRef, useEffect } from 'react';
import { Track, Playlist, ProgressData } from '../types';
import { MusicIcon, MoreHorizontalIcon, CheckCircleIcon, CircleIcon, PlusIcon, InfoIcon } from './Icons';
import { Thumbnail } from './Thumbnail';

interface TrackRowProps {
  track: Track;
  index: number;
  list: Track[];
  isInsidePlaylist: boolean;
  isSelected: boolean;
  isSelectionMode: boolean;
  progressMap: Record<string, ProgressData>;
  associatedPlaylists: Playlist[];
  activeMenuTrackId: string | null;
  onSelectTrack: (track: Track, index: number, list: Track[]) => void;
  onToggleSelection: (trackId: string) => void;
  onOpenMenu: (trackId: string | null) => void;
  onAddToPlaylist: (track: Track) => void;
  onViewMetadata: (track: Track) => void;
  onRemoveFromPlaylist: (trackName: string) => void;
  style?: React.CSSProperties;
}

export const TrackRow: React.FC<TrackRowProps> = ({
  track,
  index,
  list,
  isInsidePlaylist,
  isSelected,
  isSelectionMode,
  progressMap,
  associatedPlaylists,
  activeMenuTrackId,
  onSelectTrack,
  onToggleSelection,
  onOpenMenu,
  onAddToPlaylist,
  onViewMetadata,
  onRemoveFromPlaylist,
  style
}) => {
  const menuRef = useRef<HTMLDivElement>(null);

  const progress = progressMap[track.name];
  const percentage = progress ? Math.min(progress.percentage, 100) : 0;
  const isCompleted = percentage >= 99;

  // Close context menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        if (activeMenuTrackId === track.id) {
           onOpenMenu(null);
        }
      }
    };
    if (activeMenuTrackId === track.id) {
        document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [activeMenuTrackId, track.id, onOpenMenu]);


  return (
      <div 
        style={style}
        className="w-full box-border pt-1 pb-1"
      >
      <div 
        className={`group relative flex items-center gap-4 p-3 rounded-lg transition-colors h-full ${isSelected ? 'bg-audible-orange/10' : 'hover:bg-audible-card'}`}
        onClick={() => {
            if (isSelectionMode) {
                onToggleSelection(track.id);
            } else {
                onSelectTrack(track, index, list);
            }
        }}
      >
        {/* Playable / Checkable Area */}
        <div 
           className="flex-1 flex items-center gap-4 cursor-pointer min-w-0"
        >
            <div className={`relative w-14 h-14 min-w-[3.5rem] rounded-md bg-gray-800 flex items-center justify-center transition-colors overflow-hidden ${isSelectionMode ? 'bg-transparent border-none' : ''}`}>
                {isSelectionMode ? (
                    isSelected ? (
                        <CheckCircleIcon className="w-8 h-8 text-audible-orange" />
                    ) : (
                        <CircleIcon className="w-8 h-8 text-gray-500" />
                    )
                ) : (
                    track.coverFile ? (
                        <Thumbnail file={track.coverFile} />
                    ) : track.coverPath ? ( <Thumbnail file={track.coverPath} /> ) : (
                        <>
                            <MusicIcon className="w-8 h-8 z-10 text-gray-500 group-hover:text-white" />
                            {isCompleted && <div className="absolute inset-0 bg-audible-orange/2"></div>}
                        </>
                    )
                )}
            </div>
            
            <div className="flex-1 min-w-0">
            <h3 className={`font-medium truncate text-base leading-snug ${isSelected ? 'text-audible-orange' : 'text-white'}`}>{track.name}</h3>
            
            {/* Meta Row */}
            <div className="flex flex-col gap-2 mt-2 pr-8">
                {!isSelectionMode && percentage > 0 && (
                <div className="w-full h-1 bg-gray-700 rounded-0 overflow-hidden">
                    <div 
                    className={`h-full rounded-f0 ${isCompleted ? 'bg-green-500' : 'bg-audible-orange'}`}
                    style={{ width: `${percentage}%` }}
                    />
                </div>
                )}
                <div className="flex items-center justify-between text-xs text-gray-500">
                    <div className="flex items-center gap-2">
                        {isCompleted ? (
                        <span className="text-green-500 font-medium">Completed</span>
                        ) : percentage > 0 ? (
                        <span>{Math.floor(percentage)}%</span>
                        ) : (
                        <span></span>
                        )}
                    </div>
                    
                    {/* Playlist Badges */}
                    {!isInsidePlaylist && associatedPlaylists.length > 0 && (
                        <div className="flex flex-wrap gap-1 justify-end ml-2 max-w-[45%]">
                            {associatedPlaylists.map(p => (
                                <span key={p.id} className="text-[8px] px-1.5 py-0.5 font-medium opacity-50 text-audible-orange truncate max-w-full">
                                    {p.name}
                                </span>
                            ))}
                        </div>
                    )}
                </div>
            </div>
            </div>
        </div>

        {/* Action Menu Trigger (Hide in selection mode) */}
        {!isSelectionMode && (
            <button 
            className="p-2 text-gray-500 hover:text-white transition-colors relative z-10"
            onClick={(e) => {
                e.stopPropagation();
                onOpenMenu(activeMenuTrackId === track.id ? null : track.id);
            }}
            >
            <MoreHorizontalIcon />
            </button>
        )}

        {/* Context Menu Dropdown */}
        {activeMenuTrackId === track.id && (
          <div 
            ref={menuRef}
            className="absolute right-10 top-10 bg-[#2a2a2a] border border-audible-separator rounded-lg w-52 py-1 z-20 overflow-hidden animate-fade-in"
          >
            <button 
              className="w-full text-left px-4 py-3 hover:bg-white/10 text-sm flex items-center gap-2"
              onClick={(e) => {
                  e.stopPropagation();
                  onAddToPlaylist(track);
              }}
            >
              <PlusIcon className="w-4 h-4" />
              Add to Playlist
            </button>
            
            <button 
              className="w-full text-left px-4 py-3 hover:bg-white/10 text-sm flex items-center gap-2"
              onClick={(e) => {
                  e.stopPropagation();
                  onViewMetadata(track);
                  onOpenMenu(null);
              }}
            >
              <InfoIcon className="w-4 h-4" />
              View Metadata
            </button>
          </div>
        )}
      </div>
      </div>
  );
};
