import { NextResponse } from "next/server";

export const runtime = "nodejs";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

function extractText(data: any): string {
  if (typeof data?.output_text === "string" && data.output_text.length > 0) {
    return data.output_text;
  }

  const output = data?.output;
  if (!Array.isArray(output)) {
    return "";
  }

  const parts: string[] = [];

  for (const item of output) {
    if (!Array.isArray(item?.content)) continue;

    for (const content of item.content) {
      if (content?.type === "output_text" && typeof content.text === "string") {
        parts.push(content.text);
      }
    }
  }

  return parts.join("\n").trim();
}

type Tone = "seo" | "marketing" | "short";
type Language = "english" | "greek" | "german" | "french" | "spanish";

type AltTextVariations = {
  seo: string;
  short: string;
  marketing: string;
};

type PromptInput = {
  parsedUrl: URL;
  safeTitle: string;
  safeDescription: string;
  safeImageUrl: string;
  selectedTone: Tone;
  selectedLanguage: Language;
  retryReason?: string;
};

function normalizeTone(value: unknown): Tone {
  if (typeof value !== "string") {
    return "seo";
  }

  const tone = value.trim().toLowerCase();
  if (tone === "marketing" || tone === "short") {
    return tone;
  }

  return "seo";
}

function normalizeLanguage(value: unknown): Language {
  if (typeof value !== "string") {
    return "english";
  }

  const language = value.trim().toLowerCase();
  if (
    language === "greek" ||
    language === "german" ||
    language === "french" ||
    language === "spanish"
  ) {
    return language;
  }

  return "english";
}

function languageInstruction(language: Language): string {
  if (language === "greek") {
    return "Write all output in natural modern Greek. Do not use English, German, French, or Spanish.";
  }

  if (language === "german") {
    return "Write all output in natural professional German. Do not use English, Greek, French, or Spanish.";
  }

  if (language === "french") {
    return "Write all output in natural professional French. Do not use English, Greek, German, or Spanish.";
  }

  if (language === "spanish") {
    return "Write all output in natural professional Spanish. Do not use English, Greek, German, or French.";
  }

  return "Write all output in natural professional English. Do not use Greek, German, French, or Spanish.";
}

function languageLabel(language: Language): string {
  if (language === "greek") {
    return "Greek";
  }

  if (language === "german") {
    return "German";
  }

  if (language === "french") {
    return "French";
  }

  if (language === "spanish") {
    return "Spanish";
  }

  return "English";
}

function containsGreekCharacters(text: string): boolean {
  return /[\u0370-\u03ff\u1f00-\u1fff]/i.test(text);
}

function isWrongLanguageOutput(variations: AltTextVariations, selectedLanguage: Language): boolean {
  if (selectedLanguage === "greek") {
    return false;
  }

  const values = [variations.seo, variations.short, variations.marketing];
  return values.some((value) => containsGreekCharacters(value));
}

function buildPrompt({
  parsedUrl,
  safeTitle,
  safeDescription,
  safeImageUrl,
  selectedTone,
  selectedLanguage,
  retryReason,
}: PromptInput): string {
  const languageName = languageLabel(selectedLanguage);
  const retryBlock = retryReason
    ? `
Previous attempt failed:
- ${retryReason}
- Correct the language issue now.
`
    : "";

  return `You are an expert international ecommerce copywriter and SEO specialist.

Create exactly 3 alt text variations for the product page below.

Product page URL: ${parsedUrl.toString()}
Detected product title: ${safeTitle}
Detected meta description: ${safeDescription}
Detected main product image URL: ${safeImageUrl}
Requested tone: ${selectedTone}
Requested language: ${selectedLanguage}
${retryBlock}
IMPORTANT LANGUAGE RULE:
- Output must be written ONLY in ${languageName}.
- Never use Greek unless the requested language is Greek.
- If the title, description, or URL clues are in another language, translate or adapt them into ${languageName} before writing the final outputs.
- Every value in the JSON response must be fully written in ${languageName}.

Content requirements:
- Detect the likely product type from the URL, title, description, and image clues
- Make all versions specific, product-related, and visually descriptive
- Make the wording concise, natural, SEO-friendly, and accessibility-friendly
- Include likely product type, color, and material when they can be reasonably inferred
- Mention likely use-case only when it adds real clarity
- If exact details are unknown, use the most likely safe ecommerce wording without inventing unrealistic claims
- Keep every variation to a maximum of 2 sentences
- Do not use quotation marks inside the output text
- Return valid JSON only with no markdown fences and no extra text

Variation rules:
- "seo": prioritize SEO-friendly wording and discoverability
- "short": prioritize brevity, clarity, and one short sentence when possible
- "marketing": prioritize a polished, premium, lightly persuasive tone
- The requested tone is ${selectedTone}; make that variation especially strong, but still return all 3

Return this exact shape:
{
  "seo": "text in ${languageName}",
  "short": "text in ${languageName}",
  "marketing": "text in ${languageName}"
}`;
}

