import { v2 as cloudinary } from "cloudinary";
import { config } from "../../config/environment";

// Configure Cloudinary
cloudinary.config({
  cloud_name: config.cloudinaryName,
  api_key: config.cloudinaryApiKey,
  api_secret: config.cloudinaryApiSecret,
});

interface UploadResult {
  url: string;
  publicId: string;
  fileName: string;
  fileType: string;
  fileSize: number;
}

class UploadService {
  async uploadFile(
    file: Express.Multer.File,
    folder: string = "journee-docs"
  ): Promise<UploadResult> {
    try {
      const result = await cloudinary.uploader.upload(file.path, {
        folder,
        resource_type: "auto",
        public_id: `${Date.now()}_${file.originalname}`,
      });

      return {
        url: result.secure_url,
        publicId: result.public_id,
        fileName: file.originalname,
        fileType: file.mimetype,
        fileSize: file.size,
      };
    } catch (error) {
      console.error("Upload service error:", error);
      throw new Error("Failed to upload file");
    }
  }

  async deleteFile(publicId: string): Promise<boolean> {
    try {
      await cloudinary.uploader.destroy(publicId);
      return true;
    } catch (error) {
      console.error("Delete file error:", error);
      throw new Error("Failed to delete file");
    }
  }

  async uploadBase64Image(
    base64Data: string,
    folder: string = "journee-docs"
  ): Promise<UploadResult> {
    try {
      const result = await cloudinary.uploader.upload(base64Data, {
        folder,
        resource_type: "image",
        public_id: `img_${Date.now()}`,
      });

      return {
        url: result.secure_url,
        publicId: result.public_id,
        fileName: `image_${Date.now()}.${result.format}`,
        fileType: `image/${result.format}`,
        fileSize: result.bytes,
      };
    } catch (error) {
      console.error("Upload base64 image error:", error);
      throw new Error("Failed to upload image");
    }
  }
}

export const uploadService = new UploadService();
