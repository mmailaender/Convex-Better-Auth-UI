let successMessage = $state('');
let errorMessage = $state('');

export function notifySuccess(msg: string) {
	successMessage = msg;
	errorMessage = '';
}

export function notifyError(msg: string) {
	errorMessage = msg;
	successMessage = '';
}

export function clearMessages() {
	successMessage = '';
	errorMessage = '';
}

export function getMessages() {
	return { successMessage, errorMessage };
}
