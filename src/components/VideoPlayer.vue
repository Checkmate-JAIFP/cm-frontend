<template>
  <div
    ref="videoContainer"
    class="group/video-container relative max-w-[1000px] flex justify-center bg-black ms-auto me-auto"
    :class="[
      {
        'w-full max-w-initial max-h-[90vh]': isTheater,
        'w-full max-w-initial max-h-full': isFullscreen,
        'mini-player': isPictureInPicture
      },
      { muted: volumeLevel === 'muted' }
    ]"
  >
    <div
      v-show="active"
      v-if="!!video"
      class="absolute bottom-0 left-0 right-0 text-white z-10 opacity-0 transition-opacity duration-100 ease-in-out before:bg-gradient-to-t before:from-black before:to-transparent before:pointer-events-none before:content-[''] before:w-full before:aspect-[8/1] before:absolute before:bottom-0 before:z-[-1] group-hover/video-container:opacity-100 group-focus-within/video-container:opacity-100"
      :class="{ 'opacity-100': !playing }"
    >
      <!--      Timeline UI-->
      <div
        ref="timelineContainer"
        :key="timelineKey"
        @mousemove="handleTimelineUpdate"
        @mousedown="toggleScrubbing"
        @mouseup="toggleScrubbing"
        class="flex items-center h-2 margin-2 cursor-pointer group/timeline-container"
      >
        <div
          :style="{ '--progress-position': currentProgress, '--preview-position': previewProgress }"
          class="relative w-full h-1 bg-slate-600 group-hover/timeline-container:h-full group-hover/timeline-container:before:block before:absolute before:left-0 before:top-0 before:bottom-0 before:right-[calc(100%_-_var(--preview-position)_*_100%)] before:bg-slate-300 after:absolute after:left-0 after:top-0 after:bottom-0 after:right-[calc(100%_-_var(--progress-position)_*_100%)] after:bg-green-500"
        >
          <!--          Timeline thumb UI -->
          <div
            class="absolute -translate-x-1/2 scale-100 h-[200%] -top-1/2 left-[calc(var(--progress-position)_*_100%)] bg-green-500 rounded-full hover:transition-transform duration-100 ease-in-out aspect-square"
          ></div>
          <template v-if="track.cues.length > 0">
            <div
              v-for="chapter in track.cues"
              :key="chapter.id"
              :style="{ '--chapter-marker-position': getPositionFor(chapter) }"
              class="group/chapter-marker-container"
              :class="{ hidden: isStreaming }"
            >
              <div
                class="absolute -translate-x-1/2 scale-100 h-[200%] -top-1/2 left-[calc(var(--chapter-marker-position)_*_100%)] bg-green-800 rounded-full hover:transition-transform duration-100 ease-in-out aspect-square z-10"
              ></div>
              <div
                :class="
                  track.activeCues.length &&
                  track.activeCues[0].text == chapter.text &&
                  !isVideoEnded
                    ? 'flex'
                    : 'hidden'
                "
                class="group-hover/chapter-marker-container:flex text-sm absolute bottom-8 left-[calc(var(--chapter-marker-position)_*_75%)] max-w-96 bg-black p-2 rounded-3xl shadow-2xl"
              >
                {{ chapter.text }}
              </div>
            </div>
          </template>
        </div>
      </div>
      <!--      Controls UI-->
      <div class="flex p-2 gap-2 justify-center items-center">
        <VideoControlButton size="small" @click="togglePlay" class="play-pause-btn">
          <svg
            v-if="!playing"
            xmlns="http://www.w3.org/2000/svg"
            height="100%"
            viewBox="0 0 24 24"
            width="100%"
            fill="#FFFFFF"
          >
            <path d="M0 0h24v24H0z" fill="none" />
            <path d="M8 5v14l11-7z" />
          </svg>
          <svg
            v-else
            xmlns="http://www.w3.org/2000/svg"
            height="100%"
            viewBox="0 0 24 24"
            width="100%"
            fill="#FFFFFF"
          >
            <path d="M0 0h24v24H0z" fill="none" />
            <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
          </svg>
        </VideoControlButton>
        <div class="volume-container flex items-center group/volume-container">
          <VideoControlButton size="small" @click="toggleMuted" class="mute-btn">
            <svg
              v-if="volumeLevel === 'muted'"
              class="volume-muted-icon"
              xmlns="http://www.w3.org/2000/svg"
              height="24px"
              viewBox="0 0 24 24"
              width="24px"
              fill="#FFFFFF"
            >
              <path d="M0 0h24v24H0V0z" fill="none" />
              <path
                d="M4.34 2.93L2.93 4.34 7.29 8.7 7 9H3v6h4l5 5v-6.59l4.18 4.18c-.65.49-1.38.88-2.18 1.11v2.06c1.34-.3 2.57-.92 3.61-1.75l2.05 2.05 1.41-1.41L4.34 2.93zM10 15.17L7.83 13H5v-2h2.83l.88-.88L10 11.41v3.76zM19 12c0 .82-.15 1.61-.41 2.34l1.53 1.53c.56-1.17.88-2.48.88-3.87 0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zm-7-8l-1.88 1.88L12 7.76zm4.5 8c0-1.77-1.02-3.29-2.5-4.03v1.79l2.48 2.48c.01-.08.02-.16.02-.24z"
              />
            </svg>
            <svg
              v-else-if="volumeLevel === 'low'"
              class="volume-low-icon"
              height="100%"
              viewBox="0 0 36 36"
              width="100%"
            >
              <use class="ytp-svg-shadow" xlink:href="#ytp-id-15"></use>
              <use class="ytp-svg-shadow" xlink:href="#ytp-id-16"></use>
              <defs>
                <clipPath id="ytp-svg-volume-animation-mask">
                  <path d="m 14.35,-0.14 -5.86,5.86 20.73,20.78 5.86,-5.91 z"></path>
                  <path d="M 7.07,6.87 -1.11,15.33 19.61,36.11 27.80,27.60 z"></path>
                  <path
                    class="ytp-svg-volume-animation-mover"
                    d="M 9.09,5.20 6.47,7.88 26.82,28.77 29.66,25.99 z"
                    transform="translate(0, 0)"
                  ></path>
                </clipPath>
                <clipPath id="ytp-svg-volume-animation-slash-mask">
                  <path
                    class="ytp-svg-volume-animation-mover"
                    d="m -11.45,-15.55 -4.44,4.51 20.45,20.94 4.55,-4.66 z"
                    transform="translate(0, 0)"
                  ></path>
                </clipPath>
              </defs>
              <path
                class="ytp-svg-fill ytp-svg-volume-animation-speaker"
                clip-path="url(#ytp-svg-volume-animation-mask)"
                d="M8,21 L12,21 L17,26 L17,10 L12,15 L8,15 L8,21 Z M19,14 L19,22 C20.48,21.32 21.5,19.77 21.5,18 C21.5,16.26 20.48,14.74 19,14 Z"
                fill="#fff"
                id="ytp-id-15"
              ></path>
              <path
                class="ytp-svg-fill ytp-svg-volume-animation-hider"
                clip-path="url(#ytp-svg-volume-animation-slash-mask)"
                d="M 9.25,9 7.98,10.27 24.71,27 l 1.27,-1.27 Z"
                fill="#fff"
                id="ytp-id-16"
                style="display: none"
              ></path>
            </svg>
            <svg
              v-else-if="volumeLevel === 'high'"
              class="volume-high-icon"
              xmlns="http://www.w3.org/2000/svg"
              height="100%"
              viewBox="0 0 24 24"
              width="100%"
              fill="#FFFFFF"
            >
              <path d="M0 0h24v24H0z" fill="none" />
              <path
                d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"
              />
            </svg>
          </VideoControlButton>
          <input
            @input="setVolume"
            class="volume-slider w-0 origin-left scale-x-0 appearance-none h-0.5 transition-width-transform duration-150 ease-in-out group-hover/volume-container:w-full group-hover/volume-container:scale-x-100"
            type="range"
            min="0"
            max="1"
            step="0.1"
            :value="volume"
          />
        </div>
        <div class="flex items-center gap-1 grow">
          <div class="current-time">{{ formatSeconds(currentTime) }}</div>
          /
          <div class="total-time">{{ totalTime }}</div>
        </div>
        <button @click="changePlaybackSpeed" class="speed-container wide">
          {{ playbackSpeed }}
        </button>
        <VideoControlButton size="small" @click="toggleMiniPlayer" class="mini-player-btn">
          <svg height="100%" viewBox="0 0 36 36" width="100%">
            <use class="ytp-svg-shadow" xlink:href="#ytp-id-56"></use>
            <path
              d="M25,17 L17,17 L17,23 L25,23 L25,17 L25,17 Z M29,25 L29,10.98 C29,9.88 28.1,9 27,9 L9,9 C7.9,9 7,9.88 7,10.98 L7,25 C7,26.1 7.9,27 9,27 L27,27 C28.1,27 29,26.1 29,25 L29,25 Z M27,25.02 L9,25.02 L9,10.97 L27,10.97 L27,25.02 L27,25.02 Z"
              fill="#fff"
              id="ytp-id-56"
            ></path>
          </svg>
        </VideoControlButton>
        <VideoControlButton size="small" @click="toggleTheaterMode" class="theater-btn">
          <svg v-if="isTheater" height="100%" viewBox="0 0 36 36" width="100%">
            <use class="ytp-svg-shadow" xlink:href="#ytp-id-119"></use>
            <path
              d="m 26,13 0,10 -16,0 0,-10 z m -14,2 12,0 0,6 -12,0 0,-6 z"
              fill="#fff"
              fill-rule="evenodd"
              id="ytp-id-119"
            ></path>
          </svg>
          <svg v-else height="100%" viewBox="0 0 36 36" width="100%">
            <use class="ytp-svg-shadow" xlink:href="#ytp-id-66"></use>
            <path
              d="m 28,11 0,14 -20,0 0,-14 z m -18,2 16,0 0,10 -16,0 0,-10 z"
              fill="#fff"
              fill-rule="evenodd"
              id="ytp-id-66"
            ></path>
          </svg>
        </VideoControlButton>
        <VideoControlButton size="small" @click="toggleFullscreen" class="full-screen-btn">
          <svg v-if="isFullscreen" height="100%" viewBox="0 0 36 36" width="100%" fill="#FFFFFF">
            <g class="ytp-fullscreen-button-corner-2">
              <use class="ytp-svg-shadow" xlink:href="#ytp-id-113"></use>
              <path
                class="ytp-svg-fill"
                d="m 14,14 -4,0 0,2 6,0 0,-6 -2,0 0,4 0,0 z"
                id="ytp-id-113"
              ></path>
            </g>
            <g class="ytp-fullscreen-button-corner-3">
              <use class="ytp-svg-shadow" xlink:href="#ytp-id-114"></use>
              <path
                class="ytp-svg-fill"
                d="m 22,14 0,-4 -2,0 0,6 6,0 0,-2 -4,0 0,0 z"
                id="ytp-id-114"
              ></path>
            </g>
            <g class="ytp-fullscreen-button-corner-0">
              <use class="ytp-svg-shadow" xlink:href="#ytp-id-115"></use>
              <path
                class="ytp-svg-fill"
                d="m 20,26 2,0 0,-4 4,0 0,-2 -6,0 0,6 0,0 z"
                id="ytp-id-115"
              ></path>
            </g>
            <g class="ytp-fullscreen-button-corner-1">
              <use class="ytp-svg-shadow" xlink:href="#ytp-id-116"></use>
              <path
                class="ytp-svg-fill"
                d="m 10,22 4,0 0,4 2,0 0,-6 -6,0 0,2 0,0 z"
                id="ytp-id-116"
              ></path>
            </g>
          </svg>
          <svg
            v-else
            xmlns="http://www.w3.org/2000/svg"
            height="100%"
            viewBox="0 0 24 24"
            width="100%"
            fill="#FFFFFF"
          >
            <path d="M0 0h24v24H0z" fill="none" />
            <path
              d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"
            />
          </svg>
        </VideoControlButton>
      </div>
    </div>
    <video v-show="active" :src="videoSrc" class="w-full" ref="video" autoplay></video>
  </div>
