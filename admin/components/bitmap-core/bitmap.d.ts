import type { ComponentPropsWithoutRef } from 'react'

/**
 * The raster settings the three bitmap components share. They all run the same
 * engine — only the source differs — so the knobs below mean the same thing in
 * each, and are declared once here rather than three times.
 */
export type DitherKernel =
  | 'bayer2'
  | 'bayer4'
  | 'bayer8'
  | 'bayer16'
  | 'floyd'
  | 'atkinson'
  | 'jarvis'
  | 'none'

export interface BitmapFieldProps extends ComponentPropsWithoutRef<'div'> {
  /** Pixels per cell. Smaller is finer and costs more per frame. */
  cell?: number
  /** Tone steps. 2 is one-bit; higher posterises. */
  levels?: number
  /** What turns tone into dots: `bayer2` to `bayer16` are fixed patterns that hold still, `floyd`, `atkinson` and `jarvis` diffuse the error and follow the picture more closely but can crawl as it changes, `none` just posterises. */
  dither?: DitherKernel
  /** 0 passes the tone through untouched, 1 applies the kernel in full. */
  ditherAmount?: number
  /** Alternate scan direction. Error-diffusion kernels only. */
  serpentine?: boolean
  /** Stretch of the tones around mid-grey before dithering. 1 leaves them alone, above 1 is harder, below 1 is flatter. */
  contrast?: number
  /** Added to every tone before dithering. 0 leaves them alone. */
  brightness?: number
  /** Swaps lit and unlit cells. */
  invert?: boolean
  /** Flow-field shear, in cells. */
  warp?: number

  /** Reach of the pointer's influence, in px. */
  cursorRadius?: number
  /** Outward push at the centre of that reach, in px. */
  cursorStrength?: number
  /** Luminance added at the centre of that reach. */
  cursorLift?: number

  /** Colour of the lit cells. */
  color?: string
  /** `null` renders transparent. */
  background?: string | null

  /** Stops the frame loop without unmounting. */
  paused?: boolean
  /** Maximum redraws per second (the field still drifts at the same speed). */
  fps?: number
  /** Honour `prefers-reduced-motion`, and keep honouring it if it changes. */
  respectReducedMotion?: boolean
  /** Position the field to the viewport rather than its container. */
  fullscreen?: boolean
}
