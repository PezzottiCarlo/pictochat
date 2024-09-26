import { App } from "antd";
import { useSession } from "./context/SessionContext";

function MyApp() {
  const { session } = useSession();

  return (
    <App>
    </App>
  );
}

export default MyApp;
