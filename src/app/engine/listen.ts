"use server"

import { SoundAnalysisRequest, SoundAnalysisResponse } from "@/types"

const apiUrl = `${process.env.RENDERING_ENGINE_API || ""}`

export async function listen(sound: string): Promise<string> {
  if (!sound?.length) {
    console.log(`cannot call the API without a sound, aborting..`)
    // throw new Error(`cannot call the API without a sound, aborting..`)
    return ""
  }

  try {
    const request = {
      sound
    } as SoundAnalysisRequest

    console.log(`calling ${apiUrl}/listen called with: `, {
      sound: request.sound.slice(0, 20)
    })

    const res = await fetch(`${apiUrl}/listen`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        // Authorization: `Bearer ${process.env.VC_SECRET_ACCESS_TOKEN}`,
      },
      body: JSON.stringify(request),
      cache: 'no-store',
    // we can also use this (see https://vercel.com/blog/vercel-cache-api-nextjs-cache)
    // next: { revalidate: 1 }
    })

    if (res.status !== 200) {
      throw new Error('Failed to fetch data')
    }

    const response = (await res.json()) as SoundAnalysisResponse
    return response.result
  } catch (err) {
    console.error(err)
    return ""
  }
}
