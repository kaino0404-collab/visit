// 앱 아이콘 및 스플래시 이미지 생성 스크립트
// 실행: node scripts/create-assets.js

const fs = require('fs')
const path = require('path')

// 최소 유효 PNG (1x1 픽셀, 남색 #1e40af)
// 실제 앱에는 proper 이미지를 교체하세요
const PNG_1x1_BLUE = Buffer.from(
  '89504e470d0a1a0a0000000d49484452000000010000000108020000009001' +
  '2e00000000c4944415478016360f8cfc0c0c000000000ffff03001e6003fd' +
  '0000000049454e44ae426082', 'hex'
)

const assetsDir = path.join(__dirname, '..', 'assets')
if (!fs.existsSync(assetsDir)) fs.mkdirSync(assetsDir)

const files = ['icon.png', 'splash.png', 'adaptive-icon.png', 'favicon.png']
for (const f of files) {
  const dest = path.join(assetsDir, f)
  if (!fs.existsSync(dest)) {
    fs.writeFileSync(dest, PNG_1x1_BLUE)
    console.log('생성:', f)
  } else {
    console.log('이미 존재:', f)
  }
}
console.log('\n✅ assets 생성 완료. 실제 앱 아이콘으로 교체하려면 assets/ 폴더의 PNG를 교체하세요.')
