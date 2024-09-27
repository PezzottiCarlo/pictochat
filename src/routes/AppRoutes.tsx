// router.tsx
import React from 'react';
import { createHashRouter } from 'react-router-dom';
import MyApp from '../MyApp';
import Contacts from './Contacts';
import Login from './Login';
import Settings from './Settings';
import { ChatWrapper } from './Chat';
import NotFound from './NotFound';
import ProtectedRoute from './ProtectedRoute';

export const router = createHashRouter([
  {
    path: '/',
    element: <MyApp />,
    errorElement: <NotFound />,
    children: [
      {
        path: 'settings',
        element: <Settings />,
      },
      {
        path: 'login',
        element: <Login />,
      },
      {
        path: 'contacts',
        element: (
          <ProtectedRoute>
            <Contacts />
          </ProtectedRoute>
        ),
      },
      {
        path: 'chat/:chatId',
        element: (
          <ProtectedRoute>
            <ChatWrapper />
          </ProtectedRoute>
        ),
      },
    ],
  },
]);
