import "./polyfill";
import React from 'react';
import ReactDOM from 'react-dom/client';
import './styles/index.css';
import { RouterProvider } from 'react-router-dom';
import { ConfigProvider, ThemeConfig } from 'antd';
import { SessionProvider } from './context/SessionContext';
import { router } from './routes/AppRoutes';
import { theme } from 'antd';

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);

if (window.matchMedia('(display-mode: standalone)').matches) {
  //alert("App correctly installed")
  //do stuff if this on
}

export const themeConfig : ThemeConfig = {
  token: {
    colorPrimary: "#722ed1",
    colorInfo: "#722ed1",
    fontSize: 14
  },
  cssVar: true,
  algorithm:theme.darkAlgorithm
};

root.render(
  <SessionProvider>
    <ConfigProvider  theme={themeConfig}>
      <RouterProvider router={router} />
    </ConfigProvider>
  </SessionProvider>
);
