const MAGALU_STORE = "magazinematheusmauer"; // seu Magazine Você
const AMAZON_TAG = process.env.AMAZON_TAG || ""; // ex: "seutag-20"

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

const q = encodeURIComponent(text);

const magaluLink = `https://www.magazinevoce.com.br/${MAGALU_STORE}/busca/${q}/`;

let amazonLink = `https://www.amazon.com.br/s?k=${q}`;
if (AMAZON_TAG && AMAZON_TAG.trim().length > 0) {
  amazonLink += `&tag=${encodeURIComponent(AMAZON_TAG.trim())}`;
}

reply =
  `🛒 *Encontrei opções para:* *${text}*\n\n` +
  `✅ Amazon: ${amazonLink}\n` +
  `✅ Magalu: ${magaluLink}\n\n` +
  `Se quiser, diga: *barato* / *custo-benefício* / *melhor avaliado*`;
reply =
"🛒 *Encontrei as melhores opções para:* " + text + "\n\n" +

"🔥 *COMPRAR AGORA*\n" +
"• Amazon: https://www.amazon.com.br/s?k=" + q + "\n" +
"• Magalu: https://www.magazinevoce.com.br/magazinematheusmauer/busca/" + q + "/\n\n" +

"💬 Posso te ajudar a escolher:\n" +
"👉 barato\n" +
"👉 custo-benefício\n" +
"👉 melhor avaliado\n\n" +

"Digite como você prefere 😉";


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
