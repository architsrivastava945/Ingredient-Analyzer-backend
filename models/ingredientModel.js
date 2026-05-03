import { createRequire } from "module";
const require = createRequire(import.meta.url);
const ingredientDB = require("../data/ingredients.json");

// Returns the full ingredient list
export const getAllIngredients = () => ingredientDB;

// Returns a single ingredient by exact name or alias match
export const findByName = (name) => {
    const normalized = name.toLowerCase().trim();
    return ingredientDB.find(
        (ing) =>
            ing.name === normalized ||
            ing.aliases.includes(normalized)
    ) || null;
};