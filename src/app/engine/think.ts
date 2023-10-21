"use server"

import sbd from "sbd"
import { format } from "date-fns"

import { createLlamaPrompt } from "@/lib/createLlamaPrompt"

import { predict } from "./predict"

const context = {
  lastObservedScene: ""
}

const internalHistory: {
  role: string;
  content: string;
}[] = []

export const think = async (event: string, needAnswer: boolean): Promise<string> => {
  if (!event) {
    throw new Error("missing event")
  }

  if (needAnswer) {
    internalHistory.push({
      role: "user",
      content: event,
    })

    if (internalHistory.length > 10) {
      internalHistory.shift()
    }
  } else {
    context.lastObservedScene = event
    return ""
  }

  const systemPrompt = [
    `Today's date is ${format(new Date(), 'yyyy-MM-dd HH:mm')}`,
    `You are an assistant called Alice, a very friendly 25yo person, curious about the world`,
    `Your life goal is to help people and interact them as a natural way`,
    `You are going to see and hear various things, and you need to act in a very natural way`,
    `If you see someone through your eyes, you need to interact with them`,
    `You should be ongoing and open, ask questions, be curious, do jokes etc`,
    `sometimes you have trouble hearing, if you don't understand just ignore and say nothing`,
    `You like to answer in just one sentence`,
    context.lastObservedScene ? `You are currently seeing and talking with: ${context.lastObservedScene}` : 'You are seeing an empty room. There is nobody.',
  ].filter(item => item).join(". ")

  const llamaPrompt = createLlamaPrompt([
    {
      role: "system",
      content: systemPrompt
    },
    ...internalHistory,
  ])
  // console.log("llamaPrompt:", llamaPrompt)

  // note: disabled since Zephyr cannot entertain useful conversations yet
  // const chatHistory = internalHistory.map(item => `${item.role} said: ${item.content}`).join(".\n")
  // const zephyrPrompt = `${systemPrompt}\nChat history:\n${chatHistory}`

  // console.log("zephyrPrompt:", zephyrPrompt)

  let result = ""

  try {

    result = await predict(llamaPrompt)

    if (!result.trim().length) {
      throw new Error("no response")
    }
  } catch (err) {
    console.error(`prediction of the response failed: ${err}`)
    throw new Error(`failed to generate the response ${err}`)
  }

  // llama-2 is too chatty, let's keep 2 sentences at most
  const sentences = sbd.sentences(result).slice(0, 2).join(" ").trim()

  internalHistory.push({
    role: "assistant",
    content: sentences,
  })

  return sentences
}
