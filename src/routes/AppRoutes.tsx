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
import { PersonalPictograms } from './PersonalPictograms';

/**
 * Function to get the active page from the URL hash.
 * @returns {string} The active page.
 */
export const getActivePage = (): string => {
  let hash = window.location.hash;
  let page = hash.split('/');
  if (page.length > 1)
    return page[1];
  return page[0];
}

// Define the routes for the application using createHashRouter
export const router = createHashRouter([
  {
    path: '/',
    element: <MyApp />, // Main application component
    errorElement: <NotFound />, // Component to display for unknown routes
    children: [
      {
        path: 'welcomePage',
        element: <WelcomePage />, // Welcome page component
      },
      {
        path: 'login',
        element: <Login />, // Login page component
      },
      {
        path: 'personalPictograms',
        element: (
          <ProtectedRoute>
            <PersonalPictograms /> 
          </ProtectedRoute> // Personal pictograms component, protected route
        ),
      },
      {
        path: 'contacts',
        element: (
          <ProtectedRoute>
            <Contacts /> 
          </ProtectedRoute> // Contacts component, protected route
        ),
      },
      {
        path: 'chat/:chatId',
        element: (
          <ProtectedRoute>
            <ChatWrapper /> 
          </ProtectedRoute> // Chat wrapper component, protected route
        ),
      },
      {
        path: 'profile',
        element: (
          <ProtectedRoute>
            <Profile /> 
          </ProtectedRoute> // Profile component, protected route
        ),
      },
      {
        path: 'logout',
        element: <Logout />, // Logout component
      }
    ],
  },
]);
