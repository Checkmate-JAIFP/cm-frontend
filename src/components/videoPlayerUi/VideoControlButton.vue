<template>
  <button :class="size === 'small' ? 'w-7' : 'w-12'"
          class="text-inherit h-7 text-lg cursor-pointer opacity-85 transition-opacity duration-100 ease-in-out align-baseline hover:opacity-1">
    <slot />
  </button>
</template>
<script setup lang="ts">

defineProps<{
  size: 'small' | 'wide'
}>()

</script>
