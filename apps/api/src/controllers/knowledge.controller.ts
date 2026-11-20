import { Response, NextFunction } from 'express';
import fs from 'fs';
import path from 'path';
import { DocumentProcessingStatus } from '@agentflow/shared';
import { AuthenticatedRequest } from '../middlewares/auth';
import { KnowledgeDocument } from '../models';
import { AppError } from '../middlewares/errorHandler';
import { BillingService } from '../services/billing.service';
import { AuditService } from '../services/audit.service';

export class KnowledgeController {
  public static async list(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const docs = await KnowledgeDocument.find({ organizationId: req.organizationId }).sort({ createdAt: -1 });
      res.json({ success: true, data: docs.map((d) => d.toJSON()) });
    } catch (error) {
      next(error);
    }
  }

  public static async upload(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const file = req.file;
      const { title } = req.body;

      if (!file) {
        throw new AppError('File upload is required', 400, 'FILE_REQUIRED');
      }

      await BillingService.assertWithinLimit(req.organizationId!, 'storage');

      const ext = path.extname(file.originalname).toLowerCase();
      let textContent = '';

      if (['.txt', '.md', '.csv', '.json'].includes(ext)) {
        textContent = fs.readFileSync(file.path, 'utf8');
      } else {
        textContent = `[Parsed content of document ${file.originalname}]`;
      }

      // Calculate chunks (approx 1000 characters per chunk)
      const chunkCount = Math.max(1, Math.ceil(textContent.length / 1000));

      const doc = await KnowledgeDocument.create({
        organizationId: req.organizationId,
        title: title || file.originalname,
        fileName: file.originalname,
        fileType: ext.replace('.', '') || 'unknown',
        fileSize: file.size,
        storagePath: file.path,
        parsedContent: textContent,
        chunkCount,
        status: DocumentProcessingStatus.READY,
        uploaderId: req.user!._id,
      });

      await AuditService.record({
        organizationId: req.organizationId!,
        actorId: req.user!._id.toString(),
        actorEmail: req.user!.email,
        action: 'DOCUMENT_UPLOADED',
        resourceType: 'KnowledgeDocument',
        resourceId: doc._id.toString(),
        metadata: { fileName: doc.fileName, fileSize: doc.fileSize },
      });

      res.status(201).json({ success: true, data: doc.toJSON() });
    } catch (error) {
      next(error);
    }
  }

  public static async search(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const query = String(req.query.q || '').trim().toLowerCase();
      if (!query) {
        res.json({ success: true, data: [] });
        return;
      }

      const docs = await KnowledgeDocument.find({
        organizationId: req.organizationId,
        status: DocumentProcessingStatus.READY,
      });

      const matchedResults: any[] = [];
      for (const doc of docs) {
        if (
          doc.title.toLowerCase().includes(query) ||
          doc.parsedContent.toLowerCase().includes(query)
        ) {
          const idx = doc.parsedContent.toLowerCase().indexOf(query);
          const start = Math.max(0, idx - 100);
          const end = Math.min(doc.parsedContent.length, idx + query.length + 150);
          const snippet = (start > 0 ? '...' : '') + doc.parsedContent.substring(start, end) + (end < doc.parsedContent.length ? '...' : '');

          matchedResults.push({
            id: doc._id.toString(),
            title: doc.title,
            fileName: doc.fileName,
            fileType: doc.fileType,
            snippet,
          });
        }
      }

      res.json({ success: true, data: matchedResults });
    } catch (error) {
      next(error);
    }
  }

  public static async delete(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const doc = await KnowledgeDocument.findOneAndDelete({
        _id: req.params.documentId,
        organizationId: req.organizationId,
      });

      if (!doc) throw new AppError('Document not found', 404);

      if (fs.existsSync(doc.storagePath)) {
        try {
          fs.unlinkSync(doc.storagePath);
        } catch (e) {
          console.warn('[Knowledge] Could not delete disk file:', e);
        }
      }

      await AuditService.record({
        organizationId: req.organizationId!,
        actorId: req.user!._id.toString(),
        actorEmail: req.user!.email,
        action: 'DOCUMENT_DELETED',
        resourceType: 'KnowledgeDocument',
        resourceId: req.params.documentId,
      });

      res.json({ success: true, message: 'Document deleted successfully' });
    } catch (error) {
      next(error);
    }
  }
}
