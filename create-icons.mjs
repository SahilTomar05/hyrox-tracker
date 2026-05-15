import sharp from 'sharp'

const svg = Buffer.from(`<svg width="512" height="512" xmlns="http://www.w3.org/2000/svg">
  <rect width="512" height="512" rx="80" fill="#00E5A0"/>
  <text x="256" y="320" font-family="Arial" font-weight="bold" font-size="280" text-anchor="middle" fill="black">1F</text>
</svg>`)

await sharp(svg).resize(192, 192).png().toFile('public/icon-192.png')
await sharp(svg).resize(512, 512).png().toFile('public/icon-512.png')
console.log('Icons created!')