import Root from './drawer.svelte';
import Content from './drawer-content.svelte';
import Description from './drawer-description.svelte';
import Backdrop from './drawer-backdrop.svelte';
import Footer from './drawer-footer.svelte';
import Header from './drawer-header.svelte';
import Title from './drawer-title.svelte';
import NestedRoot from './drawer-nested.svelte';
import Close from './drawer-close.svelte';
import CloseX from './drawer-close-x.svelte';
import Trigger from './drawer-trigger.svelte';

export {
	Root,
	NestedRoot,
	Content,
	Description,
	Backdrop,
	Footer,
	Header,
	Title,
	Trigger,
	Close,
	CloseX,
	//
	Root as Drawer,
	NestedRoot as DrawerNestedRoot,
	Content as DrawerContent,
	Description as DrawerDescription,
	Backdrop as DrawerBackdrop,
	Footer as DrawerFooter,
	Header as DrawerHeader,
	Title as DrawerTitle,
	Trigger as DrawerTrigger,
	Close as DrawerClose,
	CloseX as DrawerCloseX
};
