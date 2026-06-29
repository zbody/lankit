import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('请输入有效的邮箱地址'),
  password: z.string().min(6, '密码至少 6 位'),
});

export const registerSchema = z.object({
  email: z.string().email('请输入有效的邮箱地址'),
  password: z.string().min(6, '密码至少 6 位'),
  name: z.string().min(2, '姓名至少 2 个字符').max(50, '姓名不超过 50 个字符'),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('请输入有效的邮箱地址'),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, '重置链接无效'),
  password: z.string().min(6, '密码至少 6 位'),
});

export const updateProfileSchema = z.object({
  name: z.string().min(2, '姓名至少 2 个字符').max(50, '姓名不超过 50 个字符').optional(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, '请输入当前密码'),
  newPassword: z.string().min(6, '新密码至少 6 位'),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
