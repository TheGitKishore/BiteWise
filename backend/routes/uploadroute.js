import express from 'express';
import multer from 'multer';
import { GridFSBucket, ObjectId } from 'mongodb';
import { getDB } from '../db_mongodb/db.js';

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

router.post('/diary-photo', upload.single('photo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image uploaded. Use form-data key "photo".',
        photoUri: null,
      });
    }

    if (!req.file.mimetype?.startsWith('image/')) {
      return res.status(400).json({
        success: false,
        message: 'Only image files are allowed.',
        photoUri: null,
      });
    }

    const db = getDB();
    const bucket = new GridFSBucket(db, { bucketName: 'diary_photos' });
    const filename = req.file.originalname || `diary-${Date.now()}.jpg`;

    const uploadStream = bucket.openUploadStream(filename, {
      contentType: req.file.mimetype,
      metadata: {
        uploadedAt: new Date().toISOString(),
      },
    });

    await new Promise((resolve, reject) => {
      uploadStream.end(req.file.buffer, (err) => {
        if (err) return reject(err);
        return resolve();
      });
    });

    const fileId = uploadStream.id?.toString();
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const photoUri = `${baseUrl}/api/uploads/diary-photo/${fileId}`;

    return res.status(201).json({
      success: true,
      message: 'Photo uploaded successfully.',
      photoUri,
      data: {
        photoUri,
        fileId,
      },
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message || 'Photo upload failed.',
      photoUri: null,
    });
  }
});

router.get('/diary-photo/:fileId', async (req, res) => {
  try {
    const { fileId } = req.params;
    if (!ObjectId.isValid(fileId)) {
      return res.status(400).json({ success: false, message: 'Invalid file id.' });
    }

    const db = getDB();
    const bucket = new GridFSBucket(db, { bucketName: 'diary_photos' });
    const objectId = new ObjectId(fileId);

    const fileDoc = await db.collection('diary_photos.files').findOne({ _id: objectId });
    if (!fileDoc) {
      return res.status(404).json({ success: false, message: 'Photo not found.' });
    }

    if (fileDoc.contentType) res.set('Content-Type', fileDoc.contentType);
    if (typeof fileDoc.length === 'number') res.set('Content-Length', String(fileDoc.length));
    res.set('Cache-Control', 'public, max-age=86400');

    const downloadStream = bucket.openDownloadStream(objectId);
    downloadStream.on('error', () => {
      if (!res.headersSent) res.status(404).json({ success: false, message: 'Photo not found.' });
    });
    downloadStream.pipe(res);
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message || 'Failed to load photo.' });
  }
});

export default router;
