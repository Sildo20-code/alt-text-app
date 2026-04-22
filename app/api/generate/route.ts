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

function normalizeTone(value: unknown): "seo" | "marketing" | "short" {
  if (typeof value !== "string") {
    return "seo";
  }

  const tone = value.trim().toLowerCase();
  if (tone === "marketing" || tone === "short") {
    return tone;
  }

  return "seo";
}

function toneInstruction(tone: "seo" | "marketing" | "short"): string {
  if (tone === "marketing") {
    return [
      "Prioritize a polished marketing tone.",
      "Make it persuasive and premium while remaining natural and believable.",
      "Keep it visually descriptive, but slightly more lifestyle-oriented than technical.",
    ].join("\n");
  }

  if (tone === "short") {
    return [
      "Prioritize brevity and clarity.",
      "Keep it compact, clean, and easy to scan.",
      "Use one short sentence when possible.",
    ].join("\n");
  }

  return [
    "Prioritize SEO-friendly wording.",
    "Use specific product-related phrases that can support discoverability.",
    "Keep it descriptive, relevant, and search-aware without sounding spammy.",
  ].join("\n");
}

export async function POST(req: Request) {
  try {
    const { url, title, description, imageUrl, tone } = await req.json();

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

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        input: `You are an expert Greek ecommerce copywriter and SEO specialist.

Create one alt text in natural, fluent Greek for the product page below.

Product page URL: ${parsedUrl.toString()}
Detected product title: ${safeTitle}
Detected meta description: ${safeDescription}
Detected main product image URL: ${safeImageUrl}
Requested tone: ${selectedTone}

Requirements:
- Write in high-quality modern Greek
- Detect the likely product type from the URL, title, and image URL clues
- Make it SEO-friendly using specific, product-related wording
- Make it more detailed and descriptive, while staying clean and readable
- Mention likely color, material, and use-case when they can be reasonably inferred
- If exact details are unknown, use the most likely safe ecommerce wording without inventing unrealistic claims
- Maximum 2 sentences
- Do not use quotation marks
- Do not add labels, explanations, multiple options, or extra text
- Adapt the tone based on the requested style
- ${toneInstruction(selectedTone)}
- Return only the final alt text`,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data?.error?.message || "OpenAI request failed" },
        { status: response.status, headers: corsHeaders },
      );
    }

    const result = extractText(data) || "No result";

    return NextResponse.json({ result }, { headers: corsHeaders });
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
