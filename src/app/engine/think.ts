import sbd from "sbd"
import { format } from "date-fns"

import { createLlamaPrompt } from "@/lib/createLlamaPrompt"

import { predict } from "./predict"

const internalHistory: {
  role: string;
  content: string;
}[] = []

export const think = async (event: string): Promise<string> => {
  if (!event) {
    throw new Error("missing event")
  }

  internalHistory.push({
    role: "user",
    content: event,
  })

  if (internalHistory.length > 10) {
    internalHistory.shift()
  }

  const prompt = createLlamaPrompt([
    {
      role: "system",
      content: [
        `Today's date is ${format(new Date(), 'yyyy-MM-dd at HH:mm (d)')}.`,
        `You are an android robot, very friendly, curious about the world.`,
        `Your life goal is to help human and interact them as a natural way.`,
        `You are going to see and hear various things, and you need to act in a very natural way.`,
        `If you see someone through your eyes, you need to interact with them,`,
        `you should be o ngoing and open, ask questions, be curious, do jokes etc.`,
      ].filter(item => item).join("\n")
    },
    ...internalHistory,
  ])


  let result = ""
  try {
    result = await predict(prompt)
    if (!result.trim().length) {
      throw new Error("no response")
    }
  } catch (err) {
    console.log(`prediction of the response..`)
    try {
      result = await predict(prompt+".")
    } catch (err) {
      console.error(`prediction of the response failed again!`)
      throw new Error(`failed to generate the response ${err}`)
    }
  }

  // llama-2 is too chatty, let's keep 3 sentences at most
  const sentences = sbd.sentences(result).slice(0, 3).join(" ").trim()

  internalHistory.push({
    role: "assistant",
    content: sentences,
  })

  return sentences
}
