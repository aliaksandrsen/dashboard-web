import { Suspense, lazy } from 'react';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import { Navigate, useRoutes } from 'react-router-dom';
import AppLayout from './components/AppLayout';
import Dashboard from './pages/Dashboard';

const Orders = lazy(() => import('./pages/Orders'));
const OrderCreate = lazy(() => import('./pages/OrderCreate'));
const OrderDetails = lazy(() => import('./pages/OrderDetails'));
const OrderEdit = lazy(() => import('./pages/OrderEdit'));
const Products = lazy(() => import('./pages/Products'));
const ProductCreate = lazy(() => import('./pages/ProductCreate'));
const ProductDetails = lazy(() => import('./pages/ProductDetails'));
const ProductEdit = lazy(() => import('./pages/ProductEdit'));
const Users = lazy(() => import('./pages/Users'));
const UserCreate = lazy(() => import('./pages/UserCreate'));
const UserDetails = lazy(() => import('./pages/UserDetails'));
const UserEdit = lazy(() => import('./pages/UserEdit'));
const Settings = lazy(() => import('./pages/Settings'));
const NotFound = lazy(() => import('./pages/NotFound'));

const RouteLoader = ({ label }: { label: string }) => (
  <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
    <CircularProgress aria-label={label} />
  </Box>
);

const Router = () => {
  const routes = useRoutes([
    {
      element: <AppLayout />,
      children: [
        {
          path: '/',
          element: <Dashboard />,
        },
        {
          path: '/orders',
          element: (
            <Suspense fallback={<RouteLoader label="Loading orders" />}>
              <Orders />
            </Suspense>
          ),
        },
        {
          path: '/orders/new',
          element: (
            <Suspense fallback={<RouteLoader label="Loading create order page" />}>
              <OrderCreate />
            </Suspense>
          ),
        },
        {
          path: '/orders/:id',
          element: (
            <Suspense fallback={<RouteLoader label="Loading order details" />}>
              <OrderDetails />
            </Suspense>
          ),
        },
        {
          path: '/orders/:id/edit',
          element: (
            <Suspense fallback={<RouteLoader label="Loading edit order page" />}>
              <OrderEdit />
            </Suspense>
          ),
        },
        {
          path: '/products',
          element: (
            <Suspense fallback={<RouteLoader label="Loading products" />}>
              <Products />
            </Suspense>
          ),
        },
        {
          path: '/products/new',
          element: (
            <Suspense fallback={<RouteLoader label="Loading create product page" />}>
              <ProductCreate />
            </Suspense>
          ),
        },
        {
          path: '/products/:id',
          element: (
            <Suspense fallback={<RouteLoader label="Loading product details" />}>
              <ProductDetails />
            </Suspense>
          ),
        },
        {
          path: '/products/:id/edit',
          element: (
            <Suspense fallback={<RouteLoader label="Loading edit product page" />}>
              <ProductEdit />
            </Suspense>
          ),
        },
        {
          path: '/users',
          element: (
            <Suspense fallback={<RouteLoader label="Loading users" />}>
              <Users />
            </Suspense>
          ),
        },
        {
          path: '/users/new',
          element: (
            <Suspense fallback={<RouteLoader label="Loading create user page" />}>
              <UserCreate />
            </Suspense>
          ),
        },
        {
          path: '/users/:id',
          element: (
            <Suspense fallback={<RouteLoader label="Loading user details" />}>
              <UserDetails />
            </Suspense>
          ),
        },
        {
          path: '/users/:id/edit',
          element: (
            <Suspense fallback={<RouteLoader label="Loading edit user page" />}>
              <UserEdit />
            </Suspense>
          ),
        },
        {
          path: '/settings',
          element: (
            <Suspense fallback={<RouteLoader label="Loading settings" />}>
              <Settings />
            </Suspense>
          ),
        },
        {
          path: '/actions',
          element: <Navigate to="/orders" replace />,
        },
        {
          path: '*',
          element: (
            <Suspense fallback={<RouteLoader label="Loading page" />}>
              <NotFound />
            </Suspense>
          ),
        },
      ],
    },
  ]);

  return routes;
};

export default Router;
