const { cloudinary } = require('../services/cloudinary');

// POST /api/upload/image
async function uploadImage(req, res) {
  if (!req.file) return res.status(400).json({ error: 'No image file provided' });
  res.json({
    url: req.file.path,
    publicId: req.file.filename,
    width: req.file.width,
    height: req.file.height,
  });
}

// DELETE /api/upload/image/:publicId
async function deleteImage(req, res) {
  const { publicId } = req.params;
  await cloudinary.uploader.destroy(publicId);
  res.json({ message: 'Image deleted' });
}

module.exports = { uploadImage, deleteImage };
