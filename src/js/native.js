// Capacitor 原生能力封装，带 Web 降级
import { Capacitor } from '@capacitor/core'

export const isNative = Capacitor.isNativePlatform()

let Clipboard = null
let Share = null
let Haptics = null
let LocalNotifications = null

async function loadPlugins() {
  try {
    const [c, s, h, l] = await Promise.all([
      import('@capacitor/clipboard'),
      import('@capacitor/share'),
      import('@capacitor/haptics'),
      import('@capacitor/local-notifications')
    ])
    Clipboard = c.Clipboard
    Share = s.Share
    Haptics = h.Haptics
    LocalNotifications = l.LocalNotifications
  } catch (e) {
    console.warn('capacitor plugins unavailable:', e)
  }
}

if (isNative) loadPlugins()

// ---------- 剪贴板 ----------
export async function copyText(text) {
  if (isNative && Clipboard) {
    try {
      await Clipboard.write({ string: text })
      return true
    } catch {
      return false
    }
  }
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    try {
      const ta = document.createElement('textarea')
      ta.value = text
      ta.style.position = 'fixed'
      ta.style.opacity = '0'
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      ta.remove()
      return true
    } catch {
      return false
    }
  }
}

// ---------- 分享 ----------
export async function shareText(text) {
  if (isNative && Share) {
    try {
      await Share.share({ title: '每日毒鸡汤', text, dialogTitle: '分享毒鸡汤' })
      return true
    } catch (e) {
      if (e && e.message && e.message.toLowerCase().includes('cancel')) return null
      return false
    }
  }
  if (navigator.share) {
    try {
      await navigator.share({ title: '每日毒鸡汤', text })
      return true
    } catch {
      return null
    }
  }
  return copyText(text) ? 'copied' : false
}

export async function shareFile(url, fileName, mime) {
  if (isNative && Share) {
    try {
      await Share.share({ title: '每日毒鸡汤', text: '分享一张毒鸡汤卡片', url, dialogTitle: '分享卡片' })
      return true
    } catch (e) {
      if (e && e.message && e.message.toLowerCase().includes('cancel')) return null
      return false
    }
  }
  // Web 降级：下载图片
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  document.body.appendChild(a)
  a.click()
  a.remove()
  return true
}

// ---------- 触感 ----------
export async function hapticTap() {
  if (isNative && Haptics) await Haptics.impact({ style: 'LIGHT' }).catch(() => {})
}
export async function hapticSuccess() {
  if (isNative && Haptics) await Haptics.notification({ type: 'SUCCESS' }).catch(() => {})
}
export async function hapticFail() {
  if (isNative && Haptics) await Haptics.notification({ type: 'WARNING' }).catch(() => {})
}

// ---------- 本地通知 ----------
export async function requestNotificationPermission() {
  if (isNative && LocalNotifications) {
    try {
      const perm = await LocalNotifications.requestPermissions()
      return perm.permission === 'granted'
    } catch {
      return false
    }
  }
  return true
}

export async function scheduleDailyNotification(quote) {
  if (isNative && LocalNotifications) {
    try {
      await LocalNotifications.schedule({
        notifications: [
          {
            id: 1,
            title: '🍋 今日毒鸡汤',
            body: `「${quote.text}」`,
            schedule: { on: { hour: 8, minute: 0 } },
            extra: { type: 'daily' }
          }
        ]
      })
      return true
    } catch {
      return false
    }
  }
  return false
}

export async function cancelDailyNotification() {
  if (isNative && LocalNotifications) {
    try {
      await LocalNotifications.cancel({ notifications: [{ id: 1 }] })
      return true
    } catch {
      return false
    }
  }
  return false
}

// ---------- 文本朗读 (TTS) ----------
let speech = null
if (typeof window !== 'undefined' && ('speechSynthesis' in window)) {
  speech = window.speechSynthesis
}

export function speakText(text, onEnd) {
  if (speech) {
    speech.cancel()
    const u = new SpeechSynthesisUtterance(text)
    u.lang = 'zh-CN'
    u.rate = 1.0
    u.pitch = 1.0
    if (onEnd) u.onend = () => onEnd()
    speech.speak(u)
    return true
  }
  return false
}

export function stopSpeaking() {
  if (speech) speech.cancel()
}
