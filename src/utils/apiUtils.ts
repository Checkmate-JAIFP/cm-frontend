import axios from 'axios'
import { generalSettings } from '@/utils/mediaSettings'
import { useTranscriptStore } from '@/stores/transcriptStore'
import { ClaimResource, DataToSend, ProjectData } from '@/types'

const transcriptStore = useTranscriptStore()

export const fetchProjects = async () => {
  try {
    const response = await axios.get(generalSettings.fetchProjectsUrl)
    return response.data
  } catch (error) {
    throw new Error('Failed to fetch projects.')
  }
}

export const deleteProject = async (projectId: string) => {
  const url = `${generalSettings.fetchProjectsUrl}/${projectId}`
  const response = await axios.delete(url)
  return response.data
}

const cleanObject = (obj: Record<string, unknown>): ProjectData => {
  return {
    sentenceNr: obj.sentenceNr as number,
    text: obj.text === 'null' || obj.text === undefined ? '' : (obj.text as string),
    time: obj.time as number,
    claims: (obj.claims === 'null' ? undefined : obj.claims) as string | undefined,
    speaker: (obj.speaker === 'null' ? undefined : obj.speaker) as string | undefined,
    annotation: (obj.annotation === 'null' || obj.annotation === undefined
      ? ''
      : obj.annotation) as string
  }
}
export const fetchProjectData = async (projectId: string): Promise<void> => {
  try {
    const response = await axios.get<ProjectData[]>(
      `https://8xvtslnppb.execute-api.eu-central-1.amazonaws.com/dev/claims/${projectId}`
    )

    const cleanedData: ProjectData[] = response.data.map((item) =>
      cleanObject(item as unknown as Record<string, unknown>)
    )

    cleanedData.forEach((item) => {
      if (item.text) {
        transcriptStore.addSentence({
          sentenceNr: item.sentenceNr,
          text: item.text,
          time: item.time
        })

        transcriptStore.addTranscript(item.text + '\n')
      }

      if (item.claims) {
        const claimsArray: string[] = JSON.parse(item.claims)
        let annotationsArray: string[] = Array(claimsArray.length).fill('')

        if (item.annotation && item.annotation.includes('[') && item.annotation.includes(']')) {
          annotationsArray = JSON.parse(item.annotation)
        }

        claimsArray.forEach((claimText, index) => {
          transcriptStore.addClaim({
            text: claimText,
            sentenceNr: item.sentenceNr,
            time: item.time,
            speaker: item.speaker,
            annotation: annotationsArray[index]
          })
        })
      }
    })
  } catch (error) {
    console.error(`Error fetching project data for ID ${projectId}:`, error)
    throw error
  }
}

export const editProjectTitle = async (projectId: string, projectName: string) => {
  const url = `${generalSettings.fetchProjectsUrl}/${projectId}`
  const response = await axios.put(url, { projectName })
  return response.data
}

export const sendChunk = async (seqNr: number, chunk: BlobPart, videoId: string) => {
  transcriptStore.setVideoId(videoId)
  const request = new Request(generalSettings.chunkUploadUrl, {
    method: 'POST',
    body: chunk,
    headers: {
      'Content-Type': 'video/x-matroska;codecs=avc1,opus',
      'X-Video-Seq': seqNr.toString(),
      'X-Video-Id': videoId
    }
  })

  await fetch(request)
  if (seqNr === 25) {
    await pollTranscript(videoId, 1)
  }
}

export const stopUpload = async (videoId: string, seqNr: number) => {
  const request = new Request(generalSettings.stopSignalUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ videoId, seqNr })
  })
  await fetch(request)
}

export const pollTranscript = async (
  videoId: string,
  sentenceNr: number = 1,
  retries: number = 0,
  maxRetries: number = 15
) => {
  try {
    const url = `https://8xvtslnppb.execute-api.eu-central-1.amazonaws.com/dev/claims/${videoId}/${sentenceNr}`
    const response = await axios.get(url)
    if (response.data.text) {
      transcriptStore.addSentence({
        sentenceNr: response.data.sentenceNr,
        text: response.data.text,
        time: response.data.time
      })
      transcriptStore.addTranscript(response.data.text + '\n')

      if (response.data.claim) {
        const claimsArray = JSON.parse(response.data.claim)

        if (Array.isArray(claimsArray)) {
          claimsArray.forEach((claim: string) => {
            transcriptStore.addClaim({ text: claim, sentenceNr, time: response.data.time })
          })
        }
      }

      setTimeout(() => pollTranscript(videoId, sentenceNr + 1), 3000)
    } else {
      if (retries < maxRetries) {
        setTimeout(() => pollTranscript(videoId, sentenceNr, retries + 1, maxRetries), 3000)
      }
    }
  } catch (error) {
    if (retries < maxRetries) {
      setTimeout(() => pollTranscript(videoId, sentenceNr, retries + 1, maxRetries), 3000)
    }
  }
}

const updateProjectDb = async (
  sentenceNr: number,
  data: { claim?: string; text?: string; speaker?: string; annotation?: string }
) => {
  const transcriptStore = useTranscriptStore()
  const videoId = transcriptStore.videoId
  const url = `https://8xvtslnppb.execute-api.eu-central-1.amazonaws.com/dev/claims/${videoId}/${sentenceNr}`
  await axios.put(url, data)
}

