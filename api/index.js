// Vercel serverless entry point: the whole Express API runs as one function.
// The frontend is served by Vercel as static files from frontend/dist (see vercel.json).
import { createApiApp } from "../backend/dist/app.js";

export default createApiApp();
