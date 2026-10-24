const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta';

export interface GeminiPart {
  text: string;
}

export interface GeminiContent {
  role: string;
  parts: GeminiPart[];
}

export interface GeminiSystemInstruction {
  parts: GeminiPart[];
}

export interface GeminiGenerationConfig {
  maxOutputTokens?: number;
  temperature?: number;
  responseMimeType?: string;
}

export interface GeminiRequest {
  systemInstruction?: GeminiSystemInstruction;
  contents: GeminiContent[];
  generationConfig?: GeminiGenerationConfig;
}

export interface GeminiCandidate {
  content?: {
    parts?: GeminiPart[];
  };
}

export interface GeminiResponse {
  candidates?: GeminiCandidate[];
}

const MAX_OUTPUT_TOKENS = 300;
const TEMPERATURE = 0.4;
const REQUEST_TIMEOUT_MS = 8000;

export async function callGemini(request: GeminiRequest): Promise<string | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_MODEL;

  if (!apiKey || !model) {
    return null;
  }

  const generationConfig: GeminiGenerationConfig = {
    maxOutputTokens: MAX_OUTPUT_TOKENS,
    temperature: TEMPERATURE,
    ...request.generationConfig,
  };

  // Enforce hard cap regardless of caller input
  if (
    generationConfig.maxOutputTokens !== undefined &&
    generationConfig.maxOutputTokens > MAX_OUTPUT_TOKENS
  ) {
    generationConfig.maxOutputTokens = MAX_OUTPUT_TOKENS;
  }

  const body = {
    systemInstruction: request.systemInstruction,
    contents: request.contents,
    generationConfig,
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(`${GEMINI_BASE}/models/${model}:generateContent`, {
      method: 'POST',
      headers: {
        'x-goog-api-key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return null;
    }

    const data: GeminiResponse = (await response.json()) as GeminiResponse;
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    return typeof text === 'string' && text.length > 0 ? text : null;
  } catch {
    clearTimeout(timeoutId);
    return null;
  }
}