</template>
<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, toRefs, watch, watchEffect } from 'vue'
import VideoControlButton from '@/components/videoPlayerUi/VideoControlButton.vue'
import { useMediaControls } from '@vueuse/core'

const props = withDefaults(
  defineProps<{
    videoSrc?: string
    active: boolean
    claims?: Array<{ text: string; sentenceNr: number; time: number; speaker?: string }>
    isTabSharing: boolean
  }>(),
  {
    active: true,
    claims: undefined,
    isTabSharing: false
  }
)

const isVideoEnded = computed(() => currentTime.value >= duration.value)

const { active, claims } = toRefs(props)
watch(active, () => {
  if (!active.value) {
    toggleMiniPlayer()
    muted.value = true
  } else {
    toggleMiniPlayer()
    muted.value = false
  }
})
const video = ref<HTMLVideoElement>()
const videoContainer = ref<HTMLDivElement>()
const timelineContainer = ref<HTMLDivElement>()
const {
  playing,
  muted,
  isPictureInPicture,
  currentTime,
  duration,
  volume,
  supportsPictureInPicture,
  togglePictureInPicture
} = useMediaControls(video, {
  src: props.videoSrc
})
const track = ref()
const timelineKey = ref(0)

watch(
  claims,
  () => {
    if (claims.value && track.value && track.value.cues) {
      const cues = track.value.cues

      // Remove existing cues
      while (cues.length > 0) {
        track.value.removeCue(cues[0])
      }

      // Add new cues from claims
      const claimsArray = [...claims.value]
      claimsArray.forEach((claim) => {
        const cue = new VTTCue(claim.time, claim.time + 5, `${claim.text}`)
        track.value.addCue(cue)
      })
      // Increment the key to trigger a re-render of the timeline
      timelineKey.value += 1
    }
  },
  { deep: true }
)

