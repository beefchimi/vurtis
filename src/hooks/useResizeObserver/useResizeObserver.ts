import {useRef, useState, type RefObject} from 'react';
import {supportResizeObserver} from 'beeftools';

import {useIsoEffect} from '../useIsoEffect';
import {useMounted} from '../useMounted';

import type {ResizeKebabBox} from './types';
import {convertKebabToCamel, extractSize} from './utilities';

interface Size {
  width: number;
  height: number;
}

// TODO: Consider a `round?: boolean;` option that would help
// restrict the resizes to whole numbers.
export interface ResizeObserverOptions<T extends HTMLElement = HTMLElement> {
  ref: RefObject<T>;
  box?: ResizeKebabBox;
  // In case you need to `disconnect/re-connect` the observer,
  // perhaps because you are re-using a `ref` for different `nodes`,
  // you can increment the `forceReconnect` prop.
  forceReconnect?: number;
  onResize?: (size: Size) => void;
}

const initialSize: Size = {
  width: 0,
  height: 0,
};

// NOTE: Using this custom hook over the `use-resize-observer` dependency
// as there was an issue with: "This expression is not callable".

// This hook is designed to return a `width/height` state by default.
// However, if you choose to pass a `onResize` callback, the state
// will be bypassed in favour of sending `width/height` updates via
// the `onResize` callback. This helps avoid double re-renders.
export function useResizeObserver<T extends HTMLElement = HTMLElement>({
  ref,
  box = 'border-box',
  forceReconnect = 0,
  onResize,
}: ResizeObserverOptions<T>): Size {
  const [{width, height}, setSize] = useState<Size>(initialSize);

  const previousSize = useRef<Size>({...initialSize});
  const onResizeRef = useRef<((size: Size) => void) | undefined>(onResize);

  const isMounted = useMounted();

  useIsoEffect(() => {
    if (!ref.current || !supportResizeObserver()) return;

    const observer = new ResizeObserver(([entry]) => {
      const camelBox = convertKebabToCamel(box);

      const newWidth = extractSize(entry, camelBox, 'inlineSize');
      const newHeight = extractSize(entry, camelBox, 'blockSize');

      const hasChanged =
        previousSize.current.width !== newWidth ||
        previousSize.current.height !== newHeight;

      if (hasChanged) {
        const newSize: Size = {width: newWidth, height: newHeight};

        previousSize.current.width = newWidth;
        previousSize.current.height = newHeight;

        if (onResizeRef.current) {
          onResizeRef.current(newSize);
        } else {
          if (isMounted()) setSize(newSize);
        }
      }
    });

    observer.observe(ref.current, {box});

    return () => {
      observer.disconnect();
    };
  }, [box, ref, forceReconnect, isMounted]);

  return {width, height};
}
