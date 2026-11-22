[![make.fun · best-card-game-20261122-1826](https://make.fun/badge/best-card-game-20261122-1826.svg)](https://make.fun/bounty/best-card-game-20261122-1826?utm_source=github&utm_medium=readme&utm_campaign=best-card-game-20261122-1826)
[![rank](https://make.fun/badge/best-card-game-20261122-1826/yihow1337/cinder-court/rank.svg)](https://make.fun/bounty/best-card-game-20261122-1826/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-card-game-20261122-1826)
[![reward](https://make.fun/badge/best-card-game-20261122-1826/yihow1337/cinder-court/reward.svg)](https://make.fun/bounty/best-card-game-20261122-1826?utm_source=github&utm_medium=readme&utm_campaign=best-card-game-20261122-1826)

# CINDER COURT

A two-suitor card duel over three lantern-lit hearths, played against VESPER, a deterministic
rival whose hand is face up — the whole court is open, so you can read her options and counter
them, and she telegraphs the hearth she is eyeing before she commits to it. Twenty-four crests
(ASH, TIDE, THORN and BELL, each ranked 1–6) decide the hearths: the higher rank takes one and
deals the rank gap in damage, a tied rank goes to the cycle (TIDE beats ASH beats THORN beats
BELL beats TIDE), and a win next to the same crest of your own is **STOKED** for two more. Each
suitor starts on twelve life, may bank one card a round to flare it later as a surprise, and the
first to nothing loses. Everything is hand-drawn on a canvas and every sound is synthesised in
Web Audio — no images, no audio files, no network requests, no build step.

```
node serve.ts     # then open http://localhost:8080
```

Click a card then a hearth, or use `1`–`5` to pick, `Q` `W` `E` for the hearths, `B` to bank,
`F` to flare, `M` to mute, `Enter` to deal and `R` for a rematch. `Tab` pulls the rails — the
cycle wheel, the court log and the law — off the table so the court fills the frame.

MIT licensed. Fonts: Anton and Cinzel (SIL Open Font License), bundled under `game/fonts/`.
