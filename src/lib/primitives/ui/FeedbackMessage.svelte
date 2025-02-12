<script lang="ts">
    import { TriangleAlert } from 'lucide-svelte';
  interface Props {
    successMessage?: string;
    errorMessage?: string;
  }

  let { successMessage = $bindable(''), errorMessage = $bindable('') }: Props = $props();
  
    function clearSuccess() {
      successMessage = '';
    }
    function clearError() {
      errorMessage = '';
    }
  </script>
  
  {#if successMessage}
    <div class="card grid grid-cols-1 items-center gap-4 p-4 preset-outlined-success-500 lg:grid-cols-[1fr_auto]">
      <div>
        <p class="font-bold">Success</p>
        <p class="opacity-60 type-scale-1">{successMessage}</p>
      </div>
      <div class="flex gap-1">
        <button class="btn preset-tonal hover:preset-filled" onclick={clearSuccess}>
          Dismiss
        </button>
      </div>
    </div>
  {/if}
  
  {#if errorMessage}
    <div class="card grid grid-cols-1 items-center gap-4 p-4 preset-outlined-error-500 lg:grid-cols-[auto_1fr_auto]">
      <TriangleAlert />
      <div>
        <p class="font-bold">Error</p>
        <p class="opacity-60 type-scale-1">{errorMessage}</p>
      </div>
      <div class="flex gap-1">
        <button class="btn preset-tonal hover:preset-filled" onclick={clearError}>
          Dismiss
        </button>
      </div>
    </div>
  {/if}
  