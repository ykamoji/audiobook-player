
import React, { useState, useEffect, useMemo } from 'react';
import { Playlist, Track, ProgressData } from '../types';
import { MusicIcon } from './Icons';
import { Thumbnail } from './Thumbnail';
import {Capacitor} from "@capacitor/core";

interface PlaylistCardProps {
    playlist: Playlist;
    allTracks: Track[];
    progressMap: Record<string, ProgressData>;
    onClick: () => void;
}

export const PlaylistCard: React.FC<PlaylistCardProps> = ({ playlist, allTracks, progressMap, onClick }) => {

    const { covers, playlistProgress, totalTracks } = useMemo(() => {
        const images: (File | string)[] = [];
        let totalPercentage = 0;
        const total = playlist.trackNames.length;

        for (const name of playlist.trackNames) {
            const t = allTracks.find(track => track.name === name);

            if (t?.coverFile) {
                images.push(t.coverFile); // now supports File or string
            }else if(t?.coverPath) {
                images.push(Capacitor.convertFileSrc(t.coverPath))
            }
            
            const p = progressMap[name];
            if (p) totalPercentage += p.percentage;
        }
        
        return {
            covers: images,
            playlistProgress: total > 0 ? Math.round(totalPercentage / total) : 0,
            totalTracks: total
        };
    }, [playlist, allTracks, progressMap]);

    // Randomize initial offset to show different starting images for different playlists
    const [offset, setOffset] = useState(() => Math.floor(Math.random() * 100));

    // Rotate images every 8 seconds if we have covers
    useEffect(() => {
        if (covers.length <= 1) return;
        
        const interval = setInterval(() => {
            setOffset(prev => (prev + 1) % covers.length);
        }, 8000);

        return () => clearInterval(interval);
    }, [covers.length]);

    const currentCover = covers.length > 0 ? covers[offset % covers.length] : null;

    return (
        <div 
            onClick={onClick}
            className="group cursor-pointer w-full flex flex-col gap-4 mb-2"
        >
            {/* Image Container */}
            <div className="relative w-full aspect-[2/1] rounded-xl overflow-hidden transition-all transform group-hover:scale-[1.005] bg-gray-800">
                <div className="absolute inset-0 bg-gray-800">
                    {currentCover ? (
                        <Thumbnail file={currentCover} />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center opacity-10">
                            <MusicIcon className="w-16 h-16" />
                        </div>
                    )}
                </div>
            </div>
            
            {/* Content - Below Image */}
            <div className="flex flex-col items-center px-4 text-center">
                <h3 className="font-bold text-white text-2xl tracking-tight group-hover:text-audible-orange transition-colors">
                    {playlist.name}
                </h3>
                <div className="flex items-center justify-center gap-2 mt-1">
                    <span className="text-sm font-medium text-gray-400">
                        {totalTracks} tracks
                    </span>
                    {playlistProgress > 0 && (
                        <>
                            <span className="w-1 h-1 bg-gray-600 rounded-full"></span>
                            <span className="text-[10px] font-semibold text-audible-orange">
                                {playlistProgress}%
                            </span>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};
