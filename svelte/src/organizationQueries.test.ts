/// <reference types="vite/client" />
/**
 * `getActiveOrganization` and `listOrganizations` answer an absence (`null`, `[]`) only when it is
 * confirmed, and throw when the lookup fails, so a client can tell "there is none" from "it could
 * not be read". Runs `convex/` and the real Better Auth component in convex-test.
 */
import { convexTest } from 'convex-test';
import type { UserIdentity } from 'convex/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { api, components } from './convex/_generated/api';
import type { MutationCtx } from './convex/_generated/server';
import authSchema from './convex/betterAuth/schema';
import schema from './convex/schema';

/** While set, Better Auth's organization lookups fail, as a failed read does. */
const lookups = vi.hoisted(() => ({ fail: false }));
vi.mock('./convex/auth', async (importOriginal) => {
	const actual = await importOriginal<typeof import('./convex/auth')>();
	const failed = async () => {
		throw new Error('the lookup failed');
	};
	return {
		...actual,
		createAuth: (...args: Parameters<typeof actual.createAuth>) => {
			const auth = actual.createAuth(...args);
			if (!lookups.fail) return auth;
			return {
				...auth,
				api: { ...auth.api, getFullOrganization: failed, listOrganizations: failed }
			};
		}
	};
});

const modules = import.meta.glob('./convex/**/*.*s');
const authModules = import.meta.glob('./convex/betterAuth/**/*.ts');

type AuthDocument = { _id: string };
type BetterAuthIdentity = Partial<UserIdentity> & { subject: string; sessionId: string };

let seedCounter = 0;

beforeEach(() => {
	vi.stubEnv('BETTER_AUTH_FALLBACK_URL', 'http://127.0.0.1:5173');
	lookups.fail = false;
});

afterEach(() => {
	vi.unstubAllEnvs();
});

function setup() {
	const t = convexTest(schema, modules);
	t.registerComponent('betterAuth', authSchema, authModules);
	return t;
}

type TestConvex = ReturnType<typeof setup>;

async function createAuthDocument(
	ctx: MutationCtx,
	input: { model: string; data: Record<string, unknown> }
): Promise<string> {
	const document = (await ctx.runMutation(components.betterAuth.adapter.create, {
		input: input as never
	})) as AuthDocument;
	return document._id;
}

/**
 * A user who owns one organization, active on the user and the session. Seeded through the
 * adapter, so the user `onCreate` trigger doesn't add a personal organization.
 */
async function seedMember(
	t: TestConvex,
	email: string
): Promise<{ userId: string; organizationId: string; identity: BetterAuthIdentity }> {
	return await t.run(async (ctx) => {
		seedCounter += 1;
		const now = Date.now();
		const organizationId = await createAuthDocument(ctx, {
			model: 'organization',
			data: { name: `Org ${seedCounter}`, slug: `org-${seedCounter}`, createdAt: now }
		});
		const userId = await createAuthDocument(ctx, {
			model: 'user',
			data: {
				name: email,
				email,
				emailVerified: true,
				activeOrganizationId: organizationId,
				createdAt: now,
				updatedAt: now
			}
		});
		await createAuthDocument(ctx, {
			model: 'member',
			data: { organizationId, userId, role: 'owner', createdAt: now }
		});
		const sessionId = await createAuthDocument(ctx, {
			model: 'session',
			data: {
				expiresAt: now + 7 * 24 * 60 * 60_000,
				token: `session-${seedCounter}`,
				createdAt: now,
				updatedAt: now,
				userId,
				activeOrganizationId: organizationId
			}
		});
		return { userId, organizationId, identity: { subject: userId, sessionId } };
	});
}

async function deleteAuthRows(t: TestConvex, model: string, field: string, value: string) {
	await t.run(async (ctx) => {
		await ctx.runMutation(components.betterAuth.adapter.deleteMany, {
			input: { model, where: [{ field, value }] } as never,
			paginationOpts: { cursor: null, numItems: 100 }
		});
	});
}

async function updateAuthRow(
	t: TestConvex,
	model: string,
	id: string,
	update: Record<string, unknown>
) {
	await t.run(async (ctx) => {
		await ctx.runMutation(components.betterAuth.adapter.updateOne, {
			input: { model, where: [{ field: '_id', value: id }], update } as never
		});
	});
}

