# Interview manager

Transcribe interviews in one click. Made for journalists, by journalists

At the moment IM uses [Rev.ai](https://www.rev.ai/) for transcription -- you can think of it as a user-friendly UI wrapper with a few extra features. You will need to bring your own Rev.ai access token to use the app. The app will guide you through this once you download and run it.

There are plans to switch to [Deepgram](https://deepgram.com/), which should be faster, cheaper and more accurate. The long-shot goal is to figure out a purely on-device transcription model so there is no cost and the app will work completely offline.

## Dev instructions

Setup:
- Install Rust on your computer
- Install packages with `npm i`
- Run dev mode with `npm run tauri dev`

Troubleshooting:
- There are problems with node 20.6.0 related to [this Vite issue](https://github.com/vitejs/vite/issues/14299). 20.7.0 and above should be fine. Run `node --version` to check your node version. Use `nvm` to install the correct version.