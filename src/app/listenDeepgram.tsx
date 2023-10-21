"use client"

import {  useEffect, useState } from "react"

import { useToast } from "@/components/ui/use-toast"

export function Listen({
  onListen,
}: {
  onListen: (recording: string) => void
}) {
  const { toast } = useToast()
  const [transcriptBuffer, setTranscriptBuffer] = useState("")

  useEffect(() => {

    if (!navigator?.mediaDevices?.getUserMedia || !MediaRecorder.isTypeSupported("audio/webm")) {
      toast({
        title: "Error",
        description: "Your browser doesn't support audio recording",
        variant: "destructive"
      })
      return
    }

    const fn = async () => {

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })

      const recorder = new MediaRecorder(stream, { mimeType: "audio/webm" })

      const socket = new WebSocket("ws://localhost:3002")


      socket.onopen = () => {
        console.log({ event: "onopen" });
        recorder.addEventListener("dataavailable", async (event) => {
          if (event.data.size > 0 && socket.readyState === 1) {
            socket.send(event.data)
          }
        })
        recorder.start(1000)
      }
    
      socket.onmessage = (message) => {
        let transcript = ""
        try {
          const received = JSON.parse(message.data)
          transcript = received.channel.alternatives[0].transcript || ""
        } catch (err) {
          console.error(err)
        }

        if (transcript?.length > 1) {
          setTranscriptBuffer(transcript)
          onListen(transcript)
        }
      }
    
      socket.onclose = () => {
        console.log({ event: "onclose" });
      }
    
      socket.onerror = (error) => {
        console.log({ event: "onerror", error });
      }
    }

    fn()
  }, [])

  return (
    <div className="fixed top-80 left-16 z-10 bg-gray-100 p-4">
      <p>{
        transcriptBuffer || ""
        }</p>
    </div>
  )
}