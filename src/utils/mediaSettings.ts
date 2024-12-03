export const generalSettings = {
  saveLocalCopy: false,
  transferToBackend: true,
  frameRate: 25,
  videoWidth: 768,
  videoHeight: 432,
  videoBitsPerSecond: 1750000,
  audioSampleRate: 44100,
  audioSampleSize: 16,
  audioBitsPerSecond: 96000,
  mimeType: 'video/webm',
  chunkUploadUrl: 'https://8xvtslnppb.execute-api.eu-central-1.amazonaws.com/dev/upload/chunk',
  stopSignalUrl: 'https://8xvtslnppb.execute-api.eu-central-1.amazonaws.com/dev/upload/end',
  fetchProjectsUrl: 'https://8xvtslnppb.execute-api.eu-central-1.amazonaws.com/dev/projects'
}

export const displayMediaSettings = {
  video: {
    width: { max: generalSettings.videoWidth },
    height: { max: generalSettings.videoHeight },
    frameRate: { max: generalSettings.frameRate }
  },
  audio: {
    sampleRate: { max: generalSettings.audioSampleRate },
    sampleSize: { max: generalSettings.audioSampleSize },
    suppressLocalAudioPlayback: true
  }
}

export const mediaRecorderSettings = {
  audioBitsPerSecond: generalSettings.audioBitsPerSecond,
  videoBitsPerSecond: generalSettings.videoBitsPerSecond,
  videoKeyFrameIntervalCount: displayMediaSettings.video.frameRate.max,
  mimeType: generalSettings.mimeType
}
