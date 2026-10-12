import type { FunctionReturnType } from 'convex/server';
import type { api } from '#convex/_generated/api.js';

export type AdminUser = FunctionReturnType<typeof api.admin.queries.listUsers>['users'][number];
export type AdminOrganization = FunctionReturnType<
	typeof api.admin.queries.listAllOrganizations
>['page'][number];
export type AppRole = 'user' | 'admin';
