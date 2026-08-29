import '../css/style.css'
import { QUOTES, CATEGORIES, TAG_COLORS, getDailyQuote } from '../data/quotes.js'
import {
  isNative,
  copyText,
  shareText,
  shareFile,
  hapticTap,
  hapticSuccess,
  hapticFail,
  requestNotificationPermission,
  scheduleDailyNotification,
  cancelDailyNotification,
  speakText,
  stopSpeaking
} from './native.js'
import { cardToBlob, saveBlob } from './card.js'

const $ = (sel) => document.querySelector(sel)

const state = {
  cat: 'all',
  history: [],
  favs: loadFavs(),
  current: null,
  dailyQuote: null,
  theme: localStorage.getItem('sour_theme') || 'dark',
  notifyEnabled: localStorage.getItem('sour_notify') === '1',
  notifyTime: localStorage.getItem('sour_notify_time') || '08:00',
  checkins: loadCheckins(),
  isSpeaking: false
}

// ---------- 持久化 ----------
function loadFavs() {
  try { return JSON.parse(localStorage.getItem('sour_favs') || '[]') } catch { return [] }
}
function saveFavs() { localStorage.setItem('sour_favs', JSON.stringify(state.favs)) }

function loadCheckins() {
  try { return JSON.parse(localStorage.getItem('sour_checkins') || '[]') } catch { return [] }
}
function saveCheckins() { localStorage.setItem('sour_checkins', JSON.stringify(state.checkins)) }

