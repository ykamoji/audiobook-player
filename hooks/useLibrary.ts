import { useState, useRef } from 'react';
import { Capacitor } from '@capacitor/core';
import { FilePicker } from '@capawesome/capacitor-file-picker';
import { scanNativePath, scanWebFiles } from '../utils/fileScanner';
import { Track, AppData } from '../types';

interface UseLibraryProps {
    onMetadataLoaded: (data: AppData) => void;
    onUploadSuccess: () => void;
}

export const useLibrary = ({ onMetadataLoaded, onUploadSuccess }: UseLibraryProps) => {
    const [allTracks, setAllTracks] = useState<Track[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const nativeRootPathRef = useRef<string>('');

    // @ts-ignore
    const handleDirectoryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        setIsLoading(true);
        try {
            let resultTracks: Track[] = [];
            let resultMetadata: AppData | undefined;

            if (Capacitor.isNativePlatform()) {

                const isIOS = Capacitor.getPlatform() === "ios";
                if (isIOS) {
                    // @ts-ignore
                    const result = await FilePicker.pickFiles({multiple: true});
                    const filePaths = result.files.map(f => f.path!).filter((p): p is string => !!p);
                    const scan = await scanNativePath(filePaths);
                    resultTracks = scan.tracks;
                    resultMetadata = scan.metadata;

                }
            } else if (e.target.files && e.target.files.length > 0) {
                const files = Array.from(e.target.files) as File[];
                await new Promise(resolve => setTimeout(resolve, 50));
                const scan = await scanWebFiles(files);
                resultTracks = scan.tracks;
                resultMetadata = scan.metadata;
            }

            if (resultMetadata) onMetadataLoaded(resultMetadata);
            setAllTracks(resultTracks);
            
            if (resultTracks.length > 0) {
                onUploadSuccess();
            } else if (!Capacitor.isNativePlatform() || nativeRootPathRef.current) {
                alert("No audio files found.");
            }

        } catch (err) {
            console.error("Upload error:", err);
        } finally {
            setIsLoading(false);
        }
    };

    return {
        allTracks,
        setAllTracks,
        isLoading,
        nativeRootPath: nativeRootPathRef.current,
        handleDirectoryUpload
    };
};