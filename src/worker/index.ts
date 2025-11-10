import { Hono } from "hono";
import aiRoutes from "./routes/ai";

const app = new Hono<{ Bindings: Env }>();

app.route("/api/ai", aiRoutes);

export default app;
