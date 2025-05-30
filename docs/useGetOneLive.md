---
layout: default
title: "useGetOneLive"
---

# `useGetOneLive`

This [Enterprise Edition](https://react-admin-ee.marmelab.com)<img class="icon" src="./img/premium.svg" alt="React Admin Enterprise Edition icon" /> hook, alternative to [`useGetOne`](./useGetOne.md), subscribes to live updates on the record.

## Usage

```jsx
import { useRecordContext } from 'react-admin';
import { useGetOneLive } from '@react-admin/ra-realtime';

const UserProfile = () => {
    const record = useRecordContext();
    const { data, isPending, error } = useGetOneLive('users', { id: record.userId });
    if (isPending) {
        return <Loading />;
    }
    if (error) {
        return <p>ERROR</p>;
    }
    return <div>User {data.username}</div>;
};
```

The hook will subscribe to live updates on the record (topic: `resource/[resource]/[id]`) and will refetch the record when it is updated or deleted.

See [the `useGetOne` documentation](./useGetOne.md) for the full list of parameters and return type.

## TypeScript

The `useGetOneLive` hook accepts a generic parameter for the record type:

```tsx
import { useRecordContext } from 'react-admin';
import { useGetOneLive } from '@react-admin/ra-realtime';

type Ticket = {
    id: number;
    userId: string;
    message: string;
};

type User = {
    id: number;
    username: string;
}

const UserProfile = () => {
    const ticket = useRecordContext<Ticket>();
    const { data: user, isPending, error } = useGetOneLive<User>('users', { id: ticket.userId });
    if (isPending) { return <Loading />; }
    if (error) { return <p>ERROR</p>; }
    // TypeScript knows that user is of type User
    return <div>User {user.username}</div>;
};
```