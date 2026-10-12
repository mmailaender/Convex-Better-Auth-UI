/** Path of the admin dashboard route. */
export const ADMIN_ROUTE = '/admin' as const;

/** Users the users table loads at first and adds per "Load more". */
export const USERS_PAGE_SIZE = 50;

/** Most users the users table loads; `admin/queries.listUsers` caps `limit` at the same value. */
export const USERS_MAX = 1000;

/** Admin dashboard tab values. */
export const TAB_USERS = 'users';
export const TAB_ORGANIZATIONS = 'organizations';
