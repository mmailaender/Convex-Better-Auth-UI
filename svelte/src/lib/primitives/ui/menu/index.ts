import { Menu as MenuPrimitive } from '@ark-ui/svelte/menu';

import Trigger from './menu-trigger.svelte';
import Content from './menu-content.svelte';
import ItemGroupLabel from './menu-item-group-label.svelte';
import ItemGroup from './menu-item-group.svelte';
import Item from './menu-item.svelte';
import CheckboxItem from './menu-checkbox-item.svelte';
import TriggerItem from './menu-trigger-item.svelte';
import Separator from './menu-separator.svelte';

import Label from './menu-label.svelte';
import RadioGroup from './menu-radio-item-group.svelte';
import RadioItem from './menu-radio-item.svelte';
import Shortcut from './dropdown-menu-shortcut.svelte';
const Root = MenuPrimitive.Root;
export {
	Root,
	Trigger,
	CheckboxItem,
	Content,
	ItemGroupLabel,
	ItemGroup,
	Item,
	TriggerItem,
	Label,
	RadioGroup,
	RadioItem,
	Separator,
	Shortcut,
	//
	Root as Menu,
	Trigger as MenuTrigger,
	CheckboxItem as MenuCheckboxItem,
	Content as MenuContent,
	ItemGroup as MenuItemGroup,
	ItemGroupLabel as MenuItemGroupLabel,
	Item as MenuItem,
	TriggerItem as MenuTriggerItem,
	Label as DropdownMenuLabel,
	RadioGroup as DropdownMenuRadioGroup,
	RadioItem as DropdownMenuRadioItem,
	Separator as DropdownMenuSeparator,
	Shortcut as DropdownMenuShortcut
};
