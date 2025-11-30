import { useState, useEffect } from 'react';
import { Playlist, Track } from '../types';

export const usePlaylistManager = (isStorageLoaded: boolean) => {
    const [savedPlaylists, setSavedPlaylists] = useState<Playlist[]>([]);

    useEffect(() => {
        if (!isStorageLoaded) return;
        localStorage.setItem('audiobook_playlists', JSON.stringify(savedPlaylists));
    }, [savedPlaylists, isStorageLoaded]);

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
    };

    const removeMultipleFromPlaylist = (playlistId: string, trackNames: string[]) => {
        setSavedPlaylists(prev => prev.map(p => {
            if (p.id === playlistId) {
                return { ...p, trackNames: p.trackNames.filter(n => !trackNames.includes(n)) }
            }
            return p;
        }));
    };

    return {
        savedPlaylists,
        setSavedPlaylists,
        createPlaylist,
        deletePlaylist,
        updatePlaylistName,
        addToPlaylist,
        addMultipleToPlaylist,
        removeFromPlaylist,
        removeMultipleFromPlaylist
    };
};
