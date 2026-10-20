'use client';

import { useEffect, useId, useState } from 'react';
import { useQuery } from 'convex/react';
import { Check, ChevronDown, Loader2, Search } from 'lucide-react';

import { api } from '@/convex/_generated/api';
import * as Avatar from '@/components/primitives/ui/avatar';
import type { AdminUser } from '@/components/admin/types';

type UserSelectProps = {
	/** The selected user */
	value: AdminUser | null;
	onChange: (user: AdminUser) => void;
	/** Users not to offer, like the organization's members */
	excludeIds?: string[];
	/** Why a user can't be picked, shown instead of their email; `undefined` when they can */
	unavailableReason?: (user: AdminUser) => string | undefined;
	/** Id of the trigger, for a `<label htmlFor>` */
	id?: string;
};

function UserLabel({ user, detail = user.email }: { user: AdminUser; detail?: string }) {
	return (
		<>
			<Avatar.Root className="size-8 shrink-0">
				<Avatar.Image src={user.image ?? undefined} alt={user.name} />
				<Avatar.Fallback>
					<Avatar.Marble name={user.name} />
				</Avatar.Fallback>
			</Avatar.Root>
			<span className="flex min-w-0 flex-1 flex-col text-left">
				<span className="truncate text-sm">{user.name}</span>
				<span className="text-surface-600-400 truncate text-xs">{detail}</span>
			</span>
		</>
	);
}

/**
 * Picks a user, searching by name or email. The list expands inline rather than in a
 * popover: dialogs hide portaled content from screen readers and clip content that isn't portaled.
 */
export default function UserSelect({
	value,
	onChange,
	excludeIds = [],
	unavailableReason,
	id
}: UserSelectProps) {
	const listId = useId();
	const [expanded, setExpanded] = useState(false);
	const [searchInput, setSearchInput] = useState('');
	const [search, setSearch] = useState('');

	// Search runs 200ms after the last keystroke instead of on every one
	useEffect(() => {
		const timer = setTimeout(() => setSearch(searchInput.trim()), 200);
		return () => clearTimeout(timer);
	}, [searchInput]);

	const result = useQuery(
		api.admin.queries.listUsers,
		expanded ? { searchValue: search || undefined, limit: 20 } : 'skip'
	);
	// Keep showing the previous results, dimmed, while a new search loads
	const [data, setData] = useState(result);
	if (result !== undefined && result !== data) setData(result);
	const isStale = result === undefined && data !== undefined;
	const users = (data?.users ?? []).filter((user) => !excludeIds.includes(user.id));

	function toggle() {
		setExpanded(!expanded);
		if (!expanded) {
			setSearchInput('');
			setSearch('');
		}
	}

	function select(user: AdminUser) {
		onChange(user);
		setExpanded(false);
	}

	return (
		<div className="flex flex-col gap-1">
			<button
				id={id}
				type="button"
				className="input flex min-h-12 w-full cursor-pointer items-center gap-3 py-2 text-left"
				aria-expanded={expanded}
				aria-controls={listId}
				onClick={toggle}
			>
				{value ? (
					<UserLabel user={value} />
				) : (
					<span className="text-surface-600-400 flex-1 text-sm">Select a user...</span>
				)}
				<ChevronDown
					className={`size-4 shrink-0 opacity-60 transition-transform ${expanded ? 'rotate-180' : ''}`}
					aria-hidden="true"
				/>
			</button>
			{expanded ? (
				<div
					id={listId}
					className="border-surface-300-700 rounded-container flex flex-col gap-1 border p-1"
				>
					<div className="relative">
						<Search
							className="text-surface-400-600 pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
							aria-hidden="true"
						/>
						<input
							type="search"
							className="input pl-9 text-sm"
							placeholder="Search by name or email..."
							aria-label="Search users by name or email"
							value={searchInput}
							onChange={(e) => setSearchInput(e.target.value)}
							autoFocus
						/>
					</div>
					<div className="flex max-h-56 flex-col overflow-y-auto">
						{!data ? (
							<p className="text-surface-600-400 flex items-center gap-2 p-3 text-sm" role="status">
								<Loader2 className="size-4 animate-spin" aria-hidden="true" />
								Loading users...
							</p>
						) : users.length === 0 ? (
							<p className="text-surface-600-400 p-3 text-sm">
								{search ? `No users match "${search}".` : 'Search by name or email to find a user.'}
							</p>
						) : (
							users.map((user) => {
								const reason = unavailableReason?.(user);
								return (
									<button
										key={user.id}
										type="button"
										className={`hover:bg-surface-200-800 focus-visible:bg-surface-200-800 rounded-base flex items-center gap-3 p-2 outline-hidden disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent ${
											isStale ? 'opacity-60' : ''
										}`}
										aria-pressed={value?.id === user.id}
										disabled={Boolean(reason)}
										onClick={() => select(user)}
									>
										<UserLabel user={user} detail={reason} />
										{value?.id === user.id ? (
											<Check className="size-4 shrink-0" aria-hidden="true" />
										) : null}
									</button>
								);
							})
						)}
					</div>
				</div>
			) : null}
		</div>
	);
}
