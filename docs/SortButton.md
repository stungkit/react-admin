---
layout: default
title: "The SortButton Component"
storybook_path: ra-ui-materialui-button-sortbutton--basic
---

# `<SortButton>`

Some List views don't have a natural UI for sorting - e.g. the `<SimpleList>`, or a list of images, don't have column headers like the `<DataTable>`. For these cases, react-admin offers the `<SortButton>`, which displays a dropdown list of fields that the user can choose to sort on.

<video controls autoplay playsinline muted loop>
  <source src="./img/sort-button.webm" type="video/webm"/>
  <source src="./img/sort-button.mp4" type="video/mp4"/>
  Your browser does not support the video tag.
</video>


## Usage

`<SortButton>` requires a `fields` prop, containing the list of field names it should allow to sort on. For instance, here is how to offer a button to sort on the `reference`, `sales`, and `stock` fields:

```jsx
import * as React from 'react';
import { TopToolbar, SortButton, CreateButton, ExportButton } from 'react-admin';

const ListActions = () => (
    <TopToolbar>
        <SortButton fields={['reference', 'sales', 'stock']} />
        <CreateButton />
        <ExportButton />
    </TopToolbar>
);
```

## Props

| Prop        | Required | Type           | Default               | Description                         |
|-------------|----------|----------------|-----------------------|-------------------------------------|
| `fields`    | Required | `string[]`     | -                     | List of fields to offer sort on     |
| `className` | Optional | `string  `     | -                     | class name for the button container |
| `icon`      | Optional | `ReactElement` | `<ArrowDropDownIcon>` | iconElement, e.g. `<CommentIcon />` |
| `label`     | Optional | `string`       | 'ra.sort.sort_by'     | label or translation message to use |
| `sx`        | Optional | `SxProps`      | -                     | Styling                             |

## `className`

The `className` prop is passed down to the button container. Use it to customize the button style.

```jsx
<SortButton 
    fields={['reference', 'sales', 'stock']}
    className="my-sort-button"
/>
```

## `fields`

The `fields` prop expects an array of strings. Each string is the name of a field to sort on. The `<SortButton>` renders the corresponding menu item depending on the current sort order (ASC by default, or DESC if the current sort field is active).

```jsx
<SortButton fields={['reference', 'sales', 'stock']} />
```

## `icon`

You can customize the icon rendered on the left of the button by passing an `icon` prop.

```jsx
<SortButton 
    fields={['reference', 'sales', 'stock']}
    icon={<SortIcon />}
/>
```

## `label`

You can customize the label of the button by passing a `label` prop.

```jsx
<SortButton 
    fields={['reference', 'sales', 'stock']}
    label="Sort by"
/>
```

## `sx`: CSS API

You can override the style of `<SortButton>` and its inner components thanks to the `sx` property (see [the `sx` documentation](./SX.md) for details).

{% raw %}
```jsx
<SortButton 
    fields={['reference', 'sales', 'stock']}
    sx={{
        mx: 1,
        '& .MuiButton-root': {
            color: 'text.secondary',
        },
    }}
/>
```
{% endraw %}

This property accepts the following subclasses:

| Rule name             | Description                        |
|-----------------------|------------------------------------|
| `&.RaSortButton-root` | Applied to the root `span` element |