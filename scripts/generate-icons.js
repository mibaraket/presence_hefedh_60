import fs from 'fs';
import zlib from 'zlib';

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    const byte = buf[i];
    crc = crc ^ byte;
    for (let j = 0; j < 8; j++) {
      crc = (crc >>> 1) ^ (-(crc & 1) & 0xedb88320);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function makeChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const crcBuf = Buffer.alloc(4);
  const toCrc = Buffer.concat([typeBuf, data]);
  crcBuf.writeUInt32BE(crc32(toCrc), 0);
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

function createPng(size, maskable = false) {
  const width = size;
  const height = size;

  // IHDR data
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // 8 bits per channel
  ihdr[9] = 6; // RGBA
  ihdr[10] = 0; // deflate
  ihdr[11] = 0; // standard filter
  ihdr[12] = 0; // non-interlaced

  // Uncompressed scanlines
  // Each row: 1 byte filter (0) + width * 4 bytes RGBA
  const rowLength = 1 + width * 4;
  const rawData = Buffer.alloc(rowLength * height);

  const cx = width / 2;
  const cy = height / 2;
  const rCircle = width * 0.42;
  const rBook = width * 0.22;

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowLength;
    rawData[rowOffset] = 0; // Filter: None
    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + 1 + x * 4;
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Base background
      let r = 6, g = 78, b = 59, a = 255; // #064e3b

      // Inner circle
      if (dist <= rCircle) {
        if (Math.abs(dist - rCircle) < (width * 0.015)) {
          // Emerald ring
          r = 16; g = 185; b = 129;
        } else {
          // Dark background #022c22
          r = 2; g = 44; b = 34;
        }
      }

      // Quran Book Icon approximation (two curved pages)
      const nx = (x - cx) / rBook;
      const ny = (y - cy) / rBook;

      if (ny >= -0.7 && ny <= 0.7) {
        // Spine in middle
        if (Math.abs(nx) < 0.8) {
          const pageDist = Math.abs(ny) - (0.6 - Math.abs(nx) * 0.2);
          if (pageDist < 0.1 && pageDist > -0.5) {
            // Book page lines in #34d399
            r = 52; g = 211; b = 153;
          }
        }
      }

      rawData[pxOffset] = r;
      rawData[pxOffset + 1] = g;
      rawData[pxOffset + 2] = b;
      rawData[pxOffset + 3] = a;
    }
  }

  const compressedData = zlib.deflateSync(rawData);

  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdrChunk = makeChunk('IHDR', ihdr);
  const idatChunk = makeChunk('IDAT', compressedData);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

// Generate icons
fs.writeFileSync('public/icon-192.png', createPng(192));
fs.writeFileSync('public/icon-512.png', createPng(512));
fs.writeFileSync('public/icon-maskable-512.png', createPng(512, true));
fs.writeFileSync('public/apple-touch-icon.png', createPng(180));
console.log('PNG Icons generated successfully!');
