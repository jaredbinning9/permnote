import sharp from "sharp";

const svg = `
<svg width="512" height="512" xmlns="http://www.w3.org/2000/svg">
  <rect width="512" height="512" rx="96" fill="#27272a"/>
  <rect x="8" y="8" width="496" height="496" rx="90" fill="none"
        stroke="#3f3f461a" stroke-width="6"/>
  <text x="232" y="264" font-family="Arial, Helvetica, sans-serif" font-size="330"
        font-weight="normal" fill="#e4e4e7" text-anchor="middle"
        dominant-baseline="central">P</text>
  <rect x="352" y="360" width="84" height="24" rx="6" fill="#71717ade"/>
</svg>`;

const buf = Buffer.from(svg);
await sharp(buf).resize(512, 512).png().toFile("public/icon-512.png");
await sharp(buf).resize(192, 192).png().toFile("public/icon-192.png");
console.log("icons written to public/");