'use client';

import { useEffect, useId, useState } from 'react';
import { useQuery } from 'convex/react';
import { Check, ChevronDown, Loader2, Search } from 'lucide-react';

import { api } from '@/convex/_generated/api';
import * as Avatar from '@/components/primitives/ui/avatar';
import type { AdminOrganization } from '@/components/admin/types';

type OrganizationSelectProps = {
	/** The selected organization */
	value: AdminOrganization | null;
	onChange: (organization: AdminOrganization) => void;
	/** Organizations not to offer, like those the user already belongs to */
	excludeIds?: string[];
	/** Id of the trigger, for a `<label htmlFor>` */
	id?: string;
};

function OrganizationLabel({ organization }: { organization: AdminOrganization }) {
	return (
		<>
			<Avatar.Root className="rounded-container size-8 shrink-0">
				<Avatar.Image src={organization.logo ?? undefined} alt={organization.name} />
				<Avatar.Fallback className="rounded-container">
					<Avatar.Marble name={organization.name} />
				</Avatar.Fallback>
			</Avatar.Root>
			<span className="flex min-w-0 flex-1 flex-col text-left">
				<span className="truncate text-sm">{organization.name}</span>
				<span className="text-surface-600-400 truncate text-xs">{organization.slug}</span>
			</span>
		</>
	);
}

/**
 * Picks an organization, searching by name or slug. The list expands inline rather than in a
 * popover: dialogs hide portaled content from screen readers and clip content that isn't portaled.
 */
export default function OrganizationSelect({
	value,
	onChange,
	excludeIds = [],
	id
}: OrganizationSelectProps) {
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
		api.admin.queries.searchOrganizations,
		expanded ? { search: search || undefined } : 'skip'
	);
	// Keep showing the previous results, dimmed, while a new search loads
	const [data, setData] = useState(result);
	if (result !== undefined && result !== data) setData(result);
	const isStale = result === undefined && data !== undefined;
	const organizations = (data ?? []).filter(
		(organization) => !excludeIds.includes(organization._id)
	);

	function toggle() {
		setExpanded(!expanded);
		if (!expanded) {
			setSearchInput('');
			setSearch('');
		}
	}

	function select(organization: AdminOrganization) {
		onChange(organization);
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
					<OrganizationLabel organization={value} />
				) : (
					<span className="text-surface-600-400 flex-1 text-sm">Select an organization...</span>
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
							placeholder="Search organizations..."
							aria-label="Search organizations"
							value={searchInput}
							onChange={(e) => setSearchInput(e.target.value)}
							autoFocus
						/>
					</div>
					<div className="flex max-h-56 flex-col overflow-y-auto">
						{!data ? (
							<p className="text-surface-600-400 flex items-center gap-2 p-3 text-sm" role="status">
								<Loader2 className="size-4 animate-spin" aria-hidden="true" />
								Loading organizations...
							</p>
						) : organizations.length === 0 ? (
							<p className="text-surface-600-400 p-3 text-sm">
								{search ? `No organizations match "${search}".` : 'No organizations to add.'}
							</p>
						) : (
							organizations.map((organization) => (
								<button
									key={organization._id}
									type="button"
									className={`hover:bg-surface-200-800 focus-visible:bg-surface-200-800 rounded-base flex items-center gap-3 p-2 outline-hidden ${
										isStale ? 'opacity-60' : ''
									}`}
									aria-pressed={value?._id === organization._id}
									onClick={() => select(organization)}
								>
									<OrganizationLabel organization={organization} />
									{value?._id === organization._id ? (
										<Check className="size-4 shrink-0" aria-hidden="true" />
									) : null}
								</button>
							))
						)}
					</div>
				</div>
			) : null}
		</div>
	);
}
