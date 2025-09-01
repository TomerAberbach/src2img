import { dirname, join } from 'node:path'
import { promises as fs } from 'node:fs'
import http from 'node:http'
import { fileURLToPath } from 'node:url'
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
  background,
}: Pick<
  Options,
  | `themePath`
  | `fontFamily`
  | `fontSize`
  | `fontSizeUnit`
  | `padding`
  | `paddingUnit`
  | `background`
>) => {
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

  return (src: string, lang: string) =>
    `<html><head><style>${style}</style></head><body><pre class="language-${lang}"><code class="language-${lang}">${prism.highlight(
      src,
      prism.languages[lang]!,
      lang,
    )}</code></pre></body></html>`
}

const startServer = ({
  srcs,
  port,
  render,
}: Pick<Options, `srcs` | `port`> & {
  render: (src: string, lang: string) => string
}): Promise<ReturnType<typeof httpShutdown>> =>
  new Promise(resolve => {
    const server = httpShutdown(
      http.createServer((req, res) => {
        const index = parseInt(req.url!.split(`?`)[1] ?? ``, 10)
        if (isNaN(index)) {
          res.writeHead(404).end()
          return
        }

        const [src, lang] = srcs[index]!
        res
          .writeHead(200, { 'Content-Type': `text/html` })
          .write(render(src, lang))
        res.end()
      }),
    )

    server.listen(port, () => resolve(server))
  })

const screenshot = async ({
  transparent,
  type = `png`,
  srcs,
  render,
  port,
}: Pick<Options, `transparent` | `type` | `srcs` | `port`> & {
  render: (src: string, lang: string) => string
}) => {
  const server = await startServer({ srcs, render, port })

  const browser = await puppeteer.launch()
  const page = await browser.newPage()

  const images = []
  for (let i = 0; i < srcs.length; i++) {
    await page.goto(`http://localhost:${port}?${i}`, {
      waitUntil: `domcontentloaded`,
    })
    const [width, height] = await page.evaluate(() => {
      const element = document.getElementsByTagName(`code`)[0]!
      return [element.offsetWidth, element.offsetHeight] as const
    })
    await page.setViewport({ width, height })
    const image = await page.screenshot({
      type,
      quality: type === `png` ? undefined : 100,
      omitBackground: transparent,
      fullPage: true,
    })
    images.push(image)
  }

  await browser.close()
  await new Promise(resolve => {
    server.shutdown(resolve)
  })

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
  port = 8888,
}: Options): Promise<Buffer[]> =>
  (
    await screenshot({
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
        background: transparent ? `none` : background,
      }),
      port,
    })
  ).map(array => Buffer.from(array))

export type Options = Readonly<{
  themePath?: string
  fontFamily?: string
  fontSize: number
  fontSizeUnit?: string
  padding?: number
  paddingUnit: string
  background?: string
  srcs: readonly [string, string][]
  transparent?: boolean
  type?: `png` | `jpeg`
  port?: number
}>

export default src2img
