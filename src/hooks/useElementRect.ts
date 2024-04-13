import {useCallback, useRef, useState} from 'react';

import {useIsoEffect} from './useIsoEffect';
import {useResizeObserver} from './useResizeObserver';
import {useWindowScroll} from './useWindowScroll';

interface RectSubset {
  top: number;
  right: number;
  bottom: number;
  left: number;
  width: number;
  height: number;
}

const INITIAL_RECT: RectSubset = {
  top: 0,
  right: 0,
  bottom: 0,
  left: 0,
  width: 0,
  height: 0,
};

// TODO: Do we want to create and provide the `ref`,
// or accept it as an option?
export function useElementRect() {
  const ref = useRef<HTMLElement>(null);
  const [rect, setRect] = useState<RectSubset>(INITIAL_RECT);

  const updateRect = useCallback(() => {
    if (ref.current) {
      setRect(ref.current.getBoundingClientRect());
    }
  }, []);

  const {scrollX, scrollY, visibleWidth, visibleHeight} = useWindowScroll({
    updateStrategy: 'aggressive',
  });

  useResizeObserver({ref, onResize: updateRect});

  useIsoEffect(() => {
    updateRect();
  }, [scrollX, scrollY, visibleWidth, visibleHeight]);

  return {
    ref,
    rect,
    updateRect,
  };
}
