<script lang="ts">
	import { Menu as MenuPrimitive } from '@ark-ui/svelte';
	let { ref = $bindable(null), ...restProps }: MenuPrimitive.ItemGroupProps = $props();
</script>

<MenuPrimitive.ItemGroup bind:ref data-slot="menu-group" {...restProps} />
