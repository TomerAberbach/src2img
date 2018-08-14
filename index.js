const path = require('path')
const fs = require('fs')

const prism = require('prismjs')
require('prismjs/components/')()

const http = require('http')
const httpShutdown = require('http-shutdown')
const puppeteer = require('puppeteer')

/**
 * Returns a function which takes a source code string and returns an
 * HTML page string adhering to the options to the original function.
 *
 * Theme will be the default Prism theme by default. If the provided
 * theme path is simply made up lowercase letters without slashes or a file extension
 * then the path will be resolved to the default Prism theme of that name (e.g. 'coy', 'dark', etc.)
 *
 * The theme's font family is not overridden if font family is undefined.
 * Font size unit is 'px' by default.
 * Padding is 0 by default.
 * Padding Unit is 'px' by default.
 * The theme's background is not overridden if background is undefined.
 * @param {{
 *   themePath: string | undefined,
 *   fontFamily: string | undefined,
 *   fontSize: number,
 *   fontSizeUnit: string | undefined,
 *   padding: number | undefined,
 *   paddingUnit: string | undefined,
 *   background: string | undefined
 * }} opts
 * @return {function(src: string, lang: string): string}
 */
const renderer = opts => {
  const themePath = opts.themePath
    ? /^[a-z]+$/.test(opts.themePath)
      ? path.join(__dirname, `themes/prism-${opts.themePath}.css`)
      : opts.themePath
    : path.join(__dirname, 'themes/prism.css')

  const style =
    `${fs.readFileSync(themePath)}

     html, body {
       padding: 0;
       margin: 0;
     }

     body {
       overflow: hidden;
     }

     code[class*='language-'] {
       display: inline-block;
       ${opts.fontFamily ? `font-family: '${opts.fontFamily}';` : ''}
       font-size: ${opts.fontSize}${opts.fontSizeUnit || 'px'};
       white-space: pre;
       padding: ${opts.padding || 0}${opts.paddingUnit || 'px'};
       margin: 0;
     }

     pre[class*='language-'] {
       padding: 0;
       margin: 0;
     }

     ${opts.background ? `code[class*='language-'] {
       background: ${opts.background};  
     }` : ''}`.replace(/^ {5}/m, '')

  return (src, lang) => `<html><head><style>${style}</style></head><body><pre class="language-${lang}"><code class="language-${lang}">${
    prism.highlight(src, prism.languages[lang], lang)
  }</code></pre></body></html>`
}

/**
 * Starts a server at the given port which responds to GET requests with
 * the provided source code rendered by the provided rendering function.
 *
 * The URL should be in the form `localhost:${port}?${index}` where index determines
 * which of the source code in the URL is sent back.
 *
 * The server is returned as a promise and has shutdown functionality.
 * @param {{
 *   render: function(src: string, lang: string): string
 *   src: Array<[string, string]>,
 *   port: number
 * }} opts
 * @return {Promise<http.Server>}
 */
const server = opts => new Promise((resolve, reject) => {
  const server = httpShutdown(http.createServer((req, res) => {
    res.writeHeader(200, {'Content-Type': 'text/html'})
    const item = opts.src[parseInt(req.url.split('?')[1])]
    res.write(opts.render(item[0], item[1]))
    res.end()
  }))

  server.listen(opts.port, err => err ? reject(err) : resolve(server))
})

/**
 * Returns an array of buffers representing the screenshotted source codes as as a promise.
 * @param {{
 *   render: function(src: string, lang: string): string
 *   src: Array<[string, string]>,
 *   transparent: boolean,
 *   type: string | undefined,
 *   port: number
 * }} opts
 * @return {Promise<Array<Buffer>>}
 */
const screenshot = opts => {
  const images = Array(opts.src.length)

  return server(opts).then(server =>
    puppeteer.launch().then(browser =>
      browser.newPage().then(page =>
        (function f (i) {
          if (i < opts.src.length) {
            return page.goto(`http://localhost:${opts.port}?${i}`, {waitUntil: 'domcontentloaded'})
              .then(() => page.evaluate(() => {
                const element = document.getElementsByTagName('code')[0]
                return [element.offsetWidth, element.offsetHeight]
              }))
              .then(([width, height]) => page.setViewport({width, height}))
              .then(() => page.screenshot({
                type: opts.type || 'png',
                quality: (opts.type || 'png') === 'png' ? undefined : 100,
                omitBackground: opts.transparent,
                fullPage: true
              }))
              .then(image => {
                images[i] = image
                return f(i + 1)
              })
          }
        })(0)
      ).then(() => browser.close())
    ).then(() => new Promise(resolve => server.shutdown(resolve)))
  ).then(() => images)
}

/**
 * Returns an array of buffers representing the screenshotted source codes as as a promise.
 * If transparent is true then the value of background will not matter.
 * @param {{
 *   themePath: string | undefined,
 *   fontFamily: string | undefined,
 *   fontSize: number,
 *   fontSizeUnit: string | undefined,
 *   padding: number | undefined,
 *   paddingUnit: string | undefined,
 *   background: string | undefined,
 *   src: Array<[string, string]>,
 *   transparent: boolean | undefined,
 *   type: string | undefined,
 *   port: number | undefined
 * }} opts
 * @return {Promise<Array<Buffer>>}
 */
module.exports = opts => {
  const o = Object.assign({render: renderer(opts)}, opts)

  if (o.transparent) {
    o.background = 'transparent'
  }

  if (!o.port) {
    o.port = 8888
  }

  return screenshot(o)
}
