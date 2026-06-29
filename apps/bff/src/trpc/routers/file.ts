import { z } from 'zod';
import { protectedProcedure, router } from '../router.js';
import { prisma } from '../../db/prisma.js';
import { getStorageProvider, getCurrentStorageType } from '../../utils/storage.js';

export const fileRouter = router({
  upload: protectedProcedure
    .input(
      z.object({
        name: z.string(),
        type: z.string(),
        size: z.number(),
        buffer: z.string(), // base64
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const provider = getStorageProvider(getCurrentStorageType());
      const buffer = Buffer.from(input.buffer, 'base64');

      const result = await provider.upload({
        name: input.name,
        type: input.type,
        size: input.size,
        buffer,
      });

      const record = await prisma.fileRecord.create({
        data: {
          originalName: input.name,
          fileName: result.fileName,
          ext: result.fileName.split('.').pop() || '',
          mimeType: input.type,
          size: input.size,
          path: result.path,
          url: result.url,
          uploadedBy: ctx.session?.userId,
        },
      });

      return {
        id: record.id,
        url: record.url,
        originalName: record.originalName,
        size: record.size,
        mimeType: record.mimeType,
        createdAt: record.createdAt.toISOString(),
      };
    }),

  list: protectedProcedure
    .input(
      z.object({
        page: z.number().min(1).default(1),
        pageSize: z.number().min(1).max(100).default(20),
      }),
    )
    .query(async ({ input }) => {
      const skip = (input.page - 1) * input.pageSize;
      const [items, total] = await Promise.all([
        prisma.fileRecord.findMany({
          skip,
          take: input.pageSize,
          orderBy: { createdAt: 'desc' },
        }),
        prisma.fileRecord.count(),
      ]);
      return {
        items: items.map((f: { id: string; originalName: string; fileName: string; ext: string | null; mimeType: string; size: number; url: string; uploadedBy: string | null; createdAt: Date }) => ({
          id: f.id,
          originalName: f.originalName,
          fileName: f.fileName,
          ext: f.ext,
          mimeType: f.mimeType,
          size: f.size,
          url: f.url,
          uploadedBy: f.uploadedBy,
          createdAt: f.createdAt.toISOString(),
        })),
        total,
        page: input.page,
        pageSize: input.pageSize,
      };
    }),

  delete: protectedProcedure.input(z.string()).mutation(async ({ input }) => {
    const record = await prisma.fileRecord.findUnique({ where: { id: input } });
    if (!record) {
      throw new Error('文件不存在');
    }

    // 从存储中删除文件
    const provider = getStorageProvider(getCurrentStorageType());
    await provider.delete(record.fileName);

    // 从数据库删除记录
    await prisma.fileRecord.delete({ where: { id: input } });
    return { success: true };
  }),

  /** 获取文件预览URL */
  getPreviewUrl: protectedProcedure
    .input(z.string())
    .query(async ({ input }) => {
      const record = await prisma.fileRecord.findUnique({ where: { id: input } });
      if (!record) {
        throw new Error('文件不存在');
      }

      const provider = getStorageProvider(getCurrentStorageType());
      return {
        url: provider.getUrl(record.fileName),
        mimeType: record.mimeType,
        originalName: record.originalName,
      };
    }),
});
