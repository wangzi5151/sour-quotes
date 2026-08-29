import '../css/style.css'
import { QUOTES, CATEGORIES, TAG_COLORS, getDailyQuote } from '../data/quotes.js'
import {
  isNative,
  copyText,
  shareText,
  hapticTap,
  hapticSuccess,
  hapticFail
} from './native.js'

const $ = (sel) => document.querySelector(sel)

const state = {
  cat: 'all',
  history: [],
  favs: loadFavs(),
  current: null,
  dailyQuote: null
}

// ---------- Helpers ----------
function loadFavs() {
  try {
    return JSON.parse(localStorage.getItem('sour_favs') || '[]')
  } catch {
    return []
  }
}

function saveFavs() {
  localStorage.setItem('sour_favs', JSON.stringify(state.favs))
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

function pool() {
  return state.cat === 'all' ? QUOTES : QUOTES.filter((q) => q.cat === state.cat)
}

function renderCard(quote, animate = true) {
  const cat = CATEGORIES.find((c) => c.id === quote.cat) || CATEGORIES[0]
  state.current = quote

  const emoji = $('#cardCat')
  emoji.textContent = cat.emoji

  const text = $('#quoteText')
  text.textContent = quote.text
  if (animate) {
    text.classList.remove('show')
    void text.offsetWidth
    text.classList.add('show')
  } else {
    text.classList.add('show')
  }

  const tag = $('#quoteTag')
  tag.textContent = quote.tag
  tag.style.background = TAG_COLORS[quote.tag] || '#ff6b81'
  if (animate) {
    tag.classList.remove('show')
    void tag.offsetWidth
    tag.classList.add('show')
  } else {
    tag.classList.add('show')
  }

  const favBtn = $('#actFav')
  favBtn.classList.toggle('fav-active', isFav(quote))
  $('#favIcon').textContent = isFav(quote) ? '❤️' : '🤍'
}

function pickRandom() {
  const p = pool()
  if (!p.length) return
  let q = p[Math.floor(Math.random() * p.length)]
  if (p.length > 1) {
    while (q.text === state.dailyQuote?.text && p.length > 1) {
      q = p[Math.floor(Math.random() * p.length)]
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
    toast('没有更早的啦')
    hapticFail()
    return
  }
  state.history.pop()
  const prev = state.history[state.history.length - 1]
  renderCard(prev)
  hapticTap()
}

function isFav(quote) {
  return state.favs.some((f) => f.text === quote.text)
}

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

function toast(msg) {
  const el = $('#toast')
  el.textContent = msg
  el.classList.remove('hidden')
  el.classList.add('show')
  clearTimeout(el._t)
  el._t = setTimeout(() => {
    el.classList.remove('show')
    setTimeout(() => el.classList.add('hidden'), 300)
  }, 1600)
}

async function doCopy() {
  if (!state.current) return
  const ok = await copyText(state.current.text)
  toast(ok ? '已复制，拿去发朋友圈吧 📋' : '复制失败')
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
    toast('分享成功 🚀')
    hapticSuccess()
  } else {
    toast('分享已取消')
  }
}

// ---------- Categories ----------
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

// ---------- Favorites ----------
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

// ---------- About ----------
function renderAbout() {
  const page = $('#tabAbout')
  const q1 = getDailyQuote(QUOTES, new Date()).quote
  page.innerHTML = `<div class="about-box">
    <h3>🍋 每日毒鸡汤</h3>
    <p>「今天也要笑着活下去」的电子良药。每天一句扎心语录，专治各种想不开、睡不着、过度自信。</p>
    <h3>📌 使用小贴士</h3>
    <p>· 今日毒鸡汤：每天同一句，适合每天打卡<br>
       · 再来一碗：随机抽取，喝到吐为止<br>
       · 收藏：把扎心的句子留住<br>
       · 复制/分享：一键发朋友圈、群聊</p>
    <h3>📊 数据</h3>
    <div class="about-stats">
      <div class="stat"><b>${QUOTES.length}</b><span>条语录</span></div>
      <div class="stat"><b>${CATEGORIES.length - 1}</b><span>个分类</span></div>
      <div class="stat"><b>100%</b><span>离线可用</span></div>
    </div>
    <p style="margin-top:14px;font-size:12px">💡 今日彩蛋：「${q1.text}」<br>
    <br>Made with 🍋 · 开源项目 · 无广告 · 无追踪</p>
  </div>`
}

// ---------- Tabs ----------
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

// ---------- Init ----------
function init() {
  renderCats()
  renderAbout()
  renderFavorites()
  showDaily()

  $('#btnDaily').addEventListener('click', showDaily)
  $('#btnRandom').addEventListener('click', pickRandom)
  $('#actCopy').addEventListener('click', doCopy)
  $('#actFav').addEventListener('click', toggleFav)
  $('#actShare').addEventListener('click', doShare)
  $('#actPrev').addEventListener('click', showPrev)

  document.querySelectorAll('.nav-item').forEach((n) => {
    n.addEventListener('click', () => {
      switchTab(n.dataset.tab)
      hapticTap()
    })
  })

  document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') pickRandom()
    if (e.key === 'ArrowLeft') showPrev()
  })
}

init()
