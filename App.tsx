import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Setup } from './components/Setup';
import { Library } from './components/Library';
import { Controls } from './components/Controls';
import { parseSubtitles } from './utils/parser';
import { AudioFileState, SubtitleFileState, Track } from './types';
import { ChevronLeftIcon } from './components/Icons';

function App() {
  // --- State ---
  const [view, setView] = useState<'setup' | 'library' | 'player'>('setup');
  
  // Playlist State
  const [playlist, setPlaylist] = useState<Track[]>([]);
  const [currentTrackIndex, setCurrentTrackIndex] = useState<number>(-1);
  const [isLoading, setIsLoading] = useState(false);
  const [isAutoPlay, setIsAutoPlay] = useState(true);

  // Active Playback State
  const [audioState, setAudioState] = useState<AudioFileState>({
    file: null,
    url: null,
    name: '',
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

  // --- Refs ---
  const audioRef = useRef<HTMLAudioElement>(null);
  const subtitleContainerRef = useRef<HTMLDivElement>(null);
  const activeSubtitleRef = useRef<HTMLDivElement>(null);

  // --- Handlers ---
  const handleDirectoryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;

    setIsLoading(true);
    const files = Array.from(e.target.files);
    
    // 1. Separate Audio and Subtitle files
    const audioFiles: File[] = [];
    const subtitleMap = new Map<string, File>();

    const audioExtensions = ['.mp3', '.wav', '.aac', '.m4a', '.ogg', '.flac'];
    const subtitleExtensions = ['.srt', '.vtt'];

    // Helper to get base name (filename without extension)
    const getBaseName = (filename: string) => filename.substring(0, filename.lastIndexOf('.'));
    const getExtension = (filename: string) => filename.substring(filename.lastIndexOf('.')).toLowerCase();

    files.forEach(file => {
      const ext = getExtension(file.name);
      if (audioExtensions.includes(ext)) {
        audioFiles.push(file);
      } else if (subtitleExtensions.includes(ext)) {
        // Map subtitle files by their name for easy lookup
        // We might want to store the full name or just the base. 
        // Logic: Audio "Song.mp3" looks for "Song_srt.srt"
        subtitleMap.set(file.name, file);
      }
    });

    // 2. Build Tracks
    const newPlaylist: Track[] = audioFiles.map(audioFile => {
      const audioBaseName = getBaseName(audioFile.name);
      
      // Look for a subtitle file that matches "AudioBaseName_srt"
      // We check common extensions
      let subFile = null;
      for (const subExt of subtitleExtensions) {
        const potentialName = `${audioBaseName}_srt${subExt}`;
        if (subtitleMap.has(potentialName)) {
          subFile = subtitleMap.get(potentialName)!;
          break;
        }
      }

      return {
        id: crypto.randomUUID(),
        name: audioBaseName,
        audioFile: audioFile,
        subtitleFile: subFile || null
      };
    });

    // Sort playlist alphabetically
    newPlaylist.sort((a, b) => a.name.localeCompare(b.name));

    setPlaylist(newPlaylist);
    setIsLoading(false);
    
    if (newPlaylist.length > 0) {
      setView('library');
    } else {
      alert("No audio files found in the selected folder.");
    }
  };

  const playTrack = async (track: Track, index: number) => {
    // 1. Reset current state
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    
    // 2. Load Audio
    const url = URL.createObjectURL(track.audioFile);
    setAudioState({
      file: track.audioFile,
      url: url,
      name: track.name
    });
    setCurrentTrackIndex(index);

    // 3. Load Subtitles if available
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

    // 4. Switch view and play
    setView('player');
    // Auto-start playing is handled by the useEffect on audioState.url usually or manually here
    // We'll let the audio element's autoPlay or a useEffect trigger it.
  };

  // Effect to auto-play when track changes
  useEffect(() => {
    if (audioState.url && audioRef.current) {
      audioRef.current.play().then(() => setIsPlaying(true)).catch(err => console.log("Autoplay blocked", err));
    }
  }, [audioState.url]);

  const handleBackToLibrary = () => {
    setView('library');
  };

  const handleBackToSetup = () => {
    setPlaylist([]);
    setAudioState({ file: null, url: null, name: '' });
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

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleSeek = (percentage: number) => {
    if (audioRef.current) {
      const newTime = (percentage / 100) * duration;
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    if (isAutoPlay && currentTrackIndex !== -1 && currentTrackIndex < playlist.length - 1) {
      // Play next track
      playTrack(playlist[currentTrackIndex + 1], currentTrackIndex + 1);
    }
  };

  // --- Computed ---
  const currentCueIndex = useMemo(() => {
    return subtitleState.cues.findIndex(cue => 
      currentTime >= cue.start && currentTime <= cue.end
    );
  }, [currentTime, subtitleState.cues]);

  // --- Effects ---
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  useEffect(() => {
    if (view === 'player' && activeSubtitleRef.current && subtitleContainerRef.current) {
      const container = subtitleContainerRef.current;
      const element = activeSubtitleRef.current;
      const elementTop = element.offsetTop;
      const elementHeight = element.offsetHeight;
      const containerHeight = container.clientHeight;
      const scrollTo = elementTop - (containerHeight / 2) + (elementHeight / 2);

      container.scrollTo({
        top: scrollTo,
        behavior: 'smooth'
      });
    }
  }, [currentCueIndex, view]);

  return (
    <div className="min-h-screen bg-audible-bg text-white font-sans selection:bg-audible-orange selection:text-black overflow-hidden">
      <audio
        ref={audioRef}
        src={audioState.url || undefined}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
      />

      {view === 'setup' && (
        <Setup
          onDirectoryUpload={handleDirectoryUpload}
          isLoading={isLoading}
        />
      )}

      {view === 'library' && (
        <Library 
          tracks={playlist}
          onSelectTrack={playTrack}
          onBack={handleBackToSetup}
        />
      )}

      {view === 'player' && (
        <div className="relative h-screen flex flex-col">
          {/* Header */}
          <div className="absolute top-0 left-0 right-0 z-30 p-4 flex items-center bg-gradient-to-b from-audible-bg to-transparent">
            <button 
              onClick={handleBackToLibrary}
              className="p-2 text-white/80 hover:text-white transition-colors"
            >
              <ChevronLeftIcon />
            </button>
            <div className="ml-4 flex-1 min-w-0">
               <h2 className="font-semibold text-xs text-audible-orange uppercase tracking-widest">Now Playing</h2>
               <p className="font-bold truncate text-sm text-gray-200">{audioState.name}</p>
            </div>
          </div>

          {/* Subtitle Scroll Area */}
          <div 
            ref={subtitleContainerRef}
            className="relative flex-1 overflow-y-auto no-scrollbar pt-[50vh] pb-[50vh] px-8 space-y-8"
          >
            {subtitleState.cues.map((cue, index) => {
              const isActive = index === currentCueIndex;
              return (
                <div
                  key={cue.id}
                  ref={isActive ? activeSubtitleRef : null}
                  className={`
                    transition-all duration-500 ease-out transform
                    ${isActive 
                      ? 'opacity-100 scale-100' 
                      : 'opacity-40 scale-95 blur-[0.5px]'
                    }
                  `}
                  onClick={() => {
                    if (audioRef.current) {
                      audioRef.current.currentTime = cue.start;
                      if (!isPlaying) {
                          audioRef.current.play();
                          setIsPlaying(true);
                      }
                    }
                  }}
                >
                  <p className={`
                    text-xl md:text-2xl font-medium leading-relaxed text-center cursor-pointer font-serif
                    ${isActive ? 'text-white' : 'text-gray-400 hover:text-gray-200'}
                  `}>
                    {cue.text}
                  </p>
                </div>
              );
            })}
            
            {subtitleState.cues.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center text-gray-500 pb-20">
                <p>No lyrics available.</p>
                <p className="text-xs mt-2 text-gray-600">File: {audioState.name}_srt.srt</p>
              </div>
            )}
          </div>

          {/* Player Controls (Bottom Sheet) */}
          <div className="glass absolute bottom-0 left-0 right-0 p-6 pt-8 pb-10 rounded-t-3xl border-t border-white/5 z-20">
            <Controls
              isPlaying={isPlaying}
              onPlayPause={togglePlayPause}
              progress={duration ? (currentTime / duration) * 100 : 0}
              currentTime={currentTime}
              duration={duration}
              onSeek={handleSeek}
              volume={volume}
              onVolumeChange={setVolume}
              isAutoPlay={isAutoPlay}
              onToggleAutoPlay={() => setIsAutoPlay(!isAutoPlay)}
            />
          </div>
          
          {/* Aesthetic background ambient glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-audible-orange/10 rounded-full blur-[120px] pointer-events-none z-0" />
        </div>
      )}
    </div>
  );
}

export default App;