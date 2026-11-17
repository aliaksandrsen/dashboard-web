import { Suspense, lazy } from 'react';
import CircularProgress from '@mui/material/CircularProgress';
import { useRoutes } from 'react-router-dom';
import AppLayout from './components/AppLayout';
import UserInfo from './pages/UserInfo';

const Actions = lazy(() => import('./pages/Actions'));
const Products = lazy(() => import('./pages/Products'));
const Settings = lazy(() => import('./pages/Settings'));

const Router = () => {
  const routes = useRoutes([
    {
      element: <AppLayout />,
      children: [
        {
          path: '/',
          element: <UserInfo />,
        },
        {
          path: '/actions',
          element: (
            <Suspense fallback={<CircularProgress aria-label="Loading actions page" />}>
              <Actions />
            </Suspense>
          ),
        },
        {
          path: '/products',
          element: (
            <Suspense fallback={<CircularProgress aria-label="Loading products page" />}>
              <Products />
            </Suspense>
          ),
        },
        {
          path: '/settings',
          element: (
            <Suspense fallback={<CircularProgress aria-label="Loading settings page" />}>
              <Settings />
            </Suspense>
          ),
        },
      ],
    },
  ]);

  return routes;
};

export default Router;
