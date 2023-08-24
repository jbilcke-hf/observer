"use client"

import { useState, useTransition } from "react"
import { format } from "date-fns"

import { Observe } from "./observe"
import { cn } from "@/lib/utils"

import { think } from "./engine/think"
import { Progress } from "./interface/progress"
import { Listen } from "./listen"
import { Speak } from "./speak"

export default function Main() {
  const [_isPending, startTransition] = useTransition()
  const [lastImage, setLastImage] = useState<string>("")
  const [lastRawObservation, setLastRawObservation] = useState<string>("")
  const [isLoadingAction, setLoadingAction] = useState(false)
  
  const [observations, setObservations] = useState<string[]>([])
  const [action, setAction] = useState<string>("Nothing to say yet.")
  
  // receive a new observation from what the agent is looking at
  const handleOnObserve = (observation: string, image: string) => {
    setLastRawObservation(observation)
    setLastImage(image)

    // last comes first
    setObservations([
      `On ${format(new Date(), 'yyyy-MM-dd at HH:mm (d)')}, you saw: \"${observation}\".`
    ].concat(observations))

    // TODO: use llama-2 to summarize previous observations
    const history = observations.slice(0, 3).join("\n")


    startTransition(async () => {
      setLoadingAction(true)
      const action =  await think({
        history,
        observation,
        event: "Please react in a natural way to the current situation, by interacting with the person or entity you are seeing.",
      })

      setAction(action)
      setLoadingAction(false)
    })
  }

  const handleOnListen = (recording: string) => {
    console.log("on listen")
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
      {/*<Listen onListen={handleOnListen} />*/}
      <Speak>{action}</Speak>

      <Progress
        isLoading={isLoadingAction}
        resetKey=""
        className="left-6 right-0"
      />

      <div className="fixed z-10 left-0 right-0 bottom-0 flex flex-col items-center justify-center">
        <div className="full md:w-[80%] lg:w-[70%] mb-0 md:p-4 md:mb-8 bg-zinc-100 md:rounded-xl p-4 shadow-2xl text-xs md:text-sm">
          <p>🅿️ <span className="font-semibold">Informations: </span> This demo uses
           <a href="https://huggingface.co/HuggingFaceM4/idefics-80b#bias-evaluation" target="_blank" className="font-semibold"> IDEFICS </a>
           and 
           <a href="https://huggingface.co/meta-llama" target="_blank" className="font-semibold"> Llama-2 </a>, and is provided for demonstration and research purposes.</p>
          <p>⛔️ <span className="font-semibold">Limitations: </span> This demo is provided as-is, with no guarantee of factually correct results. In some cases, the models may return hallucinated or innapropriate responses.</p>
        </div>
      </div>
    </div>
  )
}