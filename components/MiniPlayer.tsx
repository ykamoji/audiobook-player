import React from "react";
import {PauseIcon, PlayIcon} from "./Icons.tsx";

interface MiniProps{
    coverUrl:string,
    name:string,
    audioUrl?:string,
    isPlaying:boolean,
    onTogglePlay:() => void
    onOpen:() => void
}

export const MiniPlayer: React.FC<MiniProps> = ({ coverUrl, name, audioUrl, isPlaying, onTogglePlay, onOpen}) => {

    return (
        <div className={"flex flex-1 justify-between ps-3 pt-1 gap-x-4 min-w-0 bg-audible-orange bg-opacity-50"} onClick={onOpen}>
            <div className={"flex w-12 pb-1"}>
                <div className="h-[100%] aspect-[1/1] overflow-hidden">
                    <img
                        src={coverUrl}
                        alt={name}
                        className="w-full h-full object-cover"
                    />
                </div>
            </div>
            <div className="flex flex-1 min-w-0 font-weight-lighter text-base leading-snug text-white">
                <div className={"mt-3 truncate"}>
                    {name}
                </div>
            </div>
            <div className={"flex flex-shrink-0 pe-5 items-center"}>
                <button
                   onClick={(e) => {
                      e.stopPropagation();
                      onTogglePlay();
                    }}
                    className="flex text-orange-100 items-center justify-center transition-all shadow-audible-orange/10">
                    {isPlaying ? <PauseIcon className="w-8 h-8"/> : <PlayIcon className="w-8 h-8 ml-0"/>}
                </button>
            </div>
        </div>
    );
}