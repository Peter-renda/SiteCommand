import { getSupabase } from "./supabase";
import type { ThreadMessage } from "./email-types";

const GRAPH_BASE = "https://graph.microsoft.com/v1.0";
const TOKEN_URL = "https://login.microsoftonline.com/common/oauth2/v2.0/token";

export interface GraphMessage {
  id: string;
  subject: string;
  bodyPreview: string;
  conversationId: string;
  isRead: boolean;
  hasAttachments: boolean;
  receivedDateTime: string;
  from: { emailAddress: { name: string; address: string } };
  toRecipients: { emailAddress: { name: string; address: string } }[];
}

/**
 * Returns a valid access token for the given user, refreshing if it will
 * expire within the next 5 minutes. Throws if no connection exists.
 */
export async function getValidToken(userId: string): Promise<string> {
  const supabase = getSupabase();
  const { data: conn } = await supabase
    .from("user_email_connections")
    .select("access_token, refresh_token, token_expires_at")
    .eq("user_id", userId)
    .eq("provider", "outlook")
    .single();

  if (!conn) throw new Error("No Outlook connection found");

  const expiresAt = new Date(conn.token_expires_at).getTime();
  const nowPlus5m = Date.now() + 5 * 60 * 1000;

  if (expiresAt > nowPlus5m) return conn.access_token;

  // Token is stale — refresh it
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      client_id: process.env.MICROSOFT_CLIENT_ID!,
      client_secret: process.env.MICROSOFT_CLIENT_SECRET!,
      refresh_token: conn.refresh_token,
      scope: "Mail.Read Mail.ReadWrite offline_access User.Read",
    }).toString(),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Token refresh failed: ${body}`);
  }

  const json = (await res.json()) as {
    access_token: string;
    refresh_token?: string;
    expires_in: number;
  };

  const newExpiry = new Date(Date.now() + json.expires_in * 1000).toISOString();

  await supabase
    .from("user_email_connections")
    .update({
      access_token: json.access_token,
      refresh_token: json.refresh_token ?? conn.refresh_token,
      token_expires_at: newExpiry,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId)
    .eq("provider", "outlook");

  return json.access_token;
}

/**
 * Fetches up to 250 of the most recent messages from the user's mailbox.
 * /me/messages spans all folders, so this includes both received and sent mail.
 */
export async function fetchInboxMessages(accessToken: string): Promise<GraphMessage[]> {
  const select = "id,subject,bodyPreview,conversationId,isRead,hasAttachments,receivedDateTime,from,toRecipients";
  const url = `${GRAPH_BASE}/me/messages?$top=250&$orderby=receivedDateTime desc&$select=${select}`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Graph inbox fetch failed: ${res.status} ${body}`);
  }

  const json = await res.json();
  return (json.value ?? []) as GraphMessage[];
}

/**
 * Sends an email through Outlook (requires Mail.Send scope).
 * If the token lacks Mail.Send, the API will return 403 — reconnect Outlook to grant it.
 */
export async function sendOutlookEmail(
  accessToken: string,
  opts: { to: string; subject: string; body: string; cc?: string[] }
): Promise<void> {
  const res = await fetch(`${GRAPH_BASE}/me/sendMail`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      message: {
        subject: opts.subject,
        body: { contentType: "Text", content: opts.body },
        toRecipients: [{ emailAddress: { address: opts.to } }],
        ccRecipients: (opts.cc ?? []).map((a) => ({ emailAddress: { address: a } })),
      },
      saveToSentItems: true,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    if (res.status === 403) {
      throw new Error("Outlook send permission denied. Please disconnect and reconnect your Outlook account to grant send access.");
    }
    throw new Error(`Outlook send failed: ${res.status} ${body}`);
  }
}

/**
 * Creates a draft message in the user's Outlook Drafts folder.
 * Returns the Graph message id of the new draft.
 */
export async function createOutlookDraft(
  accessToken: string,
  opts: { to: { email: string; name?: string }; subject: string; body: string }
): Promise<{ id: string }> {
  const res = await fetch(`${GRAPH_BASE}/me/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      subject: opts.subject,
      body: { contentType: "HTML", content: opts.body },
      toRecipients: [
        {
          emailAddress: {
            address: opts.to.email,
            name: opts.to.name ?? opts.to.email,
          },
        },
      ],
      isDraft: true,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Graph create draft failed: ${res.status} ${body}`);
  }

  return res.json();
}

/** Fetches all messages in an Outlook conversation (oldest first) with full bodies. */
export async function fetchOutlookThread(
  accessToken: string,
  conversationId: string
): Promise<ThreadMessage[]> {
  const select = "id,subject,from,toRecipients,receivedDateTime,body,bodyPreview,internetMessageId";
  // Single quotes inside an OData string literal must be doubled.
  const safeId = conversationId.replace(/'/g, "''");
  const url = `${GRAPH_BASE}/me/messages?$filter=conversationId eq '${safeId}'&$select=${select}&$top=100`;

  const res = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Graph thread fetch failed: ${res.status} ${body}`);
  }
  const json = await res.json();
  const messages = (json.value ?? []) as any[];

  return messages
    .map((m): ThreadMessage => {
      const isHtml = (m.body?.contentType ?? "").toLowerCase() === "html";
      return {
        id: m.id,
        from: {
          name: m.from?.emailAddress?.name ?? "",
          address: m.from?.emailAddress?.address ?? "",
        },
        to: (m.toRecipients ?? []).map((r: any) => ({
          name: r.emailAddress?.name ?? "",
          address: r.emailAddress?.address ?? "",
        })),
        date: m.receivedDateTime ?? new Date().toISOString(),
        subject: m.subject || "(no subject)",
        bodyHtml: isHtml ? m.body?.content ?? "" : "",
        bodyText: isHtml ? "" : m.body?.content ?? "",
        snippet: m.bodyPreview ?? "",
        messageIdHeader: m.internetMessageId,
      };
    })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

/**
 * Replies to an Outlook message within its conversation. Uses the Graph reply
 * action, which keeps threading intact and replies to the original sender.
 */
export async function sendOutlookReply(
  accessToken: string,
  opts: { messageId: string; body: string }
): Promise<void> {
  const res = await fetch(`${GRAPH_BASE}/me/messages/${opts.messageId}/reply`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ comment: opts.body }),
  });

  if (!res.ok) {
    const body = await res.text();
    if (res.status === 403) {
      throw new Error("Outlook send permission denied. Please disconnect and reconnect your Outlook account to grant send access.");
    }
    throw new Error(`Graph reply failed: ${res.status} ${body}`);
  }
}
