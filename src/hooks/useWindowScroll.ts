import {useState} from 'react';
import {supportDom} from 'beeftools';

import {useIsoEffect} from './useIsoEffect';
import {useWindowEvent} from './useWindowEvent';
import {
  useWindowSize,
  measureWindow,
  type WindowSizeData,
} from './useWindowSize';

type WindowScrollFn = (event: Event) => void;

type WindowSizeSubset = Pick<
  WindowSizeData,
  | 'scrollWidth'
  | 'scrollHeight'
  | 'minViewWidth'
  | 'minViewHeight'
  | 'offscreenWidth'
  | 'offscreenHeight'
  | 'scrollbarSizeX'
  | 'scrollbarSizeY'
>;

// Consider `boolean` values for `overscroll top/bottom/left/right`.
export interface WindowScrollData {
  scrollX: number;
  scrollY: number;
  scrollWidth: WindowSizeData['scrollWidth'];
  scrollHeight: WindowSizeData['scrollHeight'];
  visibleWidth: WindowSizeData['minViewWidth'];
  visibleHeight: WindowSizeData['minViewHeight'];
  scrollableDistanceX: number;
  scrollableDistanceY: number;
  scrollableX: boolean;
  scrollableY: boolean;
  scrollbarVisibleX: boolean;
  scrollbarVisibleY: boolean;
  atStartX: boolean;
  atEndX: boolean;
  atStartY: boolean;
  atEndY: boolean;
}

export interface WindowScrollOptions {
  // TODO: Accept a `debounceMs = 0` argument.
  updateStrategy?: 'lazy' | 'aggressive';
  onScroll?: WindowScrollFn;
}

const DEFAULT_SCROLL: WindowScrollData = {
  scrollX: 0,
  scrollY: 0,
  scrollWidth: 0,
  scrollHeight: 0,
  visibleWidth: 0,
  visibleHeight: 0,
  scrollableDistanceX: 0,
  scrollableDistanceY: 0,
  scrollableX: false,
  scrollableY: false,
  scrollbarVisibleX: false,
  scrollbarVisibleY: false,
  atStartX: true,
  atEndX: true,
  atStartY: true,
  atEndY: true,
};

// Does it make sense to cache this here?
const IS_CLIENT = supportDom();

export function measureScroll(windowSize?: WindowSizeSubset): WindowScrollData {
  // We might prefer to return the last "client measurement" instead.
  if (!IS_CLIENT) return DEFAULT_SCROLL;

  const {
    scrollWidth,
    scrollHeight,
    minViewWidth,
    minViewHeight,
    offscreenWidth,
    offscreenHeight,
    scrollbarSizeX,
    scrollbarSizeY,
  } = windowSize ?? measureWindow();

  const {scrollX, scrollY} = window;

  return {
    scrollX,
    scrollY,
    scrollWidth,
    scrollHeight,
    visibleWidth: minViewWidth,
    visibleHeight: minViewHeight,
    scrollableDistanceX: offscreenWidth,
    scrollableDistanceY: offscreenHeight,
    scrollableX: Boolean(offscreenWidth),
    scrollableY: Boolean(offscreenHeight),
    scrollbarVisibleX: Boolean(scrollbarSizeX),
    scrollbarVisibleY: Boolean(scrollbarSizeY),
    atStartX: scrollX <= 0,
    atEndX: scrollX >= offscreenWidth,
    atStartY: scrollY <= 0,
    atEndY: scrollY >= offscreenHeight,
  };
}

export function useWindowScroll(options: WindowScrollOptions = {}) {
  const {updateStrategy = 'lazy', onScroll} = options;

  // TODO: We might prefer to initialize with `measureScroll` instead.
  const [scroll, setScroll] = useState(DEFAULT_SCROLL);

  const {
    scrollWidth,
    scrollHeight,
    minViewWidth,
    minViewHeight,
    offscreenWidth,
    offscreenHeight,
    scrollbarSizeX,
    scrollbarSizeY,
  } = useWindowSize({updateStrategy});

  function remeasure() {
    if (!IS_CLIENT) return scroll;

    const newScroll = measureScroll({
      scrollWidth,
      scrollHeight,
      minViewWidth,
      minViewHeight,
      offscreenWidth,
      offscreenHeight,
      scrollbarSizeX,
      scrollbarSizeY,
    });

    setScroll(newScroll);

    return newScroll;
  }

  function handleScroll(event: Event) {
    remeasure();
    onScroll?.(event);
  }

  // Would performance improve with an `intersectionObserver`?
  useWindowEvent('scroll', handleScroll);

  // TODO: Is setting `scroll` at the first client-side load necessary?
  // Would we achieve the same thing by calling `measureScroll` in `useState()`?
  useIsoEffect(() => {
    remeasure();
  }, []);

  // Without `aggressive`, updated window measurements will not
  // take effect until the next "scroll event" is triggered.
  useIsoEffect(() => {
    if (updateStrategy === 'aggressive') remeasure();
  }, [
    scrollWidth,
    scrollHeight,
    minViewWidth,
    minViewHeight,
    offscreenWidth,
    offscreenHeight,
    scrollbarSizeX,
    scrollbarSizeY,
  ]);

  // Consumer's can call `remeasure()` manually when they
  // suspect the changed has occured that would otherwise
  // not be reported by the window scroll event.
  return {
    ...scroll,
    remeasure,
  };
}
