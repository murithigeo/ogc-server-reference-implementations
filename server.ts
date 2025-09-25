import app from "./index.ts";
import process from "node:process";
// import { addresses } from "./utils/lanhost.ts";
const PORT = process.env.PORT || 80;
// const NODE_ENV = process.env.NODE_ENV || "development";
app.listen(PORT, () => {
  console.log(`Server is Live: ${PORT}`);
});

/*
if (NODE_ENV === "development") {
  console.log(addresses.map((p) => `\thttp://${p}:${PORT}`).join("\n"));

  addEventListener("hmr", () => {
    console.log(`Server is Live:`);
    console.log(addresses.map((p) => `\thttp://${p}:${PORT}`).join("\n"));
  });
}
*/
