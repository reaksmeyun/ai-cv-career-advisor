import type { NextRequest } from "next/server";
import { analyzeCv, AiServiceError } from "@/lib/server/aiAnalysis";
import { extractTextFromFile, ExtractionError } from "@/lib/server/extractText";
import { messages } from "@/lib/messages";

// Runs as a Node serverless function (needs Node libs); allow up to 60s.
export const runtime = "nodejs";
export const maxDuration = 60;

const MIN_TEXT_CHARS = 100;

function json(data: unknown, status: number): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export async function POST(req: NextRequest): Promise<Response> {
  try {
    const contentType = req.headers.get("content-type") ?? "";
    let cvText: string;

    if (contentType.includes("application/json")) {
      const body = (await req.json().catch(() => ({}))) as { cvText?: unknown };
      cvText = typeof body.cvText === "string" ? body.cvText : "";
      if (cvText.trim().length < MIN_TEXT_CHARS) {
        return json({ error: messages.shortInput }, 422);
      }
    } else if (contentType.includes("multipart/form-data")) {
      const form = await req.formData();
      const file = form.get("file");
      if (!(file instanceof File)) {
        return json({ error: "No file was uploaded." }, 422);
      }
      try {
        cvText = await extractTextFromFile(file.name, await file.arrayBuffer());
      } catch (error) {
        if (error instanceof ExtractionError) return json({ error: error.message }, 422);
        throw error;
      }
    } else {
      return json({ error: "Unsupported request." }, 400);
    }

    const analysis = await analyzeCv(cvText);
    return json({ analysis }, 200);
  } catch (error) {
    if (error instanceof AiServiceError) {
      return json({ error: error.message }, error.code);
    }
    console.error("analyze route error:", error);
    return json({ error: "The analysis failed. Please try again." }, 500);
  }
}
