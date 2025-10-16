import { Router } from "express";
import multer from "multer";
import { uploadController } from "../controllers";
import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();

// Configure multer for file uploads
const upload = multer({
  dest: "uploads/", // temporary directory
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow images and documents
    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "image/webp",
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain",
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new Error(
          "Invalid file type. Only images, PDFs, Word documents, and text files are allowed."
        )
      );
    }
  },
});

// POST /api/upload/file - Upload file
router.post(
  "/file",
  authMiddleware,
  upload.single("file"),
  uploadController.uploadFile
);

// POST /api/upload/image - Upload base64 image
router.post("/image", authMiddleware, uploadController.uploadBase64Image);

// DELETE /api/upload/:publicId - Delete file
router.delete("/:publicId", authMiddleware, uploadController.deleteFile);

export default router;
