export interface GrayOptions {
  /** The pages to make gray, 1-based: [2, 3, 4] or "2-4,8". All by default; the others stay exactly as they are. */
  pages?: number[] | string;
  /** Only text and drawings ("drawings": photos keep their colour), or only pictures ("images"). */
  only?: "drawings" | "images";
  /** For photos that have to be re-compressed (most JPEGs are made gray without it). Default 90. */
  jpegQuality?: number;
  /** Stops the conversion. */
  signal?: AbortSignal;
}

export interface GrayResult {
  ok: boolean;
  /** When not ok: "unreadable", "password", "pages" or "write". */
  error?: string;
  /** Pages in the document. */
  pages: number;
  /** Pages made gray. */
  converted: number;
  /** Colour operators rewritten. */
  colours: number;
  /** Pictures made gray. */
  images: number;
  /** Of those, JPEGs made gray without re-compressing them. */
  jpegLossless: number;
  /** Gradients made gray. */
  shadings: number;
  inlineImages: number;
  /** Spot-ink colours made gray. */
  spots: number;
  /** What couldn't be converted and still has colour. */
  imagesKept: number;
  shadingsKept: number;
  inlineKept: number;
  contentKept: number;
  /** Made gray through a colour space that draws them gray, their data left as it was. */
  wrapped: number;
  /** Signed signature fields: rewriting the file invalidates them. */
  signatures: number;
}

export interface GrayError extends Error {
  /** "unreadable", "password", "pages", "write", "options" or "failed". */
  code: string;
  result?: GrayResult;
}

/**
 * Makes input gray and writes output. Rejects with a GrayError when the file can't be read, needs
 * a password, doesn't have the pages asked for, or can't be written.
 */
export function toGray(input: string, output: string, options?: GrayOptions): Promise<GrayResult>;

/** The command line's path for this platform (or FYNEPDF_GRAYSCALE_BINARY). */
export function binaryPath(): string;