function todayStr(d = new Date()) {
  const y = d.getFullYear(), m = String(d.getMonth() + 1).padStart(2, '0'), dd = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${dd}`
}

// ---------- 工具 ----------
function pool() {
  return state.cat === 'all' ? QUOTES : QUOTES.filter((q) => q.cat === state.cat)
}

function shuffle(arr, seed) {
  const a = [...arr]
  let s = seed || Date.now()
  for (let i = a.length - 1; i > 0; i--) {
    s = (s * 9301 + 49297) % 233280
    const j = s % (i + 1)
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function toast(msg) {
  const el = $('#toast')
  el.textContent = msg
  el.classList.remove('hidden')
  el.classList.add('show')
  clearTimeout(el._t)
  el._t = setTimeout(() => {
    el.classList.remove('show')
    setTimeout(() => el.classList.add('hidden'), 300)
  }, 1800)
}

// ---------- 渲染卡片 ----------
function renderCard(quote, animate = true) {
  const cat = CATEGORIES.find((c) => c.id === quote.cat) || CATEGORIES[0]
  state.current = quote

  const emoji = $('#cardCat')
  emoji.textContent = cat.emoji

  const text = $('#quoteText')
  text.textContent = quote.text
  toggleShow(text, animate)

  const tag = $('#quoteTag')
  tag.textContent = quote.tag
  tag.style.background = TAG_COLORS[quote.tag] || '#ff6b81'

  const date = $('#quoteDate')
  const now = new Date()
  date.textContent = `${now.getMonth() + 1}月${now.getDate()}日 · ${['日','一','二','三','四','五','六'][now.getDay()]}`
  toggleShow($('#quoteMeta'), animate)

  const favBtn = $('#actFav')
  favBtn.classList.toggle('fav-active', isFav(quote))
  $('#favIcon').textContent = isFav(quote) ? '❤️' : '🤍'

  stopSpeaking()
  state.isSpeaking = false
  $('#actSpeak').classList.remove('active')
}

function toggleShow(el, animate) {
  el.classList.remove('show')
  if (animate) {
    void el.offsetWidth
    el.classList.add('show')
  } else {
    el.classList.add('show')
  }
}

// ---------- 抽语录 ----------
function pickRandom() {
  const p = pool()
  if (!p.length) return
  let q = p[Math.floor(Math.random() * p.length)]
  if (p.length > 1 && state.dailyQuote) {
    let tries = 0
    while (q.text === state.dailyQuote.text && tries < 10) {
      q = p[Math.floor(Math.random() * p.length)]
      tries++
    }
  }
  state.history.push(q)
  renderCard(q)
  hapticTap()
}

function showDaily() {
  state.dailyQuote = getDailyQuote(pool()).quote
  state.history.push(state.dailyQuote)
  renderCard(state.dailyQuote)
  hapticSuccess()
}

function showPrev() {
  if (state.history.length < 2) {
    toast('没有更早的啦 🍽️')
    hapticFail()
    return
  }
  state.history.pop()
  renderCard(state.history[state.history.length - 1])
  hapticTap()
}

// ---------- 收藏 ----------
function isFav(quote) { return state.favs.some((f) => f.text === quote.text) }

function toggleFav() {
  if (!state.current) return
  if (isFav(state.current)) {
    state.favs = state.favs.filter((f) => f.text !== state.current.text)
    toast('已取消收藏')
    hapticFail()
  } else {
    state.favs.push(state.current)
    toast('已收藏 💖')
    hapticSuccess()
  }
  saveFavs()
  renderCard(state.current, false)
  renderFavorites()
}

// ---------- 复制 / 分享 / 朗读 ----------
async function doCopy() {
  if (!state.current) return
  const ok = await copyText(state.current.text)
  toast(ok ? '已复制，拿去发朋友圈 📋' : '复制失败')
  if (ok) hapticSuccess()
}

async function doShare() {
  if (!state.current) return
  const shareCard = `🍋 【每日毒鸡汤】
「${state.current.text}」
—— 每天一句扎心语录，笑着活下去
来自「每日毒鸡汤」App`
  const ok = await shareText(shareCard)
  if (ok === null) return
  if (ok) {
    toast(ok === 'copied' ? '已复制 📋' : '分享成功 🚀')
    hapticSuccess()
  } else {
    toast('分享已取消')
  }
}

async function doCardShare() {
  if (!state.current) return
  toast('正在生成卡片…')
  hapticTap()
  try {
    const blob = await cardToBlob(state.current, state.theme)
    const fileName = `sour-quote-${Date.now()}.png`
    if (isNative) {
      const url = URL.createObjectURL(blob)
      const ok = await shareFile(url, fileName, 'image/png')
      setTimeout(() => URL.revokeObjectURL(url), 5000)
      if (ok === null) return
      if (ok) { toast('卡片已分享 🎴'); hapticSuccess() }
    } else {
      saveBlob(blob, fileName)
      toast('卡片已保存 📥')
      hapticSuccess()
    }
  } catch (e) {
    console.error(e)
    toast('生成失败，请重试')
  }
}

function doSpeak() {
  if (!state.current) return
  if (state.isSpeaking) {
    stopSpeaking()
    state.isSpeaking = false
    $('#actSpeak').classList.remove('active')
    return
  }
  const ok = speakText(state.current.text, () => {
    state.isSpeaking = false
    $('#actSpeak').classList.remove('active')
  })
  if (ok) {
    state.isSpeaking = true
    $('#actSpeak').classList.add('active')
    toast('正在朗读 🔊')
    hapticTap()
  } else {
    toast('当前设备不支持朗读')
  }
}

// ---------- 打卡 ----------
function renderCheckin() {
  const days = 7
  const checkins = state.checkins
  const streak = calcStreak(checkins)
  const doneToday = checkins.includes(todayStr())

  $('#checkinStreak').textContent = doneToday ? `今日已打卡 · 连续 ${streak} 天` : `已打卡 ${streak} 天`
  $('#checkinSub').textContent = doneToday ? '明天继续，喝汤不中断' : '连续打卡，喝汤不中断'
  $('#btnCheckin').textContent = doneToday ? '✅ 已打卡' : '今日打卡'
  $('#btnCheckin').classList.toggle('done', doneToday)

  const wrap = $('#checkinDays')
  wrap.innerHTML = ''
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const ds = todayStr(d)
    const done = checkins.includes(ds)
    const el = document.createElement('div')
    el.className = 'day-pill' + (done ? ' done' : '')
    el.innerHTML = done ? `<b>✓</b>${d.getDate()}日` : `<b>${d.getDate()}</b>${['日','一','二','三','四','五','六'][d.getDay()]}`
    wrap.appendChild(el)
  }
}

function calcStreak(checkins) {
  let streak = 0
  const d = new Date()
  if (!checkins.includes(todayStr(d))) d.setDate(d.getDate() - 1)
  while (checkins.includes(todayStr(d))) {
    streak++
    d.setDate(d.getDate() - 1)
  }
  return streak
}

function doCheckin() {
  const ds = todayStr()
  if (state.checkins.includes(ds)) {
    toast('今天已经打过卡啦 🌟')
    hapticFail()
    return
  }
  state.checkins.push(ds)
  saveCheckins()
  renderCheckin()
  toast(`打卡成功！连续 ${calcStreak(state.checkins)} 天 🔥`)
  hapticSuccess()
}

// ---------- 分类 ----------
function renderCats() {
  const wrap = $('#catFilter')
  wrap.innerHTML = ''
  CATEGORIES.forEach((c) => {
    const el = document.createElement('button')
    el.className = 'cat' + (c.id === state.cat ? ' active' : '')
    el.dataset.cat = c.id
    el.textContent = `${c.emoji} ${c.name}`
    el.addEventListener('click', () => {
      state.cat = c.id
      renderCats()
      hapticTap()
      showDaily()
    })
    wrap.appendChild(el)
  })
}

// ---------- 收藏列表 ----------
function renderFavorites() {
  const page = $('#tabFavorites')
  if (state.favs.length === 0) {
    page.innerHTML = `<div class="empty">
      <span class="empty-emoji">🫗</span>
      还没有收藏
      <br>遇到扎心的句子，点「收藏」留住它
    </div>`
    return
  }
  page.innerHTML = ''
  state.favs.forEach((fav) => {
    const cat = CATEGORIES.find((c) => c.id === fav.cat) || CATEGORIES[0]
    const item = document.createElement('div')
    item.className = 'fav-item'
    item.innerHTML = `<span class="fav-emoji">${cat.emoji}</span>
      <span class="fav-text">${fav.text}</span>
      <button class="fav-del">🗑️</button>`
    item.querySelector('.fav-text').addEventListener('click', () => {
      renderCard(fav)
      switchTab('quote')
      toast('已载入 🍋')
    })
    item.querySelector('.fav-del').addEventListener('click', (e) => {
      e.stopPropagation()
      state.favs = state.favs.filter((f) => f.text !== fav.text)
      saveFavs()
      renderFavorites()
      if (state.current && state.current.text === fav.text) renderCard(state.current, false)
      toast('已移除')
      hapticTap()
    })
    page.appendChild(item)
  })
}

// ---------- 导出收藏 ----------
async function exportFavs() {
  if (state.favs.length === 0) {
    toast('还没有收藏可导出')
    return
  }
  const content = state.favs.map((f) => `- ${f.text}（${f.tag}）`).join('\n')
  const header = `🍋 每日毒鸡汤 · 我的收藏（共 ${state.favs.length} 条）\n\n`
  try {
    await copyText(header + content)
    toast('已复制到剪贴板 📋')
    hapticSuccess()
  } catch {
    toast('导出失败')
  }
}

// ---------- 自定义语录 ----------
function addCustomQuote() {
  toast('请先编辑 src/data/quotes.js 加入语录')
}

// ---------- 关于 ----------
function renderAbout() {
  const page = $('#tabAbout')
  const q1 = getDailyQuote(QUOTES, new Date()).quote
  const total = QUOTES.length
  page.innerHTML = `<div class="about-box">
    <h3>🍋 每日毒鸡汤</h3>
    <p>「今天也要笑着活下去」的电子良药。每天一句扎心语录，专治各种想不开、睡不着、过度自信。</p>
    <h3>📌 使用小贴士</h3>
    <p>· 今日毒鸡汤：每天同一句，适合每天打卡<br>
       · 再来一碗：随机抽取，喝到吐为止<br>
       · 收藏：把扎心的句子留住<br>
       · 卡片：一键生成精美分享卡片图<br>
       · 朗读：把毒鸡汤读给你听（需要系统 TTS）</p>
    <h3>📊 数据</h3>
    <div class="about-stats">
      <div class="stat"><b>${total}</b><span>条语录</span></div>
      <div class="stat"><b>${CATEGORIES.length - 1}</b><span>个分类</span></div>
      <div class="stat"><b>4</b><span>套主题</span></div>
    </div>
    <p style="margin-top:14px;font-size:12px">💡 今日彩蛋：「${q1.text}」<br>
    <br>Made with 🍋 · 开源项目 · 无广告 · 无追踪</p>
  </div>`
}

// ---------- 主题 ----------
const THEMES = [
  { id: 'dark', name: '暗黑', swatch: 'swatch-dark' },
  { id: 'midnight', name: '午夜', swatch: 'swatch-night' },
  { id: 'sunset', name: '日落', swatch: 'swatch-sunset' },
  { id: 'forest', name: '森林', swatch: 'swatch-forest' },
  { id: 'light', name: '明亮', swatch: 'swatch-light' }
]

function applyTheme() {
  document.documentElement.dataset.theme = state.theme
  localStorage.setItem('sour_theme', state.theme)
  const meta = document.querySelector('meta[name="theme-color"]')
  if (meta) meta.content = state.theme === 'light' ? '#f5f5f7' : '#0f0f14'
}

function renderThemes() {
  const wrap = $('#themeGrid')
  wrap.innerHTML = ''
  THEMES.forEach((t) => {
    const el = document.createElement('button')
    el.className = 'theme-opt' + (t.id === state.theme ? ' active' : '')
    el.innerHTML = `<span class="swatch ${t.swatch}"></span>${t.name}`
    el.addEventListener('click', () => {
      state.theme = t.id
      applyTheme()
      renderThemes()
      hapticTap()
    })
    wrap.appendChild(el)
  })
}

// ---------- 设置 ----------
function renderSettings() {
  $('#setNotify').checked = state.notifyEnabled
  $('#setNotifyTime').value = state.notifyTime
}

async function toggleNotify() {
  const enable = $('#setNotify').checked
  if (enable) {
    const granted = await requestNotificationPermission()
    if (!granted) {
      $('#setNotify').checked = false
      toast('通知权限被拒绝 🔕')
      return
    }
    const ok = await scheduleDailyNotification(state.dailyQuote || QUOTES[0])
    if (ok) {
      state.notifyEnabled = true
      state.notifyTime = $('#setNotifyTime').value || '08:00'
      localStorage.setItem('sour_notify', '1')
      localStorage.setItem('sour_notify_time', state.notifyTime)
      toast('每日提醒已开启 🔔')
      hapticSuccess()
    } else {
      $('#setNotify').checked = false
      toast('当前环境不支持本地通知')
    }
  } else {
    await cancelDailyNotification()
    state.notifyEnabled = false
    localStorage.setItem('sour_notify', '0')
    toast('每日提醒已关闭')
  }
}

// ---------- Modal ----------
function showModal(id) { $(id).classList.add('show') }
function hideModal(id) { $(id).classList.remove('show') }

// ---------- Tab ----------
function switchTab(tab) {
  document.querySelectorAll('.nav-item').forEach((n) => {
    n.classList.toggle('active', n.dataset.tab === tab)
  })
  const isQuote = tab === 'quote'
  $('.stage').classList.toggle('hidden', !isQuote)
  $('#tabFavorites').classList.toggle('hidden', tab !== 'favorites')
  $('#tabAbout').classList.toggle('hidden', tab !== 'about')
  if (tab === 'favorites') renderFavorites()
  if (tab === 'about') renderAbout()
}

// ---------- 分享卡片按钮（在操作栏之上） ----------
function ensureCardBtn() {
  if ($('.share-card-btn')) return
  const btn = document.createElement('button')
  btn.className = 'share-card-btn'
  btn.innerHTML = '<span>🖼️</span> 生成毒鸡汤卡片图（可分享到朋友圈）'
  btn.addEventListener('click', doCardShare)
  const stage = $('.stage')
  stage.insertBefore(btn, $('.cats'))
}

// ---------- Init ----------
function init() {
  applyTheme()
  renderThemes()
  renderSettings()
  renderCats()
  renderAbout()
  renderFavorites()
  renderCheckin()
  ensureCardBtn()
  showDaily()

  // 每日首次打开自动签到（可选：打开即视为浏览）
  $('#btnDaily').addEventListener('click', showDaily)
  $('#btnRandom').addEventListener('click', pickRandom)
  $('#actCopy').addEventListener('click', doCopy)
  $('#actFav').addEventListener('click', toggleFav)
  $('#actShare').addEventListener('click', doShare)
  $('#actSpeak').addEventListener('click', doSpeak)
  $('#actPrev').addEventListener('click', showPrev)
  $('#btnCheckin').addEventListener('click', doCheckin)

  $('#btnTheme').addEventListener('click', () => showModal('#themeModal'))
  $('#btnSettings').addEventListener('click', () => {
    renderSettings()
    showModal('#settingsModal')
  })

  $('#setNotify').addEventListener('change', toggleNotify)
  $('#btnExport').addEventListener('click', exportFavs)
  $('#btnAddQuote').addEventListener('click', addCustomQuote)

  document.querySelectorAll('.modal-mask').forEach((m) => {
    m.addEventListener('click', (e) => {
      if (e.target === m) hideModal('#' + m.id)
    })
  })

  document.querySelectorAll('.nav-item').forEach((n) => {
    n.addEventListener('click', () => {
      switchTab(n.dataset.tab)
      hapticTap()
    })
  })

  // 键盘支持
  document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') pickRandom()
    if (e.key === 'ArrowLeft') showPrev()
  })

  // 触摸滑动切语录
  let touchX = null
  const card = $('#quoteCard')
  card.addEventListener('touchstart', (e) => {
    touchX = e.touches[0].clientX
  }, { passive: true })
  card.addEventListener('touchend', (e) => {
    if (touchX === null) return
    const dx = e.changedTouches[0].clientX - touchX
    if (Math.abs(dx) > 60) {
      if (dx < 0) pickRandom()
      else showPrev()
    }
    touchX = null
  }, { passive: true })
}

init()
