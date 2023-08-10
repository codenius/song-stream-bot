# song-stream-bot

Telegram bot, that sends you new songs of a playlist, album, artist, or everythiny else that spotdl can handle.

## Config
Take a long inside `.env.example` and according to this write your own '.env' file. File an issue if you got questions.

## Start
Required dependencies
- deno
- python3
- spotdl
- ffmpeg

```
deno run -A main.ts
```

## Docker
Start the bot with docker:

### build
```
docker build . -t "song-stream-bot"
```
### run
```
docker run -p 8000:8000 --init "song-stream-bot"
```

