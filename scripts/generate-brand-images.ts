import fs from 'node:fs'
import path from 'node:path'
import zlib from 'node:zlib'

// Tabela de CRC32 pré-calculada
const crcTable = new Uint32Array(256)
for (let i = 0; i < 256; i++) {
  let c = i
  for (let k = 0; k < 8; k++) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
  }
  crcTable[i] = c
}

function crc32(buf: Buffer): number {
  let c = 0xffffffff
  for (let i = 0; i < buf.length; i++) {
    c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8)
  }
  return (c ^ 0xffffffff) >>> 0
}

function makeChunk(type: string, data: Buffer): Buffer {
  const len = data.length
  const typeBuf = Buffer.from(type, 'ascii')
  const toCrc = Buffer.concat([typeBuf, data])
  const crcVal = crc32(toCrc)

  const chunk = Buffer.alloc(4 + 4 + len + 4)
  chunk.writeUInt32BE(len, 0)
  typeBuf.copy(chunk, 4)
  data.copy(chunk, 8)
  chunk.writeUInt32BE(crcVal, 8 + len)
  return chunk
}

export function createPngRgba(
  width: number,
  height: number,
  getPixel: (x: number, y: number) => [number, number, number, number],
): Buffer {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])

  // IHDR: 13 bytes
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(width, 0)
  ihdr.writeUInt32BE(height, 4)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 6 // color type 6: RGBA
  ihdr[10] = 0 // compression
  ihdr[11] = 0 // filter
  ihdr[12] = 0 // interlace
  const ihdrChunk = makeChunk('IHDR', ihdr)

  // Raw image data with filter byte (0) per row
  const rowStride = 1 + width * 4
  const rawData = Buffer.alloc(height * rowStride)

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowStride
    rawData[rowOffset] = 0 // No filter
    for (let x = 0; x < width; x++) {
      const [r, g, b, a] = getPixel(x, y)
      const pxOffset = rowOffset + 1 + x * 4
      rawData[pxOffset] = r
      rawData[pxOffset + 1] = g
      rawData[pxOffset + 2] = b
      rawData[pxOffset + 3] = a
    }
  }

  const deflated = zlib.deflateSync(rawData, { level: 9 })
  const idatChunk = makeChunk('IDAT', deflated)
  const iendChunk = makeChunk('IEND', Buffer.alloc(0))

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk])
}

// Fonte bitmap simples 5x7 para renderizar "VIVAVAREJO"
const FONT_5X7: Record<string, number[]> = {
  ' ': [0, 0, 0, 0, 0, 0, 0],
  A: [0x0e, 0x11, 0x11, 0x1f, 0x11, 0x11, 0x11],
  E: [0x1f, 0x10, 0x10, 0x1e, 0x10, 0x10, 0x1f],
  I: [0x0e, 0x04, 0x04, 0x04, 0x04, 0x04, 0x0e],
  J: [0x07, 0x02, 0x02, 0x02, 0x02, 0x12, 0x0c],
  O: [0x0e, 0x11, 0x11, 0x11, 0x11, 0x11, 0x0e],
  R: [0x1e, 0x11, 0x11, 0x1e, 0x14, 0x12, 0x11],
  V: [0x11, 0x11, 0x11, 0x11, 0x11, 0x0a, 0x04],
}

