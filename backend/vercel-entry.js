// Vercel "Services" entrypoint for the backend (Express) service.
// The service build compiles TypeScript to dist/ first; Vercel runs this exported app as a function.
// Requests arrive with their full path (/api/...), which matches the API's /api mount.
import { createApiApp } from "./dist/app.js";

export default createApiApp();
