// router.tsx
import React from 'react';
import { createHashRouter } from 'react-router-dom';
import MyApp from '../MyApp';
import Contacts from './Contacts';
import Login from './Login';
import WelcomePage from './Welcome';
import { ChatWrapper } from './Chat';
import NotFound from './NotFound';
import ProtectedRoute from './ProtectedRoute';
import Profile from './Profile';
import { Logout } from './Logout';


export const getActivePage = ():string => {
  let hash = window.location.hash;
  let page = hash.split('/');
  if (page.length > 1)
    return page[1];
  return page[0];
}

export const router = createHashRouter([
  {
    path: '/',
    element: <MyApp />,
    errorElement: <NotFound />,
    children: [
      {
        path: 'welcomePage',
        element: <WelcomePage />,
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
      {
        path: 'profile',
        element: (
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        ),
      },
      {
        path: 'logout',
        element: <Logout />,
      }
    ],
  },
]);
