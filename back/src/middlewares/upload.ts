import multer, { FileFilterCallback } from "multer";
import { Request } from "express";
import createHttpError from "http-errors";
const DEFAULT_ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/csv",
  "text/plain",
];

const DEFAULT_MAX_FILES = 5;
interface UploadOptions {
  allowedTypes?: string[];
  maxFileSize?: number;
  maxFiles?: number;
}
function createUploadMiddleware(options: UploadOptions = {}) {
  const allowedTypes = options.allowedTypes || DEFAULT_ALLOWED_TYPES;
  const maxFileSize = options.maxFileSize;
  const fileFilter = (
    _req: Request,
    file: Express.Multer.File,
    cb: FileFilterCallback
  ) => {
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        createHttpError(
          400,
          `Tipo de archivo no permitido: ${file.mimetype}. Permitidos: ${allowedTypes.join(", ")}`
        )
      );
    }
  };
  return multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: maxFileSize,
      files: options.maxFiles || DEFAULT_MAX_FILES,
    },
    fileFilter,
  });
}
const upload = createUploadMiddleware();
export function uploadSingle(fieldName: string = "file") {
  return upload.single(fieldName);
}
export function uploadMultiple(fieldName: string = "files", maxCount: number = 5) {
  return upload.array(fieldName, maxCount);
}
export function uploadFields(fields: { name: string; maxCount: number }[]) {
  return upload.fields(fields);
}
export function createUploader(options: UploadOptions) {
  return createUploadMiddleware(options);
}
export const imageUploader = createUploadMiddleware({
  allowedTypes: ["image/jpeg", "image/png", "image/gif", "image/webp"],
  maxFileSize: 5 * 1024 * 1024, 
});
export const documentUploader = createUploadMiddleware({
  allowedTypes: [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "text/csv",
    "text/plain",
  ],
  maxFileSize: 20 * 1024 * 1024, 
});
export { upload };
