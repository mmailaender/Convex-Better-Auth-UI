import client from '$lib/db/client';
import type { User } from '$lib/db/schema/types/custom';
import type { AddEmailData } from '$lib/user/api/types';
import { fql } from 'fauna';


export async function addEmail(
	accessToken: string,
    addEmailData: AddEmailData
): Promise<User> {
	try {
		const response = await client(accessToken).query<User>(
			fql`addEmail(${addEmailData})`
		);
		if (!response.data) {
			throw new Error(response.summary);
		}
		return response.data;
	} catch (err: unknown) {
		console.log('addEmail() error: ', err);
		if (err instanceof Error) {
			throw new Error(err.message);
		}
		throw new Error('Error updating email.');
	}
}

export async function deleteEmail(accessToken: string, email: string): Promise<User> {
	try {
		const response = await client(accessToken).query<User>(fql`deleteEmail(${email})`);
		return response.data;
	} catch (err: unknown) {
		if (err instanceof Error) {
			throw new Error(err.message);
		}
		throw new Error('Error updating email.');
	}
}

export async function setPrimaryEmail(accessToken: string, email: string): Promise<User> {
	try {
		const response = await client(accessToken).query<User>(
			fql`Query.identity()!.update({ primaryEmail: ${email} })`
		);
		return response.data;
	} catch (err: unknown) {
		if (err instanceof Error) {
			throw new Error(err.message);
		}
		throw new Error('Error updating email.');
	}
}

export async function cancelEmailVerification(
	accessToken: string,
	email: string
): Promise<boolean> {
	const response = await client(accessToken).query<boolean>(
		fql`deleteEmailVerification(${email})`
	);
	if (!response.data) {
		throw new Error(response.summary);
	}
	return response.data;
}