import { PORT } from "./apidocs/index.js";
import server from "./app.js";

try {
  server.listen(PORT, () => `Server online`);
} catch (error) {
  console.error(error);
  process.exit(1);
}
