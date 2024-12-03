<template>
  <div class="relative group flex items-center">
    <button @click.stop="removeFile" class="remove-button rounded-full hover:bg-gray-400">
      <img src="@/assets/closeIcon.svg" class="color" alt="Remove File" />
    </button>
    <div
      class="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:flex flex-col items-center"
    >
      <div class="bg-gray-800 text-white text-xs rounded py-1 px-2">Remove this file</div>
      <div class="bg-gray-800 h-2 w-2 transform rotate-45 -mt-1"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { defineProps, PropType } from 'vue'
defineProps({
  removeFile: {
    type: Function as PropType<(event: MouseEvent) => void>,
    required: true
  }
})
</script>

<style scoped></style>