async function answers(t: TestConvex, identity?: BetterAuthIdentity) {
	const caller = identity ? t.withIdentity(identity) : t;
	const [organization, organizations] = await Promise.all([
		caller.query(api.organizations.queries.getActiveOrganization, {}),
		caller.query(api.organizations.queries.listOrganizations, {})
	]);
	return { active: organization?.id ?? null, listed: organizations.map(({ id }) => id) };
}

describe('the organization queries tell a confirmed absence from a failed lookup', () => {
	it('a member gets the active organization and the list', async () => {
		const t = setup();
		const ada = await seedMember(t, 'ada@example.com');
		expect(await answers(t, ada.identity)).toEqual({
			active: ada.organizationId,
			listed: [ada.organizationId]
		});
	});

	it('a request with no one signed in answers null and []', async () => {
		const t = setup();
		await seedMember(t, 'ada@example.com');
		expect(await answers(t)).toEqual({ active: null, listed: [] });
	});

	it('a user deleted while their token is still valid answers null and []', async () => {
		const t = setup();
		const ada = await seedMember(t, 'ada@example.com');
		// as Better Auth deletes a user: their sessions, their memberships, then the user
		await deleteAuthRows(t, 'session', 'userId', ada.userId);
		await deleteAuthRows(t, 'member', 'userId', ada.userId);
		await deleteAuthRows(t, 'user', '_id', ada.userId);
		expect(await answers(t, ada.identity)).toEqual({ active: null, listed: [] });
		expect(
			await t.withIdentity(ada.identity).query(api.users.queries.getActiveUser, {})
		).toBeNull();
	});

	it('a session ended elsewhere answers null and []', async () => {
		const t = setup();
		const ada = await seedMember(t, 'ada@example.com');
		await deleteAuthRows(t, 'session', '_id', ada.identity.sessionId);
		expect(await answers(t, ada.identity)).toEqual({ active: null, listed: [] });
	});

	it('a user removed from their last organization answers null and []', async () => {
		const t = setup();
		const ada = await seedMember(t, 'ada@example.com');
		// the user still names the organization: only the membership is gone
		await deleteAuthRows(t, 'member', 'userId', ada.userId);
		expect(await answers(t, ada.identity)).toEqual({ active: null, listed: [] });
		expect(
			await t.withIdentity(ada.identity).query(api.users.queries.getActiveUser, {})
		).toMatchObject({ _id: ada.userId });
	});

	it('a user with no active organization answers null and still lists their organizations', async () => {
		const t = setup();
		const ada = await seedMember(t, 'ada@example.com');
		await t.run(async (ctx) => {
			await ctx.runMutation(components.betterAuth.organization.setUserActiveOrganization, {
				userId: ada.userId,
				organizationId: null
			});
		});
		expect(await answers(t, ada.identity)).toEqual({
			active: null,
			listed: [ada.organizationId]
		});
	});

	it('a session due for its refresh still gets its active organization and its role', async () => {
		const t = setup();
		const ada = await seedMember(t, 'ada@example.com');
		const day = 24 * 60 * 60_000;
		await updateAuthRow(t, 'session', ada.identity.sessionId, {
			expiresAt: Date.now() + 5 * day,
			updatedAt: Date.now() - 2 * day
		});
		expect(await answers(t, ada.identity)).toEqual({
			active: ada.organizationId,
			listed: [ada.organizationId]
		});
		expect(
			await t.withIdentity(ada.identity).query(api.organizations.queries.getOrganizationRole, {})
		).toBe('owner');
	});

	it('a failed lookup throws instead of answering null or []', async () => {
		const t = setup();
		const ada = await seedMember(t, 'ada@example.com');
		lookups.fail = true;
		const session = t.withIdentity(ada.identity);
		await expect(
			session.query(api.organizations.queries.getActiveOrganization, {})
		).rejects.toThrow('the lookup failed');
		await expect(session.query(api.organizations.queries.listOrganizations, {})).rejects.toThrow(
			'the lookup failed'
		);
	});
});