async function requestVariations(prompt: string): Promise<AltTextVariations> {
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4.1-mini",
      input: prompt,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.error?.message || "OpenAI request failed");
  }

  const rawText = extractText(data) || "No result";
  return parseVariationPayload(rawText) || fallbackVariations(rawText);
}

function parseVariationPayload(rawText: string): AltTextVariations | null {
  const normalized = rawText.trim();
  const candidates = [normalized];

  const fenceMatch = normalized.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenceMatch?.[1]) {
    candidates.push(fenceMatch[1].trim());
  }

  const jsonMatch = normalized.match(/\{[\s\S]*\}/);
  if (jsonMatch?.[0]) {
    candidates.push(jsonMatch[0].trim());
  }

  for (const candidate of candidates) {
    try {
      const parsed = JSON.parse(candidate);
      const seo = typeof parsed?.seo === "string" ? parsed.seo.trim() : "";
      const short = typeof parsed?.short === "string" ? parsed.short.trim() : "";
      const marketing = typeof parsed?.marketing === "string" ? parsed.marketing.trim() : "";

      if (seo && short && marketing) {
        return { seo, short, marketing };
      }
    } catch {
      // Try the next candidate form.
    }
  }

  return null;
}

function fallbackVariations(result: string): AltTextVariations {
  return {
    seo: result,
    short: result,
    marketing: result,
  };
}

function selectedResult(variations: AltTextVariations, tone: Tone): string {
  return variations[tone] || variations.seo;
}

export async function POST(req: Request) {
  try {
    const { url, language, tone, title, description, imageUrl } = await req.json();

    if (!url || typeof url !== "string") {
      return NextResponse.json(
        { error: "Please provide a valid URL." },
        { status: 400, headers: corsHeaders },
      );
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY is missing" },
        { status: 500, headers: corsHeaders },
      );
    }

    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url);
    } catch {
      return NextResponse.json(
        { error: "The URL format is invalid." },
        { status: 400, headers: corsHeaders },
      );
    }

    const safeTitle =
      typeof title === "string" && title.trim() ? title.trim() : "Unknown product title";
    const safeDescription =
      typeof description === "string" && description.trim()
        ? description.trim()
        : "No product description provided";
    const safeImageUrl =
      typeof imageUrl === "string" && imageUrl.trim() ? imageUrl.trim() : "No product image URL provided";
    const selectedTone = normalizeTone(tone);
    const selectedLanguage = normalizeLanguage(language);

    let variations = await requestVariations(
      buildPrompt({
        parsedUrl,
        safeTitle,
        safeDescription,
        safeImageUrl,
        selectedTone,
        selectedLanguage,
      }),
    );

    if (isWrongLanguageOutput(variations, selectedLanguage)) {
      variations = await requestVariations(
        buildPrompt({
          parsedUrl,
          safeTitle,
          safeDescription,
          safeImageUrl,
          selectedTone,
          selectedLanguage,
          retryReason: `The previous response used Greek characters even though the selected language was ${languageLabel(selectedLanguage)}.`,
        }),
      );
    }

    const result = selectedResult(variations, selectedTone);

    return NextResponse.json(
      {
        result,
        selectedTone,
        selectedLanguage,
        variations,
      },
      { headers: corsHeaders },
    );
  } catch (error) {
    console.error("API /api/generate error:", error);

    return NextResponse.json(
      { error: "Something went wrong while generating alt text." },
      { status: 500, headers: corsHeaders },
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders,
  });
}
