import { defineStore } from 'pinia'

export const useTranscriptStore = defineStore('transcript', {
  state: () => ({
    transcript: '',
    claims: [] as {
      text: string
      sentenceNr: number
      time: number
      speaker?: string
      annotation?: string
    }[],
    sentences: [] as { sentenceNr: number; text: string; time: number }[],
    videoId: '',
    claimResources: {} as Record<string, string[]>,
    sessionMode: undefined as 'replay' | undefined,
    currentProjectId: '' as string,
    currentProjectName: 'Unnamed project',
    claimsLoading: {} as Record<number, boolean>
  }),

  actions: {
    clearStore() {
      this.sentences = []
      this.claims = []
      this.transcript = ''
      this.videoId = ''
      this.claimResources = {}
      this.sessionMode = undefined
      this.currentProjectId = ''
      this.currentProjectName = 'Unnamed project'
    },
    setReplaySession(projectId: string) {
      this.sessionMode = 'replay'
      this.currentProjectId = projectId
      this.videoId = projectId
    },
    setCurrentProjectName(projectName: string) {
      this.currentProjectName = projectName
    },
    setClaimsLoading(sentenceNr: number, isLoading: boolean) {
      this.claimsLoading[sentenceNr] = isLoading
    },
    isClaimsLoading(sentenceNr: number): boolean {
      return !!this.claimsLoading[sentenceNr]
    },
    isAnyClaimLoading(): boolean {
      return Object.values(this.claimsLoading).some((isLoading) => isLoading)
    },
    setTranscript(newTranscript: string) {
      this.transcript = newTranscript
    },
    addTranscript(additionalText: string) {
      this.transcript += additionalText
    },
    addClaim(claim: {
      text: string
      sentenceNr: number
      time: number
      speaker?: string
      annotation?: string
    }) {
      const claimIndex = this.claims.findIndex(
        (c) => c.sentenceNr === claim.sentenceNr && c.text === claim.text
      )
      if (claimIndex === -1) {
        this.claims.push(claim)
      } else {
        this.claims[claimIndex].annotation = claim.annotation || ''
      }
    },
    editClaim(
      oldClaimText: string,
      newClaimText: string,
      newSpeaker: string,
      newAnnotation: string
    ) {
      const index = this.claims.findIndex((claim) => claim.text === oldClaimText)
      if (index !== -1) {
        this.claims[index].text = newClaimText
        this.claims[index].speaker = newSpeaker
        this.claims[index].annotation = newAnnotation
      }
    },
    deleteClaim(claimText: string) {
      const index = this.claims.findIndex((claim) => claim.text === claimText)
      if (index !== -1) {
        this.claims.splice(index, 1)
      }
    },

    deleteClaimsBySentenceNr(sentenceNr: number) {
      this.claims = this.claims.filter((claim) => claim.sentenceNr !== sentenceNr)
    },

    addClaimResources(claimResources: { text: string; resources: string[] }) {
      this.claimResources[claimResources.text] = claimResources.resources
    },
    setVideoId(videoId: string) {
      this.videoId = videoId
    },
    addSentence(sentence: { sentenceNr: number; text: string; time: number }) {
      if (!this.sentences.some((s) => s.sentenceNr === sentence.sentenceNr)) {
        this.sentences.push(sentence)
      }
    },
    updateSentence(sentenceNr: number, newSentenceText: string) {
      const sentenceIndex = this.sentences.findIndex((s) => s.sentenceNr === sentenceNr)
      if (sentenceIndex !== -1) {
        this.sentences[sentenceIndex].text = newSentenceText

        this.transcript = this.sentences.map((s) => s.text).join('\n')
      }
    },
    getSentenceByNumber(sentenceNr: number) {
      return this.sentences.find((sentence) => sentence.sentenceNr === sentenceNr)
    }
  }
})
