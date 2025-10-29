import "./polyfill";
import React from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { ConfigProvider, App as AntdApp } from 'antd';
import { iosTheme } from './styles/theme';
import { router } from './routes/AppRoutes';
import { SessionProvider } from './context/SessionContext';
import './styles/index.css';

const rootEl = document.getElementById('root')!;

createRoot(rootEl).render(
  <React.StrictMode>
    <ConfigProvider theme={iosTheme}>
      <AntdApp>
        <SessionProvider>
          <RouterProvider router={router} />
        </SessionProvider>
      </AntdApp>
    </ConfigProvider>
  </React.StrictMode>
);