watch(
  () => props.isTabSharing,
  async (newVal) => {
    if (!newVal && isPictureInPicture.value) {
      await togglePictureInPicture()
      isPictureInPicture.value = false
    }
  }
)

const totalTime = computed(() => {
  if (video.value) {
    return isStreaming.value ? 'Live' : (formatSeconds(duration.value) as string)
  } else {
    return '--:--'
  }
})

const currentProgress = ref(0)
const previewProgress = ref(0)
const playbackSpeed = ref('1x')
const isScrubbing = ref(false)
const wasPaused = ref(false)
const isTheater = ref(false)
const isFullscreen = ref(false)
const isStreaming = ref(false)
const volumeLevel = computed<'muted' | 'low' | 'high'>(() => {
  if (muted.value || volume.value === 0) {
    return 'muted'
  } else if (volume.value <= 0.5 && volume.value > 0) {
    return 'low'
  } else if (volume.value > 0.5 && volume.value <= 1) {
    return 'high'
  } else {
    return 'muted'
  }
})

const togglePlay = () => {
  playing.value = !playing.value
}

const toggleScrubbing = (e: MouseEvent) => {
  if (!timelineContainer.value) return
  if (!video.value) return
  const rect = timelineContainer.value.getBoundingClientRect()
  const percent = Math.min(Math.max(0, e.x - rect.x), rect.width) / rect.width
  isScrubbing.value = (e.buttons & 1) === 1
  if (isScrubbing.value) {
    wasPaused.value = video.value.paused
    video.value.pause()
  } else {
    if (isStreaming.value) {
      currentTime.value = percent * currentTime.value
    } else {
      currentTime.value = percent * duration.value
    }
    if (!wasPaused.value) video.value.play()
  }
  handleTimelineUpdate(e)
}

