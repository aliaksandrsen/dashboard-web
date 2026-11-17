import { useRoutes } from 'react-router-dom';
import AppLayout from './components/AppLayout';
import UserInfo from './pages/UserInfo';

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
          element: <div>Actions are here</div>,
        },
      ],
    },
  ]);

  return routes;
};

export default Router;
