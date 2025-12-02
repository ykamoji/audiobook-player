
import { Filesystem, Encoding } from '@capacitor/filesystem';
import { Track, AppData } from '../types';
import {Capacitor} from "@capacitor/core";

const AUDIO_EXTS = ['.mp3', '.wav', '.aac', '.m4a', '.ogg', '.flac'];
const SUBTITLE_EXTS = ['.srt', '.vtt'];
const COVER_EXTS = ['.png', '.jpg', '.jpeg', '.webp'];

const getExtension = (filename: string) => filename.substring(filename.lastIndexOf('.')).toLowerCase();
const getBaseName = (filename: string) => filename.substring(0, filename.lastIndexOf('.'));

const sortTracks = (tracks: Track[]) => {
    return tracks.sort((a, b) => {
        const getNumber = (str: string) => {
            const matches = str.match(/(\d+)/);
            return matches ? parseInt(matches[0], 10) : null;
        };
        const numA = getNumber(a.name);
        const numB = getNumber(b.name);
        if (numA !== null && numB !== null && numA !== numB) return numA - numB;
        return a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' });
    });
};

export const scanNativePath = async (
    rootInput: string | string[]
): Promise<{ tracks: Track[]; metadata?: AppData }> => {
    const audioMap = new Map<string, string>();
    const subtitleMap = new Map<string, string>();
    const coverMap = new Map<string, string>();
    let foundMetadata: AppData | undefined = undefined;

    const isArrayInput = Array.isArray(rootInput);

    /* ============================================================
       MODE 1: iOS multi-file selection  → rootInput = string[]
       ============================================================ */
    if (isArrayInput) {
        const filePaths = rootInput as string[];

        for (const fullPath of filePaths) {
            const filename = fullPath.split("/").pop()!;
            const cleanName = decodeURIComponent(filename);
            const ext = getExtension(cleanName);

            if (AUDIO_EXTS.includes(ext)) {
                audioMap.set(cleanName, fullPath);
            } else if (SUBTITLE_EXTS.includes(ext)) {
                subtitleMap.set(cleanName, fullPath);
            } else if (COVER_EXTS.includes(ext)) {
                const urlpath = Capacitor.convertFileSrc(fullPath);
                // console.log("WHY_NOT", urlpath)
                coverMap.set(cleanName, urlpath);
            } else if (cleanName === "metadata.json") {
                try {
                    const content = await Filesystem.readFile({
                        path: fullPath,
                        encoding: Encoding.UTF8,
                    });
                    const text =
                        typeof content.data === "string"
                            ? content.data
                            : JSON.stringify(content.data);
                    foundMetadata = JSON.parse(text);
                } catch (e) {
                    console.error("Error parsing native metadata.json", e);
                }
            }
        }

    } else {
        /* ============================================================
           MODE 2: DIRECTORY SCAN → Android
           ============================================================ */
        const rootPath = rootInput as string;

        const scanDir = async (currentPath: string) => {
            try {
                const result = await Filesystem.readdir({ path: currentPath });
                for (const file of result.files) {
                    const separator = currentPath.endsWith('/') ? '' : '/';
                    const fullPath = `${currentPath}${separator}${file.name}`;

                    if (file.type === "directory") {
                        await scanDir(fullPath);
                    } else {
                        const ext = getExtension(file.name);
                        if (AUDIO_EXTS.includes(ext)) {
                            audioMap.set(file.name, fullPath);
                        } else if (SUBTITLE_EXTS.includes(ext)) {
                            subtitleMap.set(file.name, fullPath);
                        } else if (COVER_EXTS.includes(ext)) {
                            coverMap.set(file.name, fullPath);
                        } else if (file.name === "metadata.json") {
                            try {
                                const content = await Filesystem.readFile({
                                    path: fullPath,
                                    encoding: Encoding.UTF8,
                                });
                                const text = typeof content.data === "string"  ? content.data  : JSON.stringify(content.data);
                                foundMetadata = JSON.parse(text);
                            } catch (e) {
                                console.error("Error parsing metadata.json", e);
                            }
                        }
                    }
                }
            } catch (e) {
                console.error("Error reading native directory", currentPath, e);
            }
        };

        await scanDir(rootPath);
    }

    /* ============================================================
       Build Track List
       ============================================================ */
    const tracks: Track[] = [];

    audioMap.forEach((path, filename) => {
        const baseName = getBaseName(filename);
        let subPath = undefined;
        let coverPath = undefined;

        for (const ext of SUBTITLE_EXTS) {
            const checkName = `${baseName}${ext}`;
            if (subtitleMap.has(checkName)) {
                subPath = subtitleMap.get(checkName);
                break;
            }
        }

        for (const ext of COVER_EXTS) {
            const checkName = `${baseName}${ext}`;
            if (coverMap.has(checkName)) {
                coverPath = coverMap.get(checkName);
                break;
            }
        }

        // console.log("WHY_NOT_AGAIN", filename, baseName, path, coverPath)

        tracks.push({
            id: crypto.randomUUID(),
            name: baseName,
            audioPath: path,
            subtitlePath: subPath,
            coverPath: coverPath,
        });
    });

    return { tracks: sortTracks(tracks), metadata: foundMetadata };
};

export const scanWebFiles = async (files: File[]): Promise<{ tracks: Track[], metadata?: AppData }> => {
    let foundMetadata: AppData | undefined = undefined;
    const audioFiles: File[] = [];
    const subtitleMap = new Map<string, File>();
    const coverMap = new Map<string, File>();

    // First pass: identify files
    for (const file of files) {
        if (file.name === 'metadata.json') {
            try {
                const text = await file.text();
                foundMetadata = JSON.parse(text);
            } catch (err) {
                console.error("Failed to parse metadata.json", err);
            }
            continue;
        }

        const ext = getExtension(file.name);
        if (AUDIO_EXTS.includes(ext)) {
            audioFiles.push(file);
        } else if (SUBTITLE_EXTS.includes(ext)) {
            subtitleMap.set(file.name, file);
        } else if (COVER_EXTS.includes(ext)) {
            coverMap.set(file.name, file);
        }
    }

    // Second pass: pair files
    const tracks: Track[] = audioFiles.map(audioFile => {
        const audioBaseName = getBaseName(audioFile.name);
        
        let subFile = null;
        for (const subExt of SUBTITLE_EXTS) {
            const potentialName = `${audioBaseName}${subExt}`;
            if (subtitleMap.has(potentialName)) {
                subFile = subtitleMap.get(potentialName)!;
                break;
            }
        }

        let coverFile = null;
        for (const coverExt of COVER_EXTS) {
            const potentialName = `${audioBaseName}${coverExt}`;
            if (coverMap.has(potentialName)) {
                coverFile = coverMap.get(potentialName)!;
                break;
            }
        }

        // console.log("WHY_NOT_AGAIN", audioFile, audioBaseName, coverFile)

        return {
            id: crypto.randomUUID(),
            name: audioBaseName,
            audioFile: audioFile,
            subtitleFile: subFile || null,
            coverFile: coverFile || null
        };
    });

    return { tracks: sortTracks(tracks), metadata: foundMetadata };
};
