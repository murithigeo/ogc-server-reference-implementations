import { PORT } from "./apidocs/index.js";
import app from "./app.js";

app.listen(PORT,()=>console.log(`listening on ${PORT}`));