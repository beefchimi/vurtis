import {useCallback, useEffect, useState} from 'react';
import {useMounted, useTimeout} from './hooks';

// This hook is an opinionated "throttle" for `vurt` changes.
// The idea is that you will feed this hook a value such as
// `listWidth` or `itemHeight`. Upon receiving a new value,
// the `pending` state will become `true` and the timer will
// begin counting down before returning to `false`. This is
// useful for when you need to perform a side-effect to
// virtual container/item changes. A common use-case is
// throttling layout animations during resize operations.
// If you need an even more aggressive deferral of side-effects,
// you can pass the `debounce` argument which should further
// reduce the number of `pending` changes.

export const VURTTLE_DURATION = 200;

export function useVurttle(vurtValue = 0, debounce = false) {
  const isMounted = useMounted();

  const [pending, setPending] = useState(false);
  const [duration, setDuration] = useState(VURTTLE_DURATION);

  const handleReset = useCallback(() => {
    setPending(false);
  }, []);

  useEffect(() => {
    if (!isMounted() || !vurtValue) return;

    setPending(true);

    // Toggling the `duration` back-and-forth between a
    // different value allows us to reset the `useTimeout()`,
    // turning this hook into a "debounce" vs a "throttle".
    if (debounce) {
      setDuration((current) =>
        current === VURTTLE_DURATION ? VURTTLE_DURATION + 1 : VURTTLE_DURATION,
      );
    }
  }, [isMounted, vurtValue, debounce]);

  useTimeout(handleReset, {
    duration,
    disabled: !isMounted() || !pending,
  });

  return pending;
}
