import { useState, useRef, useEffect } from 'react';
import { ProgressData } from '../types';

export const useProgressManager = () => {
    const [progressMap, setProgressMap] = useState<Record<string, ProgressData>>({});
    
    // Helper to persist to local storage (manual trigger)
    const persistProgress = (map: Record<string, ProgressData>) => {
        try {
            localStorage.setItem('audiobook_progress', JSON.stringify(map));
        } catch (e) {
            console.error("Failed to save progress to localStorage", e);
        }
    };

    // Load initial progress is handled in App.tsx mainly for coordination, 
    // but we provide the logic to update and save here.

    const saveProgress = (trackName: string, currentTime: number, duration: number, segmentHistory: Record<number, number>) => {
        if (!trackName || duration <= 0) return;
        
        const newEntry: ProgressData = {
            currentTime,
            duration,
            percentage: (currentTime / duration) * 100,
            updatedAt: Date.now(),
            segmentHistory: { ...segmentHistory }
        };

        setProgressMap(prev => {
            const newMap = { ...prev, [trackName]: newEntry };
            persistProgress(newMap); // Persist immediately
            return newMap;
        });
    };

    const reloadProgress = () => {
        try {
            const stored = localStorage.getItem('audiobook_progress');
            if (stored) setProgressMap(JSON.parse(stored));
        } catch (e) {}
    };

    return {
        progressMap,
        setProgressMap,
        saveProgress,
        reloadProgress
    };
};
