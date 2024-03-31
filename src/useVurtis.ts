import {useCallback, useMemo, useRef, useState} from 'react';
import {arrayOfLength, clamp} from 'beeftools';

import {useIsoEffect, useResizeObserver, useWindowScroll} from './hooks';

import type {
  VurtisListElement,
  VurtisItemElement,
  VurtisItemData,
} from './useVurtis.types';
import {
  calcContainerHeight,
  calcItemTop,
  calcItemLeft,
  getItemX,
} from './useVurtis.utils';

// Consider an option for `%` units, since `getItemX()` supports it.
export interface VurtisOptions {
  count?: number;
  minWidth?: number;
  gap?: number;
}

const MIN_ITEM_SIZE = 10;
const MIN_DEVICE_WIDTH = 320;

// TODO: Referencing the following prototypes:
// 1. https://stackblitz.com/edit/react-virtual-fluid-grid?terminal=dev
// 2. https://stackblitz.com/edit/react-virtual-fluid-grid-fixed?terminal=dev
// 3. https://stackblitz.com/edit/react-virtual-fluid-grid-padding?terminal=dev
export function useVurtis({
  count = 0,
  minWidth = MIN_ITEM_SIZE,
  gap = 0,
}: VurtisOptions) {
  // const isMounted = useMounted();
  const listRef = useRef<VurtisListElement>(null);

  const [columns, setColumns] = useState(1);
  const [rangeStart, setRangeStart] = useState(0);
  const [rangeEnd, setRangeEnd] = useState(0);

  const [listTop, setListTop] = useState(0);
  const [listScroll, setListScroll] = useState(0);

  const [listWidth, setListWidth] = useState(MIN_DEVICE_WIDTH);
  const [listHeight, setListHeight] = useState(MIN_ITEM_SIZE);
  const [listVisibleHeight, setListVisibleHeight] = useState(0);

  const [itemWidth, setItemWidth] = useState(MIN_ITEM_SIZE);
  const [itemHeight, setItemHeight] = useState(MIN_ITEM_SIZE);

  // It might make sense to cache the captured element. That way,
  // we can re-use it within `onResize`. Only grab `firstElementChild`
  // if the cached `itemRef` is `null`.
  const updateItemHeight = useCallback(
    (element: VurtisItemElement | null) => {
      // Should we prefer `Math.round`?
      const newHeight = element
        ? Math.ceil(element.getBoundingClientRect().height)
        : itemHeight;

      setItemHeight(newHeight);
    },
    [itemHeight],
  );

  const {
    scrollY,
    scrollHeight: documentHeight,
    visibleHeight: windowHeight,
  } = useWindowScroll({updateStrategy: 'aggressive'});

  useResizeObserver({
    ref: listRef,
    onResize: ({width}) => {
      if (listRef.current) {
        updateItemHeight(
          listRef.current.firstElementChild as VurtisItemElement,
        );
      }
      setListWidth(width);
    },
  });

  useIsoEffect(() => {
    if (listRef.current) setListTop(listRef.current.offsetTop);
  }, [listRef, documentHeight]);

  // Compute a certain subset of dimensions based on relevant changes.
  useIsoEffect(() => {
    const latestX = getItemX(listWidth, minWidth, gap);

    // Not passing `latestX.pixel[1]` as `gap` because
    // we always want row gaps.
    const newListHeight = calcContainerHeight({
      count,
      gap,
      columns: latestX.columns,
      itemHeight,
    });

    setColumns(latestX.columns);
    setListHeight(newListHeight);

    setItemWidth(latestX.pixel[0]);
  }, [count, minWidth, gap, listWidth, itemHeight]);

  // Compute the visible height of the list on screen.
  useIsoEffect(() => {
    const scrollAdjusted = scrollY - listTop;
    const scrollOffset = Math.abs(scrollAdjusted);

    setListScroll(clamp(0, scrollAdjusted, listHeight));
    setListVisibleHeight(clamp(0, listHeight - scrollOffset, windowHeight));
  }, [listTop, listHeight, scrollY, windowHeight]);

  // Compute the range of items to render, as well as what is visible.
  useIsoEffect(() => {
    // TODO: This math is not quite right, as we do not accomodate
    // for the final row not having a trailing gap.
    const itemHeightWithGap = itemHeight + gap;

    const rowsBefore = itemHeightWithGap
      ? Math.floor(listScroll / itemHeightWithGap)
      : 0;
    const visibleRows = itemHeightWithGap
      ? Math.ceil(listVisibleHeight / itemHeightWithGap)
      : 0;

    // Always render 1 extra row so we do not end up with
    // blank space while scrolling down.
    // TODO: We should not do this if we are scrolled well past the container.
    const visibleRowsAdjusted = visibleRows + 1;

    const indexStart = Math.abs(rowsBefore * columns);
    const indexEnd = (rowsBefore + visibleRowsAdjusted) * columns;

    // The math is not quite accurate, since `indexEnd` could end up
    // higher than `count`, or less than count when scroll to bottom.
    const indexEndWithinRange = Math.min(count, indexEnd);
    const indexEndAdjusted =
      count - indexEndWithinRange <= columns ? count : indexEndWithinRange;

    setRangeStart(indexStart);
    setRangeEnd(indexEndAdjusted);
  }, [count, columns, gap, itemHeight, listVisibleHeight, listScroll]);

  const virtualItems: VurtisItemData[] = useMemo(() => {
    const visibleLength = rangeEnd - rangeStart;
    const shellItems = arrayOfLength(visibleLength);

    return shellItems.map((index) => {
      const order = rangeStart + index;

      return {
        order,
        top: calcItemTop({order, columns, height: itemHeight, gap}),
        left: calcItemLeft({order, columns, width: itemWidth, gap}),
        width: itemWidth,
        height: itemHeight,
      };
    });
  }, [gap, columns, rangeStart, rangeEnd, itemWidth, itemHeight]);

  const getSpaceBefore = useCallback(() => {
    // TODO: If we solve the bug where `virtualItems` retains a single `row`,
    // we likely need to update this to use `getTotalSize()` as fallback.
    const firstItem = virtualItems[0];
    return firstItem ? Math.max(0, firstItem.top ?? 0) : 0;
  }, [virtualItems]);

  const getSpaceAfter = useCallback(() => {
    const lastItem = virtualItems[virtualItems.length - 1];
    const lastItemEnd = lastItem ? (lastItem.top ?? 0) + itemHeight : 0;
    return lastItem ? Math.max(0, listHeight - lastItemEnd) : 0;
  }, [virtualItems]);

  return {
    listRef,
    updateItemHeight,
    listHeight,
    virtualItems,
    rangeStart,
    rangeEnd,
    // Useful for layouts that want to use a CSS grid instead of
    // absolute positioning. This may be necessary for animation.
    getSpaceBefore,
    getSpaceAfter,

    // TODO: Temporary for "overlay" testing.
    // listWidth,
  };
}
