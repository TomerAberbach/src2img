<h1 align="center">
  src2img
</h1>

<div align="center">
  <a href="https://npmjs.org/package/src2img">
    <img src="https://badgen.net/npm/v/src2img" alt="version" />
  </a>
  <a href="https://github.com/TomerAberbach/src2img/actions">
    <img src="https://github.com/TomerAberbach/src2img/workflows/CI/badge.svg" alt="CI" />
  </a>
  <a href="https://unpkg.com/src2img/dist/index.js">
    <img src="https://deno.bundlejs.com/?q=src2img&badge" alt="gzip size" />
  </a>
  <a href="https://unpkg.com/src2img/dist/index.js">
    <img src="https://deno.bundlejs.com/?q=src2img&config={%22compression%22:{%22type%22:%22brotli%22}}&badge" alt="brotli size" />
  </a>
</div>

<div align="center">
  Converts source code to high quality images.
</div>

## Install

```sh
$ npm i src2img
```

## Usage

```js
import fs from 'node:fs/promises'
import { join } from 'node:path'
import src2img from 'src2img'

const src = `path/to/sources`
const out = `path/to/out`

const names = await fs.readdir(src)
const srcs = Promise.all(
  names.map(async name => ({
    name,
    src: await fs.readFile(join(src, name), `utf8`),
  })),
)

const images = await src2img({
  // Font size and unit control the size and quality of the image.
  fontSize: 20,
  fontSizeUnit: `pt`,
  padding: 3,
  // Using 'px' does not scale with font size.
  paddingUnit: `vw`,
  // Png or jpeg
  type: `png`,
  src: srcs.map(({ src }) => [
    src,
    // https://prismjs.com/index.html#languages-list
    `javascript`,
    // See https://www.npmjs.com/package/filename2prism for getting alias from
    // filename.
  ]),
})

await Promise.all(
  images.map((image, i) =>
    fs.writeFile(
      join(out, `${srcs[i].name.replaceAll(/\.[^.]+$/gu, ``)}.png`),
      image,
    ),
  ),
)
```

Look at the [CLI package](https://www.npmjs.com/package/src2img-cli) if you'd
like to use this from the command line.

Some rendered code:

![example](example.png)

## Related

- [filename2prism](https://www.npmjs.com/package/filename2prism)
- [src2img-cli](https://www.npmjs.com/package/src2img-cli)
- [prismjs](https://www.npmjs.com/package/prismjs)

## Contributing

Stars are always welcome!

For bugs and feature requests,
[please create an issue](https://github.com/TomerAberbach/src2img/issues/new).

## License

[MIT](https://github.com/TomerAberbach/src2img/blob/main/license) ©
[Tomer Aberbach](https://github.com/TomerAberbach)
