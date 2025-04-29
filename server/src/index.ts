import { PORT } from "./apidocs/index.ts";
import server from "./app.ts";

try {
    server.listen(3000,()=>console.log(`Listening on PORT: ${PORT}`))
} catch (error) {
    console.error(error)
    process.exit(1)
}