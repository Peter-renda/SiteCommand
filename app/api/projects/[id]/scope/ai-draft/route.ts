import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { GoogleGenAI } from "@google/genai";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await params; // consume params

  const body = await req.json();
  const { divisionCode, divisionName, sectionName, projectName, projectType } = body;

  if (!divisionCode || !divisionName) {
    return NextResponse.json({ error: "Division code and name are required" }, { status: 400 });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "AI service not configured" }, { status: 503 });
  }

  try {
    const genai = new GoogleGenAI({ apiKey });

    const sectionPart = sectionName ? ` — Section: ${sectionName}` : "";
    const projectPart = projectName ? ` for the project "${projectName}"` : "";
    const typePart = projectType ? ` (project type: ${projectType})` : "";

    const prompt = `Write a professional Scope of Work paragraph for a construction project${projectPart}${typePart}.

CSI MasterFormat Division: ${divisionCode} – ${divisionName}${sectionPart}

Requirements:
- Write 3 to 5 sentences
- Be specific, professional, and use standard construction industry language
- Describe what work is included, quality standards, and any key requirements
- Do not use bullet points or headers — write in paragraph form only
- Do not include any preamble like "Here is a scope..." — just provide the scope text directly`;

    const preferredModels = [process.env.GEMINI_MODEL, "gemini-2.5-flash", "gemini-2.0-flash"].filter(
      (value): value is string => Boolean(value)
    );
    let text = "";
    let lastError = "";
    for (const model of preferredModels) {
      try {
        const result = await genai.models.generateContent({
          model,
          contents: prompt,
        });
        text = (result.text ?? "").trim();
        if (text) break;
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "AI generation failed";
        lastError = message;
        if (message.toLowerCase().includes("not_found") || message.toLowerCase().includes("no longer available")) {
          continue;
        }
        break;
      }
    }

    if (!text && lastError) {
      return NextResponse.json({ error: lastError }, { status: 502 });
    }

    return NextResponse.json({ text });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "AI generation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
