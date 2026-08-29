// Capacitor 原生能力封装，带 Web 降级
import { Capacitor } from '@capacitor/core'

export const isNative = Capacitor.isNativePlatform()

let Clipboard = null
let Share = null
let Haptics = null

async function loadPlugins() {
  try {
    const [c, s, h] = await Promise.all([
      import('@capacitor/clipboard'),
      import('@capacitor/share'),
      import('@capacitor/haptics')
    ])
    Clipboard = c.Clipboard
    Share = s.Share
    Haptics = h.Haptics
  } catch (e) {
    console.warn('capacitor plugins unavailable:', e)
  }
}

if (isNative) loadPlugins()

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

export async function hapticTap() {
  if (isNative && Haptics) await Haptics.impact({ style: 'LIGHT' }).catch(() => {})
}

export async function hapticSuccess() {
  if (isNative && Haptics) await Haptics.notification({ type: 'SUCCESS' }).catch(() => {})
}

export async function hapticFail() {
  if (isNative && Haptics) await Haptics.notification({ type: 'WARNING' }).catch(() => {})
}
