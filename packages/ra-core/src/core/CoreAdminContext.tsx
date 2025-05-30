import * as React from 'react';
import { useMemo } from 'react';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';

import { AdminRouter } from '../routing';
import { AuthContext, convertLegacyAuthProvider } from '../auth';
import {
    DataProviderContext,
    UndoableMutationsContextProvider,
    convertLegacyDataProvider,
    defaultDataProvider,
} from '../dataProvider';
import { StoreContextProvider, Store, memoryStore } from '../store';
import { PreferencesEditorContextProvider } from '../preferences/PreferencesEditorContextProvider';
import { I18nContextProvider } from '../i18n';
import { ResourceDefinitionContextProvider } from './ResourceDefinitionContext';
import { NotificationContextProvider } from '../notification';
import {
    AuthProvider,
    LegacyAuthProvider,
    I18nProvider,
    DataProvider,
    AdminChildren,
    DashboardComponent,
    LegacyDataProvider,
} from '../types';

const defaultStore = memoryStore();

export interface CoreAdminContextProps {
    /**
     * The authentication provider for security and permissions
     *
     * @see https://marmelab.com/react-admin/Authentication.html
     * @example
     * import authProvider from './authProvider';
     *
     * const App = () => (
     *     <Admin authProvider={authProvider}>
     *         ...
     *     </Admin>
     * );
     */
    authProvider?: AuthProvider | LegacyAuthProvider;

    /**
     * The base path for all URLs generated by react-admin.
     *
     * @see https://marmelab.com/react-admin/Admin.html#using-react-admin-in-a-sub-path
     * @example
     * import { Admin } from 'react-admin';
     * import { BrowserRouter } from 'react-router-dom';
     * import { dataProvider } from './dataProvider';
     *
     * const App = () => (
     *     <BrowserRouter>
     *         <Admin basename="/admin" dataProvider={dataProvider}>
     *              ...
     *         </Admin>
     *    </BrowserRouter>
     * );
     */
    basename?: string;

    children?: AdminChildren;

    /**
     * The component to use for the dashboard page (displayed on the `/` route).
     *
     * @see https://marmelab.com/react-admin/Admin.html#dashboard
     * @example
     * import { Admin } from 'react-admin';
     * import Dashboard from './Dashboard';
     * import { dataProvider } from './dataProvider';
     *
     * const App = () => (
     *     <Admin dashboard={Dashboard} dataProvider={dataProvider}>
     *         ...
     *     </Admin>
     * );
     */
    dashboard?: DashboardComponent;

    /**
     * The data provider used to communicate with the API
     *
     * @see https://marmelab.com/react-admin/DataProviders.html
     * @example
     * import { Admin } from 'react-admin';
     * import simpleRestProvider from 'ra-data-simple-rest';
     * const dataProvider = simpleRestProvider('http://path.to.my.api/');
     *
     * const App = () => (
     *     <Admin dataProvider={dataProvider}>
     *         ...
     *     </Admin>
     * );
     */
    dataProvider?: DataProvider | LegacyDataProvider;

    /**
     * The adapter for storing user preferences
     *
     * @see https://marmelab.com/react-admin/Admin.html#store
     * @example
     * import { Admin, memoryStore } from 'react-admin';
     *
     * const App = () => (
     *     <Admin dataProvider={dataProvider} store={memoryStore()}>
     *         ...
     *     </Admin>
     * );
     */
    store?: Store;

    /**
     * The react-query client
     *
     * @see https://marmelab.com/react-admin/Admin.html#queryclient
     * @example
     * import { Admin } from 'react-admin';
     * import { QueryClient } from '@tanstack/react-query';
     *
     * const queryClient = new QueryClient({
     *     defaultOptions: {
     *         queries: {
     *             retry: false,
     *             structuralSharing: false,
     *         },
     *         mutations: {
     *             retryDelay: 10000,
     *         },
     *     },
     * });
     *
     * const App = () => (
     *     <Admin queryClient={queryClient} dataProvider={...}>
     *         ...
     *     </Admin>
     * );
     */
    queryClient?: QueryClient;

    /**
     * The internationalization provider for translations
     *
     * @see https://marmelab.com/react-admin/Translation.html
     * @example
     * // in src/i18nProvider.js
     * import polyglotI18nProvider from 'ra-i18n-polyglot';
     * import fr from 'ra-language-french';
     *
     * export const i18nProvider = polyglotI18nProvider(() => fr, 'fr');
     *
     * // in src/App.js
     * import { Admin } from 'react-admin';
     * import { dataProvider } from './dataProvider';
     * import { i18nProvider } from './i18nProvider';
     *
     * const App = () => (
     *     <Admin dataProvider={dataProvider} i18nProvider={i18nProvider}>
     *         ...
     *     </Admin>
     * );
     */
    i18nProvider?: I18nProvider;
}

export const CoreAdminContext = (props: CoreAdminContextProps) => {
    const {
        authProvider,
        basename,
        dataProvider = defaultDataProvider,
        i18nProvider,
        store = defaultStore,
        children,
        queryClient,
    } = props;

    if (!dataProvider) {
        throw new Error(`Missing dataProvider prop.
React-admin requires a valid dataProvider function to work.`);
    }

    const finalQueryClient = useMemo(
        () => queryClient || new QueryClient(),
        [queryClient]
    );

    const finalAuthProvider = useMemo(
        () =>
            authProvider instanceof Function
                ? convertLegacyAuthProvider(authProvider)
                : authProvider,
        [authProvider]
    );

    const finalDataProvider = useMemo(
        () =>
            dataProvider instanceof Function
                ? convertLegacyDataProvider(dataProvider)
                : dataProvider,
        [dataProvider]
    );

    return (
        <AuthContext.Provider value={finalAuthProvider}>
            <DataProviderContext.Provider value={finalDataProvider}>
                <StoreContextProvider value={store}>
                    <PreferencesEditorContextProvider>
                        <QueryClientProvider client={finalQueryClient}>
                            <AdminRouter basename={basename}>
                                <I18nContextProvider value={i18nProvider}>
                                    <NotificationContextProvider>
                                        <UndoableMutationsContextProvider>
                                            <ResourceDefinitionContextProvider>
                                                {children}
                                            </ResourceDefinitionContextProvider>
                                        </UndoableMutationsContextProvider>
                                    </NotificationContextProvider>
                                </I18nContextProvider>
                            </AdminRouter>
                        </QueryClientProvider>
                    </PreferencesEditorContextProvider>
                </StoreContextProvider>
            </DataProviderContext.Provider>
        </AuthContext.Provider>
    );
};
