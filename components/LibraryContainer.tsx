
import React from 'react';
import { Library } from './Library';
import { Track, Playlist, AppData, ProgressData } from '../types';
import { Capacitor } from '@capacitor/core';
import { FilePicker } from '@capawesome/capacitor-file-picker';
import { scanNativePath, scanWebFiles } from '../utils/fileScanner';
import { saveToNativeFilesystem, downloadWebMetadata } from '../utils/persistence';

interface LibraryContainerProps {
  // Global State
  allTracks: Track[];
  playlists: Playlist[];
  progressMap: Record<string, ProgressData>;
  isAutoPlay: boolean;
  
  // Actions
  onSetTracks: (tracks: Track[], metadata?: AppData) => void;
  onSelectTrack: (track: Track, index: number, specificPlaylist?: Track[]) => void;
  onBackToSetup: () => void;
  onToggleAutoPlay: () => void;
  onViewMetadata: (track: Track) => void;
  
  // Playlist Actions (Passed from hook)
  playlistActions: {
      createPlaylist: (name: string, initialTracks: Track[]) => void;
      deletePlaylist: (id: string) => void;
      updatePlaylistName: (id: string, newName: string) => void;
      addToPlaylist: (playlistId: string, track: Track) => void;
      addMultipleToPlaylist: (playlistId: string, tracks: Track[]) => void;
      removeFromPlaylist: (playlistId: string, trackName: string) => void;
      removeMultipleFromPlaylist: (playlistId: string, trackNames: string[]) => void;
  };

  // Settings
  volume: number;
  nativeRootPath: string;
}

export const LibraryContainer: React.FC<LibraryContainerProps> = ({
  allTracks,
  playlists,
  progressMap,
  isAutoPlay,
  onSetTracks,
  onSelectTrack,
  onBackToSetup,
  onToggleAutoPlay,
  onViewMetadata,
  playlistActions,
  volume,
  nativeRootPath
}) => {

  const handleExportData = async () => {
      const data: AppData = {
          progress: progressMap,
          playlists: playlists,
          settings: { volume, isAutoPlay },
          exportedAt: Date.now()
      };

      if (Capacitor.isNativePlatform()) {
          await saveToNativeFilesystem(data, nativeRootPath);
          alert("Data saved to storage.");
      } else {
          downloadWebMetadata(data);
      }
  };

  return (
    <Library 
      allTracks={allTracks}
      playlists={playlists}
      onSelectTrack={onSelectTrack}
      onBack={onBackToSetup}
      progressMap={progressMap}
      onExportData={handleExportData}
      isAutoPlay={isAutoPlay}
      onToggleAutoPlay={onToggleAutoPlay}
      onViewMetadata={onViewMetadata}
      onCreatePlaylist={playlistActions.createPlaylist}
      onAddToPlaylist={playlistActions.addToPlaylist}
      onAddMultipleToPlaylist={playlistActions.addMultipleToPlaylist}
      onDeletePlaylist={playlistActions.deletePlaylist}
      onUpdatePlaylistName={playlistActions.updatePlaylistName}
      onRemoveFromPlaylist={playlistActions.removeFromPlaylist}
      onRemoveMultipleFromPlaylist={playlistActions.removeMultipleFromPlaylist}
    />
  );
};
