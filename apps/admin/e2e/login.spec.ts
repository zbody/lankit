import { test, expect } from '@playwright/test';

test.describe('Admin 登录流程', () => {
  test('未登录访问首页应跳转到登录页', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/login/, { timeout: 15000 });
  });

  test('登录页应显示邮箱、密码输入框和登录按钮', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await expect(page.getByPlaceholder('邮箱')).toBeVisible({ timeout: 15000 });
    await expect(page.getByPlaceholder('密码')).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('登 录')).toBeVisible({ timeout: 5000 });
  });

  test('错误密码应弹出错误提示', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await page.getByPlaceholder('邮箱').fill('admin@bk.com');
    await page.getByPlaceholder('密码').fill('wrongpassword');
    await page.getByText('登 录').click();
    await expect(page.locator('.ant-message-notice-content').first()).toBeVisible({ timeout: 10000 });
  });

  test('正确凭据应登录成功并跳转仪表盘', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await page.getByPlaceholder('邮箱').fill('admin@bk.com');
    await page.getByPlaceholder('密码').fill('admin123');
    await page.getByText('登 录').click();
    await expect(page.locator('.ant-statistic-title').first()).toBeVisible({ timeout: 20000 });
  });

  test('退出登录应清除 token 并跳转登录页', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await page.getByPlaceholder('邮箱').fill('admin@bk.com');
    await page.getByPlaceholder('密码').fill('admin123');
    await page.getByText('登 录').click();
    await expect(page.locator('.ant-statistic-title').first()).toBeVisible({ timeout: 20000 });

    await page.getByText('退出').click();
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 });

    await page.goto('/');
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 });
  });
});
