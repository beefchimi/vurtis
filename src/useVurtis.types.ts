export type VurtisListElement = HTMLOListElement | HTMLUListElement;
export type VurtisItemElement = HTMLLIElement;
export type VurtisWidthTuple = [width: number, gap: number];

export interface VurtisContainerCalc {
  count?: number;
  columns?: number;
  itemHeight?: number;
  gap?: number;
}

export interface VurtisItemCalc {
  order?: number;
  columns?: number;
  width?: number;
  height?: number;
  gap?: number;
}

export interface VurtisItemX {
  columns: number;
  pixel: VurtisWidthTuple;
  percent: VurtisWidthTuple;
}

export interface VurtisItemPosition {
  // TODO: Do we want to support `string` (for percentage)?
  top?: number;
  left?: number;
  width?: number;
  height?: number;
}

export interface VurtisItemData extends VurtisItemPosition {
  // `order` is the items "index" within the full virtual collection.
  // Since `virtualItems` is only returning a subset of the full
  // collection, this "original index" value is important.
  order: number;
}
