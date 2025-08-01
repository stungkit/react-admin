---
layout: default
title: "ShowInDialogButton"
---

# `<ShowInDialogButton>`

This [Enterprise Edition](https://react-admin-ee.marmelab.com)<img class="icon" src="./img/premium.svg" alt="React Admin Enterprise Edition icon" /> component renders a button opening a `<Show>` view inside a dialog, hence allowing to show a record without leaving the current view.

<video controls autoplay playsinline muted loop>
  <source src="https://react-admin-ee.marmelab.com/assets/ra-form-layout/latest/InDialogButtons.mp4" type="video/mp4" />
  Your browser does not support the video tag.
</video>

It can be useful in case you want the ability to show a record linked by a reference to the currently edited record, or if you have a nested `<DataTable>` inside a `<Show>` or an `<Edit>` view. 

## Usage

First, install the `@react-admin/ra-form-layout` package:

```sh
npm install --save @react-admin/ra-form-layout
# or
yarn add @react-admin/ra-form-layout
```

**Tip**: [`ra-form-layout`](https://react-admin-ee.marmelab.com/documentation/ra-form-layout#createindialogbutton-editindialogbutton-and-showindialogbutton) is hosted in a private npm registry. You need to subscribe to one of the [Enterprise Edition](https://react-admin-ee.marmelab.com/) plans to access this package.

Then, use the `<ShowInDialogButton>` component inside a `RecordContext` (in a `<DataTable>`, in a `<Show>` or an `<Edit>` view).

Below is an example of an `<Edit>` view, inside which is a nested `<DataTable>`, offering the ability to show the detail of each row in a dialog:

{% raw %}

```jsx
import {
  DataTable,
  DateField,
  ReferenceManyField,
  SelectField,
  SimpleShowLayout,
  TextField,
} from "react-admin";
import { ShowInDialogButton } from "@react-admin/ra-form-layout";

const sexChoices = [
  { id: "male", name: "Male" },
  { id: "female", name: "Female" },
];

const ShowButton = () => (
  <ShowInDialogButton fullWidth maxWidth="md">
    <SimpleShowLayout>
      <TextField source="first_name" fullWidth />
      <TextField source="last_name" fullWidth />
      <DateField source="dob" label="born" fullWidth />
      <SelectField source="sex" choices={sexChoices} fullWidth />
    </SimpleShowLayout>
  </ShowInDialogButton>
);

const CustomersDataTable = () => (
  <DataTable>
    <DataTable.Col source="id" />
    <DataTable.Col source="first_name" />
    <DataTable.Col source="last_name" />
    <DataTable.Col source="dob" label="born" field={DateField} />
    <DataTable.Col source="sex">
      <SelectField source="sex" choices={sexChoices} />
    </DataTable.Col>
    <DataTable.Col>
      <ShowButton />
    </DataTable.Col>
  </DataTable>
);

const EmployerEdit = () => (
  <Edit>
    <SimpleForm>
      <TextInput source="name" validate={required()} />
      <TextInput source="address" validate={required()} />
      <TextInput source="city" validate={required()} />
      <ReferenceManyField label="Customers" reference="customers" target="employer_id">
        <CustomersDataTable />
      </ReferenceManyField>
    </SimpleForm>
  </Edit>
);
```

{% endraw %}

## Props

This component accepts the following props:

| Prop           | Required | Type           | Default  | Description               |
|----------------|----------|----------------|----------|---------------------------|
| `ButtonProps`  | Optional | `object`       |          | Props to pass to the MUI `<Button>` component |
| `children`     | Required | `ReactNode`    |          | The content of the dialog |
| `emptyWhileLoading` | Optional | `boolean` |         | Set to `true` to return `null` while the list is loading |
| `fullWidth`    | Optional | `boolean`      | `false`  | Set to `true` to make the dialog full width |
| `icon`         | Optional | `ReactElement` |          | The icon of the button |
| `id`           | Optional | `string | number` |       | The record id. If not provided, it will be deduced from the record context |
| `inline`       | Optional | `boolean`      | `false`  | Set to `true` to display only an MUI `<IconButton>` instead of the full `<Button>`. The label will still be available as a `<Tooltip>` though. |
| `label`        | Optional | `string`       |          | The label of the button. I18N is supported. |
| `maxWidth`     | Optional | `string | boolean` | `sm` | The max width of the dialog. |
| `queryOptions` | Optional | `object`       |          | The options to pass to the `useQuery` hook |
| `resource`     | Optional | `string`       |          | The resource name, e.g. `posts` |
| `sx`           | Optional | `object`       |          | Override the styles applied to the dialog component |
| `title`            | Optional | `ReactNode`       |         | The title of the dialog                                                                 |

## `ButtonProps`

The `ButtonProps` prop allows you to pass props to the MUI `<Button>` component. For instance, to change the color of the button, you can use the `color` prop:

{% raw %}

```jsx
const ShowButton = () => (
  <ShowInDialogButton ButtonProps={{ color: 'primary' }}>
      <SimpleShowLayout>
          ...
      </SimpleShowLayout>
  </ShowInDialogButton>
);
```

{% endraw %}

## `children`

`<ShowInDialogButton>` doesn't render any field by default - it delegates this to its children, called "Show layout components". These components read the `record` from the [`RecordContext`](./useRecordContext.md) and render its fields.

React-admin provides 2 built-in show layout components:

- [`<SimpleShowLayout>`](./SimpleShowLayout.md) displays fields with a label in a single column
- [`<TabbedShowLayout>`](./TabbedShowLayout.md) displays a list of tabs, each tab rendering a stack of fields with a label

To use an alternative layout, switch the `<ShowInDialogButton>` child component:

```diff
const ShowButton = () => (
    <ShowInDialogButton fullWidth maxWidth="md">
-       <SimpleShowLayout>
+       <TabbedShowLayout>
+           <TabbedShowLayout.Tab label="Main">
                <TextField source="first_name" fullWidth />
                <TextField source="last_name" fullWidth />
                <DateField source="dob" label="born" fullWidth />
                <SelectField source="sex" choices={sexChoices} fullWidth />
+           </TabbedShowLayout.Tab>
-       </SimpleShowLayout>
+       </TabbedShowLayout>
    <ShowInDialogButton fullWidth maxWidth="md">
);
```

You can also pass a React element as child, to build a custom layout. Check [Building a custom Show Layout](./ShowTutorial.md#building-a-custom-layout) for more details.

## `emptyWhileLoading`

By default, `<ShowInDialogButton>` renders its child component even before the `dataProvider.getOne()` call returns. If you use `<SimpleShowLayout>` or `<TabbedShowLayout>`, this isn't a problem as these components only render when the record has been fetched. But if you use a custom child component that expects the record context to be defined, your component will throw an error.

To avoid this, set the `emptyWhileLoading` prop to `true`:

```jsx
const ShowButton = () => (
  <ShowInDialogButton emptyWhileLoading>
      ...
  </ShowInDialogButton>
);
```

## `fullWidth`

By default, `<EditInDialogButton>` renders a [Material UI `<Dialog>`](https://mui.com/material-ui/react-dialog/#full-screen-dialogs) component that takes the width of its content.

You can make the dialog full width by setting the `fullWidth` prop to `true`:

```jsx
const EditButton = () => (
  <EditInDialogButton fullWidth>
      ...
  </EditInDialogButton>
);
```

In addition, you can set a dialog maximum width by using the `maxWidth` enumerable in combination with the `fullWidth` boolean. When the `fullWidth` prop is true, the dialog will adapt based on the `maxWidth` value.

```jsx
const EditButton = () => (
  <EditInDialogButton fullWidth maxWidth="sm">
      ...
  </EditInDialogButton>
);
```

## `icon`

The `icon` prop allows you to pass an icon to the button. It can be a MUI icon component, or a custom icon component.

```jsx
import { Edit } from '@mui/icons-material';

const ShowButton = () => (
  <ShowInDialogButton icon={<Edit />}>
      ...
  </ShowInDialogButton>
);
```

## `id`

The `id` prop allows you to pass the record id to the `<ShowInDialogButton>` component. If not provided, it will be deduced from the record context.

This is useful to link to a related record. For instance, the following button lets you show the author of a book:

```jsx
const ShowAuthorButton = () => {
  const book = useRecordContext();
  return (
    <ShowInDialogButton resource="authors" id={book.author_id}>
        ...
    </ShowInDialogButton>
  );
};
```

## `inline`

By default, `<ShowInDialogButton>` renders a `<Button>` component. If you want to display only an `<IconButton>`, set the `inline` prop to `true`:

```jsx
const ShowButton = () => (
  <ShowInDialogButton inline>
      ...
  </ShowInDialogButton>
);
```

## `label`

The `label` prop allows you to pass a custom label to the button, instead of the default ("Show"). It can be a string, a I18N value, or a React element.

```jsx
const ShowButton = () => (
  <ShowInDialogButton label="Show details">
      ...
  </ShowInDialogButton>
);
```

## `maxWidth`

The `maxWidth` prop allows you to set the max width of the dialog. It can be one of the following values: `xs`, `sm`, `md`, `lg`, `xl`, `false`. The default is `sm`.

For example, you can use that prop to make the dialog full width:

```jsx
const ShowButton = () => (
  <ShowInDialogButton fullWidth maxWidth={false}>
      ...
  </ShowInDialogButton>
);
```

## `queryOptions`

The `queryOptions` prop allows you to pass options to the [`useQuery`](./Actions.md#usequery-and-usemutation) hook. 

This can be useful e.g. to pass [a custom `meta`](./Actions.md#meta-parameter) to the `dataProvider.getOne()` call.

{% raw %}

```jsx
const ShowButton = () => (
  <ShowInDialogButton queryOptions={{ meta: { fetch: 'author' } }}>
      ...
  </ShowInDialogButton>
);
```

{% endraw %}

## `resource`

The `resource` prop allows you to pass the resource name to the `<ShowInDialogButton>` component. If not provided, it will be deduced from the resource context.

This is useful to link to a related record. For instance, the following button lets you show the author of a book:

```jsx
const ShowAuthorButton = () => {
  const book = useRecordContext();
  return (
    <ShowInDialogButton resource="authors" id={book.author_id}>
        ...
    </ShowInDialogButton>
  );
};
```

## `sx`

Customize the styles applied to the Material UI `<Dialog>` component:

{% raw %}

```jsx
const ShowButton = () => (
  <ShowInDialogButton sx={{ backgroundColor: 'paper' }}>
      ...
  </ShowInDialogButton>
);
```

{% endraw %}

## `title`

Unlike the `<Show>` components, with Dialog components the title will be displayed in the `<Dialog>`, not in the `<AppBar>`.
If you pass a custom title component, it will render in the same `RecordContext` as the dialog's child component. That means you can display non-editable details of the current `record` in the title component.
Here is an example:

```tsx
import { SimpleForm, useRecordContext } from 'react-admin';
import { ShowInDialogButton } from '@react-admin/ra-form-layout';

const CustomerShowTitle = () => {
    const record = useRecordContext();
    return record ? (
        <span>
            Show {record?.last_name} {record?.first_name}
        </span>
    ) : null;
};

const ShowButton = () => (
  <ShowInDialogButton title={<CustomerEditTitle />}>
    <SimpleShowLayout>
      ...
    </SimpleShowLayout>
  </ShowInDialogButton>
);

const CustomersDataTable = () => (
  <DataTable>
    ...
    <DataTable.Col>
      <ShowButton />
    </DataTable.Col>
  </DataTable>
);
```

You can also hide the title by passing `null`:

```tsx
<ShowInDialogButton title={null}>
    <SimpleForm>
        ...
    </SimpleForm>
</ShowInDialogButton>
```
