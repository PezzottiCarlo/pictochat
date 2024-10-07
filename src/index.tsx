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
    colorPrimary: "#2f54eb", // Colore principale per bottoni, link, etc.
    colorInfo: "#2f54eb", // Colore delle informazioni (alert, badge, etc.)
    colorSuccess: "#a0d911", // Colore per gli stati di successo
    fontSize: 22, // Dimensione del font globale
    sizeUnit: 4, // Unità base per le dimensioni
    sizeStep: 4, // Incremento per le dimensioni in scala
    wireframe: false, // Disabilita lo stile wireframe
  },
  components: {
    // Personalizzazioni per ogni componente
    Input: {
      paddingBlock: 10, // Padding verticale per gli input
      fontSize: 22, // Dimensione del font per gli input coerente con il font globale
    },
    Button: {
      fontSize: 22,
      controlHeight: 52,
    },
    Avatar: {
      sizeStep: 8, 
    },
    Badge: {
      fontSize: 18,
    },
    Typography: {
      fontSizeHeading1: 28,
      fontSizeHeading2: 26,
      fontSizeHeading3: 24,
      fontSizeHeading4: 22, 
    },
    
  },
  cssVar: true, // Usa le variabili CSS
  algorithm: theme.darkAlgorithm, // Usa il tema scuro di Ant Design
};

root.render(
  <SessionProvider>
    <ConfigProvider theme={themeConfig}>
      <RouterProvider router={router} />
    </ConfigProvider>
  </SessionProvider>
);
