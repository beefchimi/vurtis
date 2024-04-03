import {useCallback, useEffect, useState} from 'react';
import {useMounted, useTimeout} from './hooks';

// This hook is an opinionated "throttle" for `vurt` changes.
// The idea is that you will feed this hook a value such as
// `listWidth` or `itemHeight`. Upon receiving a new value,
// the `pending` state will become `true` and the timer will
// begin counting down before returning to `false`. This is
// useful for when you need to perform a side-effect to
// virtual container/item changes. A common use-case for
// this throttling layout animations during resize operations.
// This may be necessary to avoid very aggresive re-renders.

export const VURTTLE_DURATION = 200;

export function useVurttle(vurtValue = 0) {
  const isMounted = useMounted();
  const [pending, setPending] = useState(false);

  const handleReset = useCallback(() => {
    setPending(false);
  }, []);

  useEffect(() => {
    if (isMounted() && !pending && vurtValue) {
      setPending(true);
    }
  }, [isMounted, vurtValue]);

  useTimeout(handleReset, {
    duration: VURTTLE_DURATION,
    disabled: !isMounted() || !pending,
  });

  return pending;
}
