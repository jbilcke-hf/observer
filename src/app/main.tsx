"use client"

import { useState, useTransition } from "react"
import { format } from "date-fns"

import { Observe } from "./observe"
import { cn } from "@/lib/utils"

import { think } from "./engine/think"
import { Progress } from "./interface/progress"
import { Listen } from "./listen"
import { Speak } from "./speak"
import { Toaster } from "@/components/ui/toaster"

export default function Main() {
  const [_isPending, startTransition] = useTransition()
  const [lastImage, setLastImage] = useState<string>("")
  const [lastRawObservation, setLastRawObservation] = useState<string>("")
  const [isLoadingAction, setLoadingAction] = useState(false)
  
  const [action, setAction] = useState<string>("Nothing to say yet.")
  
  const handleOnEvent = (event: string) => {
    setLoadingAction(true)
    startTransition(async () => {
      const action = await think(event)
      setAction(action)
      setLoadingAction(false)
    })
  }
  // receive a new observation from what the agent is looking at
  const handleOnObserve = (observation: string, image: string) => {
    setLastRawObservation(observation)
    setLastImage(image)
    handleOnEvent(`It is ${format(new Date(), 'HH:mm (d)')} and you are seeing this: ${observation}`)
  }

  const handleOnListen = (recording: string) => {
    handleOnEvent(`It is ${format(new Date(), 'HH:mm (d)')} and you are hearing this: ${recording}`)
  }
  
  return (
    <div className="w-screen h-screen bg-zinc-100">
      
      <div className="fixed z-10 left-0 right-0 flex flex-col items-center justify-center">
        <div className={cn(
          `flex flex-col md:flex-row`,
          `items-center justify-between`,
          `w-full md:w-[90%] lg:w-[80%]`,
          `p-2 mt-0 md:p-4 md:mt-8`,
          `bg-zinc-100 md:rounded-xl`,
          `shadow-2xl text-xs md:text-sm`
        )}>
          <div className="flex flex-row space-x-4 w-full md:w-1/2 p-2 md:p-4">
            <div className="flex w-[112px]">
              {lastImage ? 
                <div className="w-28 aspect-video">
                  <img
                    src={lastImage}
                    alt="screenshot"
                    className="rounded-lg shadow-xl border border-zinc-500"
                  />
                </div> : null}
            </div>

            <div className="text-lg flex-grow italic">
              <span className="text-zinc-700 text-lg">
                {lastRawObservation}
              </span>
            </div>
          </div>


          <div className="flex flex-row w-full md:w-1/2 p-2 md:p-4">

            <div className="w-full text-zinc-800 text-lg">
              {action}
            </div>
          </div>
        </div>
      </div>

      <Observe onObserve={handleOnObserve} />
      <Listen onListen={handleOnListen} />
      <Speak>{action}</Speak>
      <Toaster />

      <Progress
        isLoading={isLoadingAction}
        resetKey=""
        className="left-6 right-0"
      />

      <div className="fixed z-10 left-0 right-0 bottom-0 flex flex-col items-center justify-center">
        <div className="full md:w-[80%] lg:w-[70%] mb-0 md:p-4 md:mb-8 bg-zinc-100 md:rounded-xl p-4 shadow-2xl text-xs md:text-sm">
          <p>🅿️ <span className="font-semibold">
            </span>This multimodal demo allow 
           <a href="https://huggingface.co/meta-llama" target="_blank" className="font-semibold underline"> Llama-2 </a> to hear, see and talk.
           You need to upgrade to a <a href="https://caniuse.com/webgpu" target="_blank" className="font-semibold underline">browser with support for WebGPU</a> for speech recognition to work.
            Vision is handled by <a href="https://huggingface.co/HuggingFaceM4/idefics-80b#bias-evaluation" target="_blank" className="font-semibold underline"> IDEFICS </a></p>
          <p>⛔️ <span className="font-semibold">Limitations: </span>This demo is provided as-is, for demonstration and research purpose only. As it demonstrates WebGPU technology, this demo will not support incompatible browsers and/or devices. No guarantee of factually correct results. In some cases, the models may return hallucinated or innapropriate responses.</p>
        </div>
      </div>
    </div>
  )
}