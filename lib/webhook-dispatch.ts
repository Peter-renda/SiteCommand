import { createHmac } from "crypto";
import { getSupabase } from "@/lib/supabase";
import { sendWebhookEventEmail } from "@/lib/email";

export async function dispatchWebhookEvent(
  companyId: string,
  event: string,
  payload: Record<string, unknown>
) {
  const supabase = getSupabase();

  const { data: webhooks } = await supabase
    .from("webhooks")
    .select("id, url, secret, notify_email, name")
    .eq("company_id", companyId)
    .eq("is_active", true)
    .contains("events", [event]);

  if (!webhooks || webhooks.length === 0) return;

  const body = JSON.stringify({ event, data: payload, timestamp: new Date().toISOString() });

  await Promise.allSettled(
    webhooks.map(async (wh: { id: string; url: string; secret: string; notify_email: string | null; name: string }) => {
      const sig = createHmac("sha256", wh.secret).update(body).digest("hex");

      // Fire HTTP POST
      try {
        await fetch(wh.url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-SiteCommand-Event": event,
            "X-SiteCommand-Signature": `sha256=${sig}`,
          },
          body,
          signal: AbortSignal.timeout(10_000),
        });
      } catch {
        // swallow — webhook delivery failures are non-fatal
      }

      // Send email notification if configured
      if (wh.notify_email) {
        try {
          await sendWebhookEventEmail(wh.notify_email, event, payload, wh.name);
        } catch {
          // swallow
        }
      }
    })
  );
}
