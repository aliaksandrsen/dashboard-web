import { Suspense, lazy } from 'react';
import CircularProgress from '@mui/material/CircularProgress';
import { useRoutes } from 'react-router-dom';
import AppLayout from './components/AppLayout';
import UserInfo from './pages/UserInfo';

const Actions = lazy(() => import('./pages/Actions'));
const OrderDetails = lazy(() => import('./pages/OrderDetails'));
const Products = lazy(() => import('./pages/Products'));
const ProductDetails = lazy(() => import('./pages/ProductDetails'));
const Users = lazy(() => import('./pages/Users'));
const UserDetails = lazy(() => import('./pages/UserDetails'));
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
          path: '/orders/:id',
          element: (
            <Suspense fallback={<CircularProgress aria-label="Loading order details" />}>
              <OrderDetails />
            </Suspense>
          ),
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
          path: '/products/:id',
          element: (
            <Suspense fallback={<CircularProgress aria-label="Loading product details" />}>
              <ProductDetails />
            </Suspense>
          ),
        },
        {
          path: '/users',
          element: (
            <Suspense fallback={<CircularProgress aria-label="Loading users page" />}>
              <Users />
            </Suspense>
          ),
        },
        {
          path: '/users/:id',
          element: (
            <Suspense fallback={<CircularProgress aria-label="Loading user details" />}>
              <UserDetails />
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
