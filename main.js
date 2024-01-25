import qrcode from "qrcode-terminal";
import pkg from "whatsapp-web.js";
const { Client, LocalAuth } = pkg;
import { ChatGPTAPI } from "chatgpt";
import dotenv from "dotenv";
const dotconfig = dotenv.config();

const sendRequestToOpenAI = async (msg) => {
  const api = new ChatGPTAPI({
    apiKey: process.env.OPENAI_API_KEY,
    completionParams: {
      model: "gpt-3.5-turbo",
      temperature: 0.5,
      top_p: 0.8,
    },
  });

  let res = await api.sendMessage(msg.toString());
  return res.text;
};

const client = new Client({
  puppeteer: {
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  },
  authStrategy: new LocalAuth({
    clientId: "client-one",
  }),
});

client.initialize();

client.on("qr", (qr) => {
  qrcode.generate(qr, { small: true });
  console.log("WHATSAPP WEB => QR Generated");
});

client.on("authenticated", (session) => {
  console.log("WHATSAPP WEB => Authenticated");
});

const generateReply = async (message, group_id) => {
  let output = "";
  if (message.toLowerCase().includes("openai:")) {
    client.sendMessage(group_id, "Generating reply from Open AI Server...");

    const msg = message.split(":")[1];

    if (msg) {
      output = await sendRequestToOpenAI(msg.trim());
    }

    if (output) {
      client.sendMessage(group_id, output);
    }
  }
};

client.on("ready", async () => {
  console.log("WHATSAPP WEB => Ready");

  client.on("message_create", (message) => {
    client.getChats().then((chats) => {
      const myGroup = chats.find(
        (chat) => chat.name === process.env.WHATSAPP_GROUP_ID
      );

      generateReply(message?.body, myGroup.id._serialized);
    });
  });
});
