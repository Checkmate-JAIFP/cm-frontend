<template>
  <div class="mt-8 flex flex-col gap-y-4 mx-4">
    <!-- Hidden because no backend support yet for working with uploaded files: -->
    <FileUpload @transcribeSuccess="handleTranscribeSuccess" class="hidden" />
    <span class="hidden text-gray-500">OR</span>

    <LiveRecording @startSession="redirectToSession" />

    <div class="projectsWrapper relative mt-8">
      <label class="absolute font-semibold top-0 left-2 transform -translate-y-1/2 bg-white px-2"
        >My Projects</label
      >
      <div class="transcript bg-gray-100 border border-gray-200 p-4 overflow-y-auto text-xs">
        <div
          v-for="project in projects"
          :key="project.projectId"
          class="flex items-center justify-between p-4 border-b"
        >
          <div class="flex-1 flex">
            <input
              v-if="editingProjectId === project.projectId"
              v-model="project.projectName"
              @keyup.enter="stopEditing(project.projectId)"
              class="border px-2 py-1 mr-2 flex-grow max-w-lg"
            />
            <div v-else @dblclick="editProjectName(project.projectId)" class="cursor-pointer">
              {{ project.projectName }}
            </div>
          </div>

          <div class="w-34 mr-24 text-gray-400 text-right">
            {{ formatTimestamp(project.timeCreated) }}
          </div>

          <div class="flex items-center gap-2">
            <button @click="confirmDelete(project.projectId)" class="text-red-500 hover:underline">
              Delete
            </button>
            <button @click="openProject(project.projectId)" class="text-blue-500 hover:underline">
              Open
            </button>
          </div>
        </div>
      </div>
    </div>

    <div
      v-if="showConfirmModal"
      class="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center"
    >
      <div class="bg-white p-6 rounded-md shadow-md">
        <p class="mb-4">
          Are you sure you want to delete this project? Once it's gone, it’s gone for good!
        </p>
        <div class="flex justify-center gap-10">
          <button @click="deleteEntry" class="bg-red-500 text-white px-4 py-2 rounded">
            Delete
          </button>
          <button @click="closeModal" class="bg-gray-500 text-white px-4 py-2 rounded">
            Cancel
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import FileUpload from '@/components/FileUpload.vue'
import LiveRecording from '@/components/LiveRecording.vue'
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useTranscriptStore } from '@/stores/transcriptStore'
import { fetchProjects, fetchProjectData, editProjectTitle, deleteProject } from '@/utils/apiUtils'
import { Project } from '@/types'

const router = useRouter()
const transcriptStore = useTranscriptStore()

const showConfirmModal = ref(false)
const projectToDelete = ref<string | null>(null)
const projects = ref<Project[]>([])
const editingProjectId = ref<string | null>(null)

const loadProjects = async () => {
  const fetchedProjects: Project[] = await fetchProjects()
  projects.value = fetchedProjects.sort((a, b) => Number(b.timeCreated) - Number(a.timeCreated))
}

const handleTranscribeSuccess = (transcript: string) => {
  transcriptStore.setTranscript(transcript)
}

const redirectToSession = async () => {
  await router.push({ name: 'Session' })
}

const editProjectName = (id: string) => {
  editingProjectId.value = id
}

const stopEditing = async (id: string) => {
  editingProjectId.value = null

  const updatedProject = projects.value.find((project) => project.projectId === id)

  if (updatedProject) {
    await editProjectTitle(id, updatedProject.projectName)
  }
}

const openProject = async (projectId: string) => {
  const project = projects.value.find((proj) => proj.projectId === projectId)
  if (project) {
    transcriptStore.setCurrentProjectName(project.projectName)
  }
  await fetchProjectData(projectId)
  transcriptStore.setReplaySession(projectId)
  await router.push({ name: 'Session' })
}

const confirmDelete = (id: string) => {
  projectToDelete.value = id
  showConfirmModal.value = true
}

const deleteEntry = async () => {
  const projectId = projectToDelete.value
  if (projectId !== null) {
    await deleteProject(projectId)
    projects.value = projects.value.filter((project) => project.projectId !== projectId)

    closeModal()
  }
}

const closeModal = () => {
  projectToDelete.value = null
  showConfirmModal.value = false
}

const formatTimestamp = (timestamp: string) => {
  const date = new Date(Number(timestamp))
  return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
}

onMounted(loadProjects)
</script>

<style scoped></style>
