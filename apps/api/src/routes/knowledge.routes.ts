import { Router } from 'express';
import multer from 'multer';
import fs from 'fs';
import { KnowledgeController } from '../controllers/knowledge.controller';
import { authenticate } from '../middlewares/auth';
import { requireTenant } from '../middlewares/tenant';
import { requireRole } from '../middlewares/rbac';
import { config } from '../config';
import { OrgRole } from '@agentflow/shared';

const router = Router();

if (!fs.existsSync(config.uploadDir)) {
  fs.mkdirSync(config.uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, config.uploadDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + '-' + file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_'));
  },
});

const upload = multer({
  storage,
  limits: { fileSize: config.maxFileSize },
});

router.use(authenticate, requireTenant);

router.get('/', KnowledgeController.list);
router.get('/search', KnowledgeController.search);
router.post('/upload', requireRole(OrgRole.MEMBER), upload.single('file'), KnowledgeController.upload);
router.delete('/:documentId', requireRole(OrgRole.MEMBER), KnowledgeController.delete);

export default router;