export function drawBrandLogo(): Buffer {
  const width = 1200
  const height = 630

  // Cores:
  // Fundo branco #FFFFFF
  // Azul VivaVarejo #2563EB (RGB: 37, 99, 235)
  // Texto escuro #1F2937 (RGB: 31, 41, 55)
  // Texto cinza #4B5563 (RGB: 75, 85, 99)

  // Criamos uma imagem com um card elegante e central:
  // - Ícone azul de losango VivaVarejo à esquerda
  // - Texto VIVAVAREJO ao lado com escala grande
  // - Linha sutil de apoio

  const scale = 14
  const text = 'VIVAVAREJO'
  const letterSpacing = 2 * scale
  const charWidth = 5 * scale
  const totalTextWidth = text.length * charWidth + (text.length - 1) * letterSpacing

  // Símbolo do losango
  const iconSize = 180
  const iconX = 140
  const iconY = Math.round((height - iconSize) / 2)

  const textStartX = iconX + iconSize + 80
  const textStartY = Math.round((height - 7 * scale) / 2)

  return createPngRgba(width, height, (x, y) => {
    // 1. Fundo limpo
    let r = 247,
      g = 247,
      b = 245,
      a = 255 // Fundo sutil #F7F7F5

    // Card interno branco
    if (x >= 40 && x < width - 40 && y >= 40 && y < height - 40) {
      r = 255
      g = 255
      b = 255
    }

    // Borda do card
    if (
      (x >= 40 && x < width - 40 && (y === 40 || y === height - 41)) ||
      (y >= 40 && y < height - 40 && (x === 40 || x === width - 41))
    ) {
      r = 229
      g = 231
      b = 235 // #E5E7EB
    }

    // 2. Ícone azul com cantos arredondados
    if (x >= iconX && x < iconX + iconSize && y >= iconY && y < iconY + iconSize) {
      const rx = 36
      const dx = Math.min(x - iconX, iconX + iconSize - 1 - x)
      const dy = Math.min(y - iconY, iconY + iconSize - 1 - y)
      let insideBox = true
      if (dx < rx && dy < rx) {
        const dist = Math.hypot(rx - dx, rx - dy)
        if (dist > rx) insideBox = false
      }

      if (insideBox) {
        // Cor base azul VivaVarejo #2563EB
        r = 37
        g = 99
        b = 235

        // Desenhar losango branco girado 45° no centro do ícone
        const cx = iconX + iconSize / 2
        const cy = iconY + iconSize / 2
        // Rotação 45 graus: u = (dx + dy)/sqrt(2), v = (dy - dx)/sqrt(2)
        const relX = x - cx
        const relY = y - cy
        const rotX = Math.abs((relX + relY) * 0.7071)
        const rotY = Math.abs((relY - relX) * 0.7071)

        const diamondHalf = 38
        const diamondBorder = 10
        const isBorder =
          rotX <= diamondHalf &&
          rotY <= diamondHalf &&
          (rotX >= diamondHalf - diamondBorder || rotY >= diamondHalf - diamondBorder)
        const isCenterDot = Math.hypot(relX, relY) <= 10

        if (isBorder || isCenterDot) {
          r = 255
          g = 255
          b = 255
        }
      }
    }

    // 3. Renderizar texto "VIVAVAREJO"
    if (y >= textStartY && y < textStartY + 7 * scale) {
      const row = Math.floor((y - textStartY) / scale)
      const relX = x - textStartX
      if (relX >= 0 && relX < totalTextWidth) {
        const step = charWidth + letterSpacing
        const charIdx = Math.floor(relX / step)
        const inCharX = relX % step
        if (charIdx < text.length && inCharX < charWidth) {
          const col = Math.floor(inCharX / scale)
          const ch = text[charIdx]
          const bitmap = FONT_5X7[ch]
          if (bitmap) {
            const bitRow = bitmap[row]
            const bit = (bitRow >> (4 - col)) & 1
            if (bit === 1) {
              // #1F2937 escuro forte
              r = 31
              g = 41
              b = 55
            }
          }
        }
      }
    }

    // 4. Faixa azul sutil na base do card
    if (x >= 40 && x < width - 40 && y >= height - 48 && y < height - 40) {
      r = 37
      g = 99
      b = 235
    }

    return [r, g, b, a]
  })
}

// Salva nos arquivos do public
const outDir = path.resolve(process.cwd(), 'public')
const pngBuffer = drawBrandLogo()

fs.writeFileSync(path.join(outDir, 'og-image.png'), pngBuffer)
fs.writeFileSync(path.join(outDir, 'logo.png'), pngBuffer)

console.log('Arquivos public/og-image.png e public/logo.png gerados com sucesso!')
