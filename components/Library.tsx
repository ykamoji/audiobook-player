
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Track, Playlist, ProgressData } from '../types';
import { ChevronLeftIcon, PlusIcon, TrashIcon, SaveIcon, RepeatIcon, MoreHorizontalIcon, PencilIcon } from './Icons';
import { PlaylistCard } from './PlaylistCard';
import { TrackRow } from './TrackRow';
import { LibraryModals } from './LibraryModals';

interface LibraryProps {
  allTracks: Track[]; // The source of truth for file objects
  playlists: Playlist[];
  onSelectTrack: (track: Track, index: number, specificPlaylist?: Track[]) => void;
  onBack: () => void;
  progressMap: Record<string, ProgressData>;
  onCreatePlaylist: (name: string, initialTracks: Track[]) => void;
  onAddToPlaylist: (playlistId: string, track: Track) => void;
  onAddMultipleToPlaylist: (playlistId: string, tracks: Track[]) => void;
  onDeletePlaylist: (id: string) => void;
  onUpdatePlaylistName: (id: string, newName: string) => void;
  onRemoveFromPlaylist: (playlistId: string, trackName: string) => void;
  onRemoveMultipleFromPlaylist: (playlistId: string, trackNames: string[]) => void;
  onExportData: () => void;
  isAutoPlay: boolean;
  onToggleAutoPlay: () => void;
  onViewMetadata: (track: Track) => void;
}

// Fixed height for virtualization
const ROW_HEIGHT = 88; 
const BUFFER_ITEMS = 5;

