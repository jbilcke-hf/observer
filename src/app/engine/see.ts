"use server"

import { ImageAnalysisRequest, ImageAnalysisResponse } from "@/types"

const apiUrl = `${process.env.RENDERING_ENGINE_API || ""}`

export async function see({
  prompt,
  imageBase64
}: {
  prompt: string
  imageBase64: string
}): Promise<string> {
  return ""
  
  if (!prompt) {
    console.error(`cannot call the API without an image, aborting..`)
    throw new Error(`cannot call the API without an image, aborting..`)
  }

  try {
    const request = {
      prompt,
      image: imageBase64

    } as ImageAnalysisRequest

    console.log(`calling ${apiUrl}/analyze called with: `, {
      prompt: request.prompt,
      image: request.image.slice(0, 20)
    })

    const res = await fetch(`${apiUrl}/analyze`, {
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

    const response = (await res.json()) as ImageAnalysisResponse

    return response.result.replaceAll("The image shows", "")
  } catch (err) {
    console.error(err)
    return ""
  }
}
