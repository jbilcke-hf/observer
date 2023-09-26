export function blobToBase64Uri(blob?: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!blob || typeof window === "undefined" || !window.FileReader) {
      resolve("")
      return
    }

    const reader = new window.FileReader()
    reader.readAsDataURL(blob)
    reader.onloadend = () => {
      resolve(`${reader.result || ""}`)
    }
    reader.onerror = () => {
      // reject("error while converting blob to base64")
      resolve("")
    }
  })
}