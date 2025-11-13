<script lang="ts">
	import { Menu as MenuPrimitive } from '@ark-ui/svelte';
	let { ref = $bindable(null), ...restProps }: MenuPrimitive.TriggerProps = $props();
</script>

<MenuPrimitive.Trigger bind:ref data-slot="menu-trigger" {...restProps} />
