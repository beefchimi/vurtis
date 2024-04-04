# Vurtis

[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](https://opensource.org/licenses/ISC)

> Welcome to `Vurtis` aka `Virtual Curtis` aka `another React virutalization package`.

This package was created to satisfy a very specific use-case for virtualization in `React`. If you have a fluid grid of uniform height items, this is the package for you! Otherwise, you probably want `@tanstack/react-virtual`.

[Check out the StackBlitz demo](https://stackblitz.com/edit/vurtis)

## Install

```sh
npm install vurtis
```

## Usage

The following example is your most common use case for a “virtualized fluid grid with uniform height items”.

This method requires passing the returned `top/left/width` values to each `<li />` in order to absolutely position them within the parent `<ul />`.

```tsx
import {useVurtis} from 'vurtis';

import {useBreakpoint} from '../local-project/hooks';
import {someDataSet} from '../local-project/data';

export function MyComponent() {
  const {desktop} = useBreakpoint();

  const itemMinWidth = desktop ? 260 : 160;
  const gapSize = desktop ? 16 : 10;

  const {listRef, listHeight, virtualItems, updateItemHeight} = useVurtis({
    count: someDataSet.length,
    minWidth: itemMinWidth,
    gap: gapSize,
  });

  const itemsMarkup = virtualItems.map(
    ({order, top, left, width, height}, index) => {
      const {id, name} = someDataSet[order] ?? {};

      // NOTES:
      // 1. While `updateItemHeight` could be passed to the `ref` of
      //    every `item`... we recommend checking against `index` and
      //    only passing it to the first item. This is to help avoid
      //    redundant DOM measurements (since all items are equal height).
      // 2. While `height` is available from the `item` data,
      //    it is not passed to `style`. This is because we want
      //    our items to compute their `height` naturally.

      return (
        <li
          key={`Item-${id}`}
          ref={index === 0 ? updateItemHeight : undefined}
          style={{top, left, width}}
        >
          <span>{name}</span>
          <span>{order}</span>
          <span>{index}</span>
        </li>
      );
    },
  );

  return (
    <div className="MyComponent">
      <ul ref={listRef} style={{height: listHeight}}>
        {itemsMarkup}
      </ul>
    </div>
  );
}
```

The following minimum CSS styles are required for this to work:

```css
.MyComponent {
  /*
   * This wrapper - or any other parent of the <ul /> - cannot be
   * positioned (have a stacking context) or else offsetTop cannot
   * be captured within useVurtis().
  */
}

ul {
  position: relative;
}

ul li {
  position: absolute;
}
```

### Alternate usage

It might be that you cannot use absolute positioning for your virtualized grid.

We can allow our list to use a CSS grid layout while leveraging the "space before/after" methods to update the list’s `padding top/bottom` as we scroll.

```tsx
export function AlternateSolution() {
  const {desktop} = useBreakpoint();

  const itemMinWidth = desktop ? 260 : 160;
  const gapSize = desktop ? 16 : 10;

  const {
    listRef,
    virtualItems,
    updateItemHeight,
    getSpaceBefore,
    getSpaceAfter,
  } = useVurtis({
    count: someDataSet.length,
    minWidth: itemMinWidth,
    gap: gapSize,
  });

  const itemsMarkup = virtualItems.map(({order}, index) => {
    const {id, name} = someDataSet[order] ?? {};

    return (
      <li key={`Item-${id}`} ref={index === 0 ? updateItemHeight : undefined}>
        <span>{name}</span>
        <span>{order}</span>
        <span>{index}</span>
      </li>
    );
  });

  return (
    <div className="MyComponent">
      <ul
        ref={listRef}
        style={{
          paddingTop: getSpaceBefore(),
          paddingBottom: getSpaceAfter(),
        }}
      >
        {itemsMarkup}
      </ul>
    </div>
  );
}
```

The above solution assumes the following CSS:

```css
ul {
  position: relative;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  grid-template-rows: auto;
  align-content: start;
  align-items: start;
  gap: 10px;

  @media (min-width: 1280px) {
    grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
    gap: 16px;
  }
}
```

NOTE: For this to work, you will need the `minWidth / gap` values passed to `useVurtis` to be in sync with your CSS. It is recommended you share these “style tokens” so that they can never deviate.

## Debounce / throttle helper

Perhaps you require some side-effects for when a value returned by `useVurtis()` changes. At the moment, nothing internal to `useVurtis()` is debounced/throttled, since all the relevant measurements need to be computed quickly in order to give a smooth UX. Throwing some expensive side-effects on top of that could cause a lot of re-rendering issues for your UI. If this is the cause, you may want to leverage the `useVurttle()` hook.

```tsx
export function MyComponent() {
  const {listRef, listWidth, listHeight, virtualItems, updateItemHeight} =
    useVurtis({
      count: 20,
      minWidth: 100,
      gap: 10,
    });

  // Will flip back-and-forth between `true/false` during resize operations.
  // When `true`, you can refrain from additional computations - such as animations.
  // Passing the 2nd `debounce` argument will further limit `pending` changes.
  const pending = useVurttle(listWidth, true);

  useEffect(() => {
    console.log('Some side-effect goes here...', pending);
  }, [pending]);

  const itemsMarkup = virtualItems.map(
    ({order, top, left, width, height}, index) => {
      return (
        <li
          key={`Item-${order}`}
          ref={index === 0 ? updateItemHeight : undefined}
          style={{top, left, width}}
        >
          <span>{order}</span>
        </li>
      );
    },
  );

  return (
    <div>
      <p>Pending: {pending.toString()}</p>

      <ul ref={listRef} style={{height: listHeight}}>
        {itemsMarkup}
      </ul>
    </div>
  );
}
```

## Notes

As mentioned above, this package is for a very specific virtualization pattern. As such, there are a number of missing features / optimizations that you may otherwise expect to have. Some of these things _could be added in the future..._ but I make no guarantee.

**Missing features:**

1. Support for variable height items.
2. Support for horizontal scrolling lists.
3. Support for non-window containers.
4. Debounced window listeners (scroll/resize).
5. Recommended solutions for animation.
6. Fully SSR / RSC compatible.
7. Tests.
8. etc...
