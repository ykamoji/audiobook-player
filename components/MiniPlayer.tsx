import {FC, useMemo, CSSProperties} from "react";
import {MusicIcon, PauseIcon, PlayIcon} from "./Icons.tsx";

interface MiniProps{
    coverUrl:string,
    name:string,
    isPlaying:boolean,
    progress:number,
    onTogglePlay:() => void
    onOpen:() => void
}


export const MiniPlayer: FC<MiniProps> = ({ coverUrl, name, isPlaying, onTogglePlay, onOpen, progress}) => {

    const colorMap = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("colorMap") || "{}");
    } catch {
      return {};
    }
  }, []);

    let bgStyle: CSSProperties = {
    backgroundColor: "rgba(255,131,0,0.60)", // audible-orange with opacity
  };
    if (coverUrl && colorMap) {
        const key = name + ".png";
        if (colorMap[key]) {
          // colorMap[key] should be "r,g,b"
          bgStyle = {
            backgroundColor: `rgba(${colorMap[key]}, 0.65)`
          };
        }
      }

    return (
        <>
            <div className={`flex flex-1 justify-between ps-3 pt-1 gap-x-4 min-w-0`}
                 style={bgStyle}
                 onClick={() => {
                     if (!!coverUrl) onOpen();
                 }}>
                <div className={"flex w-12 pb-1"}>
                    <div className="h-[100%] aspect-[1/1] overflow-hidden">
                        {!!coverUrl ?
                            <img
                                src={coverUrl}
                                alt={name}
                                className="w-full h-full object-cover"
                            /> : <MusicIcon className="w-12 h-12 text-white"/>}
                    </div>
                </div>
                <div className="flex flex-1 min-w-0 font-weight-lighter text-base leading-snug text-white">
                    <div className={"mt-3 truncate"}>
                        {name}
                    </div>
                </div>
                <div className={"flex flex-shrink-0 pe-5 items-center"}>
                    <button
                        disabled={!coverUrl}
                        onClick={(e) => {
                            e.stopPropagation();
                            onTogglePlay();
                        }}
                        className="flex text-orange-100 items-center justify-center transition-all shadow-audible-orange/10">
                        {isPlaying ? <PauseIcon className="w-8 h-8"/> : <PlayIcon className="w-8 h-8 ml-0"/>}
                    </button>
                </div>
            </div>
            <div className={"h-1 absolute left-0 bottom-0 transition-all duration-100 ease-linear bg-audible-orange"}
                 style={{width: `${progress}%`}}>
            </div>
        </>
    );
}