import { z } from 'zod';
import { protectedProcedure, router } from '../router.js';
import { prisma } from '../../db/prisma.js';
import { writeFile, mkdir } from 'node:fs/promises';
import { join, extname } from 'node:path';
import { randomUUID } from 'node:crypto';

const UPLOAD_DIR = join(process.cwd(), 'uploads');

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
      const ext = extname(input.name);
      const fileName = `${randomUUID()}${ext}`;
      const relativePath = `uploads/${fileName}`;
      const absolutePath = join(UPLOAD_DIR, fileName);

      await mkdir(UPLOAD_DIR, { recursive: true });
      await writeFile(absolutePath, Buffer.from(input.buffer, 'base64'));

      const record = await prisma.fileRecord.create({
        data: {
          originalName: input.name,
          fileName,
          ext,
          mimeType: input.type,
          size: input.size,
          path: relativePath,
          url: `/files/${fileName}`,
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
        items: items.map((f) => ({
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
    await prisma.fileRecord.delete({ where: { id: input } });
    return { success: true };
  }),
});
