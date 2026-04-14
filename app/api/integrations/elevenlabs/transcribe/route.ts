import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase";

const ELEVENLABS_TRANSCRIBE_URL = "https://api.elevenlabs.io/v1/speech-to-text";

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Lookup order: company_integrations → platform_settings → env var
  let apiKey: string | undefined;
  try {
    const supabase = getSupabase();

    // 1. Company-level key (set by company super_admin)
    if (session.company_id) {
      const { data } = await supabase
        .from("company_integrations")
        .select("value")
        .eq("company_id", session.company_id)
        .eq("key", "ELEVENLABS_API_KEY")
        .single();
      apiKey = data?.value ?? undefined;
    }

    // 2. Platform-level key (set by site admin)
    if (!apiKey) {
      const { data } = await supabase
        .from("platform_settings")
        .select("value")
        .eq("key", "ELEVENLABS_API_KEY")
        .single();
      apiKey = data?.value ?? undefined;
    }
  } catch {
    // DB unavailable – fall through to env var
  }

  // 3. Environment variable fallback
  apiKey ??= process.env.ELEVENLABS_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "Missing ELEVENLABS_API_KEY. Add it to your server environment to enable transcription." },
      { status: 503 }
    );
  }

  const form = await req.formData();
  const audio = form.get("audio");

  if (!(audio instanceof File)) {
    return NextResponse.json({ error: "audio file is required" }, { status: 400 });
  }

  const upstreamBody = new FormData();
  upstreamBody.append("model_id", process.env.ELEVENLABS_STT_MODEL_ID ?? "scribe_v2");
  upstreamBody.append("file", audio, audio.name || "audio.webm");

  const upstream = await fetch(ELEVENLABS_TRANSCRIBE_URL, {
    method: "POST",
    headers: {
      "xi-api-key": apiKey,
    },
    body: upstreamBody,
  });

  const raw = await upstream.text();
  if (!upstream.ok) {
    return NextResponse.json(
      { error: `ElevenLabs transcription failed (${upstream.status}).`, details: raw.slice(0, 400) },
      { status: 502 }
    );
  }

  let parsed: { text?: string };
  try {
    parsed = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "Invalid transcription response from ElevenLabs." }, { status: 502 });
  }

  return NextResponse.json({ text: parsed.text ?? "" });
}
