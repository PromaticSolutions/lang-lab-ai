import { useEffect, useState } from 'react';

/**
 * Uses the Visual Viewport API to return the actual visible height,
 * accounting for mobile keyboards. Falls back to window.innerHeight.
 */
export function useViewportHeight() {
  const [height, setHeight] = useState(() =>
    typeof window !== 'undefined'
      ? window.visualViewport?.height ?? window.innerHeight
      : 800
  );

  useEffect(() => {
    const vv = window.visualViewport;

    const update = () => {
      setHeight(vv?.height ?? window.innerHeight);
    };

    if (vv) {
      vv.addEventListener('resize', update);
      vv.addEventListener('scroll', update);
    } else {
      window.addEventListener('resize', update);
    }

    update();

    return () => {
      if (vv) {
        vv.removeEventListener('resize', update);
        vv.removeEventListener('scroll', update);
      } else {
        window.removeEventListener('resize', update);
      }
    };
  }, []);

  return height;
}
