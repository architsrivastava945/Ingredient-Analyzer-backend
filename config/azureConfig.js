import dotenv from "dotenv";
dotenv.config();

export const azureConfig = {
    endpoint: process.env.AZURE_ENDPOINT,
    key: process.env.AZURE_KEY,
};