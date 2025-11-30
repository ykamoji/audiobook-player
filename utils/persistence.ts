
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Capacitor } from '@capacitor/core';
import { AppData } from '../types';

export const saveToNativeFilesystem = async (data: AppData, rootPath?: string) => {
    if (!Capacitor.isNativePlatform()) return;
    try {
        const path = rootPath ? `${rootPath}/metadata.json` : 'metadata.json';
        const options = rootPath 
            ? { path, data: JSON.stringify(data, null, 2), encoding: Encoding.UTF8 }
            : { path: 'metadata.json', data: JSON.stringify(data, null, 2), directory: Directory.Documents, encoding: Encoding.UTF8 };

        await Filesystem.writeFile(options);
        console.log('Saved metadata to filesystem');
    } catch (e) {
        console.error('Error saving to filesystem', e);
    }
};

export const loadInitialNativeMetadata = async (): Promise<AppData | null> => {
    if (!Capacitor.isNativePlatform()) return null;
    try {
        const result = await Filesystem.readFile({
            path: 'metadata.json',
            directory: Directory.Documents,
            encoding: Encoding.UTF8,
        });
        
        const text = typeof result.data === 'string' ? result.data : JSON.stringify(result.data);
        return JSON.parse(text);
    } catch (e) {
        // Metadata might not exist yet, which is fine
        return null;
    }
};

export const readNativeTextFile = async (path: string): Promise<string> => {
    try {
        const result = await Filesystem.readFile({
            path,
            encoding: Encoding.UTF8
        });
        return typeof result.data === 'string' ? result.data : JSON.stringify(result.data);
    } catch (error) {
        console.error("Failed to read native text file", error);
        throw error;
    }
};

export const downloadWebMetadata = (data: AppData) => {
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = "metadata.json";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
};
