<template>
  <div
    class="flex flex-col items-center justify-center bg-gray-100 border-2 border-dashed border-gray-300 rounded-md py-2 cursor-pointer hover:bg-gray-200"
    @dragover.prevent
    @dragenter.prevent="toggleActive"
    @dragleave.prevent="toggleActive"
    @drop.prevent="handleDrop"
    @click="selectFile"
    :class="{ 'active-dropzone': isDropzoneActive }"
  >
    <input type="file" ref="fileInput" class="hidden" @change="handleFileChange" />
    <div v-if="!file" class="text-center text-gray-500">
      <p>Click here and choose a file or drag the file here.</p>
    </div>
    <div v-else class="flex items-center justify-center space-x-4 w-full px-4">
      <p class="text-gray-500">File: {{ file.name }} has been added.</p>
      <RemoveFileButton :removeFile="removeFile" />
      <button @click.stop="transcribeFile" class="px-4 py-1 bg-blue-500 text-white rounded-xl">
        Transcribe File
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import RemoveFileButton from '@/components/RemoveFileButton.vue'

const file = ref<File | null>(null)
const fileInput = ref<HTMLInputElement | null>(null)
const isDropzoneActive = ref(false)

const toggleActive = () => {
  isDropzoneActive.value = !isDropzoneActive.value
}

const handleDrop = (event: DragEvent) => {
  const droppedFile = event.dataTransfer?.files[0]
  if (droppedFile) {
    file.value = droppedFile
    isDropzoneActive.value = !isDropzoneActive.value
  }
}

const selectFile = () => {
  fileInput.value?.click()
}

const handleFileChange = (event: Event) => {
  const input = event.target as HTMLInputElement
  if (input.files && input.files.length > 0) {
    file.value = input.files[0]
  }
}

const removeFile = () => {
  file.value = null
}
// TODO: Logic to transcribe an uploaded file:
const transcribeFile = async () => {
  /* if (file.value) {
    const formData = new FormData()
    formData.append('file', file.value)

    try {
      const response = await axios.post('/api/transcribe', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })
      // Emit the transcript to the parent component
      emit('transcribeSuccess', response.data.transcript)
    } catch (error) {
      console.error('Error transcribing file:', error)
    }
  }*/
}
</script>

<style scoped>
.active-dropzone {
  color: #fff;
  border-color: #fff;
  background-color: #41b883;
}
</style>
