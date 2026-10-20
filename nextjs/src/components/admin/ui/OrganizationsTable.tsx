'use client';

import { useEffect, useState } from 'react';
import { useQuery } from 'convex/react';
import { Loader2, Search } from 'lucide-react';

import { api } from '@/convex/_generated/api';
import * as Avatar from '@/components/primitives/ui/avatar';
import OrganizationActionsMenu from '@/components/admin/ui/OrganizationActionsMenu';
import { LIST_MAX } from '@/components/admin/utils/admin.constants';

const PAGE_SIZE = 25;

type OrganizationsTableProps = {
	/** Opens the page of an organization */
	onViewOrganization: (organizationId: string) => void;
};

/**
 * Admin organizations table. Lists every organization in the deployment with search; a row
 * opens the organization's page. Only mounted when the `organizations` feature toggle is
 * enabled (enforced by {@link AdminDashboard} and the server functions).
 */
export default function OrganizationsTable({ onViewOrganization }: OrganizationsTableProps) {
	const [searchInput, setSearchInput] = useState('');
	const [searchQuery, setSearchQuery] = useState('');
	const [limit, setLimit] = useState(PAGE_SIZE);

	// Search runs 250ms after the last keystroke instead of on every one, like the users table
	useEffect(() => {
		const timer = setTimeout(() => {
			setSearchQuery(searchInput.trim());
			setLimit(PAGE_SIZE);
		}, 250);
		return () => clearTimeout(timer);
	}, [searchInput]);

	// "Load more" raises the limit of one reactive list, like the users table
	const result = useQuery(api.admin.queries.listAllOrganizations, {
		searchValue: searchQuery || undefined,
		limit
	});
	// Keep showing the previous result, dimmed, while a new search or page loads
	const [data, setData] = useState(result);
	if (result !== undefined && result !== data) setData(result);
	const isStale = result === undefined && data !== undefined;
	const organizations = data?.organizations ?? [];

	return (
		<div className="flex h-full flex-col">
			<div className="flex shrink-0 items-center gap-3 py-4">
				<div className="relative flex-1">
					<div className="pointer-events-none absolute inset-y-0 flex items-center">
						<Search className="text-surface-400-600 size-4" aria-hidden="true" />
					</div>
					<input
						type="search"
						className="input w-full !border-0 border-transparent pl-6 text-sm"
						placeholder="Search by name or slug..."
						aria-label="Search organizations by name or slug"
						value={searchInput}
						onChange={(e) => setSearchInput(e.target.value)}
					/>
				</div>
			</div>

			{!data ? (
				<div className="text-surface-600-400 flex items-center gap-2 p-4 text-sm" role="status">
					<Loader2 className="size-4 animate-spin" aria-hidden="true" />
					Loading organizations...
				</div>
			) : organizations.length === 0 ? (
				<div className="text-surface-600-400 p-4 text-sm">
					{searchQuery ? `No organizations match "${searchQuery}".` : 'No organizations yet.'}
				</div>
			) : (
				<div
					className={`max-h-[calc(80vh-12rem)] overflow-y-auto pb-12 transition-opacity ${
						isStale ? 'opacity-60' : ''
					}`}
				>
					<table className="table w-full">
						<thead className="bg-surface-50-950 sticky top-0 z-20">
							<tr>
								<th className="text-surface-600-400 p-2 !pl-3 text-left text-xs font-semibold">
									Organization
								</th>
								<th className="text-surface-600-400 hidden w-32 p-2 text-left text-xs sm:table-cell">
									Created
								</th>
								<th className="w-12 p-2">
									<span className="sr-only">Actions</span>
								</th>
							</tr>
						</thead>
						<tbody>
							{organizations.map((org) => (
								<tr
									key={org._id}
									className="!border-surface-300-700 hover:bg-surface-100-900 cursor-pointer !border-t"
									onClick={() => onViewOrganization(org._id)}
								>
									<td className="max-w-0 !py-3 !pl-3">
										<div className="flex items-center gap-3">
											<Avatar.Root className="rounded-container size-9 shrink-0">
												<Avatar.Image src={org.logo ?? undefined} alt={org.name} />
												<Avatar.Fallback className="rounded-container">
													<Avatar.Marble name={org.name} />
												</Avatar.Fallback>
											</Avatar.Root>
											<div className="flex min-w-0 flex-col">
												{/* The keyboard way to the organization; the row handles pointer clicks */}
												<button
													type="button"
													className="truncate text-left text-sm font-medium hover:underline"
													onClick={(event) => {
														event.stopPropagation();
														onViewOrganization(org._id);
													}}
												>
													{org.name}
												</button>
												<span className="text-surface-600-400 truncate text-sm">{org.slug}</span>
											</div>
										</div>
									</td>
									<td className="text-surface-600-400 hidden text-sm sm:table-cell">
										{new Date(org.createdAt).toLocaleDateString()}
									</td>
									{/* Clicks on the menu, portaled or not, bubble through React to the row: stop them here */}
									<td className="text-right" onClick={(event) => event.stopPropagation()}>
										<OrganizationActionsMenu
											organization={org}
											onView={() => onViewOrganization(org._id)}
										/>
									</td>
								</tr>
							))}
						</tbody>
					</table>
					{searchQuery && !isStale && organizations.length >= PAGE_SIZE ? (
						<p className="text-surface-600-400 py-3 text-center text-xs">
							Showing the first {PAGE_SIZE} matches. Refine your search to narrow them down.
						</p>
					) : null}
					{data.hasMore && limit >= LIST_MAX ? (
						<p className="text-surface-600-400 py-3 text-center text-xs">
							Showing the newest {LIST_MAX} organizations. Search to find the others.
						</p>
					) : data.hasMore ? (
						<div className="flex justify-center py-3">
							<button
								type="button"
								className="btn preset-tonal"
								onClick={() => setLimit(Math.min(limit + PAGE_SIZE, LIST_MAX))}
								disabled={isStale}
							>
								Load more
							</button>
						</div>
					) : null}
				</div>
			)}
		</div>
	);
}
