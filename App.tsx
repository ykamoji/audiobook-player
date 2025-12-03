import React, { useState, useEffect } from 'react';
import { Setup } from './components/Setup';
import { LibraryContainer } from './components/LibraryContainer';
import { PlayerContainer } from './components/PlayerContainer';
import { MetadataPanel, MetadataPanelData } from './components/MetadataPanel';
import { Track, AppData } from './types';
import { useSpring, animated } from "@react-spring/web";
import { loadInitialNativeMetadata } from './utils/persistence';
import { usePlaylistManager } from './hooks/usePlaylistManager';
import { useProgressManager } from './hooks/useProgressManager';
import { useLibrary } from './hooks/useLibrary';
import { usePlayer } from './hooks/usePlayer';

function App() {
  // --- Global View State ---
  const [view, setView] = useState<'setup' | 'titles' | 'playlists' >('setup');

  const [playerMode, setPlayerMode] = useState<'mini' | 'full'>('mini')

  const [isStorageLoaded, setIsStorageLoaded] = useState(false);
  
  // --- Settings ---
  const [isAutoPlay, setIsAutoPlay] = useState(false);
  // const [volume, setVolume] = useState(1);
  const [metadataPanelData, setMetadataPanelData] = useState<MetadataPanelData | null>(null);

  // --- Custom Hooks ---
  const playlistManager = usePlaylistManager(isStorageLoaded);
  const { progressMap, setProgressMap, saveProgress, reloadProgress } = useProgressManager();

  // Handlers for Library
  const applyMetadata = (data: AppData) => {
    if(localStorage.getItem("system_metadata") === 'true') return
    if (data.progress) {
        setProgressMap(prev => {
            const newMap = {...prev, ...data.progress};
            localStorage.setItem('audiobook_progress', JSON.stringify(newMap));
            return newMap;
        });
    }
    if (data.playlists) playlistManager.setSavedPlaylists(data.playlists);
    if (data.settings) {
        if (data.settings.isAutoPlay !== undefined) setIsAutoPlay(data.settings.isAutoPlay);
    }
  };

  const { allTracks, isLoading, nativeRootPath, handleDirectoryUpload } = useLibrary({
    onMetadataLoaded: applyMetadata,
    onUploadSuccess: () => setView('titles')
  });

  const player = usePlayer({
      isAutoPlay,
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
       localStorage.setItem('audiobook_autoplay', JSON.stringify(isAutoPlay));
    }
  }, [isAutoPlay, isStorageLoaded]);


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
      setPlayerMode('full');
  };

  const miniStyle = useSpring({
      opacity: playerMode === "mini" ? 1 : 0,
      y: playerMode === "mini" ? 0 : 20,
      config: { tension: 200, friction: 22 }
  });

  const bottomStyle = useSpring({
      opacity: playerMode === "full" ? 0 : 1,
      y: playerMode === "full" ? 20 : 0,
      config: { tension: 200, friction: 22 }
  })

  return (
      <>
          <div className="h-screen flex flex-col bg-audible-bg text-white font-sans selection:bg-audible-orange overflow-hidden selection:text-black">
              <audio
                  ref={player.audioRef}
                  src={player.audioState.url || undefined}
                  onTimeUpdate={player.onTimeUpdate}
                  onLoadedMetadata={player.onLoadedMetadata}
                  onDurationChange={player.onLoadedMetadata}
                  onEnded={player.onEnded}
              />
              <div className="flex-1 overflow-hidden flex flex-col relative">
                  {view === 'setup' && (
                      <div className="flex-1 overflow-y-auto">
                          <Setup
                              onDirectoryUpload={handleDirectoryUpload}
                              isLoading={isLoading}
                              onContinueToLibrary={() => setView('titles')}
                              hasExistingLibrary={allTracks.length > 0}
                          />
                      </div>
                  )}
                  {(view === 'titles' || view === 'playlists') &&
                      <div className={"flex-1 overflow-y-auto pb-[calc(env(safe-area-inset-bottom)+60px)]"}>
                          <LibraryContainer
                              allTracks={allTracks}
                              playlists={playlistManager.savedPlaylists}
                              progressMap={progressMap}
                              isAutoPlay={isAutoPlay}
                              activeTab={view}
                              // onSetTracks={(tracks, meta) => { setAllTracks(tracks); if(meta) applyMetadata(meta); }}
                              onSelectTrack={playTrackWrapper}
                              // onBackToSetup={() => {
                              //     reloadProgress();
                              //     setView('setup');
                              // }}
                              onToggleAutoPlay={() => setIsAutoPlay(!isAutoPlay)}
                              onViewMetadata={handleOpenMetadata}
                              playlistActions={playlistManager}
                              nativeRootPath={nativeRootPath}
                          />
                      </div>
                  }
              </div>
          </div>
          <div className="flex-1 overflow-y-auto overflow-x-hidden pb-[calc(env(safe-area-inset-bottom)+60px)]">
              {playerMode === 'full' && <PlayerContainer
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
                  onBack={() => {
                      player.pause();
                      reloadProgress();
                      setPlayerMode('mini');
                  }}
                  onTogglePlay={player.togglePlay}
                  onSeek={player.seek}
                  onSubtitleClick={player.jumpToTime}
                  onOpenMetadata={() => handleOpenMetadata()}
                  onSegmentChange={player.changeSegment}
              />}
          </div>
          <MetadataPanel
              data={metadataPanelData}
              onClose={() => setMetadataPanelData(null)}
          />
          <div
              className="fixed bottom-0 w-full pb-1"
              style={{"paddingBottom": `calc(env(safe-area-inset-bottom) + 10px)`}}>
              <animated.div style={{
                    opacity: miniStyle.opacity,
                    transform: miniStyle.y.to(v => `translateY(${v}px)`)
                  }}
                  className="flex justify-around z-40 bg-[#111]">
                  MINI MODE
              </animated.div>
              <animated.div
                  style={{
                    opacity: bottomStyle.opacity,
                    transform: bottomStyle.y.to(v => `translateY(${v}px)`)
                  }}
                  className="relative z-40 flex justify-center bg-[#111] gap-x-8">
                  <button
                      onClick={() => setView('setup')}
                      className={`text-lg font-bold pb-1 w-[75px] transition-colors border-b-2 ${view === 'setup' ? 'text-white border-audible-orange' : 'border-black text-gray-500 hover:text-gray-300'}`}>
                      Sync
                  </button>
                  <button
                      onClick={() => setView('titles')}
                      className={`text-lg font-bold pb-1 w-[75px] transition-colors border-b-2 ${view === 'titles' ? 'text-white border-audible-orange' : 'border-black text-gray-500 hover:text-gray-300'}`}>
                      Library
                  </button>
                  <button
                      onClick={() => setView('playlists')}
                      className={`text-lg font-bold pb-1 w-[75px] transition-colors border-b-2 ${view === 'playlists' ? 'text-white border-audible-orange' : 'border-black text-gray-500 hover:text-gray-300'}`}>
                      Playlists
                  </button>
              </animated.div>
          </div>
      </>
  );
}

export default App;
