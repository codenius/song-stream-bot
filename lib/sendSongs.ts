import { CommandContext, InputFile } from "grammy";
import { Router } from "oak";
import { MyContext } from "./bot.ts";
import { Song } from "./Song.ts";

const SERVER_URL = Deno.env.get("SERVER_URL");
const PERSIST_SONG_FILES = Deno.env.get("PERSIST_SONG_FILES") == "true" ||
  false;
const DIR = `${Deno.cwd()}/songs/`;

export async function sendSongs(
  songsToSend: Song[],
  ctx: CommandContext<MyContext>,
) {
  for await (const { isFile, name } of Deno.readDir(DIR)) {
    const songToSend = songsToSend.find((songToSend) =>
      name.includes(songToSend.name)
    );
    if (
      isFile && songToSend
    ) {
      const filePath = `${DIR}${name}`;
      const fileUrl = `${SERVER_URL}songs/${name}`;
      const encoded = encodeURI(fileUrl);
      console.log("Sending", PERSIST_SONG_FILES ? encoded : name);
      const response = await ctx.replyWithAudio(new InputFile(filePath));
      if (response.message_id && response.audio) {
        await Deno.remove(filePath);
      }
    }
  }
}

export const songsRouter = new Router({ prefix: "/songs" });
if (PERSIST_SONG_FILES) {
  songsRouter.get("/:name", async (ctx, next) => {
    try {
      await ctx.send({
        root: DIR,
        path: ctx.params.name,
      });
    } catch {
      await next();
    }
  });
}
