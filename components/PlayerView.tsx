import React, { useRef, useEffect, useState, useLayoutEffect } from 'react';
import { Controls } from './Controls';
import {XIcon, ListIcon, ChevronDownIcon} from './Icons';
import { AudioFileState, SubtitleFileState, SubtitleCue } from '../types';
import { SlideWindow } from "./SlideWindow.tsx";
import { animated } from "@react-spring/web";
import { useSwipeDown } from './../hooks/useSwipeDown';


interface PlayerViewProps {
  audioState: AudioFileState;
  subtitleState: SubtitleFileState;
  displayedCues: SubtitleCue[]; // Cues for the current segment
  currentCueIndex: number;
  currentTime: number; // Absolute time (for subtitle click)
  duration: number;    // Absolute duration

  currentSegmentIndex: number;
  totalSegments: number;
  segmentMarkers: number[];
  onSegmentChange: (index: number) => void;

  isPlaying: boolean;
  onBack: () => void;
  onTogglePlay: () => void;
  onSeek: (percentage: number) => void;
  onSubtitleClick: (time: number) => void;
  onNext: () => void;
  onPrevious: () => void;
  onSkipForward: () => void;
  onSkipBackward: () => void;
  onOpenMetadata: () => void;
  hasNext: boolean;
  hasPrevious: boolean;
}

const CUES_PER_SEGMENT = 100;

