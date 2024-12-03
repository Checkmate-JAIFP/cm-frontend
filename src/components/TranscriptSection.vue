<template>
  <div class="transcriptWrapper relative border border-gray-200">
    <label
      class="absolute font-semibold top-0 left-2 transform -translate-y-1/2 bg-white px-2 z-10"
    >
      Transcript
    </label>

    <div class="bg-gray-100 px-4 overflow-y-auto text-xs max-h-96">
      <button
        v-if="!isEditing && sentences.length"
        @click="toggleEdit"
        class="absolute top-2 right-8 bg-blue-500 text-white p-1 px-3 rounded hover:bg-blue-600 z-10"
      >
        Edit
      </button>
      <div class="sticky top-0 bg-gray-100 min-h-10"></div>
      <div v-if="!isEditing">
        <p v-if="!sentences.length">No transcript available</p>
        <div v-else>
          <div
            v-for="sentence in sentences"
            :key="sentence.sentenceNr"
            :title="getClaimText(sentence.sentenceNr)"
            @contextmenu.prevent="openContextMenu(sentence.sentenceNr)"
            class="group"
          >
            <span
              :class="{
                'bg-yellow-200': hasClaim(sentence.sentenceNr),
                'group-hover:bg-gray-300': !hasClaim(sentence.sentenceNr),
                'group-hover:bg-yellow-300': hasClaim(sentence.sentenceNr)
              }"
              @click="hasClaim(sentence.sentenceNr) ? jumpToClaim(sentence.sentenceNr) : null"
              >{{ sentence.text }}</span
            >
          </div>
        </div>
      </div>
      <div v-else>
        <div v-for="(sentence, index) in localSentences" :key="sentence.sentenceNr" class="mb-2">
          <input
            type="text"
            v-model="localSentences[index].text"
            @input="trackEdits(index)"
            class="w-full p-2 border border-gray-300"
          />
        </div>
        <div class="sticky bottom-0 bg-gray-100 min-h-10"></div>
        <div class="absolute bottom-2 flex space-x-2 mt-2">
          <button
            @click="cancelEdit"
            class="bg-gray-500 text-white py-1 px-3 rounded hover:bg-gray-600"
          >
            Back
          </button>
          <button
            @click="submitEdit"
            class="bg-green-500 text-white py-1 px-3 rounded hover:bg-green-600"
          >
            Submit
          </button>
        </div>
      </div>
    </div>
    <AddClaimModal
      v-if="showAddClaimModal && selectedSentenceNr !== null"
      :sentenceNr="selectedSentenceNr"
      @close="showAddClaimModal = false"
      @submit="addNewClaim"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useTranscriptStore } from '@/stores/transcriptStore'
import { updateSentence, addClaim, pollNewClaims } from '@/utils/apiUtils'
import AddClaimModal from '@/components/AddClaimModal.vue'

const transcriptStore = useTranscriptStore()
const sentences = ref(transcriptStore.sentences)
const isEditing = ref(false)
const editedSentences = ref<{ [key: number]: string }>({})
const localSentences = ref<{ sentenceNr: number; text: string; time: number }[]>([])
const showAddClaimModal = ref(false)
const selectedSentenceNr = ref<number | null>(null)

watch(
  () => transcriptStore.sentences,
  (newSentences) => {
    sentences.value = newSentences
  },
  { immediate: true }
)

function toggleEdit() {
  isEditing.value = true
  localSentences.value = transcriptStore.sentences.map((sentence) => ({
    ...sentence
  }))
}

function trackEdits(index: number) {
  const sentenceNr = localSentences.value[index].sentenceNr
  const currentText = localSentences.value[index].text
  const originalText = transcriptStore.sentences.find((s) => s.sentenceNr === sentenceNr)?.text

  if (currentText.trim() === '') {
    editedSentences.value[sentenceNr] = ''
  } else if (currentText !== originalText) {
    editedSentences.value[sentenceNr] = currentText
  } else {
    delete editedSentences.value[sentenceNr]
  }
}

function cancelEdit() {
  isEditing.value = false
  editedSentences.value = {}
}

async function submitEdit() {
  const edits = Object.entries(editedSentences.value)
  for (const [sentenceNr, text] of edits) {
    const nr = parseInt(sentenceNr, 10)
    await updateSentence(nr, text)
    transcriptStore.deleteClaimsBySentenceNr(nr)
    isEditing.value = false

    if (text !== '') {
      transcriptStore.setClaimsLoading(nr, true)
      await pollNewClaims(transcriptStore.videoId, nr)
      transcriptStore.setClaimsLoading(nr, false)
    }
  }

  editedSentences.value = {}
  sentences.value = [...transcriptStore.sentences]
}

function hasClaim(sentenceNr: number): boolean {
  return transcriptStore.claims.some((claim) => claim.sentenceNr === sentenceNr)
}

function getClaimText(sentenceNr: number): string {
  const claim = transcriptStore.claims.find((claim) => claim.sentenceNr === sentenceNr)
  return claim ? claim.text : ''
}

function jumpToClaim(sentenceNr: number) {
  const firstClaimIndex = transcriptStore.claims.findIndex(
    (claim) => claim.sentenceNr === sentenceNr
  )
  if (firstClaimIndex !== -1) {
    const claimElement = document.querySelector(
      `[data-claim-key="${sentenceNr}-${firstClaimIndex}"]`
    )
    if (claimElement) {
      claimElement.scrollIntoView()
      claimElement.classList.add('expanded')
    }
  }
}

function openContextMenu(sentenceNr: number) {
  selectedSentenceNr.value = sentenceNr
  showAddClaimModal.value = true
}

async function addNewClaim({
  sentenceNr,
  claimText,
  speaker,
  annotation
}: {
  sentenceNr: number
  claimText: string
  speaker?: string
  annotation?: string
}) {
  const sentence = transcriptStore.sentences.find((s) => s.sentenceNr === sentenceNr)
  const time = sentence ? sentence.time : 0
  await addClaim(sentenceNr, claimText, speaker, annotation)
  transcriptStore.addClaim({ sentenceNr, text: claimText, time, speaker, annotation })
  showAddClaimModal.value = false
}
</script>

<style scoped></style>
