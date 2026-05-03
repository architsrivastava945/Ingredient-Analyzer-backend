import { extractTextFromImage } from "../services/azureOcrService.js";
import { calculateHealthScore } from "../services/scoringService.js";

// GET / — render the scanner page
export const showScanner = (req, res) => {
    res.render("index");
};

// POST /analyze — process image and render results page
export const analyzeImage = async (req, res) => {
    try {
        if (!req.file) {
            return res.render("index", {
                error: "No image uploaded. Please take or upload a photo."
            });
        }

        const extractedText = await extractTextFromImage(req.file.buffer);

        if (!extractedText) {
            return res.render("index", {
                error: "Could not extract text from the image. Please try a clearer photo."
            });
        }

        const analysisResult = calculateHealthScore(extractedText);

        res.render("result", { result: analysisResult });

    } catch (error) {
        console.error("analyzeImage error:", error);
        res.render("index", {
            error: "Something went wrong while analyzing the image. Please try again."
        });
    }
};