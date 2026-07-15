import multer from 'multer';

const storage = multer.memoryStorage();

/**
 * Hard cap on upload size (MB). Keep in sync with nginx `client_max_body_size`.
 * Sits below the paid-plan `maxFileSizeMb` (300–500) so the per-plan check stays
 * the meaningful gate; kept at 120 because multer buffers the whole file in memory
 * and the API container is memory-limited (raising further needs disk streaming).
 */
export const UPLOAD_MAX_MB = 120;

export const upload = multer({
  storage,
  limits: { fileSize: UPLOAD_MAX_MB * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    // Only PDF is supported end-to-end. PowerPoint was accepted here historically but has
    // no extractor (processContent routes SLIDE through pdf-parse, which throws on a .pptx
    // ZIP), so it silently FAILED during ingest. Reject it up front with a clear message
    // (mapped to a 400 in error.middleware) instead of accepting then failing.
    if (file.mimetype === 'application/pdf' || file.originalname.toLowerCase().endsWith('.pdf')) {
      cb(null, true);
    } else {
      cb(
        new Error(
          'Only PDF files are supported. Please export PowerPoint (.ppt/.pptx) to PDF and upload that.',
        ),
      );
    }
  },
});
