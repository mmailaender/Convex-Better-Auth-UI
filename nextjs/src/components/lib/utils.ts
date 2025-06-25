import { clsx, type ClassValue } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';

const customTwMerge = extendTailwindMerge({
	extend: {
		classGroups: {
			// Add Skeleton rounded classes to the rounded group
			rounded: ['rounded-base', 'rounded-container']
		}
	}
});

export function cn(...inputs: ClassValue[]) {
	return customTwMerge(clsx(inputs));
}
