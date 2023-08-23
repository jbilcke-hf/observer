import sbd from "sbd"
import { format } from "date-fns"

import { createLlamaPrompt } from "@/lib/createLlamaPrompt"

import { predict } from "./predict"

export const think = async ({
  event = "",
  observation = "",
  history = "",
}: {
  event: string;
  observation: string;
  history: string;
}): Promise<string> => {
  if (!event) {
    throw new Error("missing event")
  }
  const prompt = createLlamaPrompt([
    {
      role: "system",
      content: [
        `You are a companion robot, very friendly, curious about the world.`,

        // TODO: put the history here (from most recent to oldest)
        `You have been presented some situation in the past, but you lost your memory.`,

        `Today's date is ${format(new Date(), 'yyyy-MM-dd at HH:mm (d)')}.`,
,       `You are currently observing this: ${observation}`,
      ].filter(item => item).join("\n")
    },
    {
      role: "user",
      content: event,
    }
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

  return sentences
}
