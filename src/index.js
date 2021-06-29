import { join, dirname } from 'path'
import { promises as fs } from 'fs'
import http from 'http'
import { fileURLToPath } from 'url'
import prism from 'prismjs'
import httpShutdown from 'http-shutdown'
import puppeteer from 'puppeteer'
import loadLanguages from 'prismjs/components/index.js'

const currentDir = dirname(fileURLToPath(import.meta.url))

loadLanguages()

const renderer = async ({
  themePath,
  fontFamily,
  fontSize,
  fontSizeUnit = `px`,
  padding = 0,
  paddingUnit = `px`,
  background
}) => {
  themePath = themePath
    ? /^[a-z]+$/u.test(themePath)
      ? join(currentDir, `../themes/prism-${themePath}.css`)
      : themePath
    : join(currentDir, `../themes/prism.css`)

  const style = `${await fs.readFile(themePath, `utf8`)}

     html, body {
       padding: 0;
       margin: 0;
     }

     body {
       overflow: hidden;
     }

     code[class*='language-'] {
       display: inline-block;
       ${fontFamily ? `font-family: '${fontFamily}';` : ``}
       font-size: ${fontSize}${fontSizeUnit};
       white-space: pre;
       padding: ${padding}${paddingUnit};
       margin: 0;
     }

     pre[class*='language-'] {
       padding: 0;
       margin: 0;
     }

     ${
       background
         ? `pre[class*='language-'], code[class*='language-'] {
       background: ${background};
     }`
         : ``
     }`.replace(/^ {5}/mu, ``)

  return (src, lang) =>
    `<html><head><style>${style}</style></head><body><pre class="language-${lang}"><code class="language-${lang}">${prism.highlight(
      src,
      prism.languages[lang],
      lang
    )}</code></pre></body></html>`
}

const startServer = ({ srcs, render, port }) =>
  new Promise((resolve, reject) => {
    const server = httpShutdown(
      http.createServer((req, res) => {
        res.writeHeader(200, { 'Content-Type': `text/html` })
        const item = srcs[parseInt(req.url.split(`?`)[1], 10)]
        res.write(render(item[0], item[1]))
        res.end()
      })
    )

    server.listen(port, err => (err ? reject(err) : resolve(server)))
  })

const screenshot = async ({
  transparent,
  type = `png`,
  srcs,
  render,
  port
}) => {
  const server = await startServer({ srcs, render, port })

  const browser = await puppeteer.launch()
  const page = await browser.newPage()

  const images = []
  for (let i = 0; i < srcs.length; i++) {
    await page.goto(`http://localhost:${port}?${i}`, {
      waitUntil: `domcontentloaded`
    })
    const [width, height] = await page.evaluate(() => {
      const element = document.getElementsByTagName(`code`)[0]
      return [element.offsetWidth, element.offsetHeight]
    })
    await page.setViewport({ width, height })
    const image = await page.screenshot({
      type,
      quality: type === `png` ? undefined : 100,
      omitBackground: transparent,
      fullPage: true
    })
    images.push(image)
  }

  await browser.close()
  await new Promise(resolve => server.shutdown(resolve))

  return images
}

const src2img = async ({
  themePath,
  fontFamily,
  fontSize,
  fontSizeUnit,
  padding,
  paddingUnit,
  background,
  srcs,
  transparent,
  type,
  port = 8888
}) =>
  screenshot({
    transparent,
    type,
    srcs,
    render: await renderer({
      themePath,
      fontFamily,
      fontSize,
      fontSizeUnit,
      padding,
      paddingUnit,
      background: transparent ? `none` : background
    }),
    port
  })

export default src2img
