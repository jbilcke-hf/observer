"use client"

import { getSpeechSynthesisVoice } from "@/lib/getSpeechSynthesisVoice"
import { create } from "zustand"

export const useStore = create<{
  isSpeechSynthesisAvailable: boolean
  speechSynthesis: SpeechSynthesis
  speechSynthesisVoice: SpeechSynthesisVoice
  isSpeaking: boolean
  lastSpokenSentence: string
  isHearing: boolean // robot is hearing
  init: () => void,
  loadVoice: () => void,
  speak: (sentence: string) => void
  setHearing: (isHearing: boolean) => void
}>((set, get) => ({
  isSpeechSynthesisAvailable: false,
  speechSynthesis: undefined as unknown as SpeechSynthesis,
  speechSynthesisVoice: undefined as unknown as SpeechSynthesisVoice,
  isSpeaking: false,
  lastSpokenSentence: "",
  isHearing: false, // robot is taking
  init: () => {
    if (!window?.speechSynthesis) {
      console.error(`no speech synthesis engine available`)
      return
    }
    const speechSynthesis = window.speechSynthesis
    set({ speechSynthesis })
    
    speechSynthesis.onvoiceschanged = () => { get().loadVoice() }

    setTimeout(() => {
      get().loadVoice()
    }, 2000)

    // due to the lack of event for the speaking state, we create our own polling system
    // see https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesis/speaking
    setInterval(() => {
      const { isSpeaking } = get()
      if (!speechSynthesis.speaking && isSpeaking) {
        set({ isSpeaking: false })
      } else if (speechSynthesis.speaking && !isSpeaking) {
        set({ isSpeaking: true })
      }
    }, 100)
  },
  loadVoice: () => {
    let { speechSynthesis, speechSynthesisVoice } = get()
    if (!speechSynthesis) {
      console.error(`no speech synthesis engine available`)
      return
    }

    try {
      speechSynthesisVoice = getSpeechSynthesisVoice(speechSynthesis)
      if (!speechSynthesisVoice?.name) {
        throw new Error("no name for the voice")
      }
    } catch (err) {
      console.error(`no speech synthesis voice available: ${err}`)
      return
    }
    if (speechSynthesisVoice) {
      set({ speechSynthesisVoice, isSpeechSynthesisAvailable: true })
    }
  },
  speak: (sentence: string) => {
    const { speechSynthesis, speechSynthesisVoice } = get()
    if (!speechSynthesis || !speechSynthesisVoice) { return }
    speechSynthesis.cancel()

    const utterance = new SpeechSynthesisUtterance(sentence)
    utterance.voice = speechSynthesisVoice

    speechSynthesis.speak(utterance)

    set({ lastSpokenSentence: sentence })
  },
  setHearing: (isHearing: boolean) => { set({ isHearing }) },
}))

