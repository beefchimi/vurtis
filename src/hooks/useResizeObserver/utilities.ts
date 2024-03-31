import type {ResizeCamelBox, ResizeKebabBox} from './types.js';

export function convertKebabToCamel(size?: ResizeKebabBox): ResizeCamelBox {
  switch (size) {
    case 'border-box':
      return 'borderBoxSize';
    case 'device-pixel-content-box':
      return 'devicePixelContentBoxSize';
    default:
      return 'contentBoxSize';
  }
}

export function extractSize(
  entry?: ResizeObserverEntry,
  box: ResizeCamelBox = 'borderBoxSize',
  sizeType: keyof ResizeObserverSize = 'inlineSize'
) {
  let size = 0;

  if (!entry || (!entry[box] && box !== 'contentBoxSize')) return size;

  if (box === 'contentBoxSize') {
    size = entry.contentRect[sizeType === 'inlineSize' ? 'width' : 'height'];
  }

  if (Array.isArray(entry[box])) {
    const firstValue = entry[box][0];
    size = firstValue ? firstValue[sizeType] : 0;
  } else {
    // @ts-ignore Support Firefox's non-standard behavior.
    const nonStandardValue = entry[box][sizeType] as number;
    size = nonStandardValue ?? 0;
  }

  return Math.round(size);
}
