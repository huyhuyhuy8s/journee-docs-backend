import { Router } from "express";
import { getFAQAnswer } from "../controllers/faq.controller";

const router = Router();

// GET /api/faq/search?query=question
router.get("/search", getFAQAnswer);

// POST /api/faq/search (alternative endpoint for POST requests)
router.post("/search", getFAQAnswer);

export default router;
