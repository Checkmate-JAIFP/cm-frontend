<template>
  <div class="titleWrapper relative">
    <label class="absolute font-semibold top-0 left-2 transform -translate-y-1/2 bg-white px-2">
      Project Title
    </label>

    <div
      class="bg-gray-100 border border-gray-200 p-4 overflow-y-auto text-xs"
      @blur="cancelEditing"
    >
      <div class="flex items-center space-x-2 mt-2">
        <div class="flex items-center space-x-2">
          <button
            v-if="!isEditing"
            @click="startEditing"
            title="Edit Title"
            aria-label="Edit Title"
          >
            ✏️
          </button>
          <div v-else class="flex items-center space-x-2">
            <button
              @click="cancelEditing"
              title="Go Back Without Editing the Title"
              aria-label="Cancel Edit"
            >
              ←
            </button>
            <button @click="saveTitle" title="Save Changes" aria-label="Save Changes">✔️</button>
          </div>
        </div>
        <div v-if="isEditing" class="w-full">
          <input v-model="editableTitle" @keyup.enter="saveTitle" class="border px-2 py-1 w-full" />
        </div>
        <div v-else @dblclick="startEditing" class="cursor-pointer w-full">
          {{ transcriptStore.currentProjectName }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useTranscriptStore } from '@/stores/transcriptStore'
import { editProjectTitle } from '@/utils/apiUtils'

const transcriptStore = useTranscriptStore()
const isEditing = ref(false)
const editableTitle = ref(transcriptStore.currentProjectName)

const startEditing = () => {
  editableTitle.value = transcriptStore.currentProjectName
  isEditing.value = true
}

const saveTitle = async () => {
  if (editableTitle.value !== transcriptStore.currentProjectName) {
    transcriptStore.setCurrentProjectName(editableTitle.value)
    const projectId =
      transcriptStore.sessionMode === 'replay'
        ? transcriptStore.currentProjectId
        : transcriptStore.videoId
    await editProjectTitle(projectId, editableTitle.value)
  }
  isEditing.value = false
}

const cancelEditing = () => {
  isEditing.value = false
  editableTitle.value = transcriptStore.currentProjectName
}
</script>

<style scoped></style>
