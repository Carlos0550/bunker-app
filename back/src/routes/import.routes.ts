import { Router } from "express";
import { importController } from "@/controllers/import.controller";
import { authenticate } from "@/middlewares/auth";
import { verifySubscription } from "@/middlewares";
import multer from "multer";
import createHttpError from "http-errors";

const router = Router();

const upload = multer({
  dest: "uploads/tmp/",
  limits: { fileSize: 1024 * 1024 * 50 }, // 50MB limit
  fileFilter: (_req, file, cb) => {
    const allowedMimes = [
      "text/csv",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/csv",
      "text/plain",
    ];
    const allowedExtensions = ["csv", "xls", "xlsx"];
    const extension = file.originalname.split(".").pop()?.toLowerCase();

    if (allowedMimes.includes(file.mimetype) || allowedExtensions.includes(extension || "")) {
      cb(null, true);
    } else {
      cb(new Error("Solo se permiten archivos CSV, XLS o XLSX"));
    }
  },
});

router.use(authenticate);
router.use(verifySubscription);

router.get("/columns", importController.getSystemColumns);

router.post("/analyze", (req, res, next) => {
  upload.single("file")(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return next(
          createHttpError(400, "El archivo es demasiado grande. El límite es de 50MB.")
        );
      }
      return next(createHttpError(400, `Error de subida: ${err.message}`));
    } else if (err) {
      return next(err);
    }
    next();
  });
}, importController.analyzeFile);

router.post("/validate", importController.validateImport);
router.post("/process", importController.processImport);
router.post("/cancel", importController.cancelImport);

export default router;
