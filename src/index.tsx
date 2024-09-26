import "./polyfill";
import React from 'react';
import ReactDOM from 'react-dom/client';
import './styles/index.css';
import { RouterProvider } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import { SessionProvider } from './context/SessionContext';
import { router } from './routes/AppRoutes';
import { NewMessage, NewMessageEvent } from 'telegram/events';

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);

export const themeConfig = {
  token: {
    colorPrimary: "#722ed1",
    colorInfo: "#722ed1",     
    fontSize: 14            
  },
};

root.render(
  <React.StrictMode>
    <SessionProvider>
      <ConfigProvider theme={themeConfig}>
        <RouterProvider router={router} />
      </ConfigProvider>
    </SessionProvider>
  </React.StrictMode>
);