const toggleTheaterMode = () => {
  isFullscreen.value = false
  isTheater.value = !isTheater.value
}

const toggleFullscreen = () => {
  if (videoContainer.value) {
    isTheater.value = false
    if (isFullscreen.value) {
      document.exitFullscreen()
      isFullscreen.value = false
    } else {
      videoContainer.value.requestFullscreen()
      isFullscreen.value = true
    }
  }
}

const toggleMiniPlayer = async () => {
  isFullscreen.value = false
  isTheater.value = false
  if (supportsPictureInPicture && props.isTabSharing) {
    await togglePictureInPicture()
  }
}

const toggleMuted = () => {
  muted.value = !muted.value
}
const setVolume = (e: Event) => {
  volume.value = Number((e.target as HTMLInputElement).value)
}

const changePlaybackSpeed = () => {
  if (video.value) {
    const newPlaybackRate = video.value.playbackRate + 0.25
    if (newPlaybackRate > 2) {
      video.value.playbackRate = 0.25
    } else {
      video.value.playbackRate = newPlaybackRate
    }
    playbackSpeed.value = `${video.value.playbackRate}x`
  }
}

const skip = (time: number) => {
  currentTime.value += time
}

watchEffect(() => {
  if (!isStreaming.value) {
    currentProgress.value = currentTime.value / duration.value
  } else {
    currentProgress.value = 0.99
  }
})

