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

const socialIcons: SocialIcons = {
	Apple,
	Facebook,
	Google,
	Github,
};

const getSocialIcon = (name: keyof SocialIcons) => socialIcons[name];

export { Apple, Facebook, Google, Github, getSocialIcon };
export default { Apple, Facebook, Google, Github };
