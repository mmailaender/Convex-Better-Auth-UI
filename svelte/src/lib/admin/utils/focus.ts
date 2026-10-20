/**
 * Where keyboard focus goes as the dashboard's pages open and close. A page replaces the table it
 * opens from, so the focused element disappears with it.
 */

/** What the dashboard shows, from its URL. */
export type AdminView = {
	tab: string;
	/** The open user profile */
	user: string | null;
	/** The open organization page */
	organization: string | null;
};

/** Marks a page's back button, which takes focus when the page opens. */
export const BACK_ATTRIBUTE = 'data-admin-back';
/** Marks the link to a page with its id, which takes focus again when the page closes. */
export const FOCUS_ATTRIBUTE = 'data-admin-focus';

/**
 * The selector of the element to focus after going from `previous` to `view`: the back button of a
 * page that opened, or the link a page was opened from once it closes. `null` leaves focus alone,
 * such as on the tab after switching tabs.
 */
export function focusTarget(previous: AdminView, view: AdminView): string | null {
	const otherTab = view.tab !== previous.tab;
	if (view.user && (view.user !== previous.user || otherTab)) return `[${BACK_ATTRIBUTE}]`;
	if (
		view.organization &&
		!view.user &&
		(view.organization !== previous.organization || otherTab)
	) {
		return `[${BACK_ATTRIBUTE}]`;
	}
	if (otherTab) return null;
	const closed =
		previous.user && !view.user
			? previous.user
			: previous.organization && !view.organization
				? previous.organization
				: null;
	return closed ? `[${FOCUS_ATTRIBUTE}="${CSS.escape(closed)}"]` : null;
}

/**
 * Focuses the first visible element in `root` that matches `selector`. Pages and tables stay
 * mounted behind the page above them, hidden, so the same selector can match those too.
 */
export function focusVisible(root: ParentNode, selector: string): void {
	const element = Array.from(root.querySelectorAll<HTMLElement>(selector)).find((candidate) =>
		candidate.checkVisibility()
	);
	element?.focus();
}
