"use client"

import { ReactNode, useEffect, useState } from "react"
import { onlyText } from "react-children-utilities"

import { useTimeout } from "@/lib/useTimeout"
import { useStore } from "./useStore"

export function Speak({
  children
}: {
  children: ReactNode
}) {
  const isSpeechSynthesisAvailable = useStore(state => state.isSpeechSynthesisAvailable)
  const lastSpokenSentence = useStore(state => state.lastSpokenSentence)
  const init = useStore(state => state.init)
  const speak = useStore(state => state.speak)

  const newMessage = onlyText(children).trim()

  useEffect(() => { init() }, [])

  const canSpeak = isSpeechSynthesisAvailable && newMessage?.length && newMessage !== lastSpokenSentence
  
  useEffect(() => {
    console.log("debug:", { canSpeak, newMessage })
    if (canSpeak) {
      console.log("speaking!")
      speak(newMessage)
    }
  }, [canSpeak, newMessage])
  
  return null
}