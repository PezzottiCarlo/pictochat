/**
 * This file contains the main MyApp component which handles the core logic of the application.
 * It includes authentication checks, routing, and setting up update handlers for the Telegram API.
 */
import { useEffect } from "react";
import { App } from "antd";
import { useIsAuthenticated, useIsSetting } from "./context/SessionContext";
import { useNavigate, Outlet } from "react-router-dom";
import { Controller } from "./lib/Controller";
import { NewMessage } from "telegram/events";
import { getActivePage } from "./routes/AppRoutes";


export const updateManager = new Map<string, (update: any, type: number) => void>();


/**
 * MyApp component handles the main application logic including authentication and routing.
 * It sets up update handlers for Telegram API and navigates based on authentication status.
 */
function MyApp() {
  const isSetting = useIsSetting();
  const isAuthenticated = useIsAuthenticated();
  const navigate = useNavigate();

  useEffect(() => {
    Controller.tgApi.handleUpdates((update) => {
      updateManager.get(getActivePage())?.(update, 0);
    }, new NewMessage());
    Controller.tgApi.handleUpdates((update) => {
      if ((update.className as any) === "UpdateUserStatus") {
        updateManager.get(getActivePage())?.(update, 1);
      }
    });
  }, []);


  useEffect(() => {
    if (!isSetting) {
      navigate("/settings");
    } else if (!isAuthenticated) {
      navigate("/login");
    } else {
      navigate("/contacts");
    }
  }, [isAuthenticated, isSetting, navigate]);

  return (
    <App>
      <Outlet />
    </App>
  );
}

export default MyApp;
