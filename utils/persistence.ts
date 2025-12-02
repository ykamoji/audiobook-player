import { Filesystem, Encoding } from '@capacitor/filesystem';
import { Preferences } from "@capacitor/preferences";
import { Capacitor } from '@capacitor/core';
import { AppData } from '../types';

export const saveToNativeFilesystem = async (data: AppData, rootPath?: string) => {
    if (!Capacitor.isNativePlatform()) return false;
    try {
        await Preferences.set({
          key: "metadata",
          value: JSON.stringify(data),
        });
        return true
    } catch (e) {
        console.error('Error saving to filesystem', e);
    }
    return false
};

export const loadInitialNativeMetadata = async (): Promise<AppData | null> => {
    if (!Capacitor.isNativePlatform()) return null;
    try {
        const { value } = await Preferences.get({ key: "metadata" });
        if (!value) return null;   // Nothing saved yet
        return JSON.parse(value);
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

    try {
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
        return true
    }
    catch (error) {
        console.error("error exporting", error)
        return false
    }

};
