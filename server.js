import express from "express";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import analyzeRoutes from "./routes/analyzeRoutes.js";
import { errorHandler } from "./middleware/errorMiddleware.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// View engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Static files
app.use(express.static(path.join(__dirname, "public")));

// Body parsers
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Routes
app.use("/", analyzeRoutes);

app.use(errorHandler);

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});