import { NextResponse } from "next/server";

export const runtime = "nodejs";

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

export async function POST(req: Request) {
  try {
    const { url } = await req.json();

    if (!url || typeof url !== "string") {
      return NextResponse.json(
        { error: "Please provide a valid URL." },
        { status: 400 },
      );
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY is missing" },
        { status: 500 },
      );
    }

    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url);
    } catch {
      return NextResponse.json(
        { error: "The URL format is invalid." },
        { status: 400 },
      );
    }

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        input: `You are an expert Greek ecommerce copywriter and SEO specialist.

Create one alt text in natural, fluent Greek for the product page: ${parsedUrl.toString()}

Requirements:
- Write in high-quality modern Greek
- Make it SEO-friendly using clear product-related wording
- Keep it concise but still descriptive
- Maximum 125 characters
- Focus on what the product most likely is and its key visual/value details
- Do not use quotation marks
- Do not add labels, explanations, multiple options, or extra text
- Return only the final alt text`,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data?.error?.message || "OpenAI request failed" },
        { status: response.status },
      );
    }

    const result = extractText(data) || "No result";

    return NextResponse.json({ result });
  } catch (error) {
    console.error("API /api/generate error:", error);

    return NextResponse.json(
      { error: "Something went wrong while generating alt text." },
      { status: 500 },
    );
  }
}
