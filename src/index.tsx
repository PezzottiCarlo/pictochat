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

export const themeConfig: ThemeConfig = {
  token: {
    colorPrimary: "#2f54eb",
    colorInfo: "#2f54eb",
    fontSize: 22,
    sizeStep: 4,
    sizeUnit: 4,
    wireframe: false,
    colorSuccess: "#a0d911"
  },
  cssVar: true,
  algorithm: theme.darkAlgorithm
};

root.render(
  <SessionProvider>
    <ConfigProvider theme={themeConfig}>
      <RouterProvider router={router} />
    </ConfigProvider>
  </SessionProvider>
);
