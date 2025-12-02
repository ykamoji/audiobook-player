import React from 'react';
import { Track, Playlist } from '../types';
import { ListIcon } from './Icons';

interface LibraryModalsProps {
  showAddModal: boolean;
  setShowAddModal: (show: boolean) => void;
  showCreatePlaylistModal: boolean;
  setShowCreatePlaylistModal: (show: boolean) => void;
  showRenamePlaylistModal: boolean;
  setShowRenamePlaylistModal: (show: boolean) => void;
  newPlaylistName: string;
  setNewPlaylistName: (name: string) => void;
  createPlaylistName: string;
  setCreatePlaylistName: (name: string) => void;
  renamePlaylistName: string;
  setRenamePlaylistName: (name: string) => void;
  playlists: Playlist[];
  handleCreatePlaylist: () => void;
  handleCreateEmptyPlaylist: () => void;
  handleRenamePlaylist: () => void;
  handleAddToExisting: (playlistId: string) => void;
}

export const LibraryModals: React.FC<LibraryModalsProps> = ({
  showAddModal,
  setShowAddModal,
  showCreatePlaylistModal,
  setShowCreatePlaylistModal,
  showRenamePlaylistModal,
  setShowRenamePlaylistModal,
  newPlaylistName,
  setNewPlaylistName,
  createPlaylistName,
  setCreatePlaylistName,
  renamePlaylistName,
  setRenamePlaylistName,
  playlists,
  handleCreatePlaylist,
  handleCreateEmptyPlaylist,
  handleRenamePlaylist,
  handleAddToExisting
}) => {
  return (
    <>
      {/* Add to Playlist Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-[#2a2a2a] rounded-xl w-full max-w-sm overflow-hidden border border-white/10">
            <div className="p-4 border-b border-white/10 flex justify-between items-center">
              <h3 className="font-bold text-lg">Add to Playlist</h3>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-white">Close</button>
            </div>
            
            <div className="max-h-[60dvh] overflow-y-auto p-2">
               {/* New Playlist Option */}
               <div className="p-2">
                   <input 
                     type="text" 
                     placeholder="New Playlist Name"
                     className="w-full bg-black/20 border border-gray-600 rounded-lg p-3 text-white focus:outline-none focus:border-audible-orange"
                     value={newPlaylistName}
                     onChange={(e) => setNewPlaylistName(e.target.value)}
                   />
                   <button 
                     onClick={handleCreatePlaylist}
                     disabled={!newPlaylistName.trim()}
                     className="w-full mt-2 bg-audible-orange text-black font-bold py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white transition-colors"
                   >
                       Create & Add
                   </button>
               </div>

               {playlists.length > 0 && (
                   <>
                    <div className="px-2 py-2 text-xs font-bold text-gray-500 uppercase tracking-wider">Existing Playlists</div>
                    <div className="space-y-1">
                        {playlists.map(p => (
                            <button 
                                key={p.id}
                                onClick={() => handleAddToExisting(p.id)}
                                className="w-full text-left p-3 hover:bg-white/5 rounded-lg flex items-center gap-3 transition-colors"
                            >
                                <div className="p-2 bg-gray-800 rounded text-gray-400">
                                    <ListIcon className="w-4 h-4" />
                                </div>
                                <span className="font-medium text-gray-200">{p.name}</span>
                                <span className="text-xs text-gray-500 ml-auto">{p.trackNames.length} tracks</span>
                            </button>
                        ))}
                    </div>
                   </>
               )}
            </div>
          </div>
        </div>
      )}

      {/* Create Empty Playlist Modal */}
      {showCreatePlaylistModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-[#2a2a2a] rounded-xl w-full max-w-sm overflow-hidden border border-white/10 p-4">
             <h3 className="font-bold text-lg mb-4">Create New Playlist</h3>
             <input 
                type="text" 
                placeholder="Playlist Name"
                className="w-full bg-black/20 border border-gray-600 rounded-lg p-3 text-white focus:outline-none focus:border-audible-orange mb-4"
                value={createPlaylistName}
                onChange={(e) => setCreatePlaylistName(e.target.value)}
                autoFocus
             />
             <div className="flex gap-3">
                 <button 
                    onClick={() => setShowCreatePlaylistModal(false)}
                    className="flex-1 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 transition-colors"
                 >
                     Cancel
                 </button>
                 <button 
                    onClick={handleCreateEmptyPlaylist}
                    disabled={!createPlaylistName.trim()}
                    className="flex-1 py-2 rounded-lg bg-audible-orange text-black font-bold hover:bg-white transition-colors disabled:opacity-50"
                 >
                     Create
                 </button>
             </div>
          </div>
        </div>
      )}

      {/* Rename Playlist Modal */}
      {showRenamePlaylistModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-[#2a2a2a] rounded-xl w-full max-w-sm overflow-hidden border border-white/10 p-4">
             <h3 className="font-bold text-lg mb-4">Rename Playlist</h3>
             <input 
                type="text" 
                placeholder="New Playlist Name"
                className="w-full bg-black/20 border border-gray-600 rounded-lg p-3 text-white focus:outline-none focus:border-audible-orange mb-4"
                value={renamePlaylistName}
                onChange={(e) => setRenamePlaylistName(e.target.value)}
                autoFocus
             />
             <div className="flex gap-3">
                 <button 
                    onClick={() => setShowRenamePlaylistModal(false)}
                    className="flex-1 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 transition-colors"
                 >
                     Cancel
                 </button>
                 <button 
                    onClick={handleRenamePlaylist}
                    disabled={!renamePlaylistName.trim()}
                    className="flex-1 py-2 rounded-lg bg-audible-orange text-black font-bold hover:bg-white transition-colors disabled:opacity-50"
                 >
                     Update
                 </button>
             </div>
          </div>
        </div>
      )}
    </>
  );
};