export const Library: React.FC<LibraryProps> = ({ 
  allTracks, 
  playlists,
  onSelectTrack, 
  onBack, 
  progressMap,
  onCreatePlaylist,
  onAddToPlaylist,
  onAddMultipleToPlaylist,
  onDeletePlaylist,
  onUpdatePlaylistName,
  onRemoveFromPlaylist,
  onRemoveMultipleFromPlaylist,
  onExportData,
  isAutoPlay,
  onToggleAutoPlay,
  onViewMetadata
}) => {
  const [activeTab, setActiveTab] = useState<'titles' | 'playlists'>('titles');
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(null);
  
  // Selection Mode State
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedTrackIds, setSelectedTrackIds] = useState<Set<string>>(new Set());

  // Modal States
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCreatePlaylistModal, setShowCreatePlaylistModal] = useState(false);
  const [showRenamePlaylistModal, setShowRenamePlaylistModal] = useState(false);
  
  const [tracksToAdd, setTracksToAdd] = useState<Track[]>([]);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [createPlaylistName, setCreatePlaylistName] = useState('');
  const [renamePlaylistName, setRenamePlaylistName] = useState('');
  
  // Context Menu State
  const [activeMenuTrackId, setActiveMenuTrackId] = useState<string | null>(null);
  const [showPlaylistMenu, setShowPlaylistMenu] = useState(false);

  // Virtual Scroll State
  const [scrollTop, setScrollTop] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const playlistMenuRef = useRef<HTMLDivElement>(null);
  const playlistMenuButtonRef = useRef<HTMLButtonElement>(null);

  // Reset selection when tab changes
  useEffect(() => {
      setIsSelectionMode(false);
      setSelectedTrackIds(new Set());
      setScrollTop(0); // Reset scroll on tab change
      setShowPlaylistMenu(false);
      if (scrollContainerRef.current) scrollContainerRef.current.scrollTop = 0;
  }, [activeTab, selectedPlaylistId]);

  // Close playlist menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        if (
            playlistMenuRef.current && 
            !playlistMenuRef.current.contains(event.target as Node) &&
            playlistMenuButtonRef.current &&
            !playlistMenuButtonRef.current.contains(event.target as Node)
        ) {
            setShowPlaylistMenu(false);
        }
    };
    if (showPlaylistMenu) {
        document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showPlaylistMenu]);

  // --- Derived State for Selection Logic ---
  const currentListTracks = useMemo(() => {
    if (selectedPlaylistId) {
        const playlist = playlists.find(p => p.id === selectedPlaylistId);
        if (!playlist) return [];
        return playlist.trackNames
            .map(name => allTracks.find(t => t.name === name))
            .filter((t): t is Track => t !== undefined);
    }
    if (activeTab === 'titles') {
        return allTracks;
    }
    return [];
  }, [selectedPlaylistId, activeTab, playlists, allTracks]);

  const isAllSelected = useMemo(() => {
     if (currentListTracks.length === 0) return false;
     return currentListTracks.every(t => selectedTrackIds.has(t.id));
  }, [currentListTracks, selectedTrackIds]);

  const handleSelectAll = () => {
    if (isAllSelected) {
        setSelectedTrackIds(new Set());
    } else {
        const allIds = currentListTracks.map(t => t.id);
        setSelectedTrackIds(new Set(allIds));
    }
  };

  const handleOpenAddModal = (tracks: Track[]) => {
    setTracksToAdd(tracks);
    setNewPlaylistName('');
    setShowAddModal(true);
    setActiveMenuTrackId(null);
  };

  const handleCreatePlaylist = () => {
    if (!newPlaylistName.trim() || tracksToAdd.length === 0) return;
    onCreatePlaylist(newPlaylistName, tracksToAdd);
    setShowAddModal(false);
    setIsSelectionMode(false);
    setSelectedTrackIds(newSet => new Set());
  };

  const handleCreateEmptyPlaylist = () => {
      if (!createPlaylistName.trim()) return;
      onCreatePlaylist(createPlaylistName.trim(), []);
      setCreatePlaylistName('');
      setShowCreatePlaylistModal(false);
  };

  const handleRenamePlaylist = () => {
    if (!selectedPlaylistId || !renamePlaylistName.trim()) return;
    onUpdatePlaylistName(selectedPlaylistId, renamePlaylistName.trim());
    setRenamePlaylistName('');
    setShowRenamePlaylistModal(false);
  };

  const handleAddToExisting = (playlistId: string) => {
    if (tracksToAdd.length === 0) return;
    
    if (tracksToAdd.length === 1) {
        onAddToPlaylist(playlistId, tracksToAdd[0]);
    } else {
        onAddMultipleToPlaylist(playlistId, tracksToAdd);
    }
    
    setShowAddModal(false);
    setIsSelectionMode(false);
    setSelectedTrackIds(new Set());
  };

  const toggleSelection = (trackId: string) => {
      const newSet = new Set(selectedTrackIds);
      if (newSet.has(trackId)) {
          newSet.delete(trackId);
      } else {
          newSet.add(trackId);
      }
      setSelectedTrackIds(newSet);
  }

  const handleBulkRemove = () => {
    if (!selectedPlaylistId || selectedTrackIds.size === 0) return;
    const playlist = playlists.find(p => p.id === selectedPlaylistId);
    if (!playlist) return;

    const tracksToRemove: string[] = [];
    allTracks.forEach(t => {
        if (selectedTrackIds.has(t.id)) {
            tracksToRemove.push(t.name);
        }
    });

    onRemoveMultipleFromPlaylist(selectedPlaylistId, tracksToRemove);
    setIsSelectionMode(false);
    setSelectedTrackIds(new Set());
  };


  // --- Virtualization Logic for Main List ---
  const containerHeight = scrollContainerRef.current?.clientHeight || 800; // fallback height
  const visibleItemCount = Math.ceil(containerHeight / ROW_HEIGHT);
  const startNode = Math.floor(scrollTop / ROW_HEIGHT);
  const startIndex = Math.max(0, startNode - BUFFER_ITEMS);
  const endIndex = Math.min(allTracks.length, startNode + visibleItemCount + BUFFER_ITEMS);
  
  const virtualTracks = useMemo(() => {
    return allTracks.slice(startIndex, endIndex);
  }, [allTracks, startIndex, endIndex]);

  const topSpacerHeight = startIndex * ROW_HEIGHT;
  const bottomSpacerHeight = (allTracks.length - endIndex) * ROW_HEIGHT;

  // --- Render Views ---

  const renderPlaylistDetail = () => {
    const playlist = playlists.find(p => p.id === selectedPlaylistId);
    if (!playlist) return null;

    return (
        <div className="animate-fade-in pb-20 px-4">
             <div className="flex items-center justify-between mb-6 relative">
                <div className="flex items-center gap-3">
                    <button onClick={() => setSelectedPlaylistId(null)} className="p-2 -ml-2 hover:bg-white/10 rounded-full">
                        <ChevronLeftIcon />
                    </button>
                    <h2 className="text-2xl font-bold text-white truncate max-w-[200px] sm:max-w-md">{playlist.name}</h2>
                    <button 
                        onClick={() => {
                            setRenamePlaylistName(playlist.name);
                            setShowRenamePlaylistModal(true);
                        }}
                        className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-colors"
                        title="Rename Playlist"
                    >
                        <PencilIcon className="w-5 h-5" />
                    </button>
                </div>
                <div className="flex items-center gap-4">
                    <button onClick={() => setIsSelectionMode(!isSelectionMode)} className="text-sm font-medium text-audible-orange">
                        {isSelectionMode ? 'Cancel' : 'Select'}
                    </button>
                    {!isSelectionMode && (
                         <div className="relative">
                            <button 
                                ref={playlistMenuButtonRef}
                                onClick={() => setShowPlaylistMenu(!showPlaylistMenu)}
                                className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-full"
                            >
                                <MoreHorizontalIcon />
                            </button>
                            {showPlaylistMenu && (
                                <div 
                                    ref={playlistMenuRef}
                                    className="absolute right-0 top-full mt-2 w-48 bg-[#2a2a2a] border border-audible-separator shadow-2xl rounded-lg overflow-hidden z-20 animate-fade-in"
                                >
                                    <button 
                                        className="w-full text-left px-4 py-3 hover:bg-white/10 text-sm text-red-400 flex items-center gap-2"
                                        onClick={() => {
                                            if (window.confirm("Are you sure you want to delete this playlist?")) {
                                                onDeletePlaylist(playlist.id);
                                                setSelectedPlaylistId(null);
                                            }
                                            setShowPlaylistMenu(false);
                                        }}
                                    >
                                        <TrashIcon className="w-4 h-4" />
                                        Delete Playlist
                                    </button>
                                </div>
                            )}
                         </div>
                    )}
                </div>
             </div>
             
             {currentListTracks.length > 0 ? (
                currentListTracks.map((track, index) => (
                    <TrackRow
                        key={track.id}
                        track={track}
                        index={index}
                        list={currentListTracks}
                        isInsidePlaylist={true}
                        isSelected={selectedTrackIds.has(track.id)}
                        isSelectionMode={isSelectionMode}
                        progressMap={progressMap}
                        associatedPlaylists={[]} // Not needed in detail view as we know where we are
                        activeMenuTrackId={activeMenuTrackId}
                        onSelectTrack={onSelectTrack}
                        onToggleSelection={toggleSelection}
                        onOpenMenu={setActiveMenuTrackId}
                        onAddToPlaylist={(track) => handleOpenAddModal([track])}
                        onViewMetadata={onViewMetadata}
                        onRemoveFromPlaylist={(trackName) => onRemoveFromPlaylist(playlist.id, trackName)}
                        style={{ height: `${ROW_HEIGHT}px` }}
                    />
                ))
             ) : (
                <div className="text-center py-20 text-gray-500">
                    This playlist is empty.
                </div>
             )}
        </div>
    );
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 flex items-center justify-between flex-shrink-0 bg-audible-bg z-10">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
        >
          <ChevronLeftIcon className="w-5 h-5" />
          <span className="font-medium">Home</span>
        </button>
        <div className="flex items-center gap-4">
            {/* Auto Play Toggle */}
            <button 
                onClick={onToggleAutoPlay}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${isAutoPlay ? 'bg-audible-orange/10 border-audible-orange text-audible-orange' : 'bg-transparent border-gray-700 text-gray-500'}`}
            >
                <RepeatIcon className="w-3 h-3" />
                Auto-Play {isAutoPlay ? 'On' : 'Off'}
            </button>
            <button 
              onClick={onExportData}
              className="flex items-center gap-2 text-sm text-gray-400 hover:text-audible-orange transition-colors"
              title="Save progress and playlists to file"
            >
              <SaveIcon className="w-5 h-5" />
              <span className="hidden sm:inline">Save Data</span>
            </button>
        </div>
      </div>

      {/* Tabs / Selection Header (Only on Main View) */}
      {!selectedPlaylistId && (
        <div className="px-4 pb-4 flex items-center justify-between flex-shrink-0">
          <div className="flex gap-6">
            <button 
              onClick={() => setActiveTab('titles')}
              className={`text-lg font-bold pb-1 transition-colors ${activeTab === 'titles' ? 'text-white border-b-2 border-audible-orange' : 'text-gray-500 hover:text-gray-300'}`}
            >
              Library
            </button>
            <button 
              onClick={() => setActiveTab('playlists')}
              className={`text-lg font-bold pb-1 transition-colors ${activeTab === 'playlists' ? 'text-white border-b-2 border-audible-orange' : 'text-gray-500 hover:text-gray-300'}`}
            >
              Playlists
            </button>
          </div>
          
          {activeTab === 'titles' && (
              <div className="flex items-center gap-4">
                 {isSelectionMode && (
                     <button onClick={handleSelectAll} className="text-sm font-medium text-gray-400 hover:text-white">
                         {isAllSelected ? 'Unselect All' : 'Select All'}
                     </button>
                 )}
                 <button 
                    onClick={() => setIsSelectionMode(!isSelectionMode)}
                    className="text-sm font-medium text-audible-orange"
                 >
                    {isSelectionMode ? 'Cancel' : 'Select'}
                 </button>
              </div>
          )}
        </div>
      )}

      {/* Scrollable Content */}
      <div 
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto no-scrollbar relative"
        onScroll={(e) => setScrollTop(e.currentTarget.scrollTop)}
      >
        {selectedPlaylistId ? (
            renderPlaylistDetail()
        ) : activeTab === 'titles' ? (
            allTracks.length === 0 ? (
                <div className="w-full h-full flex items-center justify-center text-gray-500 pb-20">
                    <span className="text-xl font-medium">None</span>
                </div>
            ) : (
                <div className="pb-20 px-4" style={{ height: `${allTracks.length * ROW_HEIGHT}px`, position: 'relative' }}>
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: `${topSpacerHeight}px` }} />
                    <div style={{ position: 'absolute', top: `${topSpacerHeight}px`, left: 0, right: 0 }}>
                        {virtualTracks.map((track, i) => (
                            <TrackRow
                                key={track.id}
                                track={track}
                                index={startIndex + i}
                                list={allTracks}
                                isInsidePlaylist={false}
                                isSelected={selectedTrackIds.has(track.id)}
                                isSelectionMode={isSelectionMode}
                                progressMap={progressMap}
                                associatedPlaylists={playlists.filter(p => p.trackNames.includes(track.name))}
                                activeMenuTrackId={activeMenuTrackId}
                                onSelectTrack={onSelectTrack}
                                onToggleSelection={toggleSelection}
                                onOpenMenu={setActiveMenuTrackId}
                                onAddToPlaylist={(track) => handleOpenAddModal([track])}
                                onViewMetadata={onViewMetadata}
                                onRemoveFromPlaylist={() => {}} // No op in main list
                                style={{ height: `${ROW_HEIGHT}px` }}
                            />
                        ))}
                    </div>
                </div>
            )
        ) : (
             // Playlists View
             <div className="grid grid-cols-1 gap-6 p-4 pb-20 animate-fade-in max-w-lg mx-auto md:max-w-2xl lg:max-w-4xl">
                {playlists.length === 0 && (
                     <div className="w-full text-center py-4 text-gray-500">
                        <span className="text-xl font-medium">None</span>
                    </div>
                )}
                {playlists.map(playlist => (
                    <PlaylistCard 
                        key={playlist.id} 
                        playlist={playlist}
                        allTracks={allTracks}
                        progressMap={progressMap}
                        onClick={() => setSelectedPlaylistId(playlist.id)}
                    />
                ))}
                
                 {/* Create Playlist Button */}
                 <button 
                    onClick={() => setShowCreatePlaylistModal(true)}
                    className="w-full h-24 flex items-center justify-center gap-3 rounded-xl text-gray-500 hover:text-audible-orange transition-colors group"
                 >
                    <PlusIcon className="w-6 h-6 transition-colors group-hover:text-audible-orange" />
                    <span className="font-medium text-lg transition-colors group-hover:text-audible-orange">Create New Playlist</span>
                 </button>
             </div>
        )}
      </div>

      {/* Bulk Action Bar */}
      {isSelectionMode && selectedTrackIds.size > 0 && (
          <div className="absolute bottom-0 left-0 right-0 bg-[#2a2a2a] border-t border-audible-separator p-4 flex items-center justify-between z-20 animate-slide-up">
              <span className="text-white font-medium ml-2">{selectedTrackIds.size} selected</span>
              
              {selectedPlaylistId ? (
                   <button 
                     onClick={handleBulkRemove}
                     className="px-6 py-2 bg-red-500/10 text-red-500 hover:bg-red-500/20 rounded-full font-medium transition-colors"
                   >
                       Remove from Playlist
                   </button>
              ) : (
                <button 
                  onClick={() => {
                      const selected = allTracks.filter(t => selectedTrackIds.has(t.id));
                      handleOpenAddModal(selected);
                  }}
                  className="px-6 py-2 bg-audible-orange text-black rounded-full font-bold hover:bg-white transition-colors"
                >
                    Add to Playlist
                </button>
              )}
          </div>
      )}

      <LibraryModals
        showAddModal={showAddModal}
        setShowAddModal={setShowAddModal}
        showCreatePlaylistModal={showCreatePlaylistModal}
        setShowCreatePlaylistModal={setShowCreatePlaylistModal}
        showRenamePlaylistModal={showRenamePlaylistModal}
        setShowRenamePlaylistModal={setShowRenamePlaylistModal}
        newPlaylistName={newPlaylistName}
        setNewPlaylistName={setNewPlaylistName}
        createPlaylistName={createPlaylistName}
        setCreatePlaylistName={setCreatePlaylistName}
        renamePlaylistName={renamePlaylistName}
        setRenamePlaylistName={setRenamePlaylistName}
        playlists={playlists}
        handleCreatePlaylist={handleCreatePlaylist}
        handleCreateEmptyPlaylist={handleCreateEmptyPlaylist}
        handleRenamePlaylist={handleRenamePlaylist}
        handleAddToExisting={handleAddToExisting}
      />
    </div>
  );
};
