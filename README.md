# devgotchi

Tiny Bun-powered CLI that prints `hello, brew!`. Shipped via Homebrew.

## Install

```sh
brew install vseplet/tap/devgotchi
```

## Run locally

```sh
bun install
bun start
```

## Build a binary locally

```sh
bun run build
./dist/devgotchi
```

## Release

Push a tag matching `v*` — CI cross-compiles binaries for `darwin-arm64`, `darwin-x64`, `linux-arm64`, `linux-x64`, publishes a GitHub Release with them, and updates the formula in [`vseplet/homebrew-tap`](https://github.com/vseplet/homebrew-tap).

```sh
git tag v0.1.0
git push origin v0.1.0
```
