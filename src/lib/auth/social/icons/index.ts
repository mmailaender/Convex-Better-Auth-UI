import Apple from './apple.svelte';
import Facebook from './facebook.svelte';
import Google from './google.svelte';
import Github from './github.svelte';

export type SocialIcons = {
	Apple: typeof Apple;
	Facebook: typeof Facebook;
	Google: typeof Google;
	Github: typeof Github;
};

export { Apple, Facebook, Google, Github };
export default { Apple, Facebook, Google, Github };
