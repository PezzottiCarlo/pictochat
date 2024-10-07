import "./polyfill";
import React from 'react';
import ReactDOM from 'react-dom/client';
import './styles/index.css';
import { RouterProvider } from 'react-router-dom';
import { ConfigProvider, ThemeConfig } from 'antd';
import { SessionProvider } from './context/SessionContext';
import { router } from './routes/AppRoutes';
import { theme } from 'antd';
import themes from "./data/themes.json" 

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);

if (window.matchMedia('(display-mode: standalone)').matches) {
  //alert("App correctly installed")
  //do stuff if this on
}

let themeNumber = 4;

export const themeConfig: ThemeConfig = {
  components: themes[themeNumber].components,
  cssVar: themes[themeNumber].cssVar,
  token: themes[themeNumber].token,
  algorithm: (themes[themeNumber].algorithm === "dark")?theme.darkAlgorithm:theme.defaultAlgorithm
}

root.render(
  <SessionProvider>
    <ConfigProvider theme={themeConfig}>
      <RouterProvider router={router} />
    </ConfigProvider>
  </SessionProvider>
);
