import { animated, useSpring } from "@react-spring/web";
import { useDrag } from "@use-gesture/react";
import { useEffect, ReactNode, FC } from "react";

type Side = "bottom" | "right";

interface SlideWindowProps {
    open: boolean;
    onClose: () => void;
    side?: Side;
    width?: number | string;
    height?: number | string;
    children: ReactNode;
    className?: string;
}

export const SlideWindow: FC<SlideWindowProps> = ({
    open,
    onClose,
    side = "bottom",
    width = "70dvw",
    height = "70dvh",
    children,
    className = ""
}) => {

    const sheetSize =
        side === "bottom"
            ? (typeof height === "string"
                ? window.innerHeight * (parseInt(height) / 100)
                : height)
            : (typeof width === "string"
                ? window.innerWidth * (parseInt(width) / 100)
                : width);

    // Spring controls the sheet position
    const [{ pos }, api] = useSpring(() => ({
        pos: sheetSize,
        config: { tension: 500, friction: 40 }
    }));

    // Open/close animation
    useEffect(() => {
        api.start({ pos: open ? 0 : sheetSize });
    }, [open]);

    // Gesture Logic
    const bind = useDrag(
        ({ last, movement: [mx, my], velocity: [vx, vy], cancel }) => {
            let dragValue = 0;
            let isFlick = false;
            let isPulled = false;

            // BOTTOM SHEET DRAG
            if (side === "bottom") {
                if (my < 0) return cancel();
                dragValue = my;
                isFlick = vy > 0.5;
                isPulled = my > sheetSize * 0.25;
            }

            // RIGHT SHEET DRAG
            if (side === "right") {
                if (mx < 0) return cancel();
                dragValue = mx;
                isFlick = vx > 0.5;
                isPulled = mx > sheetSize * 0.25;
            }

            if (!last) {
                api.start({ pos: dragValue, immediate: true });
            } else {
                if (isFlick || isPulled) onClose();
                else api.start({ pos: 0 });
            }
        },
        {
            from: () => [0, pos.get()],
            bounds: { top: 0 },
            rubberband: false
        }
    );

    // Positioning
    const style =
        side === "bottom"
            ? { transform: pos.to((v) => `translateY(${v}px)`) }
            : { transform: pos.to((v) => `translateX(${v}px)`) };

    const baseClass =
        side === "bottom"
            ? "fixed left-0 right-0 bottom-0"
            : "fixed top-0 bottom-0 right-0";

    return (
        <animated.div
            {...bind()}
            style={{...style,
                height: side === "bottom" ? height : "100%",
            width: side === "right" ? width : "100%",
        }}
            className={`${baseClass} z-50 border-white/10 bg-[#1a1a1a] overflow-hidden ${className}`}
        >
            {children}
        </animated.div>
    );
};