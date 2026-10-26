/**
 * This file contains the main MyApp component which handles the core logic of the application.
 * It includes authentication checks, routing, and setting up update handlers for the Telegram API.
 */
import { useEffect, useMemo } from "react";
import { App } from "antd";
import { useIsAuthenticated, useIsSetting } from "./context/SessionContext";
import { useNavigate, Outlet } from "react-router-dom";
import { Controller } from "./lib/Controller";
import { NewMessage } from "telegram/events";
import { getActivePage } from "./routes/AppRoutes";

export const updateManager = new Map<string, (update: any, type: number) => void>();

function MyApp() {
  const { message } = App.useApp();
  const isSetting = useIsSetting();
  const isAuthenticated = useIsAuthenticated();
  const navigate = useNavigate();

  // derive current page to avoid recomputes
  const activePage = useMemo(() => getActivePage(), []);

  useEffect(() => {
    if (!isAuthenticated) return;
    let disposeNew: undefined | (() => void);
    let disposeStatus: undefined | (() => void);
    (async () => {
      disposeNew = await Controller.tgApi.handleUpdates?.((update: any) => {
        updateManager.get(getActivePage())?.(update, 0);
      }, new NewMessage());

      disposeStatus = await Controller.tgApi.handleUpdates?.((update: any) => {
        if ((update.className as any) === "UpdateUserStatus") {
          updateManager.get(getActivePage())?.(update, 1);
        }
      });
    })();

    return () => {
      try { disposeNew && disposeNew(); } catch {}
      try { disposeStatus && disposeStatus(); } catch {}
    };
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isSetting) {
      navigate("/profile", { replace: true });
    } else if (!isAuthenticated) {
      navigate("/login", { replace: true });
    } else {
      navigate("/contacts", { replace: true });
    }
  }, [isAuthenticated, isSetting, navigate, message, activePage]);

  return (
    <App>
      <Outlet />
    </App>
  );
}

export default MyApp;
