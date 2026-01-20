const express = require("express");
const axios = require("axios");

const app = express();
app.use(express.json());

// === CONFIG ===
const TOKEN = process.env.WHATSAPP_TOKEN;     // token do Meta
const PHONE_NUMBER_ID = process.env.PHONE_ID; // Phone Number ID
const VERIFY_TOKEN = process.env.VERIFY_TOKEN;

// --- Verificação do Webhook ---
app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    return res.status(200).send(challenge);
  }
  return res.sendStatus(403);
});

// --- Receber mensagens ---
app.post("/webhook", async (req, res) => {
  try {
    const entry = req.body.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;

    const msg = value?.messages?.[0];
    if (!msg) return res.sendStatus(200);

    const from = msg.from;
    const text = msg.text?.body?.trim() || "";

    let reply = "";

    if (/^oi|olá|ola|bom dia|boa tarde|boa noite/i.test(text)) {
      reply =
        "Olá! 👋 Me diga o que você procura (ex: 'airfryer', 'fone bluetooth', 'cadeira gamer') e eu te mando opções.";
    } else if (text.length < 2) {
      reply = "Pode mandar o nome do produto com mais detalhes 🙂";
    } else {
      const q = encodeURIComponent(text);
      reply =
        `Encontrei opções para: *${text}*\n\n` +
        `1) Amazon: https://www.amazon.com.br/s?k=${q}\n` +
        `2) Magalu: https://www.magazinevoce.com.br/magazinematheusmauer/busca/${q}/\n\n` +
        `Me diga: *barato* / *custo-benefício* / *top*`;
    }

    await sendText(from, reply);
    return res.sendStatus(200);
  } catch (err) {
    console.error("Webhook error:", err?.response?.data || err.message);
    return res.sendStatus(200);
  }
});

// --- Enviar mensagem ---
async function sendText(to, body) {
  if (!TOKEN || !PHONE_NUMBER_ID) {
    throw new Error("Faltou WHATSAPP_TOKEN ou PHONE_ID nas variáveis de ambiente.");
  }

  const url = `https://graph.facebook.com/v22.0/${PHONE_NUMBER_ID}/messages`;

  await axios.post(
    url,
    {
      messaging_product: "whatsapp",
      to,
      type: "text",
      text: { body },
    },
    {
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        "Content-Type": "application/json",
      },
    }
  );
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("✅ Bot rodando na porta", PORT));
