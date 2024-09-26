import { App } from "antd";
import { useSession } from "./context/SessionContext";
import SettingsPage from "./routes/Settings";

function MyApp() {
  const { session } = useSession();

  return (
    <App>
      <SettingsPage/>
    </App>
  );
}

export default MyApp;
