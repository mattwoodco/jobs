import { openai } from "@ai-sdk/openai";

export default function getOpenAIModel() {
  const modelName = process.env.API_MODEL || "mistral-small-latest";
  const baseURL = process.env.API_URL_BASE;
  if (baseURL && baseURL.trim().length > 0) {
    return openai(modelName, { baseURL });
  }
  return openai(modelName);
}