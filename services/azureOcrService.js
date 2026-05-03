import axios from "axios";
import { azureConfig } from "../config/azureConfig.js";

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export const extractTextFromImage = async (imageBuffer) => {
    try {
        // Step 1: Submit image for async OCR processing
        const submitResponse = await axios.post(
            `${azureConfig.endpoint}/vision/v3.2/read/analyze`,
            imageBuffer,
            {
                headers: {
                    "Ocp-Apim-Subscription-Key": azureConfig.key,
                    "Content-Type": "application/octet-stream",
                },
            }
        );

        const operationLocation = submitResponse.headers["operation-location"];
        if (!operationLocation) throw new Error("No operation-location header returned from Azure.");

        // Step 2: Poll for results (Azure processes asynchronously)
        let resultResponse;
        let status = "running";
        const maxRetries = 10;
        let attempts = 0;

        while (status !== "succeeded" && attempts < maxRetries) {
            await sleep(1000);
            resultResponse = await axios.get(operationLocation, {
                headers: {
                    "Ocp-Apim-Subscription-Key": azureConfig.key,
                },
            });
            status = resultResponse.data.status;
            attempts++;
        }

        if (status !== "succeeded") {
            throw new Error("Azure OCR did not complete in time.");
        }

        // Step 3: Extract and join all detected text lines
        const readResults = resultResponse.data.analyzeResult.readResults;
        const extractedText = readResults
            .flatMap(page => page.lines)
            .map(line => line.text)
            .join(" ");

        return extractedText || null;

    } catch (error) {
        console.error("Azure OCR error:", error.message);
        return null;
    }
};