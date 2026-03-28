import multer from 'multer'
import type { Request } from 'express'

const storage = multer.memoryStorage()

function fileFilter(_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) {
  const allowed = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png']
  if (allowed.includes(file.mimetype)) {
    cb(null, true)
  } else {
    cb(new Error('Only PDF, JPG, and PNG files are accepted'))
  }
}

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB
})
