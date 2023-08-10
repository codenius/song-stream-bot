import { Bot, Context, session, SessionFlavor, webhookCallback } from "grammy";
import {
  type Conversation,
  type ConversationFlavor,
  conversations,
  createConversation,
} from "grammy_conversations";
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
export type MyContext =
  & Context
  & SessionFlavor<SessionData>
  & ConversationFlavor;
type MyConversation = Conversation<MyContext>;

const bot = new Bot<MyContext>(BOT_TOKEN);

function initial(): SessionData {
  return { spotifyLink: "", oldSongs: [] };
}
bot.use(session({ initial, storage: await supabaseSessionStore() }));
bot.use(conversations());

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

bot.command("start", (ctx) => {
  ctx.reply("Hi there!");
});
bot.command("set", async (ctx) => {
  if (ctx.match) ctx.session.spotifyLink = ctx.match;
  else await ctx.conversation.enter("getSpotifyLink");
});
bot.command("link", (ctx) => {
  ctx.reply(
    ctx.session.spotifyLink || "No spotify link stored. Set one with /set.",
  );
});
bot.command("fetch", async (ctx) => {
  if (ctx.session.spotifyLink) {
    await ctx.reply("Fetching new songs...");
    const songsToDownload = await fetchSongs(ctx.session.spotifyLink, ctx);
    if (songsToDownload.length) {
      ctx.reply(`${songsToDownload.length} new songs found. Downloading...`);
      await downloadSongs(songsToDownload);
      ctx.reply("Download completed.");
    } else {
      ctx.reply("No new songs found.");
      return;
    }
    ctx.reply("Sending songs now...");
    await sendSongs(songsToDownload, ctx);
  } else {
    ctx.reply("No spotify link stored. Set one with /set.");
  }
});
bot.command("reset", (ctx) => {
  ctx.session.oldSongs = [];
  ctx.reply(
    "Successfully reset allready sent songs list. A new fetch will re-download all songs.",
  );
});

export const botRouter = new Router({ prefix: "/webhook" });
botRouter.post("/", webhookCallback(bot, "oak", "return"));
