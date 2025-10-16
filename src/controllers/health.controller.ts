import { Request, Response } from 'express';
import { documentService } from '../services/document.service';

class HealthController {
  async getHealth(req: Request, res: Response): Promise<void> {
    try {
      const allDocuments = await documentService.getAllDocuments();
      
      res.json({
        success: true,
        status: 'healthy',
        timestamp: new Date().toISOString(),
        data: {
          documentsCount: allDocuments.length,
          storage: 'file-based',
          database: 'mock (persistent)',
        },
        uptime: process.uptime(),
        memory: process.memoryUsage(),
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        status: 'unhealthy',
        error: 'Health check failed',
      });
    }
  }

  async getStats(req: Request, res: Response): Promise<void> {
    try {
      const allDocuments = await documentService.getAllDocuments();
      
      // Calculate some basic stats
      const stats = {
        totalDocuments: allDocuments.length,
        documentsByUser: {} as Record<string, number>,
        recentDocuments: allDocuments
          .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
          .slice(0, 5)
          .map(doc => ({
            id: doc.id,
            title: doc.title,
            createdBy: doc.createdBy,
            createdAt: doc.createdAt,
            collaborators: doc.collaborators.length,
          })),
      };

      // Count documents by user
      allDocuments.forEach(doc => {
        stats.documentsByUser[doc.createdBy] = (stats.documentsByUser[doc.createdBy] || 0) + 1;
      });

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to get stats',
      });
    }
  }
}

export const healthController = new HealthController();