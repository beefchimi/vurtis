import {useCallback, useRef, useState} from 'react';

import {useIsoEffect} from './useIsoEffect';
import {
  useResizeObserver,
  type ResizeObserverOptions,
} from './useResizeObserver';
import {useWindowScroll} from './useWindowScroll';

interface RectSubset {
  top: number;
  right: number;
  bottom: number;
  left: number;
  width: number;
  height: number;
}

export interface ElementRectOptions {
  forceReconnect?: ResizeObserverOptions['forceReconnect'];
  round?: boolean;
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

export function useElementRect({
  forceReconnect = 0,
  round = false,
}: ElementRectOptions) {
  const ref = useRef<HTMLElement | null>(null);
  const [rect, setRect] = useState<RectSubset>(INITIAL_RECT);

  const updateRect = useCallback(
    (element?: HTMLElement | null) => {
      if (!element) {
        setRect(INITIAL_RECT);
        return;
      }

      const domRect = element.getBoundingClientRect();
      ref.current = element;

      setRect(extractRectSubset(domRect, round));
    },
    [round],
  );

  const {
    scrollX,
    scrollY,
    visibleWidth: windowWidth,
    visibleHeight: windowHeight,
  } = useWindowScroll({
    updateStrategy: 'aggressive',
  });

  const {observerRef} = useResizeObserver({
    ref,
    forceReconnect,
    onResize: () => {
      updateRect(ref.current);
    },
  });

  useIsoEffect(() => {
    updateRect(ref.current);
  }, [updateRect, scrollX, scrollY, windowWidth, windowHeight]);

  return {
    ref,
    updateRect,
    observerRef,
    // Destructuring the `rect` as an alternative to memoizing the object.
    ...rect,
    // Returning some of our `window` values as they could
    // be useful to consumers.
    scrollX,
    scrollY,
    windowWidth,
    windowHeight,
  };
}
