import { Router } from "express";
import { documentController } from "../controllers/document.controller";
import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();

// Test route without auth
router.get("/test", (req, res) => {
  res.json({
    success: true,
    message: "Documents route is working",
    timestamp: new Date().toISOString(),
  });
});

// Apply auth middleware to all other routes
router.use(authMiddleware);

// Document routes
router.post("/", documentController.createDocument);
router.get("/", documentController.getDocuments);
router.get("/by-room/:roomId", documentController.getDocumentByRoomId);
router.get("/:id", documentController.getDocument);
router.put("/:id", documentController.updateDocument);
router.patch("/:id/title", documentController.updateDocumentTitle); // Add this line
router.delete("/:id", documentController.deleteDocument);

// Collaborator management
router.post("/:id/collaborators", documentController.addCollaborator);
router.get("/:id/collaborators", documentController.getDocumentCollaborators);
router.delete("/:id/collaborators/:userId", documentController.removeCollaborator);

export default router;
