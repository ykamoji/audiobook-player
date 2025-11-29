
import React from 'react';
import { XIcon } from './Icons';
import { formatBytes, formatDate, formatDuration } from '../utils/formatting';

export interface MetadataPanelData {
  name: string;
  fileSize: number;
  lastModified: number;
  duration: number;
  associatedPlaylists?: string[];
}

interface MetadataPanelProps {
  data: MetadataPanelData | null;
  onClose: () => void;
}

export const MetadataPanel: React.FC<MetadataPanelProps> = ({ data, onClose }) => {
  return (
    <>
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 bg-black/50 z-40 transition-opacity duration-300 ${data ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />
      
      {/* Panel */}
      <div 
        className={`fixed top-0 right-0 bottom-0 w-80 bg-[#1a1a1a] shadow-2xl z-50 transform transition-transform duration-300 ease-in-out border-l border-white/10 p-6 flex flex-col ${data ? 'translate-x-0' : 'translate-x-full'}`}
      >
          <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl font-bold text-white">Metadata</h2>
              <button onClick={onClose} className="text-gray-400 hover:text-white">
                  <XIcon className="w-6 h-6" />
              </button>
          </div>
          
          {data && (
            <div className="space-y-6 text-sm">
                <div className="pb-4 border-b border-white/5">
                    <span className="block text-audible-orange font-medium mb-1 uppercase text-xs tracking-wider">File Name</span>
                    <span className="text-gray-200 break-all">{data.name || '-'}</span>
                </div>

                {data.associatedPlaylists && data.associatedPlaylists.length > 0 && (
                    <div className="pb-4 border-b border-white/5">
                        <span className="block text-audible-orange font-medium mb-1 uppercase text-xs tracking-wider">Playlists</span>
                        <div className="flex flex-wrap gap-2 mt-2">
                            {data.associatedPlaylists.map((playlist, index) => (
                                <span key={index} className="text-xs bg-white/10 text-gray-300 px-2 py-1 rounded-md border border-white/5">
                                    {playlist}
                                </span>
                            ))}
                        </div>
                    </div>
                )}
                
                <div className="pb-4 border-b border-white/5">
                    <span className="block text-audible-orange font-medium mb-1 uppercase text-xs tracking-wider">Duration</span>
                    <span className="text-gray-200">{formatDuration(data.duration)}</span>
                </div>

                <div className="pb-4 border-b border-white/5">
                    <span className="block text-audible-orange font-medium mb-1 uppercase text-xs tracking-wider">File Size</span>
                    <span className="text-gray-200">{formatBytes(data.fileSize || 0)}</span>
                </div>

                <div className="pb-4 border-b border-white/5">
                    <span className="block text-audible-orange font-medium mb-1 uppercase text-xs tracking-wider">Last Modified</span>
                    <span className="text-gray-200">{formatDate(data.lastModified || 0)}</span>
                </div>
            </div>
          )}
      </div>
    </>
  );
};
