export interface ClaimResource {
  matchedClaim: string
  publisherName: string
}

export interface ClaimResource {
  matchedClaim: string
  factCheckMethod: string
  claimSimilarity: number
  matchedClaimSpeaker: string
  claimReview: ClaimReview[]
  publishingDate: string
}

export interface ClaimReview {
  publisher: {
    name: string
    site: string
  }
  url: string
  title: string
  reviewDate: string
  textualRating: string
  languageCode: string
}

export interface DataToSend {
  text: string
  claim?: string
  speaker?: string
  annotation?: string
}

export interface Project {
  projectId: string
  projectName: string
  timeCreated: string
}

export interface ProjectData {
  sentenceNr: number
  text?: string
  claims?: string
  speaker?: string
  time: number
  annotation?: string
}
