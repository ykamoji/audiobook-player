import React, { useRef } from 'react';
import { FolderIcon, HeadphoneIcon, ListIcon } from './Icons';

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
          onClick={() => directoryInputRef.current?.click()}
          className="
            relative overflow-hidden group cursor-pointer
            p-8 rounded-xl border border-audible-separator 
            bg-audible-card hover:bg-[#2a2a2a] hover:border-gray-600
            transition-all duration-300 shadow-2xl
          "
        >
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="p-4 rounded-full bg-audible-orange/10 text-audible-orange group-hover:scale-110 transition-transform duration-300">
              <FolderIcon className="w-10 h-10" />
            </div>
            <div>
              <h3 className="font-semibold text-xl text-white">
                Sync Audiobooks
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

        {/* Continue to Library Button */}
        {hasExistingLibrary && onContinueToLibrary && (
          <button 
            onClick={onContinueToLibrary}
            className="w-full p-4 rounded-xl border border-audible-separator bg-[#2a2a2a] hover:bg-[#333] text-white font-semibold transition-colors flex items-center justify-center gap-3 shadow-lg group"
          >
             <div className="p-1 rounded-full bg-gray-700 group-hover:bg-audible-orange group-hover:text-black transition-colors">
                 <ListIcon className="w-4 h-4" />
             </div>
             Back to Library
          </button>
        )}
      </div>
    </div>
  );
};