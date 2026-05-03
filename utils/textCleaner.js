// Strips everything that isn't the ingredient list from raw OCR text

const NOISE_PATTERNS = [
    /fssai\s*lic\.?\s*no\.?[\s\S]*?\d+/gi,     // FSSAI license numbers
    /best before[\s\S]*?[\d\/]+/gi,              // Best before dates
    /mfg\.?\s*date[\s\S]*?[\d\/]+/gi,           // Manufacturing dates
    /exp\.?\s*date[\s\S]*?[\d\/]+/gi,            // Expiry dates
    /manufactured by[\s\S]*?\./gi,               // Manufacturer address
    /marketed by[\s\S]*?\./gi,                   // Marketer address
    /packed by[\s\S]*?\./gi,                     // Packer address
    /customer care[\s\S]*?\d+/gi,                // Helpline numbers
    /www\.[^\s]+/gi,                             // URLs
    /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-z]+/gi, // Emails
    /\b\d{10,}\b/g,                              // Long digit strings (phone/barcode)
    /net (wt|weight)\.?[\s\S]*?g\b/gi,          // Net weight
    /nutritional info[\s\S]*?$/gi,               // Nutritional table onwards
    /nutrition facts[\s\S]*?$/gi,
];

// Tries to isolate just the ingredient block
function extractIngredientBlock(text) {
    const lower = text.toLowerCase();

    // Find where the ingredient list starts
    const startKeywords = [
        "ingredients:", "ingredients :", "ingredient:",
        "contains:", "composition:", "made with:"
    ];

    let startIdx = -1;
    for (const kw of startKeywords) {
        const idx = lower.indexOf(kw);
        if (idx !== -1) {
            startIdx = idx + kw.length;
            break;
        }
    }

    if (startIdx === -1) {
        // No clear marker found — return full cleaned text
        return text;
    }

    // Find where the ingredient list likely ends
    const endKeywords = [
        "nutritional", "nutrition facts", "allergen",
        "manufactured", "marketed", "best before",
        "storage", "directions", "contains added"
    ];

    let endIdx = text.length;
    for (const kw of endKeywords) {
        const idx = lower.indexOf(kw, startIdx);
        if (idx !== -1 && idx < endIdx) {
            endIdx = idx;
        }
    }

    return text.substring(startIdx, endIdx).trim();
}

export function cleanOcrText(rawText) {
    if (!rawText) return "";

    let cleaned = rawText;

    // Step 1: Remove known noise patterns
    for (const pattern of NOISE_PATTERNS) {
        cleaned = cleaned.replace(pattern, " ");
    }

    // Step 2: Extract just the ingredient block
    cleaned = extractIngredientBlock(cleaned);

    // Step 3: Normalize whitespace
    cleaned = cleaned
        .replace(/\s+/g, " ")
        .trim();

    return cleaned;
}