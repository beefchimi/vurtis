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

function extractRectSubset(
  {top, right, bottom, left, width, height}: DOMRect,
  round = false,
) {
  return {
    top: round ? Math.round(top) : top,
    right: round ? Math.round(right) : right,
    bottom: round ? Math.round(bottom) : bottom,
    left: round ? Math.round(left) : left,
    width: round ? Math.round(width) : width,
    height: round ? Math.round(height) : height,
  };
}

// TODO: Do we want to create and provide the `ref`,
// or accept it as an option?
export function useElementRect(round = false) {
  const ref = useRef<HTMLElement>(null);
  const [rect, setRect] = useState<RectSubset>(INITIAL_RECT);

  const updateRect = useCallback(() => {
    if (!ref.current) return;

    const domRect = ref.current.getBoundingClientRect();
    setRect(extractRectSubset(domRect, round));
  }, [round]);

  const {scrollX, scrollY, visibleWidth, visibleHeight} = useWindowScroll({
    updateStrategy: 'aggressive',
  });

  useResizeObserver({ref, onResize: updateRect});

  useIsoEffect(() => {
    updateRect();
  }, [updateRect, scrollX, scrollY, visibleWidth, visibleHeight]);

  return {
    ref,
    updateRect,
    // Destructuring the `rect` as an alternative to memoizing the object.
    ...rect,
  };
}
