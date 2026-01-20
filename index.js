const express = require("express");
const axios = require("axios");

const app = express();
app.use(express.json());

// ===== CONFIG =====
const TOKEN = process.env.WHATSAPP_TOKEN; // Token da Meta (Cloud API)
const PHONE_NUMBER_ID = process.env.PHONE_ID; // Phone Number ID
const VERIFY_TOKEN = process.env.VERIFY_TOKEN; // Token de verificação do webhook

// Sua loja Magalu (Magazine Você)
const MAGALU_STORE = "magazinematheusmauer";

// Sua tag de afiliado Amazon (Render env: AMAZON_TAG = matheusmaue03-20)
const AMAZON_TAG = process.env.AMAZON_TAG || "";

// ===== WEBHOOK VERIFY (GET) =====
app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    return res.status(200).send(challenge);
  }
  return res.sendStatus(403);
});

// ===== RECEIVE MESSAGES (POST) =====
app.post("/webhook", async (req, res) => {
  try {
    const entry = req.body.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;

    const msg = value?.messages?.[0];
    if (!msg) return res.sendStatus(200);

    const from = msg.from; // telefone do cliente (55DDDNUMERO)
    const text = (msg.text?.body || "").trim();

    // Ignora mensagens vazias
    if (!text) return res.sendStatus(200);

    // Monta links
    const q = encodeURIComponent(text);

    const magaluLink = `https://www.magazinevoce.com.br/${MAGALU_STORE}/busca/${q}/`;

    let amazonLink = `https://www.amazon.com.br/s?k=${q}`;
    if (AMAZON_TAG.trim()) {
      amazonLink += `&tag=${encodeURIComponent(AMAZON_TAG.trim())}`;
    }

    // ===== LÓGICA DO BOT =====
    let reply = "";

    if (/^(oi|olá|ola|bom dia|boa tarde|boa noite)\b/i.test(text)) {
      reply =
        "Olá! 👋 Sou o assistente da Loja do Matheus.\n\n" +
        "Me mande o *nome do produto* (ex: airfryer, fone bluetooth, cadeira gamer) que eu te envio opções com desconto 😄";
    } else if (text.length < 2) {
      reply = "Pode mandar o nome do produto com mais detalhes 🙂";
    } else if (/^(barato|custo|custo-beneficio|custo benefício|melhor|melhor avaliado|top)\b/i.test(text)) {
      // Se o cliente mandar uma preferência, ainda assim manda links (simples e direto)
      reply =
        `Fechado! Vou no *${text}* ✅\n\n` +
        `🛒 Amazon: ${amazonLink}\n` +
        `🛒 Magalu: ${magaluLink}\n\n` +
        "Se quiser, me diga a *marca* ou um *valor máximo* (ex: até 300) pra eu afinar melhor.";
    } else {
      reply =
        `🛒 *Encontrei opções para:* *${text}*\n\n` +
        `✅ Amazon: ${amazonLink}\n` +
        `✅ Magalu: ${magaluLink}\n\n` +
        "Pra eu te indicar mais certeiro, diga uma destas opções:\n" +
        "👉 *barato*\n" +
        "👉 *custo-benefício*\n" +
        "👉 *melhor avaliado*";
    }

    await sendText(from, reply);
    return res.sendStatus(200);
  } catch (err) {
    console.error("Webhook error:", err?.response?.data || err.message);
    return res.sendStatus(200);
  }
});

// ===== SEND MESSAGE =====
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
      timeout: 15000,
    }
  );
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("✅ Bot rodando na porta", PORT));
