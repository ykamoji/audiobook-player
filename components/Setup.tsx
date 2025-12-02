
import React, { useRef } from 'react';
import { FolderIcon, HeadphoneIcon, LibraryIcon } from './Icons';
import { Capacitor } from '@capacitor/core';

interface SetupProps {
  onDirectoryUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isLoading: boolean;
  onContinueToLibrary?: () => void;
  hasExistingLibrary?: boolean;
}

export const Setup: React.FC<SetupProps> = ({ 
  onDirectoryUpload,
  isLoading,
  onContinueToLibrary,
  hasExistingLibrary
}) => {
  const directoryInputRef = useRef<HTMLInputElement>(null);

  const handleUploadClick = () => {
      if (Capacitor.isNativePlatform()) {
          // On Native, we trigger the handler directly.
          // App.tsx handles the specific FilePicker logic for native platforms.
          // We pass a dummy event object because the handler expects one, 
          // but the native logic in App.tsx ignores it.
          onDirectoryUpload({} as any);
      } else {
          // On Web, we trigger the hidden input
          directoryInputRef.current?.click();
      }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 max-w-md mx-auto animate-fade-in bg-audible-bg">
      <div className="mb-12 text-center flex flex-col items-center">
        <HeadphoneIcon className="w-16 h-16 mb-6 text-audible-orange" />
        <h1 className="text-4xl font-bold tracking-tight mb-2 text-white">
          Audiobook Player
        </h1>
      </div>

      <div className="w-full space-y-4">
        {/* Directory Upload */}
        <div 
          onClick={handleUploadClick}
          className="
            relative overflow-hidden group cursor-pointer
            p-8 border-audible-separator 
            transition-all duration-300
          "
        >
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="p-4 rounded-full no bg-audible-orange/10 text-audible-orange group-hover:scale-110 transition-transform duration-300">
              <FolderIcon className="w-10 h-10" />
            </div>
            <div>
              <h3 className="font-semibold text-xl text-white">
                Start Syncing
              </h3>
              {isLoading && (
                <p className="text-sm text-gray-400 mt-1">
                  Scanning files...
                </p>
              )}
            </div>
          </div>
          <input 
            type="file" 
            ref={directoryInputRef} 
            onChange={onDirectoryUpload} 
            // @ts-ignore - webkitdirectory is standard in modern browsers but not in basic HTML types
            webkitdirectory="" 
            directory="" 
            multiple
            className="hidden" 
          />
        </div>

        {/* Continue to Library Button - Always Visible */}
        <div 
        onClick={onContinueToLibrary}
        className="
            group cursor-pointer p-6 rounded-2xl
            transition-all duration-300 flex items-center justify-center gap-4
        "
        >
        <div className="flex flex-col items-center gap-4 text-center">
            <div className="p-4 rounded-full no bg-audible-orange/10 group-hover:scale-110 transition-transform duration-300">
                <LibraryIcon className="w-10 h-10 text-audible-orange" />
            </div>
            <h3 className="font-semibold text-xl text-white">Library</h3>
        </div>
        </div>
      </div>
    </div>
  );
};
