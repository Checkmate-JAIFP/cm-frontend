<template>
  <div class="space-y-2">
    <div
      v-if="isAnySentenceLoading"
      class="loading-indicator flex items-center space-x-2 text-sm text-gray-500"
    >
      <span class="loader-spinner"></span>
      <span>Updating the claim list...</span>
    </div>
    <ClaimListItem
      v-for="(claim, index) in claims"
      :key="claim.sentenceNr + '-' + index"
      :claim="claim"
      :index="index"
      :data-claim-key="claim.sentenceNr + '-' + index"
      :annotation="claim.annotation ? [claim.annotation][index] : ''"
      @deleteClaim="onDeleteClaim"
      @editClaim="onEditClaim"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useTranscriptStore } from '@/stores/transcriptStore'
import ClaimListItem from '@/components/ClaimListItem.vue'
import { deleteClaim, updateClaim } from '@/utils/apiUtils'
const transcriptStore = useTranscriptStore()
const claims = computed(() => transcriptStore.claims)
const isAnySentenceLoading = computed(() => transcriptStore.isAnyClaimLoading())

async function onDeleteClaim(claimText: string) {
  await deleteClaim(claimText)
}

const onEditClaim = async (
  oldClaimText: string,
  newClaimText: string,
  newSpeaker: string,
  newAnnotation: string
) => await updateClaim(oldClaimText, newClaimText, newSpeaker, newAnnotation || '')
</script>
