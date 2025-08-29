<script lang="ts">
	import { Dialog as ArkDialog, type DialogTriggerProps } from '@ark-ui/svelte/dialog';

	let { ref = $bindable(null), ...restProps }: DialogTriggerProps = $props();
</script>

<ArkDialog.Trigger bind:ref data-slot="drawer-trigger" {...restProps} />
