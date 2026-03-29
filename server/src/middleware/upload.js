const multer = require('multer')

const upload = multer({
  storage: multer.memoryStorage(),
<<<<<<< HEAD
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
=======
  limits: { fileSize: 4 * 1024 * 1024 }, // 4MB — stays under Vercel's 4.5MB limit
>>>>>>> c108011
  fileFilter: (req, file, cb) => {
    const allowed = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
    if (allowed.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error('Only PDF and image files are allowed'))
    }
  },
})

module.exports = upload
