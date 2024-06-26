import { promises as fs } from 'node:fs'
import src2img from './dist/index.js'

const source = await fs.readFile(`./example.js`, `utf8`)

const [image] = await src2img({
  fontSize: 20,
  fontSizeUnit: `pt`,
  padding: 3,
  paddingUnit: `vw`,
  type: `png`,
  srcs: [[source, `javascript`]],
})

try {
  await fs.mkdir(`./out`)
} catch {}
await fs.writeFile(`./out/example.png`, image)
