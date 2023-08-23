export interface ImageAnalysisRequest {
  image: string // in base64
  prompt: string
}

export interface ImageAnalysisResponse {
  result: string
  error?: string
}
