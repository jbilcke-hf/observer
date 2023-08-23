"use client"

import { cn } from "@/lib/utils"

export function TopMenu() {
  return (
    <div className={cn(
      `z-10 fixed top-0 left-0 right-0`,
      `flex flex-row w-full justify-between items-center`,
      `backdrop-blur-xl`,
      `px-2 py-2 border-b-1 border-gray-50 dark:border-gray-50`,
      `bg-stone-900/70 dark:bg-stone-900/70 text-gray-50 dark:text-gray-50`,
      `space-x-6`
    )}>
      <div className="flex flex-row items-center space-x-3 font-mono">
       TODO
      </div>
      <div className="flex flex-row flex-grow items-center space-x-3 font-mono">
        TODO
      </div>
      <div className="flex flex-row items-center space-x-3 font-mono">
        TODO
      </div>
    </div>
  )
}