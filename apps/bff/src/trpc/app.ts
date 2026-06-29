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
import { importRouter } from './routers/import.js';
import { exportRouter } from './routers/export.js';
import { websocketRouter } from './routers/websocket.js';
import { performanceRouter } from './routers/performance.js';
import { operationLogRouter } from './routers/operationLog.js';
import { announcementRouter } from './routers/announcement.js';
import { apiKeyRouter } from './routers/apiKey.js';
import { emailRouter } from './routers/email.js';
import { taskRouter } from './routers/task.js';
import { mfaRouter } from './routers/mfa.js';
import { approvalRouter } from './routers/approval.js';
import { categoryRouter, articleRouter, contactRouter } from './routers/cms.js';
import { oauthRouter } from './routers/oauth.js';
import { themeRouter } from './routers/theme.js';

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
  import: importRouter,
  export: exportRouter,
  websocket: websocketRouter,
  performance: performanceRouter,
  operationLogs: operationLogRouter,
  announcement: announcementRouter,
  apiKey: apiKeyRouter,
  email: emailRouter,
  task: taskRouter,
  mfa: mfaRouter,
  approval: approvalRouter,
  category: categoryRouter,
  article: articleRouter,
  contact: contactRouter,
  oauth: oauthRouter,
  theme: themeRouter,
});

export type AppRouter = typeof appRouter;
