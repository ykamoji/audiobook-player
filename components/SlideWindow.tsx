import { animated, useSpring } from "@react-spring/web";
import { useDrag } from "@use-gesture/react";
import { useEffect, useState, ReactNode, FC } from "react";

type Side = "bottom" | "right" | "left" | "auto";

interface SlideWindowProps {
    open: boolean;
    onClose: () => void;
    side?: Side;    // ← now supports "auto"
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

    // -----------------------------
    // ORIENTATION STATE
    // -----------------------------
    const getOrientation = () =>
        window.innerWidth < window.innerHeight ? "portrait" : "landscape";

    const [orientation, setOrientation] = useState(getOrientation());

    useEffect(() => {
        const handler = () => setOrientation(getOrientation());
        window.addEventListener("resize", handler);
        window.addEventListener("orientationchange", handler);
        return () => {
            window.removeEventListener("resize", handler);
            window.removeEventListener("orientationchange", handler);
        };
    }, []);

    // Auto-side logic
    const resolvedSide =
        side === "auto"
            ? orientation === "portrait"
                ? "left"
                : "bottom"
            : side;

    // -----------------------------
    // DIMENSIONS
    // -----------------------------
    const sheetSize =
        resolvedSide === "bottom"
            ? (typeof height === "string"
                ? window.innerHeight * (parseInt(height) / 100)
                : height)
            : (typeof width === "string"
                ? window.innerWidth * (parseInt(width) / 100)
                : width);

    // -----------------------------
    // SPRING
    // -----------------------------
    const [{ pos }, api] = useSpring(() => ({
        pos: sheetSize,
        config: { tension: 500, friction: 40 }
    }));

    useEffect(() => {
        api.start({ pos: open ? 0 : sheetSize });
    }, [open, sheetSize]);

    // -----------------------------
    // GESTURE
    // -----------------------------
    const bind = useDrag(
        ({ last, movement: [mx, my], velocity: [vx, vy], cancel }) => {
            let dragValue = 0;
            let isFlick = false;
            let isPulled = false;

            // Bottom Sheet
            if (resolvedSide === "bottom") {
                if (my < 0) return cancel();
                dragValue = my;
                isFlick = vy > 0.5;
                isPulled = my > sheetSize * 0.25;
            }

            // Right Sheet
            if (resolvedSide === "right") {
                if (mx < 0) return cancel();
                dragValue = mx;
                isFlick = vx > 0.5;
                isPulled = mx > sheetSize * 0.25;
            }

            // Left Sheet
            if (resolvedSide === "left") {
                if (mx > 0) return cancel(); // dragging right should not move sheet
                dragValue = Math.abs(mx);
                isFlick = vx < -0.5;
                isPulled = dragValue > sheetSize * 0.25;
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
            rubberband: false
        }
    );

    // -----------------------------
    // TRANSFORM
    // -----------------------------
    const style =
        resolvedSide === "bottom"
            ? { transform: pos.to((v) => `translateY(${v}px)`) }
            : resolvedSide === "right"
            ? { transform: pos.to((v) => `translateX(${v}px)`) }
            : { transform: pos.to((v) => `translateX(${-v}px)`) }; // left drawer

    // -----------------------------
    // POSITIONING CLASSES
    // -----------------------------
    const baseClass =
        resolvedSide === "bottom"
            ? "fixed left-0 right-0 bottom-0"
            : resolvedSide === "right"
            ? "fixed top-0 bottom-0 right-0"
            : "fixed top-0 bottom-0 left-0";

    return (
        <animated.div
            {...bind()}
            style={{
                ...style,
                height: resolvedSide === "bottom" ? height : "100%",
                width: resolvedSide !== "bottom" ? width : "100%",
                touchAction: "none",
                zIndex: 100
            }}
            className={`${baseClass} bg-[#1a1a1a] border-white/10 overflow-hidden ${className}`}
        >
            {children}
        </animated.div>
    );
};