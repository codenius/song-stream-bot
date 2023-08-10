import { Song } from "./Song.ts";
const songsFolder = "songs";

export async function downloadSongs(spotifyLink: string | Song[]) {
  if (!spotifyLink) return;
  let linkArray: string[] = [];
  if (Array.isArray(spotifyLink)) {
    linkArray = spotifyLink.map((song) => song.url);
  } else {
    linkArray.push(spotifyLink);
  }
  console.log("Download started...");
  await makeSongsDir(songsFolder);
  const cmd = new Deno.Command("spotdl", {
    args: ["download", ...linkArray],
    cwd: songsFolder,
  });
  const output = new TextDecoder().decode((await cmd.output()).stdout);
  console.log(output);
  console.log("Download completed.");
  return output;
}

async function makeSongsDir(songsFolder: string) {
  try {
    await Deno.stat(songsFolder);
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) {
      await Deno.mkdir(songsFolder, { recursive: true });
    } else {
      throw error;
    }
  }
}
