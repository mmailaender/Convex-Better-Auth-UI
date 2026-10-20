/** Path of the admin dashboard route. */
export const ADMIN_ROUTE = '/admin' as const;

/** Users the users table loads at first and adds per "Load more". */
export const USERS_PAGE_SIZE = 50;

/** Most users or organizations a list loads; `admin/queries` caps `limit` at the same value. */
export const LIST_MAX = 1000;

/** Query parameter holding the id of the user whose profile the dashboard shows. */
export const USER_PARAM = 'adminUser';

/** Query parameter holding the id of the organization the dashboard shows. */
export const ORGANIZATION_PARAM = 'adminOrganization';

/** Admin dashboard tab values. */
export const TAB_USERS = 'users';
export const TAB_ORGANIZATIONS = 'organizations';