export const PlayerView: React.FC<PlayerViewProps> = ({
  audioState,
  subtitleState,
  displayedCues,
  currentCueIndex,
  currentTime,
  duration,
  segmentMarkers,
  currentSegmentIndex,
  totalSegments,
  onSegmentChange,
  isPlaying,
  onBack,
  onTogglePlay,
  onSeek,
  onSubtitleClick,
  onNext,
  onPrevious,
  onSkipForward,
  onSkipBackward,
  onOpenMetadata,
  hasNext,
  hasPrevious
}) => {
  const subtitleContainerRef = useRef<HTMLDivElement>(null);
  const activeSubtitleRef = useRef<HTMLDivElement>(null);
  const allowScrollAnimationRef = useRef(false);
  const [showChapters, setShowChapters] = useState(false);

    // Reset animation state when track changes to prevent initial "scroll down" animation.
  useEffect(() => {
      allowScrollAnimationRef.current = false;
      const timer = setTimeout(() => {
          allowScrollAnimationRef.current = true;
      }, 1000);
      return () => clearTimeout(timer);
  }, [audioState.name]);


  // Also disable animation temporarily when switching segments to avoid jarring jumps
  useLayoutEffect(() => {
      allowScrollAnimationRef.current = false;
      const timer = setTimeout(() => {
          allowScrollAnimationRef.current = true;
      }, 500);
      return () => clearTimeout(timer);
  }, [currentSegmentIndex]);

  const scrollToActiveCue = (retryCount = 0) => {
    if (!subtitleContainerRef.current) return;
    // Retry logic if the ref isn't attached yet (React rendering race condition)
    if (!activeSubtitleRef.current) {
        if (retryCount < 2) {
            requestAnimationFrame(() => scrollToActiveCue(retryCount + 1));
        }
        return;
    }

    const container = subtitleContainerRef.current;
    const element = activeSubtitleRef.current;

    const containerHeight = container.clientHeight;
    const elementTop = element.offsetTop;
    const elementHeight = element.offsetHeight;
    
    // Determine offset based on viewport width
    const isMobile = window.innerWidth < 768;
    const offsetRatio = isMobile ? 0.35 : 0.5;
    
    // Calculate target scroll position
    const targetScrollTop = elementTop - (containerHeight * offsetRatio) + (elementHeight / 2);

    // Instant scroll if animation not yet allowed (Initial load / Resume jump / Segment change)

    if (!allowScrollAnimationRef.current) {
        container.scrollTop = targetScrollTop;
        return;
    }

    const startScrollTop = container.scrollTop;
    const distance = targetScrollTop - startScrollTop;
    
    // Don't scroll if distance is negligible
    if (Math.abs(distance) < 5) return;

    const animationDuration = 800; // ms (slow, cinematic)
    let startTime: number | null = null;

    const animation = (now: number) => {
        if (!startTime) startTime = now;
        const timeElapsed = now - startTime;
        const progress = Math.min(timeElapsed / animationDuration, 1);
        
        // Ease Out Cubic
        const ease = 1 - Math.pow(1 - progress, 3);

        container.scrollTop = startScrollTop + (distance * ease);

        if (timeElapsed < animationDuration) {
            requestAnimationFrame(animation);
        } else {
            container.scrollTop = targetScrollTop;
        }
    };

    requestAnimationFrame(animation);
  };

  // Trigger scroll when the active cue or segment changes.
  // Using useLayoutEffect ensures calculations happen immediately after DOM update but before paint.
  useLayoutEffect(() => {
    scrollToActiveCue();
  }, [currentCueIndex, currentSegmentIndex]);



  const formatSegmentTime = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return "00:00";
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const { bind: bindPlayerSwipe, y: playerY, api: playerApi } = useSwipeDown(onBack, subtitleContainerRef);

    useEffect(() => {
         playerApi.set({ y: 0 });
    }, []);

  return (
    // <div className="relative h-full overflow-hidden no-scrollbar flex flex-col ">
    //    Header (Absolute)
      <>
        <animated.div
            {...(showChapters ? {} : bindPlayerSwipe())}
            style={{ y: playerY, touchAction: showChapters ? 'auto' : 'none' }}
            className="absolute inset-0 z-50 flex flex-col bg-black overflow-hidden pt-[calc(env(safe-area-inset-top))] ">

          <div className="absolute left-0 right-0 z-30 ps-4 pt-1 flex items-center bg-gradient-to-b from-black/80 to-transparent">
            <button
              onClick={onBack}
              className="p-2 text-white/90 hover:text-white transition-colors bg-black/20 rounded-full backdrop-blur-sm"
            >
              <ChevronDownIcon />
            </button>
            <div className="ml-4 flex-1 min-w-0">
                <h2 className="font-semibold text-xs text-audible-orange uppercase tracking-widest">Now Playing</h2>
                <p className="font-bold truncate text-sm text-gray-200">{audioState.name}</p>
            </div>
          </div>

      {/* Fixed Cover Image Area */}
      <div className="mt-3 w-full flex-none flex flex-col justify-center items-center h-[50dvh] min-h-[300px] max-h-[600px] z-10 transition-all duration-300">
          {audioState.coverUrl ? (
              <div className="relative h-[100%] aspect-[1/1] overflow-hidden">
                  <img
                      src={audioState.coverUrl}
                      alt={audioState.name}
                      className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 ring-1 ring-white/10 rounded-lg"></div>
              </div>
          ) : (
              <div className="h-[70%] aspect-square bg-gray-800 rounded-lg flex items-center justify-center">
                  <span className="text-gray-600 font-bold text-4xl select-none">
                      {audioState.name.substring(0, 2).toUpperCase()}
                  </span>
              </div>
          )}
      </div>

      {/* Scrollable Subtitles Area */}
      <div 
        ref={subtitleContainerRef}
        className="flex-1 overflow-y-auto no-scrollbar relative min-h-0 mask-image-gradient"
        style={{ 
            maskImage: 'linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%)',
            WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%)'
        }}
      >
        <div className="px-6 space-y-6 pt-4 pb-52 min-h-full">
            {displayedCues.map((cue, index) => {
            const isActive = index === currentCueIndex;
            return (
                <div
                key={cue.id}
                ref={isActive ? activeSubtitleRef : null}
                className={`
                    transition-all duration-700 ease-out transform
                    ${isActive 
                    ? 'opacity-100 blur-0' 
                    : 'opacity-30 blur-[1px]'
                    }
                `}
                onClick={() => onSubtitleClick(cue.start)}
                >
                <p className={`
                    text-xl md:text-2xl leading-relaxed text-center cursor-pointer font-cabin tracking-wide
                    transition-colors duration-500
                    ${isActive ? 'text-audible-orange font-bold' : 'text-gray-400 font-semibold hover:text-gray-300'}
                `}>
                    {cue.text}
                </p>
                </div>
            );
            })}
            
            {displayedCues.length === 0 && (
            <div className="flex flex-col items-center justify-center text-center text-gray-500 py-10">
                <p>No text content for this section.</p>
            </div>
            )}
        </div>
      </div>


      {/* Player Controls (Bottom Sheet) */}
      <div className="glass left-0 right-0 pt-3 border-t border-white/5 relative"
           style={{"paddingBottom": `calc(env(safe-area-inset-bottom) + 15px)`, "zIndex":"100"}}>
        <Controls
          isPlaying={isPlaying}
          onPlayPause={onTogglePlay}
          // Progress reflects the FULL audio length
          progress={duration > 0 ? (currentTime / duration) * 100 : 0}
          currentTime={currentTime}
          duration={duration}
          segmentMarkers={segmentMarkers}
          onSeek={onSeek}
          onOpenMetadata={onOpenMetadata}
          onOpenChapters={() => setShowChapters(true)}
          onNext={onNext}
          onPrevious={onPrevious}
          onSkipForward={onSkipForward}
          onSkipBackward={onSkipBackward}
          hasNext={hasNext}
          hasPrevious={hasPrevious}
        />
      </div>

      {/* Aesthetic background ambient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-audible-orange/5 rounded-full blur-[120px] pointer-events-none z-0" />

      {/* Chapters Slide-Up Panel */}
        {/* Backdrop */}
        <div 
            className={`fixed inset-0 bg-black/60 z-40 transition-opacity duration-300 ${showChapters ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
            onClick={() => setShowChapters(false)}
        />
        {/* Bottom Sheet */}
          <SlideWindow open={showChapters} onClose={() => setShowChapters(false)} side="auto" height="40dvh">
            <div className="bg-[#1a1a1a] rounded-t-3xl z-50 border-t border-white/10 flex flex-col h-full pt-[calc(env(safe-area-inset-top))]">
            <div className="flex items-center justify-between p-4 border-b border-white/5">
                <div className="flex items-center gap-2">
                    <ListIcon className="w-5 h-5 text-audible-orange" />
                    <h3 className="font-bold text-base text-white truncate max-w-[200px]">{audioState.name}</h3>
                </div>
                <button onClick={() => setShowChapters(false)} className="p-2 bg-white/10 rounded-full text-gray-400 hover:text-white">
                    <XIcon className="w-5 h-5" />
                </button>
            </div>
            
            <div className="overflow-y-auto p-3 space-y-1">
                {Array.from({ length: totalSegments }).map((_, i) => {
                    // Calculate dynamic duration for this segment based on lines
                    let dynDuration = 0;
                    if (subtitleState.cues.length > 0) {
                        const startIdx = i * CUES_PER_SEGMENT;
                        const endIdx = Math.min((i + 1) * CUES_PER_SEGMENT - 1, subtitleState.cues.length - 1);
                        if (startIdx < subtitleState.cues.length && endIdx >= startIdx) {
                            dynDuration = subtitleState.cues[endIdx].end - subtitleState.cues[startIdx].start;
                        }
                    } else if (duration > 0) {
                        // Fallback logic if no subtitles exist (1 big segment)
                        dynDuration = duration;
                    }
                      return (
                          <button
                              key={i}
                              onClick={() => {
                                  onSegmentChange(i);
                                  setShowChapters(false);
                              }}
                              className={`w-full flex items-center justify-between p-2.5 rounded-xl transition-all ${currentSegmentIndex === i ? 'bg-audible-orange text-black' : 'bg-white/5 text-gray-300 hover:bg-white/10'}`}
                          >
                              <span className="font-medium text-sm">1.{i + 1}</span>
                              <span
                                  className={`text-xs ${currentSegmentIndex === i ? 'text-black/70' : 'text-gray-500'}`}>
                                {formatSegmentTime(dynDuration)}
                            </span>
                          </button>
                      );
                  })}
              </div>
          </div>
          </SlideWindow>
        </animated.div>
        </>
    // </div>
  );
};
