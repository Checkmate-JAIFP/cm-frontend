<template>
  <div class="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center z-50">
    <div class="bg-white p-6 rounded-md shadow-md max-w-md w-full">
      <h2 class="text-lg font-semibold mb-4">Add Claim</h2>
      <form @submit.prevent="submitClaim" class="space-y-4">
        <div>
          <label class="block font-medium mb-1">Claim Text:</label>
          <input
            type="text"
            v-model="claimText"
            required
            class="w-full p-2 border border-gray-300 rounded"
          />
        </div>
        <div>
          <label class="block font-medium mb-1">Speaker (optional):</label>
          <input type="text" v-model="speaker" class="w-full p-2 border border-gray-300 rounded" />
        </div>
        <div>
          <label class="block font-medium mb-1">Annotation (optional):</label>
          <textarea
            v-model="annotation"
            class="w-full p-2 border border-gray-300 rounded"
          ></textarea>
        </div>
        <div class="flex justify-center gap-4 mt-6">
          <button
            type="button"
            @click="closeModal"
            class="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
          >
            Cancel
          </button>
          <button
            type="submit"
            class="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
          >
            Add Claim
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const emit = defineEmits(['close', 'submit'])

const claimText = ref('')
const speaker = ref('')
const annotation = ref('')
const props = defineProps<{ sentenceNr: number }>()
const { sentenceNr } = props

function closeModal() {
  emit('close')
}

function submitClaim() {
  emit('submit', {
    sentenceNr,
    claimText: claimText.value,
    speaker: speaker.value,
    annotation: annotation.value
  })
  closeModal()
}
</script>
