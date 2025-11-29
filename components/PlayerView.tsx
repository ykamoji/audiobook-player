
import React, { useRef, useEffect } from 'react';
import { Controls } from './Controls';
import { ChevronLeftIcon } from './Icons';
import { AudioFileState, SubtitleFileState, SubtitleCue } from '../types';

interface PlayerViewProps {
  audioState: AudioFileState;
  subtitleState: SubtitleFileState;
  displayedCues: SubtitleCue[]; // Cues for the current segment
  currentCueIndex: number;
  currentTime: number; // Absolute time (for subtitle click)
  duration: number;    // Absolute duration
  
  // Segment Props
  segmentCurrentTime: number;
  segmentDuration: number;
  currentSegmentIndex: number;
  totalSegments: number;
  onSegmentChange: (index: number) => void;

  isPlaying: boolean;
  onBack: () => void;
  onTogglePlay: () => void;
  onSeek: (percentage: number) => void;
  onSubtitleClick: (time: number) => void;
  onNext: () => void;
  onPrevious: () => void;
  onOpenMetadata: () => void;
  hasNext: boolean;
  hasPrevious: boolean;
}

export const PlayerView: React.FC<PlayerViewProps> = ({
  audioState,
  subtitleState,
  displayedCues,
  currentCueIndex,
  currentTime,
  duration,
  segmentCurrentTime,
  segmentDuration,
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
  onOpenMetadata,
  hasNext,
  hasPrevious
}) => {
  const subtitleContainerRef = useRef<HTMLDivElement>(null);
  const activeSubtitleRef = useRef<HTMLDivElement>(null);
  const chaptersScrollRef = useRef<HTMLDivElement>(null);

  // --- Custom Smooth Scroll Logic ---
  const scrollToActiveCue = () => {
    if (!subtitleContainerRef.current || !activeSubtitleRef.current) return;

    const container = subtitleContainerRef.current;
    const element = activeSubtitleRef.current;

    const containerHeight = container.clientHeight;
    const elementTop = element.offsetTop;
    const elementHeight = element.offsetHeight;
    
    // Determine offset based on viewport width
    // On Mobile (< 768px), position the active text higher (approx 35% from top) 
    // instead of centering (50%) to ensure better visibility above controls.
    const isMobile = window.innerWidth < 768;
    const offsetRatio = isMobile ? 0.35 : 0.5;
    
    // Calculate target scroll position
    const targetScrollTop = elementTop - (containerHeight * offsetRatio) + (elementHeight / 2);

    const startScrollTop = container.scrollTop;
    const distance = targetScrollTop - startScrollTop;
    
    // Don't scroll if distance is negligible
    if (Math.abs(distance) < 2) return;

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

  // Trigger scroll when the active cue changes
  useEffect(() => {
    scrollToActiveCue();
  }, [currentCueIndex]);

  // Scroll active chapter into view and reset subtitle scroll position
  useEffect(() => {
    if (chaptersScrollRef.current) {
        const activeBtn = chaptersScrollRef.current.children[currentSegmentIndex] as HTMLElement;
        if (activeBtn) {
            activeBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
        }
    }
    // Reset subtitle scroll position when changing segments to avoid long scroll animations
    if (subtitleContainerRef.current) {
        subtitleContainerRef.current.scrollTop = 0;
    }
  }, [currentSegmentIndex]);

  return (
    <div className="relative h-full flex flex-col">
      {/* Header (Absolute) */}
      <div className="absolute top-0 left-0 right-0 z-30 p-4 flex items-center bg-gradient-to-b from-black/80 to-transparent">
        <button 
          onClick={onBack}
          className="p-2 text-white/90 hover:text-white transition-colors bg-black/20 rounded-full backdrop-blur-sm"
        >
          <ChevronLeftIcon />
        </button>
        <div className="ml-4 flex-1 min-w-0 drop-shadow-md">
            <h2 className="font-semibold text-xs text-audible-orange uppercase tracking-widest">Now Playing</h2>
            <p className="font-bold truncate text-sm text-gray-200">{audioState.name}</p>
        </div>
      </div>

      {/* Fixed Cover Image Area */}
      <div className="mt-14 w-full flex-none flex flex-col justify-center items-center h-[45vh] min-h-[300px] max-h-[600px] z-10 transition-all duration-300">
          {audioState.coverUrl ? (
              <div className="relative h-[85%] aspect-square rounded-lg shadow-2xl overflow-hidden">
                  <img 
                      src={audioState.coverUrl} 
                      alt={audioState.name} 
                      className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 ring-1 ring-white/10 rounded-lg"></div>
              </div>
          ) : (
              <div className="h-[70%] aspect-square bg-gray-800 rounded-lg flex items-center justify-center shadow-2xl">
                  <span className="text-gray-600 font-bold text-4xl select-none">
                      {audioState.name.substring(0, 2).toUpperCase()}
                  </span>
              </div>
          )}

          {/* Sub-chapter Segments */}
          {totalSegments > 1 && (
            <div className="w-full max-w-md px-6 mt-4">
                <div 
                    ref={chaptersScrollRef}
                    className="flex items-center gap-2 overflow-x-auto no-scrollbar py-2 mask-image-gradient-x"
                >
                    {Array.from({ length: totalSegments }).map((_, i) => (
                        <button
                            key={i}
                            onClick={() => onSegmentChange(i)}
                            className={`
                                flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all
                                ${i === currentSegmentIndex 
                                    ? 'bg-audible-orange text-black scale-110 shadow-lg' 
                                    : 'bg-white/10 text-gray-400 hover:bg-white/20 hover:text-white'
                                }
                            `}
                        >
                            {i + 1}
                        </button>
                    ))}
                </div>
            </div>
          )}
      </div>

      {/* Scrollable Subtitles Area */}
      <div 
        ref={subtitleContainerRef}
        className="flex-1 overflow-y-auto no-scrollbar relative min-h-0 mask-image-gradient"
        style={{ 
            // Revised mask to show more text (10% to 90%)
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
                    ${isActive ? 'text-audible-orange font-bold drop-shadow-md' : 'text-gray-400 font-semibold hover:text-gray-300'}
                `}>
                    {cue.text}
                </p>
                </div>
            );
            })}
            
            {displayedCues.length === 0 && (
            <div className="flex flex-col items-center justify-center text-center text-gray-500 py-10">
                <p>No lyrics for this segment.</p>
            </div>
            )}
        </div>
      </div>

      {/* Player Controls (Bottom Sheet) */}
      <div className="glass absolute bottom-0 left-0 right-0 p-4 pt-3 pb-4 rounded-t-3xl border-t border-white/5 z-20">
        <Controls
          isPlaying={isPlaying}
          onPlayPause={onTogglePlay}
          // Progress reflects the FULL audio length, not just the segment
          progress={duration > 0 ? (currentTime / duration) * 100 : 0}
          currentTime={currentTime}
          duration={duration}
          onSeek={onSeek}
          onOpenMetadata={onOpenMetadata}
          onNext={onNext}
          onPrevious={onPrevious}
          hasNext={hasNext}
          hasPrevious={hasPrevious}
        />
      </div>
      
      {/* Aesthetic background ambient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-audible-orange/5 rounded-full blur-[120px] pointer-events-none z-0" />
    </div>
  );
};
