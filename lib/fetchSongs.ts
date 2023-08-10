import type { Song } from "./Song.ts";
import type { MyContext } from "./bot.ts";

export async function fetchSongs(spotifyLink: string, ctx: MyContext) {
  const tmpsave = "tmpsave.spotdl";
  console.log("Fetching started...");
  const cmd = new Deno.Command("spotdl", {
    args: ["save", spotifyLink, "--save-file", tmpsave],
  });
  const output = new TextDecoder().decode((await cmd.output()).stdout);
  console.log(output);
  console.log("Fetching completed.");

  const songsUncompressed: (Song & { list_position: number })[] = JSON.parse(
    await Deno.readTextFile(tmpsave),
  );
  songsUncompressed.sort((a, b) => a.list_position - b.list_position);
  const newSongs: Song[] = compressSongs(songsUncompressed);
  const oldSongs = ctx.session.oldSongs;

  const songsToDownload: Song[] = [];
  for (const newSong of newSongs) {
    if (!oldSongs.find((oldSong) => oldSong.url == newSong.url)) {
      songsToDownload.push(newSong);
    }
  }
  ctx.session.oldSongs = newSongs;

  return songsToDownload;
}

function compressSongs(songs: Song[]) {
  return songs.map(({ name, url }) => ({ name, url }));
}
