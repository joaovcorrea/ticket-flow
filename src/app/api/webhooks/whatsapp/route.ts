import { NextRequest, NextResponse } from "next/server";
import { handleWhatsAppMessage } from "@/lib/whatsapp";

// Meta Cloud API webhook verification
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    return new NextResponse(challenge, { status: 200 });
  }

  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

// Incoming messages from WhatsApp
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Meta Cloud API format
    const entry = body.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;
    const messages = value?.messages;

    if (messages?.length) {
      for (const msg of messages) {
        if (msg.type === "text") {
          const contact = value.contacts?.[0];
          await handleWhatsAppMessage({
            from: msg.from,
            name: contact?.profile?.name,
            text: msg.text.body,
            messageId: msg.id,
          });
        }
      }
    }

    // Evolution API format (alternative)
    if (body.event === "messages.upsert" && body.data) {
      const msg = body.data;
      if (!msg.key?.fromMe && msg.message?.conversation) {
        await handleWhatsAppMessage({
          from: msg.key.remoteJid?.replace("@s.whatsapp.net", "") || "",
          name: msg.pushName,
          text: msg.message.conversation,
          messageId: msg.key.id,
        });
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[WhatsApp Webhook]", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
