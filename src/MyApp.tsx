import { App } from "antd";
import { useSession } from "./context/SessionContext";

function MyApp() {
  const { session } = useSession();

  return (
    <App>
      Pictochat
    </App>
  );
}

export default MyApp;
