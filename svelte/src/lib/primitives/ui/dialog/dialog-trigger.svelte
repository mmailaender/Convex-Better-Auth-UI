<script lang="ts">
	import { Dialog as ArkDialog } from '@ark-ui/svelte/dialog';

	let { ref = $bindable(null), ...restProps }: ArkDialog.TriggerProps = $props();
</script>

<ArkDialog.Trigger bind:ref data-slot="dialog-trigger" {...restProps} />
