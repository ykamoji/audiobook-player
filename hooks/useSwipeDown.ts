import { RefObject } from "react";
import { useSpring } from "@react-spring/web";
import { useDrag } from "@use-gesture/react";

export function useSwipeDown(onClose: () => void, scrollRef: RefObject<HTMLElement>, threshold = 120) {
  const [{ y }, api] = useSpring(() => ({
    y: 0,
    config: { tension: 120, friction: 30, mass: 1.5 }
  }));

  const bind = useDrag(
    ({ last, movement: [, my], velocity: [, vy], cancel, event, first }) => {

      const scrollEl = scrollRef.current;
      const target = event.target as HTMLElement;

      const startedInsideScroll = scrollEl && scrollEl.contains(target);

      if (first && startedInsideScroll && scrollEl!.scrollTop > 0) {
        return cancel();
      }

      if (my < 0) return cancel();

      if (!last) {
        api.start({ y: my, immediate: true });
        return;
      }

      const shouldClose = my > threshold || vy > 0.5;

      if (shouldClose) {
        api.start({
          y: window.innerHeight,
          config: {
            duration: 500,
            easing: t => 1 - Math.pow(1 - t, 3)
          },
          onRest: () => {
            onClose();
          }
        });
      } else {
        api.start({ y: 0 });
      }
    },
    { from: () => [0, y.get()] }
  );

  return { bind, y, api };
}
