import { v4 as uuidv4 } from 'uuid'
import { displayMediaSettings, generalSettings, mediaRecorderSettings } from '@/utils/mediaSettings'
import { saveBlobAsFile } from '@/utils/helpers'
import { useDisplayMedia } from '@vueuse/core'
import { ref } from 'vue'

import { sendChunk, stopUpload } from '@/utils/apiUtils'

export function useLiveRecording() {
  const recordedChunks = ref<BlobPart[]>([])
  let chunkNr = 0

  const { stream, start } = useDisplayMedia(displayMediaSettings)

  const isTabSharing = ref(false)

  const getCurrentTimestamp = () => Date.now()

  const videoId = uuidv4()

  const record = async () => {
    try {
      await start()
      if (stream.value) {
        isTabSharing.value = true
        const mediaRecorder = new MediaRecorder(stream.value, mediaRecorderSettings)
        mediaRecorder.onstop = async () => {
          isTabSharing.value = false
          if (generalSettings.saveLocalCopy) {
            const blob = new Blob(recordedChunks.value, { type: 'video/webm' })
            const filename = `${getCurrentTimestamp()}.webm`
            saveBlobAsFile(blob, filename)
            recordedChunks.value.length = 0
          }
          if (generalSettings.transferToBackend) {
            await stopUpload(videoId, chunkNr)
          }
          window.location.replace('/dashboard')
        }
        mediaRecorder.ondataavailable = async (event) => {
          if (event.data.size > 0) {
            recordedChunks.value.push(event.data)
            chunkNr = recordedChunks.value.length
            if (generalSettings.transferToBackend) {
              await sendChunk(chunkNr, event.data, videoId)
            }
          }
        }
        mediaRecorder.start(1000)
      }
    } catch (error) {
      isTabSharing.value = false
      return `Something went wrong. System reported: "${error}"`
    }
    return 'Recording started'
  }

  const handleStartSession = async () => {
    return await record()
  }

  return { handleStartSession, stream, recordedChunks, isTabSharing }
}
