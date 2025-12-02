
import React, { useState, useEffect } from 'react';
import { Setup } from './components/Setup';
import { LibraryContainer } from './components/LibraryContainer';
import { PlayerContainer } from './components/PlayerContainer';
import { MetadataPanel, MetadataPanelData } from './components/MetadataPanel';
import { Track, AppData } from './types';
import { loadInitialNativeMetadata } from './utils/persistence';
import { usePlaylistManager } from './hooks/usePlaylistManager';
import { useProgressManager } from './hooks/useProgressManager';
import { useLibrary } from './hooks/useLibrary';
import { usePlayer } from './hooks/usePlayer';

function App() {
  // --- Global View State ---
  const [view, setView] = useState<'setup' | 'library' | 'player'>('setup');
  const [isStorageLoaded, setIsStorageLoaded] = useState(false);
  
  // --- Settings ---
  const [isAutoPlay, setIsAutoPlay] = useState(true);
  const [volume, setVolume] = useState(1);
  const [metadataPanelData, setMetadataPanelData] = useState<MetadataPanelData | null>(null);

  // --- Custom Hooks ---
  const playlistManager = usePlaylistManager(isStorageLoaded);
  const { progressMap, setProgressMap, saveProgress, reloadProgress } = useProgressManager();

  // Handlers for Library
  const applyMetadata = (data: AppData) => {
    if(localStorage.getItem("system_metadata") === 'true')
        return
    if (data.progress) {
        setProgressMap(prev => {
            const newMap = {...prev, ...data.progress};
            localStorage.setItem('audiobook_progress', JSON.stringify(newMap));
            return newMap;
        });
    }
    if (data.playlists) playlistManager.setSavedPlaylists(data.playlists);
    if (data.settings) {
        if (data.settings.volume !== undefined) setVolume(data.settings.volume);
        if (data.settings.isAutoPlay !== undefined) setIsAutoPlay(data.settings.isAutoPlay);
    }
  };

  const { allTracks, setAllTracks, isLoading, nativeRootPath, handleDirectoryUpload } = useLibrary({
    onMetadataLoaded: applyMetadata,
    onUploadSuccess: () => setView('library')
  });

  const player = usePlayer({
      isAutoPlay,
      volume,
      progressMap,
      saveProgress
  });

  // --- Initialization ---
  useEffect(() => {
    const loadStorage = async () => {
      try {
        reloadProgress();
        const storedPlaylists = localStorage.getItem('audiobook_playlists');
        if (storedPlaylists) playlistManager.setSavedPlaylists(JSON.parse(storedPlaylists));
        const storedVolume = localStorage.getItem('audiobook_volume');
        if (storedVolume) setVolume(parseFloat(storedVolume));
        const storedAutoPlay = localStorage.getItem('audiobook_autoplay');
        if (storedAutoPlay) setIsAutoPlay(JSON.parse(storedAutoPlay));

        const nativeData = await loadInitialNativeMetadata();
        if (nativeData) {
            applyMetadata(nativeData);
            localStorage.setItem("system_metadata", "true");
        }
      } catch (e) {
        console.error("Storage load error", e);
      } finally {
        setIsStorageLoaded(true);
      }
    };
    loadStorage();
  }, []);

  useEffect(() => {
    if (isStorageLoaded) {
       localStorage.setItem('audiobook_volume', volume.toString());
       localStorage.setItem('audiobook_autoplay', JSON.stringify(isAutoPlay));
    }
  }, [volume, isAutoPlay, isStorageLoaded]);


  // --- Metadata Logic ---
  const getAssociatedPlaylists = (trackName: string) => 
    playlistManager.savedPlaylists.filter(p => p.trackNames.includes(trackName)).map(p => p.name);

  const handleOpenMetadata = (track?: Track) => {
    const targetTrack = track || (player.audioState.name ? { name: player.audioState.name, audioFile: player.audioState.file } as Track : null);
    if (!targetTrack) return;

    const progress = progressMap[targetTrack.name];
    setMetadataPanelData({
      name: targetTrack.name,
      fileSize: targetTrack.audioFile ? targetTrack.audioFile.size : 0,
      lastModified: targetTrack.audioFile ? targetTrack.audioFile.lastModified : Date.now(),
      duration: progress?.duration || (track ? 0 : player.duration),
      associatedPlaylists: getAssociatedPlaylists(targetTrack.name)
    });
  };

  const playTrackWrapper = (track: Track, index: number, specificPlaylist?: Track[]) => {
      player.playTrack(track, index, specificPlaylist || [track]);
      setView('player');
  };

  return (
    <div className="h-screen flex flex-col bg-audible-bg text-white font-sans selection:bg-audible-orange selection:text-black overflow-hidden relative">
      <audio
        ref={player.audioRef}
        src={player.audioState.url || undefined}
        onTimeUpdate={player.onTimeUpdate}
        onLoadedMetadata={player.onLoadedMetadata}
        onEnded={player.onEnded}
      />

      {view === 'setup' && (
        <div className="flex-1 overflow-y-auto">
          <Setup
            onDirectoryUpload={handleDirectoryUpload}
            isLoading={isLoading}
            onContinueToLibrary={() => setView('library')}
            hasExistingLibrary={allTracks.length > 0}
          />
        </div>
      )}

      {view === 'library' && (
        <LibraryContainer 
            allTracks={allTracks}
            playlists={playlistManager.savedPlaylists}
            progressMap={progressMap}
            isAutoPlay={isAutoPlay}
            onSetTracks={(tracks, meta) => { setAllTracks(tracks); if(meta) applyMetadata(meta); }}
            onSelectTrack={playTrackWrapper}
            onBackToSetup={() => { reloadProgress(); setView('setup'); }}
            onToggleAutoPlay={() => setIsAutoPlay(!isAutoPlay)}
            onViewMetadata={handleOpenMetadata}
            playlistActions={playlistManager}
            volume={volume}
            nativeRootPath={nativeRootPath}
        />
      )}

      {view === 'player' && (
        <PlayerContainer
            audioState={player.audioState}
            subtitleState={player.subtitleState}
            isPlaying={player.isPlaying}
            currentTime={player.currentTime}
            duration={player.duration}
            currentTrackIndex={player.currentTrackIndex}
            playlistLength={player.playlist.length}
            onNext={player.next}
            onPrevious={player.previous}
            onSkipForward={player.skipForward}
            onSkipBackward={player.skipBackward}
            onBack={() => { player.pause(); reloadProgress(); setView('library'); }}
            onTogglePlay={player.togglePlay}
            onSeek={player.seek}
            onSubtitleClick={player.jumpToTime}
            onOpenMetadata={() => handleOpenMetadata()}
            onSegmentChange={player.changeSegment}
        />
      )}

      <MetadataPanel 
        data={metadataPanelData} 
        onClose={() => setMetadataPanelData(null)} 
      />
    </div>
  );
}

export default App;
