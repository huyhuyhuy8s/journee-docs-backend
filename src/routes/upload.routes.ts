import { Router } from "express";
import { uploadController } from "../controllers/upload.controller";
import { authMiddleware } from "../middlewarer/auth.middleware";
import multer from "multer";

const router = Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow images, documents, and other common file types
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
      "image/svg+xml",
      "application/pdf",
      "text/plain",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type"));
    }
  },
});

// All upload routes require authentication
router.use(authMiddleware);

// File upload endpoints
router.post("/file", upload.single("file"), uploadController.uploadFile);
router.post("/image/base64", uploadController.uploadBase64Image);
router.delete("/:publicId", uploadController.deleteFile);

export default router;
