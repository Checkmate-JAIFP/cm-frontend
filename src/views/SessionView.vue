<template>
  <div class="mt-8 flex flex-col gap-y-8 mx-4">
    <TitleSection />
    <div class="relative">
      <VideoPlayer :active="!isReplay" ref="livePlayer" :is-tab-sharing="isTabSharing" />
      <VideoPlayer
        v-if="isReplay"
        :active="isReplay"
        :is-tab-sharing="false"
        :video-src="replaySrc"
        ref="replayPlayer"
        :claims="transcriptStore.claims"
      />
    </div>
    <button
      v-if="showBackToLiveButton"
      @click="displayLiveRecording"
      class="bg-blue-500 text-white py-1 px-3 rounded hover:bg-blue-600 w-aut self-center"
    >
      Back to Live
    </button>
    <button
      v-if="showStartReplayButton"
      @click="onStartReplayClick"
      class="bg-blue-500 text-white py-1 px-3 rounded hover:bg-blue-600 w-auto self-center"
    >
      Start Replay
    </button>
    <TranscriptSection />
    <ClaimSection></ClaimSection>
  </div>
</template>

<script setup lang="ts">
import TranscriptSection from '@/components/TranscriptSection.vue'
import ClaimSection from '@/components/ClaimSection.vue'
import { useTranscriptStore } from '@/stores/transcriptStore'
import { useLiveRecording } from '@/composables/useLiveRecording'
import { computed, onBeforeUnmount, onMounted, ref, watchEffect } from 'vue'
import VideoPlayer from '@/components/VideoPlayer.vue'
import axios from 'axios'
import TitleSection from '@/components/TitleSection.vue'

const { handleStartSession, stream, recordedChunks, isTabSharing } = useLiveRecording()
const transcriptStore = useTranscriptStore()

const livePlayer = ref()
const replayPlayer = ref()
const isReplay = ref(false)
const replaySrc = ref()

const showBackToLiveButton = computed(() => {
  return isReplay.value && transcriptStore.sessionMode !== 'replay' && isTabSharing.value
})
const showStartReplayButton = computed(() => {
  return !isReplay.value && transcriptStore.sessionMode !== 'replay'
})

onMounted(async () => {
  if (transcriptStore.sessionMode === 'replay' && transcriptStore.currentProjectId) {
    const videoUrl = await axios.get<{ data: string }>(
      `https://8xvtslnppb.execute-api.eu-central-1.amazonaws.com/dev/video/${transcriptStore.currentProjectId}`
    )
    replaySrc.value = videoUrl.data
    await generateReplay()
  } else {
    await startSession()
  }
})

onBeforeUnmount(async () => {
  transcriptStore.clearStore()
})

const startSession = async () => {
  if (livePlayer.value) {
    await handleStartSession()
  }
}
const generateReplay = async () => {
  isReplay.value = true
  if (isTabSharing.value) {
    replaySrc.value = URL.createObjectURL(new Blob(recordedChunks.value, { type: 'video/webm' }))
  }
}
const onStartReplayClick = () => {
  if (transcriptStore.sessionMode !== 'replay') {
    generateReplay()
  }
}

const displayLiveRecording = () => {
  isReplay.value = false
}
watchEffect(() => {
  if (livePlayer.value) {
    livePlayer.value.videoRef.srcObject = stream.value
  }
})
</script>

<style scoped></style>
