export function getSpeechSynthesisVoice(speechSynthesis: SpeechSynthesis): SpeechSynthesisVoice {
  const allVoices = speechSynthesis.getVoices()

  console.log("all voices:")
  console.table(allVoices)

  const fallbackVoice = allVoices[0]

  const enVoices = allVoices.filter(voice => voice.lang.toLowerCase() === "en-us")

  console.log("available english voices:")
  console.table(enVoices)

  const kathyVoice = enVoices.find(voice => voice.name.includes("Kathy"))

  // if we find a high-quality voice
  const googleVoice = enVoices.find(voice => voice.name.includes("Google"))

  // console.log("google voice:", googleVoice)

  return googleVoice || kathyVoice || fallbackVoice
}