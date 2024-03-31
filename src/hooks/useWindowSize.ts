import {useRef, useState} from 'react';
import {supportDom} from 'beeftools';

import {useResizeObserver} from './useResizeObserver';
import {useIsoEffect} from './useIsoEffect';
import {useWindowEvent} from './useWindowEvent';

type WindowResizeFn = (event: Event) => void;

export interface WindowSizeData {
  scrollWidth: number;
  scrollHeight: number;
  minViewWidth: number;
  minViewHeight: number;
  maxViewWidth: number;
  maxViewHeight: number;
  offscreenWidth: number;
  offscreenHeight: number;
  scrollbarSizeX: number;
  scrollbarSizeY: number;
}

const DEFAULT_SIZE: WindowSizeData = {
  scrollWidth: 0,
  scrollHeight: 0,
  minViewWidth: 0,
  minViewHeight: 0,
  maxViewWidth: 0,
  maxViewHeight: 0,
  offscreenWidth: 0,
  offscreenHeight: 0,
  scrollbarSizeX: 0,
  scrollbarSizeY: 0,
};

const IS_CLIENT = supportDom();

export function measureWindow() {
  // We might prefer to return the last "client measurement" instead.
  if (!IS_CLIENT) return DEFAULT_SIZE;

  const {
    scrollWidth,
    scrollHeight,
    clientWidth: minViewWidth,
    clientHeight: minViewHeight,
  } = document.documentElement;

  const {innerWidth: maxViewWidth, innerHeight: maxViewHeight} = window;

  // Could otherwise be referred to as "scrollable distance".
  // In the future, we might consider a "before/after" amount.
  const offscreenWidth = scrollWidth - minViewWidth;
  const offscreenHeight = scrollHeight - minViewHeight;

  const scrollbarSizeX = maxViewWidth - minViewWidth;
  const scrollbarSizeY = maxViewHeight - minViewHeight;

  return {
    scrollWidth,
    scrollHeight,
    minViewWidth,
    minViewHeight,
    maxViewWidth,
    maxViewHeight,
    offscreenWidth,
    offscreenHeight,
    scrollbarSizeX,
    scrollbarSizeY,
  };
}

export interface WindowSizeOptions {
  // TODO: Accept a `debounceMs = 0` argument... but we would need
  // the event to fire first before waiting to fire again. Otherwise,
  // we would delay reporting document content changes.
  updateStrategy?: 'lazy' | 'aggressive';
  onResize?: WindowResizeFn;
}

export function useWindowSize(options: WindowSizeOptions = {}) {
  const {updateStrategy = 'lazy', onResize} = options;

  const docRef = useRef<HTMLElement | null>(null);
  // TODO: We might prefer to initialize with `measureWindow` instead.
  const [size, setSize] = useState(DEFAULT_SIZE);

  useIsoEffect(() => {
    if (updateStrategy === 'lazy' && docRef.current) {
      docRef.current = null;
    } else if (
      IS_CLIENT &&
      updateStrategy === 'aggressive' &&
      !docRef.current
    ) {
      docRef.current = document.documentElement;
    }
  }, [updateStrategy]);

  function remeasure() {
    if (!IS_CLIENT) return size;

    const newSize = measureWindow();
    setSize(newSize);

    return newSize;
  }

  function handleResize(event: Event) {
    remeasure();
    onResize?.(event);
  }

  useWindowEvent('resize', handleResize);

  // Required in order to capture document size changes that occur
  // from content changes. This is only registered if `aggressive`.
  useResizeObserver({
    ref: docRef,
    // Calling `remeasure()` is required in order to re-capture all of the
    // necessary data points. The resized entry data will not suffice.
    onResize: () => remeasure(),
  });

  // TODO: Is setting `size` at the first client-side load necessary?
  // Would we achieve the same thing by calling `measureWindow` in `useState()`?
  useIsoEffect(() => {
    remeasure();
  }, []);

  // Consumer's can call `remeasure()` manually when they know
  // the DOM has changed / elements have resized / etc.
  return {
    ...size,
    remeasure,
  };
}
