
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Setup } from './components/Setup';
import { Library } from './components/Library';
import { PlayerView } from './components/PlayerView';
import { MetadataPanel, MetadataPanelData } from './components/MetadataPanel';
import { parseSubtitles } from './utils/parser';
import { AudioFileState, SubtitleFileState, Track, Playlist, AppData } from './types';
import { formatBytes, formatDate, formatDuration } from './utils/formatting';

interface ProgressData {
  currentTime: number;
  duration: number;
  percentage: number;
  updatedAt: number;
  segmentHistory?: Record<number, number>;
}

const SEGMENT_DURATION = 15 * 60; // 15 minutes in seconds

function App() {
  // --- State ---
  const [view, setView] = useState<'setup' | 'library' | 'player'>('setup');
  const [isStorageLoaded, setIsStorageLoaded] = useState(false);
  
  // Playlist State
  const [playlist, setPlaylist] = useState<Track[]>([]);
  const [currentTrackIndex, setCurrentTrackIndex] = useState<number>(-1);
  const [isLoading, setIsLoading] = useState(false);
  const [isAutoPlay, setIsAutoPlay] = useState(true);

  // Persistence State
  const [progressMap, setProgressMap] = useState<Record<string, ProgressData>>({});
  const [savedPlaylists, setSavedPlaylists] = useState<Playlist[]>([]);

  // Active Playback State
  const [audioState, setAudioState] = useState<AudioFileState>({
    file: null,
    url: null,
    name: '',
    coverUrl: null
  });

  const [subtitleState, setSubtitleState] = useState<SubtitleFileState>({
    file: null,
    cues: [],
    name: '',
  });

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);

  // Metadata Panel State
  const [metadataPanelData, setMetadataPanelData] = useState<MetadataPanelData | null>(null);

  // --- Refs ---
  const audioRef = useRef<HTMLAudioElement>(null);
  const lastSaveTimeRef = useRef<number>(0);
  const resumeTimeRef = useRef<number>(0);
  
  // Track last known position for each segment index of the current file
  const segmentHistoryRef = useRef<Record<number, number>>({});

  // --- Initialization ---
  useEffect(() => {
    const loadStorage = () => {
      try {
        const storedProgress = localStorage.getItem('audiobook_progress');
        if (storedProgress) setProgressMap(JSON.parse(storedProgress));

        const storedPlaylists = localStorage.getItem('audiobook_playlists');
        if (storedPlaylists) setSavedPlaylists(JSON.parse(storedPlaylists));

        const storedVolume = localStorage.getItem('audiobook_volume');
        if (storedVolume) setVolume(parseFloat(storedVolume));

        const storedAutoPlay = localStorage.getItem('audiobook_autoplay');
        if (storedAutoPlay) setIsAutoPlay(JSON.parse(storedAutoPlay));
      } catch (e) {
        console.error("Failed to load storage data", e);
      } finally {
        setIsStorageLoaded(true);
      }
    };
    loadStorage();
  }, []);

  // --- Persistence Effects ---
  useEffect(() => {
    if (!isStorageLoaded) return;
    localStorage.setItem('audiobook_playlists', JSON.stringify(savedPlaylists));
  }, [savedPlaylists, isStorageLoaded]);

  useEffect(() => {
    if (!isStorageLoaded) return;
    localStorage.setItem('audiobook_volume', volume.toString());
  }, [volume, isStorageLoaded]);

  useEffect(() => {
    if (!isStorageLoaded) return;
    localStorage.setItem('audiobook_autoplay', JSON.stringify(isAutoPlay));
  }, [isAutoPlay, isStorageLoaded]);


  // --- Handlers ---
  const handleDirectoryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;

    setIsLoading(true);
    const files = Array.from(e.target.files) as File[];
    
    await new Promise(resolve => setTimeout(resolve, 50));

    // Check for metadata.json
    const dataFile = files.find(f => f.name === 'metadata.json');
    if (dataFile) {
      try {
        const text = await dataFile.text();
        const data: AppData = JSON.parse(text);
        
        if (data.progress) {
            setProgressMap(prev => ({...prev, ...data.progress}));
            localStorage.setItem('audiobook_progress', JSON.stringify({...progressMap, ...data.progress}));
        }
        if (data.playlists) setSavedPlaylists(data.playlists);
        if (data.settings) {
            if (data.settings.volume !== undefined) setVolume(data.settings.volume);
            if (data.settings.isAutoPlay !== undefined) setIsAutoPlay(data.settings.isAutoPlay);
        }
      } catch (err) {
        console.error("Failed to parse metadata.json", err);
      }
    }

    const audioFiles: File[] = [];
    const subtitleMap = new Map<string, File>();
    const coverMap = new Map<string, File>();

    const audioExtensions = ['.mp3', '.wav', '.aac', '.m4a', '.ogg', '.flac'];
    const subtitleExtensions = ['.srt', '.vtt'];
    const coverExtensions = ['.png', '.jpg', '.jpeg', '.webp'];

    const getBaseName = (filename: string) => filename.substring(0, filename.lastIndexOf('.'));
    const getExtension = (filename: string) => filename.substring(filename.lastIndexOf('.')).toLowerCase();

    files.forEach(file => {
      const ext = getExtension(file.name);
      if (audioExtensions.includes(ext)) {
        audioFiles.push(file);
      } else if (subtitleExtensions.includes(ext)) {
        subtitleMap.set(file.name, file);
      } else if (coverExtensions.includes(ext)) {
        coverMap.set(file.name, file);
      }
    });

    const newPlaylist: Track[] = audioFiles.map(audioFile => {
      const audioBaseName = getBaseName(audioFile.name);
      
      let subFile = null;
      for (const subExt of subtitleExtensions) {
        const potentialName = `${audioBaseName}${subExt}`;
        if (subtitleMap.has(potentialName)) {
          subFile = subtitleMap.get(potentialName)!;
          break;
        }
      }

      let coverFile = null;
      for (const coverExt of coverExtensions) {
        const potentialName = `${audioBaseName}${coverExt}`;
        if (coverMap.has(potentialName)) {
            coverFile = coverMap.get(potentialName)!;
            break;
        }
      }

      return {
        id: crypto.randomUUID(),
        name: audioBaseName,
        audioFile: audioFile,
        subtitleFile: subFile || null,
        coverFile: coverFile || null
      };
    });

    newPlaylist.sort((a, b) => {
      const getNumber = (str: string) => {
        const matches = str.match(/(\d+)/);
        return matches ? parseInt(matches[0], 10) : null;
      };
      const numA = getNumber(a.name);
      const numB = getNumber(b.name);

      if (numA !== null && numB !== null) {
        if (numA !== numB) return numA - numB;
      }
      return a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' });
    });

    setPlaylist(newPlaylist);
    setIsLoading(false);
    
    if (newPlaylist.length > 0) {
      setView('library');
    } else {
      alert("No audio files found in the selected folder.");
    }
  };

  const handleExportData = () => {
      const data: AppData = {
          progress: progressMap,
          playlists: savedPlaylists,
          settings: { volume, isAutoPlay },
          exportedAt: Date.now()
      };

      const jsonString = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonString], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = "metadata.json";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };

  const playTrack = async (track: Track, index: number, specificPlaylist?: Track[]) => {
    if (audioState.url) URL.revokeObjectURL(audioState.url);
    if (audioState.coverUrl) URL.revokeObjectURL(audioState.coverUrl);
    
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    setMetadataPanelData(null);
    segmentHistoryRef.current = {}; 
    
    const saved = progressMap[track.name];
    if (saved) {
        if (saved.currentTime > 0 && saved.currentTime < saved.duration - 2) {
            resumeTimeRef.current = saved.currentTime;
        } else {
            resumeTimeRef.current = 0;
        }
        // Load segment history if available
        if (saved.segmentHistory) {
            segmentHistoryRef.current = { ...saved.segmentHistory };
        }
    } else {
        resumeTimeRef.current = 0;
    }

    const audioUrl = URL.createObjectURL(track.audioFile);
    const coverUrl = track.coverFile ? URL.createObjectURL(track.coverFile) : null;

    setAudioState({
      file: track.audioFile,
      url: audioUrl,
      name: track.name,
      coverUrl: coverUrl
    });
    
    if (specificPlaylist) {
        setPlaylist(specificPlaylist);
        setCurrentTrackIndex(specificPlaylist.findIndex(t => t.id === track.id));
    } else {
        setCurrentTrackIndex(index);
    }

    if (track.subtitleFile) {
      try {
        const cues = await parseSubtitles(track.subtitleFile);
        setSubtitleState({
          file: track.subtitleFile,
          cues: cues,
          name: track.subtitleFile.name
        });
      } catch (error) {
        console.error("Failed to parse subtitle", error);
        setSubtitleState({ file: null, cues: [], name: '' });
      }
    } else {
      setSubtitleState({ file: null, cues: [], name: '' });
    }
    setView('player');
  };

  // --- Playlist Management Handlers ---
  const createPlaylist = (name: string, initialTracks: Track[]) => {
    const newPlaylist: Playlist = {
      id: crypto.randomUUID(),
      name,
      trackNames: initialTracks.map(t => t.name),
      createdAt: Date.now()
    };
    setSavedPlaylists(prev => [...prev, newPlaylist]);
  };

  const deletePlaylist = (id: string) => {
    setSavedPlaylists(prev => prev.filter(p => p.id !== id));
  };

  const updatePlaylistName = (id: string, newName: string) => {
    setSavedPlaylists(prev => prev.map(p => {
        if (p.id === id) return { ...p, name: newName };
        return p;
    }));
  };

  const addToPlaylist = (playlistId: string, track: Track) => {
    setSavedPlaylists(prev => prev.map(p => {
      if (p.id === playlistId) {
        if (p.trackNames.includes(track.name)) return p;
        return { ...p, trackNames: [...p.trackNames, track.name] };
      }
      return p;
    }));
  };

  const addMultipleToPlaylist = (playlistId: string, tracks: Track[]) => {
    setSavedPlaylists(prev => prev.map(p => {
        if (p.id === playlistId) {
            const newNames = tracks.map(t => t.name).filter(name => !p.trackNames.includes(name));
            if (newNames.length === 0) return p;
            return { ...p, trackNames: [...p.trackNames, ...newNames] }
        }
        return p;
    }));
  };

  const removeFromPlaylist = (playlistId: string, trackName: string) => {
    setSavedPlaylists(prev => prev.map(p => {
        if (p.id === playlistId) {
            return { ...p, trackNames: p.trackNames.filter(n => n !== trackName) }
        }
        return p;
    }));
  }

  const removeMultipleFromPlaylist = (playlistId: string, trackNames: string[]) => {
    setSavedPlaylists(prev => prev.map(p => {
        if (p.id === playlistId) {
            return { ...p, trackNames: p.trackNames.filter(n => !trackNames.includes(n)) }
        }
        return p;
    }));
  }

  // --- Audio Effects ---
  useEffect(() => {
    if (audioState.url && audioRef.current) {
      if (isAutoPlay) {
        const playPromise = audioRef.current.play();
        if (playPromise !== undefined) {
          playPromise
            .then(() => setIsPlaying(true))
            .catch(err => console.log("Autoplay blocked or waiting for interaction", err));
        }
      } else {
        setIsPlaying(false);
      }
    }
  }, [audioState.url]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  // --- Player Handlers ---
  const handleBackToLibrary = () => {
    if (audioRef.current) audioRef.current.pause();
    setIsPlaying(false);
    setMetadataPanelData(null);

    // Refresh progress map from storage
    try {
      const stored = localStorage.getItem('audiobook_progress');
      if (stored) setProgressMap(JSON.parse(stored));
    } catch (e) {}
    setView('library');
  };

  const handleBackToSetup = () => {
    if (audioRef.current) audioRef.current.pause();
    if (audioState.url) URL.revokeObjectURL(audioState.url);
    if (audioState.coverUrl) URL.revokeObjectURL(audioState.coverUrl);
    
    setIsPlaying(false);
    setMetadataPanelData(null);
    setAudioState({ file: null, url: null, name: '', coverUrl: null });
    setView('setup');
  };

  const togglePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  // --- Segment Logic Helpers ---
  const getSegmentIndex = (time: number) => Math.floor(time / SEGMENT_DURATION);

  const saveProgress = (t: number, d: number) => {
     if (!audioState.name || d <= 0) return;
     const newEntry: ProgressData = {
          currentTime: t,
          duration: d,
          percentage: (t / d) * 100,
          updatedAt: Date.now(),
          segmentHistory: { ...segmentHistoryRef.current }
      };
      try {
          const currentMap = JSON.parse(localStorage.getItem('audiobook_progress') || '{}');
          currentMap[audioState.name] = newEntry;
          localStorage.setItem('audiobook_progress', JSON.stringify(currentMap));
      } catch (e) {
          console.error("Failed to save progress", e);
      }
  }

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const t = audioRef.current.currentTime;
      const d = audioRef.current.duration;
      setCurrentTime(t);

      // Update segment history
      const currentSeg = getSegmentIndex(t);
      segmentHistoryRef.current[currentSeg] = t;

      // Persist progress logic (throttled)
      const now = Date.now();
      if (audioState.name && d > 0 && now - lastSaveTimeRef.current > 1000) {
        saveProgress(t, d);
        lastSaveTimeRef.current = now;
      }
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
      if (resumeTimeRef.current > 0) {
        audioRef.current.currentTime = resumeTimeRef.current;
        // Populate history for the resumed segment
        const seg = getSegmentIndex(resumeTimeRef.current);
        segmentHistoryRef.current[seg] = resumeTimeRef.current;
        resumeTimeRef.current = 0; 
      }
    }
  };

  const totalSegments = Math.max(1, Math.ceil(duration / SEGMENT_DURATION));
  const currentSegmentIndex = getSegmentIndex(currentTime);
  const segmentStartTime = currentSegmentIndex * SEGMENT_DURATION;
  // Determine how long the current segment is (usually 900s, unless it's the last one)
  const segmentDuration = Math.min(SEGMENT_DURATION, duration - segmentStartTime);
  // Time within the current segment (0 to 900)
  const segmentCurrentTime = Math.max(0, currentTime - segmentStartTime);

  const currentSegmentCues = useMemo(() => {
    const start = currentSegmentIndex * SEGMENT_DURATION;
    const end = start + SEGMENT_DURATION;
    return subtitleState.cues.filter(c => c.start >= start && c.start < end);
  }, [subtitleState.cues, currentSegmentIndex]);

  const currentCueIndex = useMemo(() => {
    // Find index in the *displayed segment cues*
    return currentSegmentCues.findIndex(cue => 
      currentTime >= cue.start && currentTime <= cue.end
    );
  }, [currentTime, currentSegmentCues]);

  const handleSeek = (percentage: number) => {
    if (audioRef.current && duration > 0) {
      // Seek absolute based on total duration
      const newTime = (percentage / 100) * duration;
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
      
      const seg = getSegmentIndex(newTime);
      segmentHistoryRef.current[seg] = newTime;
      // Force save on manual seek
      saveProgress(newTime, duration);
    }
  };

  const handleSegmentChange = (index: number) => {
    if (audioRef.current) {
        // Pause audio when switching segments
        audioRef.current.pause();
        setIsPlaying(false);

        const segmentStart = index * SEGMENT_DURATION;
        const segmentEnd = (index + 1) * SEGMENT_DURATION;

        // Check if we have history for this segment
        const savedTime = segmentHistoryRef.current[index];

        let newTime = segmentStart;

        if (savedTime && savedTime >= segmentStart && savedTime < segmentEnd) {
             // Resume from last known position in this segment
             newTime = savedTime;
        } else {
             // If no history, find the first cue in the target segment
             const firstCue = subtitleState.cues.find(c => c.start >= segmentStart && c.start < segmentEnd);
             newTime = firstCue ? firstCue.start : segmentStart;
        }
        
        audioRef.current.currentTime = newTime;
        setCurrentTime(newTime);
        segmentHistoryRef.current[index] = newTime;
        
        // Save progress explicitly as playback pauses here
        saveProgress(newTime, duration);
    }
  };

  const handleSubtitleClick = (time: number) => {
    if (audioRef.current) {
        audioRef.current.currentTime = time;
        const seg = getSegmentIndex(time);
        segmentHistoryRef.current[seg] = time;
        saveProgress(time, duration);

        if (!isPlaying) {
            audioRef.current.play();
            setIsPlaying(true);
        }
    }
  };

  const handleNext = () => {
    if (currentTrackIndex < playlist.length - 1) {
      playTrack(playlist[currentTrackIndex + 1], currentTrackIndex + 1, playlist);
    }
  };

  const handlePrevious = () => {
    if (currentTime > 3) {
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        if (!isPlaying) audioRef.current.play();
      }
      return;
    }
    if (currentTrackIndex > 0) {
      playTrack(playlist[currentTrackIndex - 1], currentTrackIndex - 1, playlist);
    } else if (audioRef.current) {
       audioRef.current.currentTime = 0;
       if (!isPlaying) audioRef.current.play();
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    if (audioState.name) {
       saveProgress(duration, duration);
    }
    if (isAutoPlay && currentTrackIndex !== -1 && currentTrackIndex < playlist.length - 1) {
      playTrack(playlist[currentTrackIndex + 1], currentTrackIndex + 1);
    }
  };

  const handleOpenPlayerMetadata = () => {
    if (audioState.file) {
      const associated = savedPlaylists
        .filter(p => p.trackNames.includes(audioState.name))
        .map(p => p.name);

      setMetadataPanelData({
        name: audioState.name,
        fileSize: audioState.file.size,
        lastModified: audioState.file.lastModified,
        duration: duration,
        associatedPlaylists: associated
      });
    }
  };

  const handleViewTrackMetadata = (track: Track) => {
    const progress = progressMap[track.name];
    const associated = savedPlaylists
        .filter(p => p.trackNames.includes(track.name))
        .map(p => p.name);

    setMetadataPanelData({
      name: track.name,
      fileSize: track.audioFile.size,
      lastModified: track.audioFile.lastModified,
      duration: progress?.duration || 0,
      associatedPlaylists: associated
    });
  };

  return (
    <div className="h-screen flex flex-col bg-audible-bg text-white font-sans selection:bg-audible-orange selection:text-black overflow-hidden relative">
      <audio
        ref={audioRef}
        src={audioState.url || undefined}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
      />

      {view === 'setup' && (
        <div className="flex-1 overflow-y-auto">
          <Setup
            onDirectoryUpload={handleDirectoryUpload}
            isLoading={isLoading}
            hasExistingLibrary={playlist.length > 0}
            onContinueToLibrary={() => setView('library')}
          />
        </div>
      )}

      {view === 'library' && (
        <Library 
          allTracks={playlist}
          playlists={savedPlaylists}
          onSelectTrack={playTrack}
          onBack={handleBackToSetup}
          progressMap={progressMap}
          onCreatePlaylist={createPlaylist}
          onAddToPlaylist={addToPlaylist}
          onAddMultipleToPlaylist={addMultipleToPlaylist}
          onDeletePlaylist={deletePlaylist}
          onUpdatePlaylistName={updatePlaylistName}
          onRemoveFromPlaylist={removeFromPlaylist}
          onRemoveMultipleFromPlaylist={removeMultipleFromPlaylist}
          onExportData={handleExportData}
          isAutoPlay={isAutoPlay}
          onToggleAutoPlay={() => setIsAutoPlay(!isAutoPlay)}
          onViewMetadata={handleViewTrackMetadata}
        />
      )}

      {view === 'player' && (
        <PlayerView 
          audioState={audioState}
          subtitleState={subtitleState}
          displayedCues={currentSegmentCues}
          currentCueIndex={currentCueIndex}
          currentTime={currentTime}
          duration={duration}
          segmentCurrentTime={segmentCurrentTime}
          segmentDuration={segmentDuration}
          currentSegmentIndex={currentSegmentIndex}
          totalSegments={totalSegments}
          onSegmentChange={handleSegmentChange}
          isPlaying={isPlaying}
          onBack={handleBackToLibrary}
          onTogglePlay={togglePlayPause}
          onSeek={handleSeek}
          onSubtitleClick={handleSubtitleClick}
          onNext={handleNext}
          onPrevious={handlePrevious}
          onOpenMetadata={handleOpenPlayerMetadata}
          hasNext={currentTrackIndex < playlist.length - 1}
          hasPrevious={currentTrackIndex > 0}
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
