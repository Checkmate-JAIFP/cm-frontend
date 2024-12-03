<template>
  <div
    class="claim bg-white p-2 rounded shadow relative"
    :data-claim-key="props.claim.sentenceNr + '-' + props.index"
  >
    <div class="flex items-center justify-between space-x-2">
      <div class="flex items-center justify-between w-full mb-1">
        <div class="flex items-center space-x-2 min-w-[4rem]">
          <button @click="handleDelete" title="Delete Claim" aria-label="Delete Claim">🗑️</button>
          <button
            v-if="!isEditing && !isLoadingClaims"
            @click="startEditing"
            title="Edit Claim"
            aria-label="Edit Claim"
          >
            ✏️
          </button>
          <div v-else class="flex items-center space-x-2">
            <button
              @click="cancelEdit"
              title="Go Back Without Editing the Claim"
              aria-label="Cancel Edit"
              :disabled="isLoadingClaims"
            >
              ←
            </button>
            <button @click="submitEdit" title="Save Changes" :disabled="isLoadingClaims">✔️</button>
          </div>
        </div>
        <div v-if="isLoadingClaims" class="w-full text-gray-500">Fetching new claims...</div>
        <div v-if="!isEditing && !isLoadingClaims" class="w-full">{{ claim.text }}</div>
        <input
          v-else
          v-model="editedClaim"
          @keyup.enter="submitEdit"
          class="w-full border p-1 rounded"
          :disabled="isLoadingClaims"
        />
      </div>
      <button
        @click="handleExpand"
        class="expandButton ml-auto transform transition-transform duration-300"
        :class="{ 'rotate-180': isExpanded }"
        title="Expand"
        aria-label="Expand"
        :disabled="isLoadingClaims"
      >
        ▼
      </button>
    </div>
    <!-- Expanded content -->
    <div v-if="isExpanded" class="moreInfo w-full text-sm border-t pt-2 text-gray-700">
      <div>
        <label class="font-semibold mr-2">Speaker:</label>
        <input
          v-if="isEditing"
          v-model="editedSpeaker"
          @keyup.enter="submitEdit"
          class="border p-1 rounded w-full"
        />
        <span v-else-if="claim.speaker">{{ claim.speaker }}</span>
        <span
          v-else-if="claimResources.length > 0 && claimResources[0].matchedClaimSpeaker != 'None'"
          style="font-style: italic"
          >{{ claimResources[0].matchedClaimSpeaker }}</span
        >
        <span v-else>{{ '' }}</span>
      </div>
      <div>
        <label class="font-semibold mr-2">Timestamp:</label>
        <span>{{ formattedTime }}</span>
      </div>
      <div>
        <label class="font-semibold">References:</label>
        <div v-if="isLoadingReferences">Searching for Resources...</div>
        <ul
          v-if="!isLoadingReferences && claimResources.length > 0"
          class="list-disc pl-5 space-y-1"
        >
          <li v-for="(resource, index) in claimResources" :key="index">
            <a
              href="#"
              @click.prevent="openClaimReview(resource.claimReview[0].url)"
              class="text-blue-600 hover:text-blue-800 underline"
            >
              {{ resource.claimReview[0].title }}
            </a>
            <ul class="list-disc pl-5 space-y-1">
              <li class="text-gray-600 text-xs">
                Checked by: {{ resource.claimReview[0].publisher.name }}
              </li>
              <li v-if="resource.publishingDate != 'None'" class="text-gray-600 text-xs">
                Checked on: {{ resource.publishingDate }}
              </li>
              <li
                v-if="resource.claimReview[0].textualRating != 'None'"
                class="text-gray-600 text-xs"
              >
                Conclusion: {{ resource.claimReview[0].textualRating }}
              </li>
            </ul>
          </li>
        </ul>
        <p v-else-if="!isLoadingReferences">No Resources available.</p>
      </div>
      <div>
        <label class="font-semibold mr-2">Annotations:</label>
        <textarea
          v-if="isEditing"
          v-model="editedAnnotation"
          class="border p-1 rounded w-full"
        ></textarea>

        <span v-else>{{ claim.annotation }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { formatTime } from '@/utils/helpers'
import { fetchClaimInfo } from '@/utils/apiUtils'
import { ClaimResource } from '@/types'
import { useTranscriptStore } from '@/stores/transcriptStore'

const props = defineProps<{
  claim: { text: string; sentenceNr: number; time: number; speaker?: string; annotation?: string }
  index: number
}>()
const emit = defineEmits(['deleteClaim', 'editClaim'])
const transcriptStore = useTranscriptStore()

const isEditing = ref(false)
const editedClaim = ref(props.claim.text) // Holds the current text of the claim while editing
const isExpanded = ref(false)
const editedSpeaker = ref(props.claim.speaker || '') // Holds the current speaker while editing
const editedAnnotation = ref(props.claim.annotation || '')
const formattedTime = computed(() => formatTime(props.claim.time))

const claimResources = ref<ClaimResource[]>([])
const isLoadingReferences = ref(false)

const isLoadingClaims = computed(() => transcriptStore.isClaimsLoading(props.claim.sentenceNr))

function handleDelete() {
  emit('deleteClaim', props.claim.text)
}

function startEditing() {
  isEditing.value = true
}
// Revert changes
function cancelEdit() {
  editedClaim.value = props.claim.text
  editedSpeaker.value = props.claim.speaker || ''
  editedAnnotation.value = props.claim.annotation || ''
  isEditing.value = false
}

function submitEdit() {
  const hasTextChanged = editedClaim.value !== props.claim.text
  emit(
    'editClaim',
    props.claim.text,
    editedClaim.value,
    editedSpeaker.value,
    editedAnnotation.value
  )
  isEditing.value = false // Exit editing mode
  if (hasTextChanged) {
    const speaker = props.claim.speaker || ''
    updateClaimReferences(editedClaim.value, speaker)
  }
}

function handleExpand() {
  isExpanded.value = !isExpanded.value // Toggle
  if (isExpanded.value) {
    const speaker = props.claim.speaker || ''
    updateClaimReferences(props.claim.text, speaker) // Fetch resources when expanding
  }
}

function updateClaimReferences(claimText: string, claimSpeaker: string) {
  isLoadingReferences.value = true
  fetchClaimInfo(claimText, claimSpeaker)
    .then((resources) => {
      if (resources && resources.length > 0) {
        claimResources.value = resources as ClaimResource[]
      } else {
        claimResources.value = []
      }
    })
    .catch(() => {
      claimResources.value = []
    })
    .finally(() => {
      isLoadingReferences.value = false
    })
}

function openClaimReview(url: string) {
  window.open(url, '_blank')
}
// Lifecycle hook: observe mutation events to track the expanded state based on DOM changes
onMounted(() => {
  // Select the DOM element corresponding to this claim, using a unique key (sentence number + index)
  const claimElement = document.querySelector(
    `[data-claim-key="${props.claim.sentenceNr}-${props.index}"]`
  )
  // Create a MutationObserver to monitor changes in the claim element's class attribute
  const observer = new MutationObserver(() => {
    // If the claim element has the 'expanded' class, set the component's expanded state to true
    if (claimElement && claimElement.classList.contains('expanded')) {
      isExpanded.value = true // Sync internal expanded state with the DOM
    }
  })
  // Start observing the claim element for class attribute changes
  if (claimElement) {
    observer.observe(claimElement, { attributes: true, attributeFilter: ['class'] })
  }
})
</script>
