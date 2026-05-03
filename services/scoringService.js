import { createRequire } from "module";
const require = createRequire(import.meta.url);
const ingredientDB = require("../data/ingredients.json");

// Build a flat lookup map: every name and alias → ingredient entry
const ingredientMap = new Map();
for (const ingredient of ingredientDB) {
    ingredientMap.set(ingredient.name.toLowerCase().trim(), ingredient);
    for (const alias of ingredient.aliases) {
        ingredientMap.set(alias.toLowerCase().trim(), ingredient);
    }
}

// Levenshtein distance for fuzzy matching
function levenshtein(a, b) {
    const matrix = Array.from({ length: b.length + 1 }, (_, i) => [i]);
    for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
    for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
            matrix[i][j] = b[i - 1] === a[j - 1]
                ? matrix[i - 1][j - 1]
                : 1 + Math.min(matrix[i - 1][j - 1], matrix[i - 1][j], matrix[i][j - 1]);
        }
    }
    return matrix[b.length][a.length];
}

// Try exact match first, then fuzzy match
function findIngredient(token) {
    const normalized = token.toLowerCase().trim();

    // 1. Exact match
    if (ingredientMap.has(normalized)) {
        return ingredientMap.get(normalized);
    }

    // 2. Fuzzy match (only for tokens long enough to be meaningful)
    if (normalized.length < 4) return null;

    let bestMatch = null;
    let bestDistance = Infinity;

    for (const [key, ingredient] of ingredientMap.entries()) {
        // Skip very short keys to avoid false matches
        if (key.length < 4) continue;
        const dist = levenshtein(normalized, key);
        // Allow edit distance of 2 for short tokens, 3 for longer ones
        const threshold = normalized.length > 10 ? 3 : 2;
        if (dist < bestDistance && dist <= threshold) {
            bestDistance = dist;
            bestMatch = ingredient;
        }
    }

    return bestMatch;
}

// Tokenize OCR text into individual ingredient candidates
function tokenizeIngredients(rawText) {
    return rawText
        .toLowerCase()
        // Remove content inside parentheses (e.g. "(contains sulphites)")
        .replace(/\(.*?\)/g, " ")
        // Split on common separators: comma, semicolon, pipe, bullet
        .split(/[,;|•\n]+/)
        .map(token => token
            .replace(/[^a-z0-9\s]/g, " ")  // remove special chars
            .replace(/\s+/g, " ")           // collapse spaces
            .trim()
        )
        .filter(token => token.length > 2);
}

// Determine overall verdict label from final score
function getOverallVerdict(score) {
    if (score >= 70) return "Clean";
    if (score >= 45) return "Moderate";
    if (score >= 20) return "Unhealthy";
    return "Hazard";
}

// Main scoring function
export function calculateHealthScore(extractedText) {
    const tokens = tokenizeIngredients(extractedText);

    const matched = [];
    const unmatched = [];
    let totalScore = 50; // Start from neutral baseline

    const categorySummary = {};

    for (const token of tokens) {
        const ingredient = findIngredient(token);

        if (ingredient) {
            // Avoid counting the same ingredient twice
            const alreadyCounted = matched.find(m => m.name === ingredient.name);
            if (alreadyCounted) continue;

            totalScore += ingredient.score;

            matched.push({
                name: ingredient.name,
                displayName: token,          // what OCR actually saw
                score: ingredient.score,
                verdict: ingredient.verdict,
                description: ingredient.description,
                category: ingredient.category,
                risk_flags: ingredient.risk_flags,
                avoid_if: ingredient.avoid_if,
            });

            // Group by category for UI summary
            if (!categorySummary[ingredient.category]) {
                categorySummary[ingredient.category] = [];
            }
            categorySummary[ingredient.category].push(ingredient.name);

        } else {
            unmatched.push(token);
        }
    }

    // Clamp score between 0 and 100
    const finalScore = Math.max(0, Math.min(100, totalScore));

    // Separate matched ingredients by verdict for easy rendering
    const hazardIngredients = matched.filter(i => i.verdict === "Hazard");
    const unhealthyIngredients = matched.filter(i => i.verdict === "Unhealthy");
    const moderateIngredients = matched.filter(i => i.verdict === "Moderate");
    const healthyIngredients = matched.filter(i => i.verdict === "Healthy" || i.verdict === "Neutral");

    return {
        score: finalScore,
        verdict: getOverallVerdict(finalScore),
        totalIngredients: tokens.length,
        matchedCount: matched.length,
        unmatchedCount: unmatched.length,
        matched,
        unmatched,
        hazardIngredients,
        unhealthyIngredients,
        moderateIngredients,
        healthyIngredients,
        categorySummary,
    };
}