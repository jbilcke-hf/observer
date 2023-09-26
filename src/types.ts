export interface ImageAnalysisRequest {
  image: string // in base64
  prompt: string
}

export interface ImageAnalysisResponse {
  result: string
  error?: string
}


export interface SoundAnalysisRequest {
  sound: string // in base64
  prompt: string
}

export interface SoundAnalysisResponse {
  result: string
  error?: string
}
