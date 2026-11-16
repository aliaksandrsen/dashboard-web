import { createBrowserRouter } from 'react-router-dom';
import AppLayout from './components/AppLayout';
import UserInfo from './pages/UserInfo';

const router = createBrowserRouter([
  {
    element: <AppLayout />,
    children: [
      {
        path: '/',
        element: <UserInfo />,
      },
      {
        path: '/actions',
        element: <div>Actions go burr</div>,
      },
    ],
  },
]);

export default router;
