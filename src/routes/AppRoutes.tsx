import React from 'react';
import { createBrowserRouter } from 'react-router-dom';
import MyApp from '../MyApp';
import Contacts from './Contacts';
import Login from './Login';
import Settings from './Settings';
import { ChatWrapper } from './Chat';
import NotFound from './NotFound';

export const router = createBrowserRouter([
  {
    path: '',
    element: <MyApp />
  },
  {
    path: '/',
    element: <MyApp />,
    errorElement: <NotFound />,  // Gestisce rotte non trovate
  },
  {
    path: '/settings',
    element: <Settings />,
  },
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/chat/:chatId',
    element: <ChatWrapper />,
  },
  {
    path: '/contacts',
    element: <Contacts />,
  },
]);


