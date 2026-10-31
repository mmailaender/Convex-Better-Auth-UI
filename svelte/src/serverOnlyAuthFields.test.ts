/// <reference types="vite/client" />
/**
 * The Better Auth additional fields the server trusts are server-only: `imageId` and `logoId` name
 * storage files the server deletes, and authorization reads `activeOrganizationId`. Clients can't
 * set them through Better Auth's endpoints; the `users` and `organizations` mutations still do,
 * after their own checks. Runs `convex/` and the real Better Auth component in convex-test.
 */
import { convexTest } from 'convex-test';
import type { UserIdentity } from 'convex/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { api, components } from './convex/_generated/api';
import type { Id } from './convex/_generated/dataModel';
import type { MutationCtx } from './convex/_generated/server';
import { authComponent, createAuth } from './convex/auth';
import authSchema from './convex/betterAuth/schema';
import { updateOrganizationProfileModel } from './convex/model/organizations';
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

async function createAuthDocument(
	ctx: MutationCtx,
	input: { model: string; data: Record<string, unknown> }
): Promise<AuthDocument> {
	return (await ctx.runMutation(components.betterAuth.adapter.create, {
		input: input as never
	})) as AuthDocument;
}

async function createOrganization(ctx: MutationCtx): Promise<string> {
	seedCounter += 1;
	const organization = await createAuthDocument(ctx, {
		model: 'organization',
		data: { name: `Org ${seedCounter}`, slug: `org-${seedCounter}`, createdAt: Date.now() }
	});
	return organization._id;
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

/**
 * A user who owns one organization, which is active on the user and the session. Seeded through
 * the adapter, so the user `onCreate` trigger doesn't add a personal organization.
 */
async function seedMember(
	ctx: MutationCtx,
	email: string,
	options: { activeOnUser?: boolean } = {}
): Promise<{ organizationId: string; identity: BetterAuthIdentity }> {
	const now = Date.now();
	const organizationId = await createOrganization(ctx);
	const user = await createAuthDocument(ctx, {
		model: 'user',
		data: {
			name: email,
			email,
			emailVerified: true,
			...(options.activeOnUser === false ? {} : { activeOrganizationId: organizationId }),
			createdAt: now,
			updatedAt: now
		}
	});
	await addMember(ctx, organizationId, user._id, 'owner');
	const session = await createAuthDocument(ctx, {
		model: 'session',
		data: {
			// Better Auth's default lifetime: a shorter one is due for a refresh, which a query can't write
			expiresAt: now + 7 * 24 * 60 * 60_000,
			token: `session-${seedCounter}`,
			createdAt: now,
			updatedAt: now,
			userId: user._id,
			activeOrganizationId: organizationId
		}
	});
	return { organizationId, identity: { subject: user._id, sessionId: session._id } };
}

async function readUser(t: ReturnType<typeof setup>, identity: BetterAuthIdentity) {
	return await t.run((ctx) =>
		ctx.runQuery(components.betterAuth.user.getUserById, { userId: identity.subject })
	);
}

async function readActiveOrganization(
	t: ReturnType<typeof setup>,
	identity: BetterAuthIdentity
): Promise<{ user: string | null | undefined; session: string | null | undefined }> {
	return await t.run(async (ctx) => {
		const user = await ctx.runQuery(components.betterAuth.user.getUserById, {
			userId: identity.subject
		});
		const session = (await ctx.runQuery(components.betterAuth.adapter.findOne, {
			model: 'session',
			where: [{ field: '_id', value: identity.sessionId }]
		})) as { activeOrganizationId?: string | null } | null;
		return { user: user?.activeOrganizationId, session: session?.activeOrganizationId };
	});
}

async function readOrganization(t: ReturnType<typeof setup>, organizationId: string) {
	return (await t.run((ctx) =>
		ctx.runQuery(components.betterAuth.adapter.findOne, {
			model: 'organization',
			where: [{ field: '_id', value: organizationId }]
		})
	)) as { name: string; logo?: string | null; logoId?: string | null } | null;
}

async function storeFile(t: ReturnType<typeof setup>, content: string): Promise<Id<'_storage'>> {
	return await t.run((ctx) => ctx.storage.store(new Blob([content], { type: 'image/png' })));
}

async function fileExists(t: ReturnType<typeof setup>, storageId: Id<'_storage'>) {
	return (await t.run((ctx) => ctx.db.system.get(storageId))) !== null;
}

describe('organization logoId is server-only', () => {
	it('Better Auth organization update drops logoId from the body', async () => {
		const t = setup();
		const owner = await t.run((ctx) => seedMember(ctx, 'logo-forger@example.com'));
		const foreignFile = await storeFile(t, 'someone else');

		// Same endpoint as POST /api/auth/organization/update, called with the owner's session
		await t.withIdentity(owner.identity).run(async (ctx) => {
			await createAuth(ctx).api.updateOrganization({
				body: {
					organizationId: owner.organizationId,
					data: { name: 'Renamed org', logoId: foreignFile } as never
				},
				headers: await authComponent.getHeaders(ctx)
			});
		});

		const organization = await readOrganization(t, owner.organizationId);
		expect(organization?.name).toBe('Renamed org');
		expect(organization?.logoId ?? null).toBeNull();
	});

	it('Better Auth organization create drops logoId from the body', async () => {
		const t = setup();
		const owner = await t.run((ctx) => seedMember(ctx, 'org-creator@example.com'));
		const foreignFile = await storeFile(t, 'someone else');

		// Same endpoint as POST /api/auth/organization/create
		const created = await t.withIdentity(owner.identity).run(async (ctx) =>
			createAuth(ctx).api.createOrganization({
				body: {
					name: 'Self-made',
					slug: 'self-made',
					logoId: foreignFile,
					keepCurrentActiveOrganization: true
				} as never,
				headers: await authComponent.getHeaders(ctx)
			})
		);

		expect((await readOrganization(t, created!.id))?.logoId ?? null).toBeNull();
	});

	it('createOrganization stores the logo through the server', async () => {
		const t = setup();
		const owner = await t.run((ctx) => seedMember(ctx, 'org-maker@example.com'));
		const logo = await storeFile(t, 'logo');

		const organizationId = await t
			.withIdentity(owner.identity)
			.mutation(api.organizations.mutations.createOrganization, {
				name: 'New org',
				slug: 'new-org',
				logoId: logo
			});

		const organization = await readOrganization(t, organizationId);
		expect(organization?.logoId).toBe(logo);
		expect(organization?.logo).toEqual(expect.any(String));
		expect((await readActiveOrganization(t, owner.identity)).user).toBe(organizationId);
	});

	it('the organization profile replaces and removes the logo and deletes the old file', async () => {
		const t = setup();
		const owner = await t.run((ctx) => seedMember(ctx, 'logo-owner@example.com'));
		const asOwner = t.withIdentity(owner.identity);
		const first = await storeFile(t, 'first logo');
		const second = await storeFile(t, 'second logo');

		await asOwner.mutation(api.organizations.mutations.updateOrganizationProfile, {
			logoId: first
		});
		expect((await readOrganization(t, owner.organizationId))?.logoId).toBe(first);

		await asOwner.mutation(api.organizations.mutations.updateOrganizationProfile, {
			logoId: second
		});
		const replaced = await readOrganization(t, owner.organizationId);
		expect(replaced?.logoId).toBe(second);
		expect(replaced?.logo).toEqual(expect.any(String));
		expect(await fileExists(t, first)).toBe(false);

		await asOwner.run((ctx) =>
			updateOrganizationProfileModel(ctx, { organizationId: owner.organizationId, logoId: null })
		);
		const removed = await readOrganization(t, owner.organizationId);
		expect(removed?.logoId ?? null).toBeNull();
		expect(removed?.logo ?? null).toBeNull();
		expect(await fileExists(t, second)).toBe(false);
	});

	it('a member without update permission cannot set the logo', async () => {
		const t = setup();
		const { owner, member } = await t.run(async (ctx) => {
			const owner = await seedMember(ctx, 'logo-admin@example.com');
			const member = await seedMember(ctx, 'logo-member@example.com');
			await addMember(ctx, owner.organizationId, member.identity.subject, 'member');
			return { owner, member };
		});
		const asMember = t.withIdentity(member.identity);
		await asMember.mutation(api.organizations.mutations.setActiveOrganization, {
			organizationId: owner.organizationId
		});
		const logo = await storeFile(t, 'member logo');

		await expect(
			asMember.mutation(api.organizations.mutations.updateOrganizationProfile, { logoId: logo })
		).rejects.toThrow(/not allowed to update this organization/i);
		expect((await readOrganization(t, owner.organizationId))?.logoId ?? null).toBeNull();
	});
});

describe('user imageId is server-only', () => {
	it('Better Auth updateUser refuses an imageId body and leaves the field unchanged', async () => {
		const t = setup();
		const owner = await t.run((ctx) => seedMember(ctx, 'avatar-forger@example.com'));
		const foreignFile = await storeFile(t, 'someone else');

		// Same endpoint as POST /api/auth/update-user, called with the user's session
		await expect(
			t.withIdentity(owner.identity).run(async (ctx) => {
				await createAuth(ctx).api.updateUser({
					body: { imageId: foreignFile } as never,
					headers: await authComponent.getHeaders(ctx)
				});
			})
		).rejects.toThrow('imageId is not allowed to be set');

		expect((await readUser(t, owner.identity))?.imageId ?? null).toBeNull();
	});

	it('updateAvatar stores the new file and deletes the replaced one', async () => {
		const t = setup();
		const owner = await t.run((ctx) => seedMember(ctx, 'avatar@example.com'));
		const asOwner = t.withIdentity(owner.identity);
		const first = await storeFile(t, 'first avatar');
		const second = await storeFile(t, 'second avatar');

		await asOwner.mutation(api.users.mutations.updateAvatar, { storageId: first });
		let user = await readUser(t, owner.identity);
		expect(user?.imageId).toBe(first);
		expect(user?.image).toEqual(expect.any(String));

		await asOwner.mutation(api.users.mutations.updateAvatar, { storageId: second });
		user = await readUser(t, owner.identity);
		expect(user?.imageId).toBe(second);
		expect(await fileExists(t, first)).toBe(false);
		expect(await fileExists(t, second)).toBe(true);
	});
});

describe('user activeOrganizationId is server-only', () => {
	it('Better Auth updateUser refuses an activeOrganizationId body and leaves the field unchanged', async () => {
		const t = setup();
		const { owner, stranger } = await t.run(async (ctx) => ({
			owner: await seedMember(ctx, 'owner@example.com'),
			stranger: await seedMember(ctx, 'stranger@example.com')
		}));
		const asOwner = t.withIdentity(owner.identity);

		await expect(
			asOwner.run(async (ctx) => {
				await createAuth(ctx).api.updateUser({
					body: { activeOrganizationId: stranger.organizationId } as never,
					headers: await authComponent.getHeaders(ctx)
				});
			})
		).rejects.toThrow('activeOrganizationId is not allowed to be set');
		expect((await readActiveOrganization(t, owner.identity)).user).toBe(owner.organizationId);

		// The session is valid: an allowed field still updates through the same call
		await asOwner.run(async (ctx) => {
			await createAuth(ctx).api.updateUser({
				body: { name: 'Renamed' },
				headers: await authComponent.getHeaders(ctx)
			});
		});
		const user = await readUser(t, owner.identity);
		expect(user?.name).toBe('Renamed');
		expect(user?.activeOrganizationId).toBe(owner.organizationId);
	});

	it('setActiveOrganization switches to an organization the user belongs to', async () => {
		const t = setup();
		const { owner, second } = await t.run(async (ctx) => {
			const owner = await seedMember(ctx, 'switcher@example.com');
			const second = await createOrganization(ctx);
			await addMember(ctx, second, owner.identity.subject, 'admin');
			return { owner, second };
		});

		await t
			.withIdentity(owner.identity)
			.mutation(api.organizations.mutations.setActiveOrganization, { organizationId: second });

		expect(await readActiveOrganization(t, owner.identity)).toEqual({
			user: second,
			session: second
		});
	});

	it('setActiveOrganization refuses an organization the user does not belong to', async () => {
		const t = setup();
		const { owner, stranger } = await t.run(async (ctx) => ({
			owner: await seedMember(ctx, 'intruder@example.com'),
			stranger: await seedMember(ctx, 'victim@example.com')
		}));

		await expect(
			t.withIdentity(owner.identity).mutation(api.organizations.mutations.setActiveOrganization, {
				organizationId: stranger.organizationId
			})
		).rejects.toThrow(/403/);

		expect(await readActiveOrganization(t, owner.identity)).toEqual({
			user: owner.organizationId,
			session: owner.organizationId
		});
	});

	it('setActiveOrganization without an id picks a membership when the user has none recorded', async () => {
		const t = setup();
		const owner = await t.run((ctx) =>
			seedMember(ctx, 'unset@example.com', { activeOnUser: false })
		);

		await t
			.withIdentity(owner.identity)
			.mutation(api.organizations.mutations.setActiveOrganization, {});

		expect((await readActiveOrganization(t, owner.identity)).user).toBe(owner.organizationId);
	});

	it('leaveOrganization moves the user to a remaining organization', async () => {
		const t = setup();
		const { owner, second } = await t.run(async (ctx) => {
			const owner = await seedMember(ctx, 'leaver@example.com');
			const otherOwner = await seedMember(ctx, 'second-owner@example.com');
			await addMember(ctx, otherOwner.organizationId, owner.identity.subject, 'member');
			return { owner, second: otherOwner.organizationId };
		});
		const asOwner = t.withIdentity(owner.identity);
		await asOwner.mutation(api.organizations.mutations.setActiveOrganization, {
			organizationId: second
		});

		await asOwner.mutation(api.organizations.members.mutations.leaveOrganization, {});

		expect(await readActiveOrganization(t, owner.identity)).toEqual({
			user: owner.organizationId,
			session: owner.organizationId
		});
	});

	it('deleteOrganization moves the user to a remaining organization', async () => {
		const t = setup();
		const { owner, second } = await t.run(async (ctx) => {
			const owner = await seedMember(ctx, 'deleter@example.com');
			const second = await createOrganization(ctx);
			await addMember(ctx, second, owner.identity.subject, 'owner');
			return { owner, second };
		});
		const asOwner = t.withIdentity(owner.identity);
		await asOwner.mutation(api.organizations.mutations.setActiveOrganization, {
			organizationId: second
		});

		await asOwner.mutation(api.organizations.mutations.deleteOrganization, {
			organizationId: second
		});

		expect(await readActiveOrganization(t, owner.identity)).toEqual({
			user: owner.organizationId,
			session: owner.organizationId
		});
	});
});
