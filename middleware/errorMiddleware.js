export const errorHandler = (err, req, res, next) => {
    console.error("Unhandled error:", err.message);
    res.status(500).render("index", {
        error: "An unexpected error occurred. Please try again."
    });
};