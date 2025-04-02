import { DocumentByName, WithoutSystemFields } from 'convex/server';
import { entDefinitions } from '../schema';
import { Ent } from '../types';

/**
 * Represents the arguments for a write operation (create, update, delete) for a specific Convex Ent table.
 * @template TableName The name of the table.
 */
export type WriteType<TableName extends keyof typeof entDefinitions> =
	| {
			operation: 'create';
			ent: undefined;
			value: WithoutSystemFields<DocumentByName<typeof entDefinitions, TableName>>;
	  }
	| {
			operation: 'update';
			ent: Ent<TableName>;
			value: Partial<WithoutSystemFields<DocumentByName<typeof entDefinitions, TableName>>>;
	  }
	| { operation: 'delete'; ent: Ent<TableName>; value: undefined };
