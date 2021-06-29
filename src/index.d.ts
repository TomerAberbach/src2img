export type Options = {
  themePath?: string
  fontFamily?: string
  fontSize: number
  fontSizeUnit?: string
  padding?: number
  paddingUnit: string
  background?: string
  srcs: ReadonlyArray<string>
  transparent?: boolean
  type?: 'png' | 'jpeg'
  port?: number
}

declare const src2img: (options: Options) => Promise<Array<Buffer>>

export default src2img
