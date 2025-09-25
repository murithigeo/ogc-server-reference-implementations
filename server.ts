import app from "./api.ts";
import process from "node:process";
import { addresses } from "./utils/lanhost.ts";
const PORT = process.env.PORT || 80;

app.listen(PORT, () => {
  console.log(`Server is Live:`);
  console.log(addresses.map((p) => `\thttp://${p}:${PORT}`).join("\n"));
});

addEventListener("hmr", () => {
  console.log(`Server is Live:`);
  console.log(addresses.map((p) => `\thttp://${p}:${PORT}`).join("\n"));
});
