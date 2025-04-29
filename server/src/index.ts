import { PORT } from "./apidocs/index.js";
import server from "./app.js";

try {
    server.listen(3000,()=>console.log(`Listening on PORT: ${PORT}`))
} catch (error) {
    console.error(error)
    process.exit(1)
}