
import { useState, useRef, useEffect } from 'react';
import { AudioFileState, SubtitleFileState, Track, ProgressData } from '../types';
import { loadTrackMedia, cleanupTrackMedia } from '../utils/mediaLoader';

const CUES_PER_SEGMENT = 100;

interface UsePlayerProps {
    isAutoPlay: boolean;
    progressMap: Record<string, ProgressData>;
    saveProgress: (trackName: string, currentTime: number, duration: number, segmentHistory: Record<number, number>) => void;
}

export const usePlayer = ({ isAutoPlay, progressMap, saveProgress }: UsePlayerProps) => {
    const audioRef = useRef<HTMLAudioElement>(null);
    
    // State
    const [playlist, setPlaylist] = useState<Track[]>([]);
    const [currentTrackIndex, setCurrentTrackIndex] = useState<number>(-1);
    const [audioState, setAudioState] = useState<AudioFileState>({ file: null, url: null, name: '', coverUrl: null });
    const [subtitleState, setSubtitleState] = useState<SubtitleFileState>({ file: null, cues: [], name: '' });
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);

    // Refs for logic
    const lastSaveTimeRef = useRef<number>(0);
    const resumeTimeRef = useRef<number>(0);
    const segmentHistoryRef = useRef<Record<number, number>>({});

    // Audio Element Effect: AutoPlay
    useEffect(() => {
        if (audioState.url && audioRef.current) {
            if (isAutoPlay) {
                audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
            } else {
                setIsPlaying(false);
            }
        }
    }, [audioState.url, isAutoPlay]);

    const playTrack = async (track: Track, index: number, specificPlaylist: Track[]) => {
        cleanupTrackMedia(audioState);
        setIsPlaying(false);
        setCurrentTime(0);
        setDuration(0);
        segmentHistoryRef.current = {}; 
        
        // Restore Progress
        const savedProgress = progressMap[track.name];
        if (savedProgress) {
            resumeTimeRef.current = (savedProgress.currentTime > 0 && savedProgress.currentTime < savedProgress.duration - 2) ? savedProgress.currentTime : 0;
            if (savedProgress.segmentHistory) segmentHistoryRef.current = { ...savedProgress.segmentHistory };
        } else {
            resumeTimeRef.current = 0;
        }

        const { audioState: newAudioState, subtitleState: newSubtitleState } = await loadTrackMedia(track);
        setAudioState(newAudioState);
        setSubtitleState(newSubtitleState);

        requestAnimationFrame(() => {
            if (audioRef.current) audioRef.current.load();
        });
        
        setPlaylist(specificPlaylist);
        setCurrentTrackIndex(specificPlaylist.findIndex(t => t.id === track.id));
    };

    const handleTimeUpdate = () => {
        if (audioRef.current) {
            const t = audioRef.current.currentTime;
            const d = audioRef.current.duration;
            setCurrentTime(t);

            // Determine segment based on CUE index, not time
            let currentSeg = 0;
            if (subtitleState.cues.length > 0) {
                // Find active cue index
                const cueIndex = subtitleState.cues.findIndex(c => t >= c.start && t <= c.end);

                // If inside a cue, use it. If not (gap), find the next cue or use previous
                let targetIndex = cueIndex;
                if (targetIndex === -1) {
                    // Find the cue that starts after current time
                    const nextCueIndex = subtitleState.cues.findIndex(c => c.start > t);
                    if (nextCueIndex > 0) targetIndex = nextCueIndex - 1;
                    else if (nextCueIndex === 0) targetIndex = 0;
                    else targetIndex = subtitleState.cues.length - 1; // End of file
                }

                currentSeg = Math.floor(targetIndex / CUES_PER_SEGMENT);
            }

            segmentHistoryRef.current[currentSeg] = t;

            if (audioState.name && d > 0 && Date.now() - lastSaveTimeRef.current > 1000) {
                saveProgress(audioState.name, t, d, segmentHistoryRef.current);
                lastSaveTimeRef.current = Date.now();
            }
        }
    };

    const handleLoadedMetadata = () => {
    const audio = audioRef.current;
    if (!audio) return;

    const applyRestoreLogic = () => {
        setDuration(audio.duration);

        // Restore the resume time AFTER duration is valid
        if (resumeTimeRef.current > 0) {
            audio.currentTime = resumeTimeRef.current;

            // Restore segment
            if (subtitleState.cues.length > 0) {
                const cueIndex = subtitleState.cues.findIndex(
                    c => resumeTimeRef.current >= c.start && resumeTimeRef.current <= c.end
                );

                let targetIndex = cueIndex !== -1 ? cueIndex : 0;

                if (cueIndex === -1) {
                    const next = subtitleState.cues.findIndex(c => c.start > resumeTimeRef.current);
                    targetIndex = next > 0 ? next - 1 : 0;
                }

                const seg = Math.floor(targetIndex / CUES_PER_SEGMENT);
                segmentHistoryRef.current[seg] = resumeTimeRef.current;
            }

            resumeTimeRef.current = 0;
        }
    };

    // Immediate apply if usable
    if (audio.duration > 0 && audio.duration !== Infinity) {
        applyRestoreLogic();
        return;
    }

    // Otherwise wait for the real duration
    const waitForDuration = () => {
        if (audio.duration > 0 && audio.duration !== Infinity) {
            audio.removeEventListener("durationchange", waitForDuration);
            applyRestoreLogic();
        }
    };

    audio.addEventListener("durationchange", waitForDuration);
};

    const handleSeek = (percentage: number) => {
        if (audioRef.current && duration > 0) {
            const newTime = (percentage / 100) * duration;
            audioRef.current.currentTime = newTime;
            setCurrentTime(newTime);
            
            // Update history for the segment we jumped into
            if (subtitleState.cues.length > 0) {
                let targetIndex = subtitleState.cues.findIndex(c => newTime >= c.start && newTime <= c.end);
                if (targetIndex === -1) {
                    const next = subtitleState.cues.findIndex(c => c.start > newTime);
                    targetIndex = next > 0 ? next - 1 : (next === 0 ? 0 : subtitleState.cues.length - 1);
                }
                const seg = Math.floor(targetIndex / CUES_PER_SEGMENT);
                segmentHistoryRef.current[seg] = newTime;
            }
            
            saveProgress(audioState.name, newTime, duration, segmentHistoryRef.current);
        }
    };

    const handleSubtitleClick = (time: number) => {
        if (audioRef.current) {
            audioRef.current.currentTime = time;
            handleSeek((time / duration) * 100); 
            if (!isPlaying) { audioRef.current.play(); setIsPlaying(true); }
        }
    };

    const handleSegmentChange = (index: number) => {
        if (audioRef.current) {
            audioRef.current.pause();
            setIsPlaying(false);

            // Calculate start time based on Cues
            let segmentStartTime = 0;
            let segmentEndTime = duration;

            if (subtitleState.cues.length > 0) {
                const startIndex = index * CUES_PER_SEGMENT;
                const endIndex = Math.min((index + 1) * CUES_PER_SEGMENT - 1, subtitleState.cues.length - 1);
                
                if (startIndex < subtitleState.cues.length) {
                    segmentStartTime = subtitleState.cues[startIndex].start;
                }
                if (endIndex < subtitleState.cues.length) {
                    segmentEndTime = subtitleState.cues[endIndex].end;
                }
            } else {
                // Fallback for no subtitles
                segmentStartTime = 0;
            }

            const savedTime = segmentHistoryRef.current[index];
            
            // Check if saved time is valid for this segment range
            let newTime = (savedTime && savedTime >= segmentStartTime && savedTime <= segmentEndTime) 
                ? savedTime 
                : segmentStartTime;
            
            audioRef.current.currentTime = newTime;
            setCurrentTime(newTime);
            segmentHistoryRef.current[index] = newTime;
            saveProgress(audioState.name, newTime, duration, segmentHistoryRef.current);
        }
    };

    const togglePlay = () => {
        if (audioRef.current) {
            if (isPlaying) audioRef.current.pause();
            else audioRef.current.play();
            setIsPlaying(!isPlaying);
        }
    };

    const pause = () => {
        if (audioRef.current) {
            audioRef.current.pause();
            setIsPlaying(false);
        }
    };

    const handleNext = () => {
        if (currentTrackIndex < playlist.length - 1) {
            playTrack(playlist[currentTrackIndex + 1], currentTrackIndex + 1, playlist);
        }
    };

    const handlePrevious = () => {
        if (currentTime > 3) {
            if (audioRef.current) { audioRef.current.currentTime = 0; if (!isPlaying) audioRef.current.play(); }
        } else if (currentTrackIndex > 0) {
            playTrack(playlist[currentTrackIndex - 1], currentTrackIndex - 1, playlist);
        } else if (audioRef.current) {
            audioRef.current.currentTime = 0; if (!isPlaying) audioRef.current.play();
        }
    };
    
    const skipForward = () => {
        if (audioRef.current) {
            let newTime = Math.min(audioRef.current.currentTime + 10, duration);
            audioRef.current.currentTime = newTime;
            setCurrentTime(newTime);
        }
    };

    const skipBackward = () => {
        if (audioRef.current) {
            let newTime = Math.max(audioRef.current.currentTime - 10, 0);
            audioRef.current.currentTime = newTime;
            setCurrentTime(newTime);
        }
    };

    return {
        // State
        audioState,
        subtitleState,
        playlist,
        currentTrackIndex,
        isPlaying,
        currentTime,
        duration,
        
        // Actions
        playTrack,
        togglePlay,
        pause,
        seek: handleSeek,
        changeSegment: handleSegmentChange,
        jumpToTime: handleSubtitleClick,
        next: handleNext,
        previous: handlePrevious,
        skipForward,
        skipBackward,
        
        // Internals for Audio Component
        audioRef,
        segmentHistoryRef,
        onTimeUpdate: handleTimeUpdate,
        onLoadedMetadata: handleLoadedMetadata,
        onEnded: () => {
            setIsPlaying(false);
            if (audioState.name) saveProgress(audioState.name, duration, duration, segmentHistoryRef.current);
            if (isAutoPlay) handleNext();
        }
    };
};