export const deleteClaim = async (claimText: string) => {
  const claim = transcriptStore.claims.find((c) => c.text === claimText)

  if (claim) {
    const sentenceNr = claim.sentenceNr
    const sentence = transcriptStore.getSentenceByNumber(sentenceNr)
    const sentenceText = sentence ? sentence.text : ''

    transcriptStore.deleteClaim(claimText)

    const remainingClaims = transcriptStore.claims.filter((c) => c.sentenceNr === sentenceNr)

    const dataToSend: DataToSend = {
      text: sentenceText
    }

    if (remainingClaims.length > 0) {
      dataToSend.claim = JSON.stringify(remainingClaims.map((c) => c.text))
    }

    await updateProjectDb(sentenceNr, dataToSend)
  }
}

export const addClaim = async (
  sentenceNr: number,
  claimText: string,
  speaker?: string,
  annotation?: string
): Promise<void> => {
  const sentence = transcriptStore.sentences.find((s) => s.sentenceNr === sentenceNr)
  const time = sentence ? sentence.time : 0

  transcriptStore.addClaim({ text: claimText, sentenceNr, time, speaker, annotation })
  transcriptStore.claims.sort((a, b) => a.sentenceNr - b.sentenceNr)

  const updatedClaims = transcriptStore.claims
    .filter((claim) => claim.sentenceNr === sentenceNr)
    .map((claim) => claim.text)

  const updatedAnnotations = transcriptStore.claims
    .filter((claim) => claim.sentenceNr === sentenceNr)
    .map((claim) => claim.annotation || '')

  const dataToSend: DataToSend = {
    text: sentence ? sentence.text : '',
    claim: JSON.stringify(updatedClaims),
    speaker: speaker || '',
    annotation: JSON.stringify(updatedAnnotations)
  }
  await updateProjectDb(sentenceNr, dataToSend)
}

export const updateClaim = async (
  oldClaimText: string,
  newClaimText: string,
  newSpeaker: string,
  newAnnotation: string
) => {
  transcriptStore.editClaim(oldClaimText, newClaimText, newSpeaker, newAnnotation)

  const claim = transcriptStore.claims.find((c) => c.text === newClaimText)
  if (claim) {
    const sentenceNr = claim.sentenceNr
    const sentence = transcriptStore.getSentenceByNumber(sentenceNr)
    const sentenceText = sentence ? sentence.text : ''

    const updatedClaims = transcriptStore.claims
      .filter((c) => c.sentenceNr === sentenceNr)
      .map((c) => c.text)

    const updatedAnnotations = transcriptStore.claims
      .filter((c) => c.sentenceNr === sentenceNr)
      .map((c) => c.annotation || '')

    const dataToSend: DataToSend = {
      text: sentenceText,
      claim: JSON.stringify(updatedClaims),
      annotation: JSON.stringify(updatedAnnotations), // Send annotations as a JSON array
      speaker: newSpeaker
    }

    await updateProjectDb(sentenceNr, dataToSend)
  }
}
export const updateSentence = async (sentenceNr: number, newSentenceText: string) => {
  transcriptStore.updateSentence(sentenceNr, newSentenceText)
  const dataToSend: DataToSend = {
    text: newSentenceText
  }
  await updateProjectDb(sentenceNr, dataToSend)
}

export const fetchNewClaims = async (videoId: string, sentenceNr: number) => {
  const url = `https://8xvtslnppb.execute-api.eu-central-1.amazonaws.com/dev/claims/${videoId}/${sentenceNr}`
  const response = await axios.get(url)

  if (
    response.status === 200 &&
    response.data.text &&
    response.data.claim !== 'null' &&
    response.data.claim !== undefined
  ) {
    let claimsArray = []
    try {
      claimsArray = JSON.parse(response.data.claim)
    } catch (error) {
      return null
    }

    if (claimsArray.length) {
      const time = transcriptStore.getSentenceByNumber(sentenceNr)?.time || 0
      claimsArray.forEach((claimText: string) => {
        transcriptStore.addClaim({
          text: claimText,
          sentenceNr,
          time
        })
      })
      transcriptStore.claims.sort((a, b) => a.sentenceNr - b.sentenceNr)
      return claimsArray
    } else {
      return null
    }
  }
}
export const pollNewClaims = async (
  videoId: string,
  sentenceNr: number,
  retries: number = 0,
  maxRetries: number = 6,
  initialDelay: number = 1000
): Promise<ClaimResource[] | null> => {
  const claimsArray = await fetchNewClaims(videoId, sentenceNr)

  if (claimsArray && claimsArray.length > 0) {
    return claimsArray
  }

  if (retries < maxRetries) {
    const delay = initialDelay * Math.pow(2, retries)
    await new Promise((resolve) => setTimeout(resolve, delay))
    return pollNewClaims(videoId, sentenceNr, retries + 1, maxRetries, initialDelay)
  } else {
    return null
  }
}

export const fetchClaimInfo = async (
  claimText: string,
  claimSpeaker: string
): Promise<ClaimResource[] | undefined> => {
  let response
  if (claimSpeaker != '') {
    response = await axios.get(
      `https://8xvtslnppb.execute-api.eu-central-1.amazonaws.com/dev/factcheck?claim=${encodeURIComponent(claimText)}&speaker=${encodeURIComponent(claimSpeaker)}`
    )
  } else {
    response = await axios.get(
      `https://8xvtslnppb.execute-api.eu-central-1.amazonaws.com/dev/factcheck?claim=${encodeURIComponent(claimText)}`
    )
  }

  if (response.data.factCheckResults.length > 0) {
    const resources = response.data.factCheckResults
    transcriptStore.addClaimResources({ text: claimText, resources })
    return resources
  }
}
