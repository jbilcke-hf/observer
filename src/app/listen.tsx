"use client"

import { useCallback, useEffect, useRef, useState, useTransition } from "react"
import { useInterval } from "usehooks-ts"
import { useRecorder } from "react-microphone-recorder"

// import { listen } from "./engine/listen"

export function Listen({
  onListen,
}: {
  onListen: (recording: string) => void
}) {
  const [_isPending, startTransition] = useTransition()

  const {
    audioLevel,
    startRecording,
    pauseRecording,
    stopRecording,
    resetRecording,
    audioURL,
    recordingState,
    isRecording,
    audioFile
  } = useRecorder()

  const status = audioLevel > 18 ? "I hear something!" : "background noise"

  useInterval(() => {
    console.log("let's stop, and start again")
    stopRecording()
    startRecording()
  }, 3000)

  useEffect(() => {
    console.log("starting recording..")
    startRecording()

    startTransition(async () => {
      // await listen()
    })
  }, [])

  return null 
  /*
  return (
    <div className="fixed top-64 left-16 z-10 bg-gray-100 p-4">
      <div>{status}</div>
    </div>
  )
  */
}
