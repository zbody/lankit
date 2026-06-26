import { router } from './router.js';
import { authRouter } from './routers/auth.js';
import { userRouter } from './routers/user.js';
import { orgRouter } from './routers/org.js';
import { roleRouter } from './routers/role.js';
import { menuRouter } from './routers/menu.js';
import { systemRouter } from './routers/system.js';
import { notificationRouter } from './routers/notification.js';
import { systemSettingsRouter } from './routers/systemSettings.js';
import { auditLogRouter } from './routers/auditLog.js';
import { dictRouter } from './routers/dict.js';
import { fileRouter } from './routers/file.js';

export const appRouter = router({
  auth: authRouter,
  user: userRouter,
  org: orgRouter,
  role: roleRouter,
  menu: menuRouter,
  system: systemRouter,
  notification: notificationRouter,
  systemSettings: systemSettingsRouter,
  auditLogs: auditLogRouter,
  dict: dictRouter,
  file: fileRouter,
});

export type AppRouter = typeof appRouter;
