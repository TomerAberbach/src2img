# src2img

[![NPM version](https://img.shields.io/npm/v/src2img.svg)](https://www.npmjs.com/package/src2img) [![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)

> Converts source code to high quality images.

## Install

Install with [npm](https://www.npmjs.com):

```sh
$ npm i src2img --save
```

## Usage

```js
const fs = require('fs')
const path = require('path')
const src2img = require('src2img')

const src = 'path/to/sources'
const out = 'path/to/out'

const names = fs.readdirSync(src)

src2img({
  fontSize: 20, // Font size and unit control the size and quality of the image
  fontSizeUnit: 'pt',
  padding: 3,
  paddingUnit: 'vw', // Using 'px' does not scale with font size
  type: 'png', // png or jpeg
  src: names.map(name => [
    fs.readFileSync(path.join(src, name)).toString(),
    'javascript' // https://prismjs.com/index.html#languages-list
    // See https://www.npmjs.com/package/filename2prism for getting alias from filename
  ])
}).then(images => Promise.all(images.map(
  (image, i) => fs.writeFileSync(path.join(out, `${names[i].replace(/\.[^.]+$/g, '')}.png`), image))
))
```

Look at the [CLI package](https://www.npmjs.com/package/src2img-cli) if you'd like to use this from the command line.

## Related

 * [filename2prism](https://www.npmjs.com/package/filename2prism)
 * [src2img-cli](https://www.npmjs.com/package/src2img-cli)

## Contributing

Pull requests and stars are always welcome. For bugs and feature requests, [please create an issue](https://github.com/TomerAberbach/src2img/issues/new).

## Running Tests

Install dev dependencies:

```sh
$ npm i -d && npm test
```

## Author

**Tomer Aberbach**

* [Github](https://github.com/TomerAberbach)
* [NPM](https://www.npmjs.com/~tomeraberbach)
* [LinkedIn](https://www.linkedin.com/in/tomer-a)
* [Website](https://tomeraberba.ch)

## License

Copyright © 2018 [Tomer Aberbach](https://github.com/TomerAberbach)
Released under the [MIT license](https://github.com/TomerAberbach/src2img/blob/master/LICENSE).
