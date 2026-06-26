import { createTRPCReact } from '@trpc/react-query';
import type { AppRouter } from '@platform/bff';

export const trpc = createTRPCReact<AppRouter>();
