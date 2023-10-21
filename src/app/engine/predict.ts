import { HfInference } from "@huggingface/inference"

const hfi = new HfInference(process.env.HF_API_TOKEN)
// const hf = hfi.endpoint(`${process.env.HF_INFERENCE_ENDPOINT_URL || ""}`)

const inferenceModel = `${process.env.LLM_HF_INFERENCE_API_MODEL || ""}`

function cleanOutput(output: string) {
  // for Zephyr we can 
  // need to do some cleanup of the garbage the LLM might have gave us
  return (
    output
    // for a simple, non-conversational autocomplete task (eg. for Zephyr)
    .replaceAll("You say:", "")
    .replaceAll("You hear:", "")
    .replaceAll("He says:", "")
    .replaceAll('"', '')

    // generic TGI / llama
    .replaceAll("<|end|>", "")
    .replaceAll("<s>", "")
    .replaceAll("</s>", "")
    .replaceAll("[INST]", "")
    .replaceAll("[/INST]", "") 
    .replaceAll("<SYS>", "")
    .replaceAll("</SYS>", "")
    .replaceAll("<|assistant|>", "")
  )
}

export async function predict(inputs: string) {


  // inputs = `${inputs}\nYou say: \"`
  console.log(`inputs: `, inputs)
  console.log(`prediction:`)

  let output = ""
  try {
    for await (const out of hfi.textGenerationStream({
      model: inferenceModel,
      inputs,
      parameters: {
        do_sample: true,

        // hard limit for max_new_tokens is 1512
        // however since we are tying to achieve some kind of real time interaction,
        // we want to make it as small as possible
        max_new_tokens: 70, // 1150,
        return_full_text: false,
      }
    })) {
      output += out.token.text
      process.stdout.write(out.token.text)
      if (
        // for a simple, non-conversational autocomplete task (eg. for Zephyr)
        // output.includes("\"") ||
        // output.includes("You say:") ||
        // output.includes("You hear:") ||
        // output.includes("He says:") ||

        // generic TGI / llama
        output.includes("</s>") || 
        output.includes("<s>") ||
        output.includes("[INST]") ||
        output.includes("[/INST]") ||
        output.includes("<SYS>") ||
        output.includes("</SYS>") ||
        output.includes("<|end|>") ||
        output.includes("<|assistant|>")
      ) {
        return cleanOutput(output)
      }
    }
  } catch (err) {
    console.error(`error during generation: ${err}`)
  }

  console.log("normal ending")
  return cleanOutput(output)
}