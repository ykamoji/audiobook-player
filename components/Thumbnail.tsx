import React, { useState, useRef, useEffect } from 'react';
import {Capacitor} from "@capacitor/core";

interface ThumbnailProps {
  file: File;
}

export const Thumbnail: React.FC<ThumbnailProps> = ({ file }) => {
    const [layers, setLayers] = useState<{ url: string; id: string }[]>([]);
    const urlsRef = useRef<Set<string>>(new Set());

    useEffect(() => {

  if (!file) return;

  let url: string;

  async function load() {

    if (typeof file === "string") {
      // iOS native path → convert using Filesystem
      // const cleanPath = decodeURIComponent(file);

      url = Capacitor.convertFileSrc(file);
      urlsRef.current.add(url);
    } else {
      // Browser file object
      url = URL.createObjectURL(file);
      urlsRef.current.add(url);
    }

    const id = crypto.randomUUID();

    setLayers(prev => {
      const last = prev[prev.length - 1];
      return last ? [last, { url, id }] : [{ url, id }];
    });

    // Cleanup transition
    const timeout = setTimeout(() => {
      setLayers(prev => {
        if (prev.length > 1) {
          const old = prev[0];
          if (urlsRef.current.has(old.url)) {
            URL.revokeObjectURL(old.url);
            urlsRef.current.delete(old.url);
          }
          return [prev[1]];
        }
        return prev;
      });
    }, 1000);

    return () => clearTimeout(timeout);
  }

  load();
}, [file]);

    // Initial loading state
    if (layers.length === 0) return <div className="w-full h-full bg-gray-800 animate-pulse" />;

    return (
        <div className="relative w-full h-full bg-gray-800 overflow-hidden">
             <style>{`
                @keyframes smoothFadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                .animate-smooth-fade {
                    animation: smoothFadeIn 1s ease-in-out forwards;
                }
             `}</style>
             {layers.map((layer, index) => {
                 const isLast = index === layers.length - 1;
                 const animate = layers.length > 1 && isLast;
                 
                 return (
                     <img 
                        key={layer.id}
                        src={layer.url}
                        alt="Cover"
                        className={`absolute inset-0 w-full h-full object-cover ${animate ? 'animate-smooth-fade' : ''}`}
                     />
                 )
             })}
        </div>
    );
};