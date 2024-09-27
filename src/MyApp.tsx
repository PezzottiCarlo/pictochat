// MyApp.tsx
import React, { useEffect } from "react";
import { App } from "antd";
import { useSession, useIsAuthenticated, useIsSetting } from "./context/SessionContext";
import { useNavigate, Outlet } from "react-router-dom";

function MyApp() {
  const { session } = useSession();
  const isSetting = useIsSetting();
  const isAuthenticated = useIsAuthenticated();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isSetting) {
      navigate("/settings");
    } else if (!isAuthenticated) {
      navigate("/login");
    } else {
      navigate("/contacts");
    }
  }, [session, isAuthenticated, navigate]);

  return (
    <App>
      <Outlet />
    </App>
  );
}

export default MyApp;