watchEffect(() => {
  isStreaming.value = duration.value === Infinity
})

const handleTimelineUpdate = (e: MouseEvent) => {
  if (!timelineContainer.value) return
  const rect = timelineContainer.value.getBoundingClientRect()
  previewProgress.value = Math.min(Math.max(0, e.x - rect.x), rect.width) / rect.width
  if (isScrubbing.value) {
    e.preventDefault()
    currentProgress.value = previewProgress.value
  }
}

const handleCueChange = (e: Event): void => {
  track.value = e.currentTarget as TextTrack
}

const getPositionFor = (chapter: TextTrackCue) => {
  const startTime = chapter.startTime
  return startTime / duration.value
}

const leadingZeroFormatter = new Intl.NumberFormat(undefined, {
  minimumIntegerDigits: 2
})

const formatSeconds = (time: number) => {
  const seconds = Math.floor(time % 60)
  const minutes = Math.floor(time / 60) % 60
  const hours = Math.floor(time / 3600)
  if (hours === 0) {
    return `${minutes}:${leadingZeroFormatter.format(seconds)}`
  } else {
    ;`${hours}:${leadingZeroFormatter.format(minutes)}:${leadingZeroFormatter.format(seconds)}`
  }
}
const skipTime = (e: KeyboardEvent) => {
  const tagName = document?.activeElement?.tagName.toLowerCase()
  if (tagName === 'input') {
    return
  }
  const key = e.key.toLowerCase()
  if (key == ' ') {
    if (tagName === 'button') return
    togglePlay()
  } else if (key == 'f') {
    toggleFullscreen()
  } else if (key == 't') {
    toggleTheaterMode()
  } else if (key == 'i') {
    toggleMiniPlayer()
  } else if (key == 'm') {
    toggleMuted()
  } else if (key == 'arrowleft') {
    skip(-5)
  } else if (key == 'arrowright') {
    skip(5)
  }
}

onMounted(() => {
  if (video.value) {
    track.value = video.value.addTextTrack('chapters', 'English', 'en')
    track.value.mode = 'showing'
    if (claims.value && track.value) {
      claims.value.forEach((claim) => {
        track.value.addCue(new VTTCue(claim.time, claim.time + 5, `${claim.text}`))
      })
    }
    track.value.addEventListener('cuechange', handleCueChange)
  }
  if (props.videoSrc) {
    skip(9000)
  }
  window.addEventListener('keyup', skipTime)
  document.addEventListener('mouseup', (e) => {
    if (isScrubbing.value) toggleScrubbing(e)
  })
  document.addEventListener('mousemove', (e) => {
    if (isScrubbing.value) handleTimelineUpdate(e)
  })
})

onUnmounted(() => {
  window.removeEventListener('keyup', skipTime)
  document.removeEventListener('mouseup', () => {})
  document.removeEventListener('mousemove', () => {})
  track.value?.removeEventListener('cuechange', handleCueChange)
})

defineExpose({
  videoRef: video
})
</script>
<style scoped>
.volume-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  border-radius: 50%;
  width: 15px;
  aspect-ratio: 1;
  background-color: rgb(0 226 129);
}
</style>
