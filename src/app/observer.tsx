"use client"

import { useCallback, useEffect, useRef, useState, useTransition } from "react"
import { useInterval } from "usehooks-ts"
import Webcam from "react-webcam"
import AutoSizer from "react-virtualized-auto-sizer"

import { see } from "./engine/see"
import { Progress } from "./interface/progress"

export default function Observer({
  onObserve,
}: {
  onObserve: (observation: string, image: string) => void
}) {
  const [_isPending, startTransition] = useTransition()
  const [img, setImg] = useState<string>("")
  const webcamRef = useRef<Webcam>(null)
  const [isInitialized, setInitialized] = useState(false)
  const [frameNumber, setFrameNumber] = useState(0)
  const [isBusy, setBusy] = useState(false)
  const [lastObservation, setLastObservation] = useState("Nothing to see yet.")
  const [lastObservedAt, setLastObservedAt] = useState(Date.now())

  const defaultWidth = 1280
  const defaultHeight = 1024 // 720

  // minimum wait time between calls
  const minimumWaitTimeInSec = 10

  // in case we need to record a video, check the last part of
  // https://blog.openreplay.com/capture-real-time-images-and-videos-with-react-webcam/
  const capture = useCallback(() => {
    if (!webcamRef.current) { return }
    const imageSrc = webcamRef.current.getScreenshot()
    if (!imageSrc) { return }
    setImg(imageSrc)
    setFrameNumber(frameNumber + 1)

    return imageSrc
  }, [webcamRef])
  
  // note: for some strange reason, the webcam (at least on macOS)
  // has a "fade in effect", which means in the first few seconds,
  // eg. if we capture at 800ms, if will be darker than normal

  useEffect(() => {
    if (webcamRef.current && img && !isInitialized) {
      setInitialized(true)
    }
  }, [webcamRef.current, img, isInitialized])

  const observe = () => {
    if (isBusy) {
      // console.log("we are already predicting: skippping turn")
      return
    }

    const currentTimeInMs = Date.now()
    const elapsedTimeInMs = currentTimeInMs - lastObservedAt
    const elapsedTimeInSec = elapsedTimeInMs / 1000
    if (elapsedTimeInSec < minimumWaitTimeInSec) {
      // console.log("minimum wait time between calls not reached: skipping turn")
      return
    }

    setBusy(true)
    
    console.log("Capturing new frame from webcam..")

    startTransition(async () => {
      const imageBase64 = capture()
      if (!imageBase64) {
        console.log("Failed to capture a new frame")
        setTimeout(() => {
          setBusy(false)
          setLastObservedAt(Date.now())
        }, 2000)
        return
      }
      const prompt = `What do you see here?`

      console.log("Calling IDEFICS..")
      const newObservation = await see({ prompt, imageBase64 })

      console.log("New observation: ", newObservation)
      if (newObservation !== lastObservation) {
        // console.log("update!")
        setLastObservation(newObservation || "")
        onObserve(newObservation || "", imageBase64)
      }
      setLastObservedAt(Date.now())

      // comment to disable the infinite loop!
      setBusy(false)
    })

    // console.log("observation ended!")
  }

  useInterval(() => {
    observe()
  }, 1000)

  return (
    <AutoSizer>
      {({ height, width }) => (
      <>
      <Webcam
        ref={webcamRef}
        className="fixed top-0 left-0 right-0 w-screen"
        screenshotFormat='image/jpeg'
        // screenshotFormat="image/webp"
        mirrored={true}
        videoConstraints={{
            width: { min: defaultWidth },
            height: { min: defaultHeight },
            aspectRatio: defaultWidth / defaultHeight,
            facingMode: "user",
        
            // if the device allows it, we can use the back camera
            // facingMode: { exact: "environment" }
          } as MediaTrackConstraints}
        />
        <Progress
          isLoading={isBusy}
          resetKey=""
          className="right-6"
        />
      </>
    )}
    </AutoSizer>
  )
}
