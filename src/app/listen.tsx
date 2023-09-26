"use client"

import { useCallback, useEffect, useRef, useState, useTransition } from "react"
import { useInterval } from "usehooks-ts"

// TODO: try this? https://www.npmjs.com/package/react-audio-voice-recorder
import { useRecorder } from "react-microphone-recorder"
import { getWaveBlob } from "webm-to-wav-converter"
import {
  AvailableModels,
  InferenceSession,
  SessionManager,
} from "whisper-turbo"

import { useToast } from "@/components/ui/use-toast"
import { useStore } from "./useStore"

export interface TSSegment {
  text: string;
  start: number;
  stop: number;
  last: boolean;
}

export interface TSTranscript {
  segments: Array<TSSegment>;
}

export function Listen({
  onListen,
}: {
  onListen: (recording: string) => void
}) {
  const { toast } = useToast()
  const speechSynthesis = useStore(state => state.speechSynthesis)
  const isSpeaking = useStore(state => state.isSpeaking)
  const isSpeakingRef = useRef(isSpeaking)
  useEffect(() => {isSpeakingRef.current = isSpeaking }, [isSpeaking])

  const setHearing = useStore(state => state.setHearing)
  const isHearing = useStore(state => state.isHearing)

  const [transcribing, setTranscribing] = useState(false)
  const transcribingRef = useRef(transcribing)
  useEffect(() => { transcribingRef.current = transcribing }, [transcribing])

  // used to detect changes, signal when we can analyze the audio
  const [audioDataFrame, setAudioDataFrame] = useState(0)
  const audioDataFrameRef = useRef(audioDataFrame)
  useEffect(() => { audioDataFrameRef.current = audioDataFrame }, [audioDataFrame])

  const [transcriptBuffer, setTranscriptBuffer] = useState("")
  useEffect(() => {
    onListen(transcriptBuffer)
  }, [transcriptBuffer])
  /*
  Available models: {
    WHISPER_TINY: 'whisper-tiny',
    WHISPER_BASE: 'whisper-base',
    WHISPER_SMALL: 'whisper-small',
    WHISPER_MEDIUM: 'whisper-medium',
    WHISPER_LARGE: 'whisper-large'
  }
  */

  // unfortunately, we cannot really use models larger than TINY because they are
  // too slow to process requests
  const whisperModel: AvailableModels = AvailableModels.WHISPER_TINY

  const listenerRef = useRef({
    isListening: false,
    startedListeningAt: 0,
    stoppedListeningAt: 0,
    durationInMs: 0,
    hits: 0,
    debugCanContinue: true, // used for debugging
  })

  // the background listener is not a CIA spy device, but a detect of changes in the
  // background noise volume level. The goal is to detect whenever an interesting event is happening
  const backgroundListener = useRecorder()

  // the foreground listener is the actual sound sampler
  // with out system, it will always lag a bit behind the background listener
  // however there might be a fix (which I haven't tried yet):
  // to take the last second of the background listener sample,
  // and glue it to the beginning of the foreground listener sample
  //
  // or, alternatively, we could just try to use a shorter time window for the background listener,
  // to make it more reactive
  const foregroundListener = useRecorder()

  // to detect voice, we use a combination of audio level and frequency sampling
  const heardSomething = backgroundListener.audioLevel > 12 // 18
  
  const status = heardSomething ? "I hear something!" : "background noise"

  const session = useRef<InferenceSession | null>(null)
  const [audioData, setAudioData] = useState<Uint8Array | null>(null)
  const [audioMetadata, setAudioMetadata] = useState<File | null>(null)
  const [loaded, setLoaded] = useState<boolean>(false)
  const [progress, setProgress] = useState<number>(0)

  const isLoadingModel = progress > 0
  const hasLoadedModel = progress === 100

  const loadModel = async () => {
    console.log("loadModel")
    if (session.current) {
      session.current.destroy()
    }
    if (!whisperModel) {
      console.error("No whisper model loaded")
      return
    }

    try {
      const manager = new SessionManager()
      const loadResult = await manager.loadModel(
        whisperModel,
        () => {
          setLoaded(true)
        },
        (p: number) => {
          console.log("progress:", p)
          setProgress(p)
        }
      )
      if (loadResult.isErr) {
        throw new Error(loadResult.error.message)
      } else {
        session.current = loadResult.value
      }
    } catch (err) {
      const error = `failed to load the model: ${err}`
      console.error(error)
      toast({
        title: "Error",
        description: error,
        variant: "destructive"
      })
    }
  }

  const runSession = async () => {
    if (!loaded) {
      console.log("runSession: aborting (model not loaded yet)")
      return
    }
    if (!session.current) {
      console.log("runSession: aborting (no model loaded)")
      toast({
        title: "Error",
        description: "No model loaded",
        variant: "destructive"
      })
      return
    }
    // console.log("debug:", { audioData, audioDataFrame })
    if (!audioData) {
      console.log("runSession: aborting (no audio file loaded)")
      toast({
        title: "Error",
        description: "No audio file loaded",
        variant: "destructive"
      })
      return
    }

    setTranscribing(transcribingRef.current = true)

    try {
      await session.current.transcribe(audioData, (s: any) => {
        const segment = s as { text: string, start: number, stop: number, last: boolean }
        const text = segment.text.trim()
        console.log("text:", text)
        if (text) {
          setTranscriptBuffer(text)
        }

        if (s.last) {
          console.log("IS LAST")
          setTranscribing(transcribingRef.current = false)
          return
        }
      })
    } catch (err) {
      const error = `transcription crashed: ${err}`
      console.error(error)
      toast({
        title: "Error",
        description: "No audio file loaded",
        variant: "destructive"
      })
    }
  }

  // let's disable the background recorder for now
  useInterval(() => {
    // console.log("let's stop, and start again")
    backgroundListener.stopRecording()
    backgroundListener.startRecording()
  }, 3000)

  useEffect(() => {
    const fn = async () => {
      console.log("load model..")
      await loadModel()

      console.log("starting to listen to background noise to detect volume peaks..")
      backgroundListener.startRecording()
    }

    fn()
  }, [])


  useEffect(() => {
    if (!audioData) {
      console.log("no audio")
    }
    // console.log("audioDataFrame changed, need to process audioData!")
    runSession()
  }, [audioDataFrame])

  // note: this effect only reacts to "head something" changes
  // anod not to changes to isListening or isSpekaing
  useEffect(() => {
    const isListening = listenerRef.current.isListening

    if (!heardSomething) { return }

    if (listenerRef.current.isListening) {
      // console.log("we are already listening, so skipping..")
      return
    }
    if (isSpeakingRef.current) {
      console.log("we are already busy speaking, so ignoring..")
      return
    }
    setHearing(true)
    // console.log("recording..")
    foregroundListener.startRecording()
    listenerRef.current.hits = 0
    listenerRef.current.isListening = true
      
    setTimeout(async () => {
      foregroundListener.stopRecording()
      setHearing(false)
      listenerRef.current.isListening = false
      listenerRef.current.stoppedListeningAt = Date.now()
      listenerRef.current.durationInMs =
        listenerRef.current.stoppedListeningAt - listenerRef.current.startedListeningAt
  
      const hits = listenerRef.current.hits
  
      if (!foregroundListener.audioBlob || typeof window === "undefined" || !window?.FileReader) {
        return
      }

      if (hits <= 11) {
        return
      }

          
      console.log(`end of sample (${foregroundListener.timeElapsed}, ${hits} hits)`)

      
      // at 12 threshold level, we should have between 12 and 20 hits (per 2 sec) for short words and utterances
      // at 12 threshold level, keystrokes should not be detected, unless the person hits the keyboard heavily
      
      // console.log("got an interesting sample, sending for review")

      // temporary, to prevent infinite loop
      if (listenerRef.current.debugCanContinue) {
        // to prevent the infinite loop, set this value to false
        // listenerRef.current.debugCanContinue = false

        try {
          const blob = await getWaveBlob(foregroundListener.audioBlob, false) // false = 16 bit, true = 32 bit
          const arrayBuffer = await blob.arrayBuffer()
          const uint8Array = new Uint8Array(arrayBuffer)

          setAudioData(uint8Array)
          setAudioDataFrame(audioDataFrameRef.current + 1)
        } catch (err) {
          const error = `failed to convert the audio sample: ${err}`
          console.error(error)
          toast({
            title: "Error",
            description: error,
            variant: "destructive"
          })
        }
      } else {
        console.log("Julian: infinite loop temporary disabled!")
      }
    }, 2000)
  }, [heardSomething])

  if (heardSomething && listenerRef.current.isListening) {
    listenerRef.current.hits = listenerRef.current.hits + 1
  }

  return (
    <div className="fixed top-80 left-16 z-10 bg-gray-100 p-4">
      {isLoadingModel && hasLoadedModel 
        ? <p>Loading whisper-turbo: {progress}% done</p>
        : <p>{
          transcriptBuffer
          || ""
          }</p>
      }
    </div>
  )
}
