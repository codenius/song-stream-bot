import "std/dotenv/load.ts"; // loads .env in Deno.env
import { Application } from "oak";
import { logger } from "./lib/logger.ts";

import { botRouter } from "./lib/bot.ts";
import { songsRouter } from "./lib/sendSongs.ts";

const SERVER_URL = Deno.env.get("SERVER_URL");
const BOT_TOKEN = Deno.env.get("BOT_TOKEN");
const PORT = 8000;
const ALLOWED_UPDATES = ["message", "message_reaction"];
const WEBHOOK_URL =
  `https://api.telegram.org/bot${BOT_TOKEN}/setWebhook?url=${SERVER_URL}webhook&allowed_updates=${
    JSON.stringify(ALLOWED_UPDATES)
  }`;
try {
  await fetch(WEBHOOK_URL);
  console.log(`Successfully registered webhook to ${SERVER_URL}.`);
} catch {
  console.log("Webhook registration failed.");
}

const app = new Application();
app.use(logger);

app.use(botRouter.routes());
app.use(botRouter.allowedMethods());
app.use(songsRouter.routes());
app.use(songsRouter.allowedMethods());

app.addEventListener("listen", () => {
  console.log(`Listening on port ${PORT}.`);
});
await app.listen({ port: PORT });
