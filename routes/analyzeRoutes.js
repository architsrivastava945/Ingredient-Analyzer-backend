import express from "express";
import { showScanner, analyzeImage } from "../controllers/analyzeController.js";
import upload from "../middleware/uploadMiddleware.js";

const router = express.Router();

// GET / — show the scanner page
router.get("/", showScanner);

// POST /analyze — process the image and show results
router.post("/analyze", upload.single("image"), analyzeImage);

export default router;