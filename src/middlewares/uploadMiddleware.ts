import path from "path";
import multer from "multer";
import { uploadDirectory } from "../config/paths";
import { AppError } from "../utils/errors";

const storage = multer.diskStorage({
  destination: uploadDirectory,
  filename: (_request, file, callback) => {
    const safeOriginalName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_");
    callback(null, `${Date.now()}-${safeOriginalName}`);
  }
});

const allowedExtensions = new Set([".json", ".key", ".keystore", ".jks", ".p12", ".pem"]);

export const keystoreUpload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024
  },
  fileFilter: (_request, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase();

    if (!allowedExtensions.has(extension)) {
      return callback(new AppError(400, "Invalid keystore file type"));
    }

    return callback(null, true);
  }
});
