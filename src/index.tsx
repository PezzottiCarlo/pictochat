import "./polyfill"

import React from 'react';
import ReactDOM from 'react-dom/client';
import './styles/index.css';
import { RouterProvider } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import { SessionProvider } from './context/SessionContext';
import { router } from './routes/AppRoutes';
import { NewMessage, NewMessageEvent } from 'telegram/events';


const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);


root.render(
  <React.StrictMode>
    <SessionProvider>
      <ConfigProvider
        theme={{
          token: {
            colorPrimary: "#722ed1",
            colorInfo: "#722ed1",
            fontSize: 18,
            fontFamily: "Arial",
          },
        }}
      >
        <RouterProvider router={router} />
      </ConfigProvider>
    </SessionProvider>
  </React.StrictMode>
);
