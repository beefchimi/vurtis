export type ResizeCamelBox = keyof Pick<
  ResizeObserverEntry,
  'borderBoxSize' | 'contentBoxSize' | 'devicePixelContentBoxSize'
>;

export type ResizeKebabBox =
  | 'border-box'
  | 'content-box'
  | 'device-pixel-content-box';
