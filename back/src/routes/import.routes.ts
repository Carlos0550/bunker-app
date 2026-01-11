import { Router } from "express";
import { importController } from "@/controllers/import.controller";
import { authenticate } from "@/middlewares/auth";
import { verifySubscription } from "@/middlewares";
import multer from "multer";
const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, 
  },
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
router.post("/analyze", upload.single("file"), importController.analyzeFile);
router.post("/process", importController.processImport);
router.post("/cancel", importController.cancelImport);
export default router;
