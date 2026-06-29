import { z } from 'zod';
import { protectedProcedure, publicProcedure, router } from '../router.js';
import { prisma } from '../../db/prisma.js';
import { generateCode } from '../../utils/codegen.js';
import { sendEmail } from '../../utils/email.js';

// === Category ===
const categorySchema = z.object({
  name: z.string().min(1),
  code: z.string().optional(),
  parentId: z.string().nullable().optional(),
  sort: z.number().default(0),
  status: z.boolean().default(true),
});

export const categoryRouter = router({
  tree: protectedProcedure.query(async () => {
    const items = await prisma.category.findMany({ where: { status: true }, orderBy: { sort: 'asc' } });
    return items;
  }),
  list: protectedProcedure
    .input(z.object({ page: z.number().min(1).default(1), pageSize: z.number().min(1).max(100).default(20) }))
    .query(async ({ input }) => {
      const skip = (input.page - 1) * input.pageSize;
      const [items, total] = await Promise.all([
        prisma.category.findMany({ skip, take: input.pageSize, orderBy: { sort: 'asc' } }),
        prisma.category.count(),
      ]);
      return { items: items.map((c: any) => ({ ...c, createdAt: c.createdAt.toISOString(), updatedAt: c.updatedAt.toISOString() })), total, page: input.page, pageSize: input.pageSize };
    }),
  create: protectedProcedure.input(categorySchema).mutation(async ({ input }) => {
    const code = input.code ?? (await generateCode(prisma, 'category', 'CAT'));
    const item = await prisma.category.create({ data: { ...input, code } });
    return item;
  }),
  update: protectedProcedure.input(z.object({ id: z.string(), data: categorySchema.partial() })).mutation(async ({ input }) => {
    const item = await prisma.category.update({ where: { id: input.id }, data: input.data });
    return item;
  }),
  delete: protectedProcedure.input(z.string()).mutation(async ({ input }) => {
    await prisma.category.delete({ where: { id: input } });
    return { success: true };
  }),
});

// === Article ===
const articleSchema = z.object({
  title: z.string().min(1),
  content: z.string().min(1),
  summary: z.string().nullable().optional(),
  coverUrl: z.string().nullable().optional(),
  categoryId: z.string().nullable().optional(),
  tags: z.string().nullable().optional(),
  status: z.string().default('DRAFT'),
  isFeatured: z.boolean().default(false),
  seoTitle: z.string().nullable().optional(),
  seoDesc: z.string().nullable().optional(),
  seoKeywords: z.string().nullable().optional(),
});

