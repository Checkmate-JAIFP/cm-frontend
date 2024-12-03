<template>
  <div
    class="flex flex-col items-center justify-center bg-gray-100 border-2 border-dashed border-gray-300 rounded-md py-2 cursor-pointer hover:bg-gray-200"
  >
    <div class="text-center text-gray-500" @click="$emit('startSession')">
      <p>Start live recording from browser</p>
    </div>
  </div>
</template>

<script setup lang="ts"></script>

<style scoped></style>
