import Apple from './apple.svelte';
import Facebook from './facebook.svelte';
import Google from './google.svelte';
import Github from './github.svelte';
import { Fingerprint as Passkey } from 'lucide-svelte';

export type AccountIcons = {
	Apple: typeof Apple;
	Facebook: typeof Facebook;
	Google: typeof Google;
	Github: typeof Github;
	Passkey: typeof Passkey;
};

const accountIcons: AccountIcons = {
	Apple,
	Facebook,
	Google,
	Github,
	Passkey
};

const getAccountIcon = (name: keyof AccountIcons) => accountIcons[name];

export { Apple, Facebook, Google, Github, Passkey, getAccountIcon };
export default { Apple, Facebook, Google, Github, Passkey };