export const articleRouter = router({
  list: protectedProcedure
    .input(z.object({ page: z.number().min(1).default(1), pageSize: z.number().min(1).max(100).default(20), keyword: z.string().optional(), categoryId: z.string().optional() }))
    .query(async ({ input }) => {
      const where: Record<string, unknown> = {};
      if (input.keyword) where.OR = [{ title: { contains: input.keyword } }, { content: { contains: input.keyword } }];
      if (input.categoryId) where.categoryId = input.categoryId;
      const skip = (input.page - 1) * input.pageSize;
      const [items, total] = await Promise.all([
        prisma.article.findMany({ where, skip, take: input.pageSize, orderBy: { createdAt: 'desc' }, include: { category: { select: { id: true, name: true } } } }),
        prisma.article.count({ where }),
      ]);
      return {
        items: items.map((a: any) => ({ ...a, createdAt: a.createdAt.toISOString(), updatedAt: a.updatedAt.toISOString(), publishedAt: a.publishedAt?.toISOString() ?? null })),
        total, page: input.page, pageSize: input.pageSize,
      };
    }),
  create: protectedProcedure.input(articleSchema).mutation(async ({ input, ctx }) => {
    const data: any = { ...input, createdBy: ctx.session!.userId };
    if (input.status === 'PUBLISHED') data.publishedAt = new Date();
    const item = await prisma.article.create({ data });
    return item;
  }),
  update: protectedProcedure.input(z.object({ id: z.string(), data: articleSchema.partial() })).mutation(async ({ input }) => {
    const data: any = { ...input.data };
    if (data.status === 'PUBLISHED') data.publishedAt = new Date();
    const item = await prisma.article.update({ where: { id: input.id }, data });
    return item;
  }),
  publish: protectedProcedure.input(z.string()).mutation(async ({ input }) => {
    const item = await prisma.article.update({ where: { id: input }, data: { status: 'PUBLISHED', publishedAt: new Date() } });
    return item;
  }),
  delete: protectedProcedure.input(z.string()).mutation(async ({ input }) => {
    await prisma.article.delete({ where: { id: input } });
    return { success: true };
  }),

  // 公开接口
  published: publicProcedure
    .input(z.object({ page: z.number().min(1).default(1), pageSize: z.number().min(1).max(50).default(10), categoryId: z.string().optional() }))
    .query(async ({ input }) => {
      const where: Record<string, unknown> = { status: 'PUBLISHED' };
      if (input.categoryId) where.categoryId = input.categoryId;
      const skip = (input.page - 1) * input.pageSize;
      const [items, total] = await Promise.all([
        prisma.article.findMany({ where, skip, take: input.pageSize, orderBy: { publishedAt: 'desc' }, select: { id: true, title: true, summary: true, coverUrl: true, publishedAt: true, category: { select: { name: true } } } }),
        prisma.article.count({ where }),
      ]);
      return { items, total, page: input.page, pageSize: input.pageSize };
    }),

  getPublished: publicProcedure.input(z.string()).query(async ({ input }) => {
    const item = await prisma.article.findFirst({ where: { id: input, status: 'PUBLISHED' }, include: { category: { select: { name: true } } } });
    if (!item) throw new Error('文章不存在');
    await prisma.article.update({ where: { id: input }, data: { viewCount: { increment: 1 } } });
    return { ...item, createdAt: item.createdAt.toISOString(), publishedAt: item.publishedAt?.toISOString() ?? null };
  }),
});

// === Contact ===
export const contactRouter = router({
  list: protectedProcedure
    .input(z.object({ page: z.number().min(1).default(1), pageSize: z.number().min(1).max(100).default(20), status: z.string().optional() }))
    .query(async ({ input }) => {
      const where: Record<string, unknown> = {};
      if (input.status) where.status = input.status;
      const skip = (input.page - 1) * input.pageSize;
      const [items, total] = await Promise.all([
        prisma.contactMessage.findMany({ where, skip, take: input.pageSize, orderBy: { createdAt: 'desc' } }),
        prisma.contactMessage.count({ where }),
      ]);
      return {
        items: items.map((m: any) => ({ ...m, createdAt: m.createdAt.toISOString(), updatedAt: m.updatedAt.toISOString(), repliedAt: m.repliedAt?.toISOString() ?? null })),
        total, page: input.page, pageSize: input.pageSize,
      };
    }),

  submit: publicProcedure
    .input(z.object({ name: z.string().min(1), email: z.string().email(), phone: z.string().optional(), subject: z.string().min(1), content: z.string().min(1) }))
    .mutation(async ({ input }) => {
      const item = await prisma.contactMessage.create({ data: input });
      return item;
    }),

  reply: protectedProcedure
    .input(z.object({ id: z.string(), reply: z.string().min(1) }))
    .mutation(async ({ input }) => {
      const msg = await prisma.contactMessage.findUnique({ where: { id: input.id } });
      if (!msg) throw new Error('留言不存在');
      // 发送邮件回复
      if (msg.email) {
        await sendEmail(msg.email, `Re: ${msg.subject}`, `<p>${input.reply}</p>`);
      }
      const item = await prisma.contactMessage.update({
        where: { id: input.id },
        data: { reply: input.reply, status: 'REPLIED', repliedAt: new Date() },
      });
      return item;
    }),

  markRead: protectedProcedure.input(z.string()).mutation(async ({ input }) => {
    await prisma.contactMessage.update({ where: { id: input }, data: { status: 'READ' } });
    return { success: true };
  }),
});
