import { Select } from '@ark-ui/svelte/select';

import Group from './select-group.svelte';
import Label from './select-label.svelte';
import Item from './select-item.svelte';
import Content from './select-content.svelte';
import Trigger from './select-trigger.svelte';
import Separator from './select-separator.svelte';
import ScrollDownButton from './select-scroll-down-button.svelte';
import ScrollUpButton from './select-scroll-up-button.svelte';
import GroupHeading from './select-group-heading.svelte';

const Root = Select.Root;
const Positioner = Select.Positioner;
const ItemText = Select.ItemText;
const ItemIndicator = Select.ItemIndicator;

export {
	Root,
	Group,
	Label,
	Item,
	ItemText,
	ItemIndicator,
	Positioner,
	Content,
	Trigger,
	Separator,
	ScrollDownButton,
	ScrollUpButton,
	GroupHeading,
	//
	Root as Select,
	Group as SelectGroup,
	Label as SelectLabel,
	Item as SelectItem,
	Positioner as SelectPositioner,
	ItemText as SelectItemText,
	ItemIndicator as SelectItemIndicator,
	Content as SelectContent,
	Trigger as SelectTrigger,
	Separator as SelectSeparator,
	ScrollDownButton as SelectScrollDownButton,
	ScrollUpButton as SelectScrollUpButton,
	GroupHeading as SelectGroupHeading
};
