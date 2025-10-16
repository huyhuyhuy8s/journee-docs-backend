import { Router } from "express";
import { documentsController } from "../controllers/documents.controller";
import { authMiddleware } from "../middlewarer/auth.middleware";

const router = Router();

// All document routes require authentication
router.use(authMiddleware);

// Document CRUD operations
router.get("/", documentsController.getDocuments);
router.post("/", documentsController.createDocument);
router.get("/:id", documentsController.getDocument);
router.put("/:id", documentsController.updateDocument);
router.delete("/:id", documentsController.deleteDocument);

// Document collaboration operations
router.post("/:id/invite", documentsController.inviteCollaborator);
router.delete("/:id/collaborators/:userId", documentsController.removeCollaborator);
router.patch("/:id/rename", documentsController.renameDocument);

// Document access operations
router.get("/:id/access", documentsController.getDocumentAccess);
router.patch("/:id/access", documentsController.updateDocumentAccess);

export default router;