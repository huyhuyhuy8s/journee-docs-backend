import { Request, Response } from "express";
import { uploadService } from "../services/upload.service";
import { AuthRequest } from "../types";

class UploadController {
  async uploadFile(req: Request & AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: "User not authenticated",
        });
        return;
      }

      if (!req.file) {
        res.status(400).json({
          success: false,
          error: "No file uploaded",
        });
        return;
      }

      const result = await uploadService.uploadFile(req.file);

      res.json({
        success: true,
        data: {
          url: result.url,
          fileName: result.fileName,
          fileType: result.fileType,
          fileSize: result.fileSize,
          publicId: result.publicId,
        },
        message: "File uploaded successfully",
      });
    } catch (error) {
      console.error("Upload file error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to upload file",
      });
    }
  }

  async uploadBase64Image(
    req: Request & AuthRequest,
    res: Response
  ): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: "User not authenticated",
        });
        return;
      }

      const { imageData } = req.body;

      if (!imageData || typeof imageData !== "string") {
        res.status(400).json({
          success: false,
          error: "Image data is required",
        });
        return;
      }

      const result = await uploadService.uploadBase64Image(imageData);

      res.json({
        success: true,
        data: {
          url: result.url,
          fileName: result.fileName,
          fileType: result.fileType,
          fileSize: result.fileSize,
          publicId: result.publicId,
        },
        message: "Image uploaded successfully",
      });
    } catch (error) {
      console.error("Upload base64 image error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to upload image",
      });
    }
  }

  async deleteFile(req: Request & AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: "User not authenticated",
        });
        return;
      }

      const { publicId } = req.params;

      if (!publicId) {
        res.status(400).json({
          success: false,
          error: "Public ID is required",
        });
        return;
      }

      await uploadService.deleteFile(publicId);

      res.json({
        success: true,
        message: "File deleted successfully",
      });
    } catch (error) {
      console.error("Delete file error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to delete file",
      });
    }
  }
}

export const uploadController = new UploadController();
