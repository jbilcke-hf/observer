"use client"

import { ReactNode, useEffect, useState } from "react"
import { onlyText } from "react-children-utilities"

export function Speak({
  children
}: {
  children: ReactNode
}) {
  const newMessage = onlyText(children).trim()
  const [playedMessage, setPlayedMessage] = useState("")
  
  const [voice, setVoice] = useState<SpeechSynthesisVoice>()

  useEffect(() => {
    console.log("getting voices..")
    setTimeout(() => {
      if (typeof window === "undefined") { return }
      if (!window?.speechSynthesis) { return }
      const allVoices = window.speechSynthesis.getVoices()

      const enVoices = allVoices.filter(voice => voice.lang.toLowerCase() === "en-us")

      if (!enVoices.length) { return }

      console.log("available voices:")
      console.table(enVoices)

      const kathyVoice = enVoices.find(voice => voice.name.includes("Kathy"))

      // if we find a high-quality voice
      const googleVoice = enVoices.find(voice => voice.name.includes("Google"))
  
      console.log("google voice:", googleVoice)

      setVoice(googleVoice || kathyVoice)
    }, 1000)
  }, [])

  useEffect(() => {
    if (typeof window === "undefined") { return }
    if (!window?.speechSynthesis) { return }
    if (!voice?.name) { return }
    if (!newMessage?.length) { return }
    if (newMessage === playedMessage) { return }
    const synth = window.speechSynthesis

    console.log(`Speaking "${newMessage}"`)
    setPlayedMessage(newMessage)
    const utterance = new SpeechSynthesisUtterance(newMessage)
    utterance.voice = voice
    synth.speak(utterance)
  }, [voice?.name, newMessage, playedMessage])
  
  return (
    null
  )
}