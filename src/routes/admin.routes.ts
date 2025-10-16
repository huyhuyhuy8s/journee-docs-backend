import { Router } from "express";
import { documentService } from "../services/document.service";
import { config } from "../../config/environment";
import * as fs from "fs";
import * as path from "path";

const router = Router();

// Only enable admin routes in development
if (config.nodeEnv === "development") {
  // Get all documents (admin view)
  router.get("/documents", async (req, res) => {
    try {
      const documents = await documentService.getAllDocuments();
      res.json({
        success: true,
        data: documents,
        count: documents.length,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: "Failed to get all documents",
      });
    }
  });

  // Get raw data file content
  router.get("/raw-data", async (req, res) => {
    try {
      const DATA_DIR = path.join(__dirname, "../../data");
      const DOCUMENTS_FILE = path.join(DATA_DIR, "documents.json");

      if (fs.existsSync(DOCUMENTS_FILE)) {
        const rawData = fs.readFileSync(DOCUMENTS_FILE, "utf8");
        res.json({
          success: true,
          data: {
            fileExists: true,
            fileContent: JSON.parse(rawData),
            filePath: DOCUMENTS_FILE,
          },
        });
      } else {
        res.json({
          success: true,
          data: {
            fileExists: false,
            filePath: DOCUMENTS_FILE,
            directoryExists: fs.existsSync(DATA_DIR),
          },
        });
      }
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });

  // Reset to default documents
  router.post("/reset", async (req, res) => {
    try {
      await documentService.resetToDefaults();
      res.json({
        success: true,
        message: "Documents reset to defaults",
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: "Failed to reset documents",
      });
    }
  });

  // Create test document for current user
  router.post("/create-test/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const document = await documentService.createDocument({
        title: `Test Document for ${userId}`,
        createdBy: userId,
        collaborators: [userId],
      });

      res.json({
        success: true,
        data: document,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: "Failed to create test document",
      });
    }
  });
}

export default router;
