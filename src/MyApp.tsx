// MyApp.tsx
import React, { useEffect } from "react";
import { App } from "antd";
import { useSession, useIsAuthenticated, useIsSetting } from "./context/SessionContext";
import { useNavigate, Outlet } from "react-router-dom";
import { Controller } from "./lib/Controller";
import { NewMessage } from "telegram/events";

export const updateManager = new Map<string, (update: any) => void>();

function MyApp() {
  const isSetting = useIsSetting();
  const isAuthenticated = useIsAuthenticated();
  const navigate = useNavigate();

  useEffect(() => {
    Controller.tgApi.handleUpdates((update) => {
      updateManager.forEach((callback) => {
        callback(update);
      });
    },new NewMessage());
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
