import { assert } from "std/testing/asserts.ts";
import { fetchSongs } from "./fetchSongs.ts";
import { MyContext } from "./bot.ts";

Deno.test(async function songFetching() {
  const spotifyLink =
    "https://open.spotify.com/playlist/37i9dQZF1DX5trt9i14X7j"; // Coding Mode, Playlist by Spotify
  const ctx = { session: { oldSongs: [] } } as unknown as MyContext;
  const songsToDownload = await fetchSongs(spotifyLink, ctx);
  console.log(
    `First 5 songs: \n${
      songsToDownload.slice(0, 5).map((song) => song.name).join("\n")
    }`,
  );
  assert(songsToDownload.length);
});
