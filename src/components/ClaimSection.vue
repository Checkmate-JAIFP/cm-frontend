<template>
  <div class="claimsWrapper relative">
    <label class="absolute font-semibold top-0 left-2 transform -translate-y-1/2 bg-white px-2 z-10"
      >Claims</label
    >
    <div class="bg-gray-100 border border-gray-200 p-4 max-h-96 overflow-y-auto text-xs">
      <ClaimList> </ClaimList>
    </div>
  </div>
</template>

<script setup lang="ts">
import ClaimList from '@/components/ClaimList.vue'
</script>

<style scoped></style>
