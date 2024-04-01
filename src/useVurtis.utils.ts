import {clamp, trimDecimals} from 'beeftools';

import type {
  VurtisContainerCalc,
  VurtisItemCalc,
  VurtisItemX,
} from './useVurtis.types';

export function calcContainerHeight({
  count = 0,
  columns = 1,
  itemHeight = 10,
  gap = 0,
}: VurtisContainerCalc) {
  if (count < 1) return 0;
  if (count <= columns) return itemHeight;

  const rows = Math.ceil(count / columns);
  // Subtract `gap` once to account for the final row.
  const totalHeight = rows * (itemHeight + gap) - gap;

  return totalHeight;
}

export function calcItemTop({
  order = 0,
  columns = 1,
  height = 10,
  gap = 0,
}: VurtisItemCalc) {
  const currentRow = Math.floor(order / columns);
  return (height + gap) * currentRow;
}

export function calcItemLeft({
  order = 0,
  columns = 1,
  width = 10,
  gap = 0,
}: VurtisItemCalc) {
  const currentColumn = order % columns;
  return (width + gap) * currentColumn;
}

export function getItemX(container = 100, minWidth = 10, gap = 0): VurtisItemX {
  const safeContainer = clamp(100, container, 9999);
  const safeItem = clamp(10, minWidth, 999);
  const safeGap = clamp(0, gap, 99);

  const singleColumnLayout: VurtisItemX = {
    columns: 1,
    pixel: [safeContainer, 0],
    percent: [100, 0],
  };

  if (safeItem >= safeContainer) return singleColumnLayout;

  const potentialColumns = Math.floor(safeContainer / safeItem);

  if (potentialColumns <= 1) return singleColumnLayout;

  const potentialItemPx = safeContainer / potentialColumns;
  const potentialItemPercent = trimDecimals(potentialItemPx * 0.1);

  if (!safeGap) {
    return {
      columns: potentialColumns,
      pixel: [potentialItemPx, 0],
      percent: [potentialItemPercent, 0],
    };
  }

  const gapTotal = safeGap * (potentialColumns - 1);
  const gapPercent = trimDecimals(safeGap * 0.1);

  const adjustedContainer = safeContainer - gapTotal;
  const adjustedItemPx = adjustedContainer / potentialColumns;
  const adjustedItemPercent = trimDecimals(adjustedItemPx * 0.1);

  if (adjustedItemPx >= safeItem) {
    return {
      columns: potentialColumns,
      pixel: [adjustedItemPx, safeGap],
      percent: [adjustedItemPercent, gapPercent],
    };
  }

  const finalColumns = potentialColumns - 1;

  if (finalColumns <= 1) return singleColumnLayout;

  const finalGapTotal = safeGap * (finalColumns - 1);

  const finalContainer = safeContainer - finalGapTotal;
  const finalItemPx = finalContainer / finalColumns;
  const finalItemPercent = trimDecimals(finalItemPx * 0.1);

  return {
    columns: finalColumns,
    pixel: [finalItemPx, safeGap],
    percent: [finalItemPercent, gapPercent],
  };
}
