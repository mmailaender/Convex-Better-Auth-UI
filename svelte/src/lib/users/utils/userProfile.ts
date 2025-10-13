export function requestCloseUserProfile(): void {
	window.dispatchEvent(new CustomEvent('user-profile:close'));
}
