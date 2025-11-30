import { Capacitor } from '@capacitor/core';
import { Track, AudioFileState, SubtitleFileState } from '../types';
import { parseSubtitles, parseSubtitleText } from './parser';
import { readNativeTextFile } from './persistence';

export const loadTrackMedia = async (track: Track): Promise<{
    audioState: AudioFileState;
    subtitleState: SubtitleFileState;
}> => {
    let audioUrl = '';
    let coverUrl = null;

    // 1. Generate URLs
    if (track.audioFile) {
        audioUrl = URL.createObjectURL(track.audioFile);
        coverUrl = track.coverFile ? URL.createObjectURL(track.coverFile) : null;
    } else if (track.audioPath) {
        audioUrl = Capacitor.convertFileSrc(track.audioPath);
        if (track.coverPath) {
            coverUrl = Capacitor.convertFileSrc(track.coverPath);
        }
    }

    const audioState: AudioFileState = {
        file: track.audioFile || null,
        url: audioUrl,
        name: track.name,
        coverUrl: coverUrl
    };

    // 2. Parse Subtitles
    let subtitleState: SubtitleFileState = { file: null, cues: [], name: '' };
    
    if (track.subtitleFile) {
        try {
            const cues = await parseSubtitles(track.subtitleFile);
            subtitleState = {
                file: track.subtitleFile,
                cues: cues,
                name: track.subtitleFile.name
            };
        } catch (error) {
            console.error("Failed to parse subtitle", error);
        }
    } else if (track.subtitlePath) {
        try {
            const text = await readNativeTextFile(track.subtitlePath);
            const cues = parseSubtitleText(text);
            subtitleState = {
                file: null,
                cues: cues,
                name: 'subtitle'
            };
        } catch (error) {
            console.error("Failed to read native subtitle", error);
        }
    }

    return { audioState, subtitleState };
};

export const cleanupTrackMedia = (audioState: AudioFileState) => {
    if (audioState.url) URL.revokeObjectURL(audioState.url);
    if (audioState.coverUrl) URL.revokeObjectURL(audioState.coverUrl);
};
