/// <reference types="vite/client" />
/**
 * One source for the active organization: the user's `activeOrganizationId`. Each session's copy,
 * which Better Auth's organization endpoints read when a call names no organization, always
 * equals it, so two sessions of one user resolve the same organization. Runs `convex/` and the
 * real Better Auth component in convex-test.
 */
import { convexTest } from 'convex-test';
import type { UserIdentity } from 'convex/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { api, components } from './convex/_generated/api';
import type { MutationCtx } from './convex/_generated/server';
import { authComponent, createAuth } from './convex/auth';
import authSchema from './convex/betterAuth/schema';
import schema from './convex/schema';

const modules = import.meta.glob('./convex/**/*.*s');
const authModules = import.meta.glob('./convex/betterAuth/**/*.ts');

type AuthDocument = { _id: string };
type BetterAuthIdentity = Partial<UserIdentity> & { subject: string; sessionId: string };

let seedCounter = 0;

beforeEach(() => {
	vi.stubEnv('BETTER_AUTH_FALLBACK_URL', 'http://127.0.0.1:5173');
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

async function createOrganization(ctx: MutationCtx): Promise<string> {
	seedCounter += 1;
	return await createAuthDocument(ctx, {
		model: 'organization',
		data: { name: `Org ${seedCounter}`, slug: `org-${seedCounter}`, createdAt: Date.now() }
	});
}

async function addMember(
	ctx: MutationCtx,
	organizationId: string,
	userId: string,
	role: 'owner' | 'admin' | 'member'
) {
	await createAuthDocument(ctx, {
		model: 'member',
		data: { organizationId, userId, role, createdAt: Date.now() }
	});
}

async function createUser(ctx: MutationCtx, email: string, activeOrganizationId?: string) {
	const now = Date.now();
	return await createAuthDocument(ctx, {
		model: 'user',
		data: {
			name: email,
			email,
			emailVerified: true,
			activeOrganizationId,
			createdAt: now,
			updatedAt: now
		}
	});
}

async function createSession(
	ctx: MutationCtx,
	userId: string,
	activeOrganizationId?: string
): Promise<BetterAuthIdentity> {
	seedCounter += 1;
	const now = Date.now();
	const sessionId = await createAuthDocument(ctx, {
		model: 'session',
		data: {
			// Better Auth's default lifetime: a shorter one is due for a refresh, which a query can't write
			expiresAt: now + 7 * 24 * 60 * 60_000,
			token: `active-organization-session-${seedCounter}`,
			createdAt: now,
			updatedAt: now,
			userId,
			activeOrganizationId
		}
	});
	return { subject: userId, sessionId };
}

/**
 * A user who owns a first organization and is an admin of a second, signed in twice, with the
 * first active (or the second, with `secondActive`). Seeded through the adapter, so neither the
 * user nor the session `onCreate` trigger runs.
 */
async function seedTwoSessions(t: TestConvex, email: string, { secondActive = false } = {}) {
	return await t.run(async (ctx) => {
		const first = await createOrganization(ctx);
		const second = await createOrganization(ctx);
		const active = secondActive ? second : first;
		const userId = await createUser(ctx, email, active);
		await addMember(ctx, first, userId, 'owner');
		await addMember(ctx, second, userId, 'admin');
		const one = await createSession(ctx, userId, active);
		const other = await createSession(ctx, userId, active);
		return { first, second, userId, one, other };
	});
}

/** What one session's organization switcher and role resolve. */
async function resolvedBy(t: TestConvex, identity: BetterAuthIdentity) {
	const session = t.withIdentity(identity);
	const [organization, role] = await Promise.all([
		session.query(api.organizations.queries.getActiveOrganization, {}),
		session.query(api.organizations.queries.getOrganizationRole, {})
	]);
	return { organization: organization?.id, role };
}

async function storedActiveOrganizations(t: TestConvex, userId: string) {
	return await t.run(async (ctx) => {
		const user = await ctx.runQuery(components.betterAuth.user.getUserById, { userId });
		const sessions = (await ctx.runQuery(components.betterAuth.adapter.findMany, {
			model: 'session',
			where: [{ field: 'userId', value: userId }],
			paginationOpts: { cursor: null, numItems: 10 }
		})) as { page: { activeOrganizationId?: string | null }[] };
		return {
			user: user?.activeOrganizationId ?? null,
			sessions: sessions.page.map((session) => session.activeOrganizationId ?? null)
		};
	});
}

async function removeMember(t: TestConvex, organizationId: string, userId: string) {
	await t.run(async (ctx) => {
		await ctx.runMutation(components.betterAuth.adapter.deleteOne, {
			input: {
				model: 'member',
				where: [
					{ field: 'organizationId', value: organizationId },
					{ field: 'userId', value: userId, connector: 'AND' }
				]
			}
		});
	});
}

/** A new session, created through Better Auth so its `onCreate` trigger runs. */
async function signIn(t: TestConvex, userId: string, activeOrganizationId?: string) {
	await t.run(async (ctx) => {
		const context = await createAuth(ctx).$context;
		await context.internalAdapter.createSession(userId, false, { activeOrganizationId }, true);
	});
}

describe('one active organization per user', () => {
	it('a switch in one session moves the other session', async () => {
		const t = setup();
		const { first, second, userId, one, other } = await seedTwoSessions(t, 'switcher@example.com');
		expect(await resolvedBy(t, other)).toEqual({ organization: first, role: 'owner' });

		await t
			.withIdentity(one)
			.mutation(api.organizations.mutations.setActiveOrganization, { organizationId: second });

		expect(await resolvedBy(t, other)).toEqual({ organization: second, role: 'admin' });
		expect(await resolvedBy(t, one)).toEqual({ organization: second, role: 'admin' });
		expect(await storedActiveOrganizations(t, userId)).toEqual({
			user: second,
			sessions: [second, second]
		});
	});

	it('leaving the active organization in one session moves the other session too', async () => {
		const t = setup();
		const { first, second, userId, one, other } = await seedTwoSessions(t, 'leaver@example.com', {
			secondActive: true
		});
		await t.run(async (ctx) => {
			const owner = await createUser(ctx, 'second-owner@example.com', second);
			await addMember(ctx, second, owner, 'owner');
		});
		expect(await resolvedBy(t, other)).toEqual({ organization: second, role: 'admin' });

		await t.withIdentity(one).mutation(api.organizations.members.mutations.leaveOrganization, {});

		expect(await resolvedBy(t, other)).toEqual({ organization: first, role: 'owner' });
		expect(await storedActiveOrganizations(t, userId)).toEqual({
			user: first,
			sessions: [first, first]
		});
	});

	it("Better Auth's own session switch (accepting an invitation) moves the user and the other session", async () => {
		const t = setup();
		const { first, userId, one, other } = await seedTwoSessions(t, 'invitee@example.com');
		const { joined, invitationId } = await t.run(async (ctx) => {
			const joined = await createOrganization(ctx);
			const inviter = await createUser(ctx, 'inviter@example.com', joined);
			await addMember(ctx, joined, inviter, 'owner');
			const invitationId = await createAuthDocument(ctx, {
				model: 'invitation',
				data: {
					organizationId: joined,
					email: 'invitee@example.com',
					role: 'member',
					status: 'pending',
					inviterId: inviter,
					expiresAt: Date.now() + 60 * 60_000,
					createdAt: Date.now()
				}
			});
			return { joined, invitationId };
		});
		expect(await resolvedBy(t, other)).toEqual({ organization: first, role: 'owner' });

		// Same endpoint as POST /api/auth/organization/accept-invitation, which switches its session
		await t.withIdentity(one).run(async (ctx) => {
			await createAuth(ctx).api.acceptInvitation({
				body: { invitationId },
				headers: await authComponent.getHeaders(ctx)
			});
		});

		expect(await resolvedBy(t, other)).toEqual({ organization: joined, role: 'member' });
		expect(await storedActiveOrganizations(t, userId)).toEqual({
			user: joined,
			sessions: [joined, joined]
		});
	});

	it("a client can't move the user through its session's copy (/update-session)", async () => {
		const t = setup();
		const { first, userId, one } = await seedTwoSessions(t, 'forger@example.com');
		const stranger = await t.run(async (ctx) => createOrganization(ctx));

		await expect(
			t.withIdentity(one).run(async (ctx) => {
				await createAuth(ctx).api.updateSession({
					body: { activeOrganizationId: stranger } as never,
					headers: await authComponent.getHeaders(ctx)
				});
			})
		).rejects.toThrow('activeOrganizationId is not allowed to be set');
		expect(await storedActiveOrganizations(t, userId)).toEqual({
			user: first,
			sessions: [first, first]
		});
	});

	it("leaving an organization between Better Auth's membership check and its session write doesn't make it active", async () => {
		const t = setup();
		const { first, second, userId, one } = await seedTwoSessions(t, 'racer@example.com');

		// `/organization/set-active` found the membership of `second`; the leave finishes; then
		// set-active writes the session, in a transaction of its own
		await removeMember(t, second, userId);
		await t.withIdentity(one).run(async (ctx) => {
			const session = (await ctx.runQuery(components.betterAuth.adapter.findOne, {
				model: 'session',
				where: [{ field: '_id', value: one.sessionId }]
			})) as { token: string };
			const context = await createAuth(ctx).$context;
			await context.internalAdapter.updateSession(session.token, {
				activeOrganizationId: second
			});
		});

		expect(await storedActiveOrganizations(t, userId)).toEqual({
			user: first,
			sessions: [first, first]
		});
	});

	it('a new session takes the user organization, or a membership when the user left it', async () => {
		const t = setup();
		const { first, second, userId } = await seedTwoSessions(t, 'returner@example.com');

		await signIn(t, userId, second);
		expect(await storedActiveOrganizations(t, userId)).toEqual({
			user: first,
			sessions: [first, first, first]
		});

		await removeMember(t, first, userId);
		await signIn(t, userId);
		expect(await storedActiveOrganizations(t, userId)).toEqual({
			user: second,
			sessions: [second, second, second, second]
		});
	});
});
