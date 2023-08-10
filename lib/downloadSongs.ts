import { Song } from "./Song.ts";

export async function downloadSongs(spotifyLink: string | Song[]) {
  if (!spotifyLink) return;
  let linkArray: string[] = [];
  if (Array.isArray(spotifyLink)) {
    linkArray = spotifyLink.map((song) => song.url);
  } else {
    linkArray.push(spotifyLink);
  }
  console.log("Download started...");
  const cmd = new Deno.Command("spotdl", {
    args: ["download", ...linkArray],
    cwd: "songs",
  });
  const output = new TextDecoder().decode((await cmd.output()).stdout);
  console.log(output);
  console.log("Download completed.");
  return output;
}
