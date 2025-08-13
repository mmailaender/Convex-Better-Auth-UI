<script lang="ts">
	import {
		DialogCloseTrigger as ArkDialogCloseTrigger,
		type DialogCloseTriggerProps
	} from '@ark-ui/svelte/dialog';

	let { ref = $bindable(null), ...restProps }: DialogCloseTriggerProps = $props();
</script>

<ArkDialogCloseTrigger
	bind:ref
	data-scope="dialog"
	data-part="close"
	type="button"
	{...restProps}
/>
