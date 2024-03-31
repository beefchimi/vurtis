import {useEffect, useRef} from 'react';
import {useIsoEffect} from './useIsoEffect';

export type WindowEventName = keyof WindowEventMap;
export type WindowEventFn = (event: WindowEventMap[WindowEventName]) => void;

export function useWindowEvent(
  eventName: WindowEventName,
  callback: WindowEventFn,
  options?: boolean | AddEventListenerOptions,
) {
  const callbackRef = useRef(callback);

  useIsoEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!window?.addEventListener) return;

    const listener: WindowEventFn = (event) => {
      callbackRef.current(event);
    };

    window.addEventListener(eventName, listener, options);

    return () => {
      window.removeEventListener(eventName, listener, options);
    };
  }, [eventName, options]);
}
