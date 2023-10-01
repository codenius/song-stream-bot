import { Bot, Context, session, SessionFlavor, webhookCallback } from "grammy";
import {
  type Conversation,
  type ConversationFlavor,
  conversations,
  createConversation,
} from "grammy_conversations";
import { hydrate, HydrateFlavor } from "@grammyjs/hydrate";
import { downloadSongs } from "./downloadSongs.ts";
import { sendSongs } from "./sendSongs.ts";
import { Router } from "oak";
import { fetchSongs } from "./fetchSongs.ts";
import { supabaseSessionStore } from "./supabaseSessionStore.ts";
import { Song } from "./Song.ts";

const BOT_TOKEN = Deno.env.get("BOT_TOKEN");
if (!BOT_TOKEN) {
  console.error("Envouirment varibale 'BOT_TOKEN' contains no bot token.");
  Deno.exit(1);
}

interface SessionData {
  spotifyLink: string;
  oldSongs: Song[];
}
export type MyContext = Context &
  SessionFlavor<SessionData> &
  ConversationFlavor &
  HydrateFlavor<Context>;
type MyConversation = Conversation<MyContext>;

const bot = new Bot<MyContext>(BOT_TOKEN);

function initial(): SessionData {
  return { spotifyLink: "", oldSongs: [] };
}
bot.use(session({ initial, storage: await supabaseSessionStore() }));
bot.use(conversations());
bot.use(hydrate());

async function getSpotifyLink(conversation: MyConversation, ctx: MyContext) {
  await ctx.reply("Send a spotify link to watch!");
  const { message } = await conversation.waitFor("::url");
  conversation.session.spotifyLink = message?.text as string;
  await ctx.reply(`Thanks!`);
}
bot.use(createConversation(getSpotifyLink));

await bot.api.setMyCommands([
  { command: "start", description: "Start the bot" },
  { command: "set", description: "Send a spotify link" },
  { command: "link", description: "Get currently set spotify link" },
  { command: "fetch", description: "Manually fetch new songs" },
  { command: "reset", description: "Resets allready send songs list" },
]);

async function createStatusMessage(ctx: MyContext, initialStatus: string) {
  const statusMessage = await ctx.reply(initialStatus);

  async function setStatus(status: string) {
    await statusMessage.editText(status);
  }

  async function deleteStatus() {
    await statusMessage.delete();
  }

  return [setStatus, deleteStatus];
}

bot.command("start", (ctx) => {
  ctx.reply("Hi there!");
});
bot.command("set", async (ctx) => {
  await ctx.conversation.enter("getSpotifyLink");
});
bot.command("link", (ctx) => {
  ctx.reply(
    ctx.session.spotifyLink || "No spotify link stored. Set one with /set."
  );
});
bot.command("fetch", async (ctx) => {
  const [setStatus, deleteStatus] = await createStatusMessage(
    ctx,
    "Fetch triggered."
  );

  if (ctx.session.spotifyLink) {
    await setStatus("Fetching new songs...");
    const songsToDownload = await fetchSongs(ctx.session.spotifyLink, ctx);
    if (songsToDownload.length) {
      await setStatus(
        `${songsToDownload.length} new songs found. Downloading...`
      );
      await downloadSongs(songsToDownload);
      await setStatus("Sending songs now...");
      await sendSongs(songsToDownload, ctx);
      await setStatus("Done.");
    } else {
      await setStatus("No new songs found.");
    }
  } else {
    await setStatus("No spotify link stored. Set one with /set.");
  }
  setTimeout(
    () =>
      deleteStatus().catch((e) => {
        console.error(e);
      }),
    5000
  );
});
bot.command("reset", (ctx) => {
  ctx.session.oldSongs = [];
  ctx.reply(
    "Successfully reset allready sent songs list. A new fetch will re-download all songs."
  );
});

export const botRouter = new Router({ prefix: "/webhook" });
botRouter.post("/", webhookCallback(bot, "oak", "return"));
