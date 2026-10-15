import type { FunctionReturnType } from 'convex/server';
import type { api } from '@/convex/_generated/api';

export type AdminUser = FunctionReturnType<typeof api.admin.queries.listUsers>['page'][number];
export type AdminOrganization = FunctionReturnType<
	typeof api.admin.queries.listAllOrganizations
>['page'][number];
export type AppRole = 'user' | 'admin';
