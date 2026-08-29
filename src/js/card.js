// 生成毒鸡汤分享卡片图（Canvas）
import { CATEGORIES } from '../data/quotes.js'
import { isNative } from './native.js'

const CARD_W = 1080
const CARD_H = 1440

export function cardToBlob(quote, theme) {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas')
    canvas.width = CARD_W
    canvas.height = CARD_H
    const ctx = canvas.getContext('2d')

    drawBackground(ctx, theme)
    drawHeader(ctx)
    drawQuote(ctx, quote, theme)
    drawFooter(ctx)

    canvas.toBlob((blob) => resolve(blob), 'image/png')
  })
}

function drawBackground(ctx, theme) {
  const palettes = {
    dark: ['#1a1a24', '#2b2140', '#14141c'],
    midnight: ['#141426', '#1e1b3a', '#101020'],
    sunset: ['#2a1620', '#3a1220', '#1c1014'],
    forest: ['#0f1c15', '#123324', '#0c1410'],
    light: ['#fff5f6', '#ffe9ec', '#ffffff']
  }
  const pal = palettes[theme] || palettes.dark

  const g = ctx.createLinearGradient(0, 0, CARD_W, CARD_H)
  g.addColorStop(0, pal[0])
  g.addColorStop(0.5, pal[1])
  g.addColorStop(1, pal[2])
  ctx.fillStyle = g
  ctx.fillRect(0, 0, CARD_W, CARD_H)

  // 装饰圆点
  const dots = [
    [120, 180, 90, 'rgba(255,107,129,0.12)'],
    [940, 260, 60, 'rgba(255,217,61,0.10)'],
    [200, 1240, 120, 'rgba(139,92,246,0.10)'],
    [920, 1180, 70, 'rgba(52,211,153,0.10)']
  ]
  dots.forEach(([x, y, r, c]) => {
    ctx.beginPath()
    ctx.arc(x, y, r, 0, Math.PI * 2)
    ctx.fillStyle = c
    ctx.fill()
  })
}

function drawHeader(ctx) {
  ctx.save()
  ctx.textAlign = 'center'
  ctx.fillStyle = '#ffffff'
  ctx.font = '600 40px system-ui, sans-serif'
  ctx.fillText('🍋 每日毒鸡汤', CARD_W / 2, 150)
  ctx.fillStyle = 'rgba(255,255,255,0.45)'
  ctx.font = '500 26px system-ui, sans-serif'
  ctx.fillText('DAILY SOUR QUOTES', CARD_W / 2, 200)
  ctx.restore()
}

function wrapText(ctx, text, maxWidth) {
  const chars = text.split('')
  const lines = []
  let line = ''
  for (const ch of chars) {
    const test = line + ch
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line)
      line = ch
    } else {
      line = test
    }
  }
  if (line) lines.push(line)
  return lines
}

function drawQuote(ctx, quote, theme) {
  const isLight = theme === 'light'
  const cat = CATEGORIES.find((c) => c.id === quote.cat) || CATEGORIES[0]

  ctx.save()
  ctx.textAlign = 'center'

  // 分类 emoji
  ctx.font = '110px system-ui, sans-serif'
  ctx.fillText(cat.emoji, CARD_W / 2, 520)

  // 引号装饰
  ctx.fillStyle = 'rgba(255,255,255,0.16)'
  ctx.font = '160px serif'
  ctx.fillText('“', 120, 700)

  // 语录正文
  const lineColor = isLight ? '#1c1c22' : '#ffffff'
  ctx.fillStyle = lineColor
  ctx.font = '700 64px system-ui, "PingFang SC", "Noto Sans SC", sans-serif'
  const lines = wrapText(ctx, quote.text, 860)
  const lineHeight = 105
  const startY = 820

  // 双行或多行从中间展开
  const totalH = lines.length * lineHeight
  let y = startY + (totalH - lineHeight * lines.length) / 2 + lineHeight / 2
  lines.forEach((line) => {
    ctx.fillText(line, CARD_W / 2, y)
    y += lineHeight
  })

  // 标签
  const tagColors = {
    '扎心': '#ff6b81', '真相': '#a78bfa', '哲理': '#4ade80',
    '单身': '#60a5fa', '金钱': '#fbbf24', '安慰': '#34d399'
  }
  const tagColor = tagColors[quote.tag] || '#ff6b81'
  const tagY = startY + (lines.length > 1 ? lines.length * lineHeight + 40 : 190)
  const tagText = `# ${quote.tag}`
  ctx.font = '600 34px system-ui, sans-serif'
  const tw = ctx.measureText(tagText).width + 56
  ctx.beginPath()
  ctx.roundRect(CARD_W / 2 - tw / 2, tagY - 52, tw, 72, 36)
  ctx.fillStyle = tagColor
  ctx.globalAlpha = 0.92
  ctx.fill()
  ctx.globalAlpha = 1
  ctx.fillStyle = '#ffffff'
  ctx.fillText(tagText, CARD_W / 2, tagY)

  ctx.restore()
}

function drawFooter(ctx) {
  ctx.save()
  ctx.textAlign = 'center'
  ctx.fillStyle = 'rgba(255,255,255,0.38)'
  ctx.font = '28px system-ui, sans-serif'
  ctx.fillText('— 每天一句扎心语录，笑着活下去 —', CARD_W / 2, 1240)
  ctx.fillStyle = 'rgba(255,255,255,0.25)'
  ctx.font = '24px system-ui, sans-serif'
  ctx.fillText('每日毒鸡汤 · 开源 App · 完全免费', CARD_W / 2, 1300)
  ctx.restore()
}

// Canvas roundRect polyfill for older webviews
if (!CanvasRenderingContext2D.prototype.roundRect) {
  CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, r) {
    const radii = [r, r, r, r]
    this.moveTo(x + radii[0], y)
    this.lineTo(x + w - radii[1], y)
    this.quadraticCurveTo(x + w, y, x + w, y + radii[1])
    this.lineTo(x + w, y + h - radii[2])
    this.quadraticCurveTo(x + w, y + h, x + w - radii[2], y + h)
    this.lineTo(x + radii[3], y + h)
    this.quadraticCurveTo(x, y + h, x, y + h - radii[3])
    this.lineTo(x, y + radii[0])
    this.quadraticCurveTo(x, y, x + radii[0], y)
    this.closePath()
    return this
  }
}

export function blobToDataUrl(blob) {
  return new Promise((resolve) => {
    const r = new FileReader()
    r.onload = () => resolve(r.result)
    r.readAsDataURL(blob)
  })
}

export function saveBlob(blob, filename) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 2000)
}
