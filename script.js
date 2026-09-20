// Появление секций, бургер-меню, tilt-превью, параллак bloom, статистика релиза.

const DOWNLOAD_URL = 'https://github.com/uzuqween/nchat-site/releases/latest/download/NChat.exe'
const RELEASE_API = 'https://api.github.com/repos/uzuqween/nchat-site/releases/latest'
const RELEASES_URL = 'https://github.com/uzuqween/nchat-site/releases'

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

document.addEventListener('DOMContentLoaded', () => {
  setupDownload()
  setupReveal()
  setupNavToggle()
  setupDownloadStats()
  if (!prefersReducedMotion && window.matchMedia('(pointer: fine)').matches) {
    setupTilt()
    setupBloomParallax()
  }
})

/** Кнопка скачивания: подстановка прямой ссылки на файл релиза. */
function setupDownload() {
  const btn = document.getElementById('download-btn')
  if (!(btn instanceof HTMLAnchorElement)) return

  if (DOWNLOAD_URL) {
    btn.href = DOWNLOAD_URL
    return
  }

  btn.addEventListener('click', event => {
    event.preventDefault()
    btn.textContent = 'Сборка скоро появится'
    setTimeout(() => { btn.textContent = 'Скачать NChat.exe' }, 2000)
  })
}

/** Секции проявляются при попадании в область видимости (IntersectionObserver). */
function setupReveal() {
  const targets = document.querySelectorAll('.section, .hero-preview')
  targets.forEach(el => el.classList.add('reveal'))

  if (!('IntersectionObserver' in window)) {
    targets.forEach(el => el.classList.add('visible'))
    return
  }

  const observer = new IntersectionObserver((entries, obs) => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible')
        obs.unobserve(entry.target)
      }
    }
  }, { threshold: 0.12 })

  targets.forEach(el => observer.observe(el))
}

/** Бургер-меню на мобильных: переключение, закрытие по клику на ссылку и по Escape. */
function setupNavToggle() {
  const toggle = document.getElementById('nav-toggle')
  const nav = document.getElementById('nav')
  if (!toggle || !nav) return

  const setOpen = open => {
    nav.classList.toggle('open', open)
    toggle.setAttribute('aria-expanded', String(open))
    toggle.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню')
  }

  toggle.addEventListener('click', () => {
    setOpen(toggle.getAttribute('aria-expanded') !== 'true')
  })

  nav.addEventListener('click', event => {
    if (event.target.closest('a')) setOpen(false)
  })

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') setOpen(false)
  })
}

/**
 * Tilt: лёгкий 3D-наклон скриншота за курсором. Обновление — через rAF,
 * максимальный наклон ±5°, чтобы не искажать читаемость скриншота.
 * Работает только на устройствах с точным указателем (мышь).
 */
function setupTilt() {
  const preview = document.getElementById('hero-preview')
  if (!preview) return

  const MAX_DEG = 5
  let rafId = null
  let targetX = 0
  let targetY = 0

  const apply = () => {
    preview.style.setProperty('--tilt-x', `${targetX.toFixed(2)}deg`)
    preview.style.setProperty('--tilt-y', `${targetY.toFixed(2)}deg`)
    rafId = null
  }

  const schedule = () => {
    if (rafId === null) rafId = requestAnimationFrame(apply)
  }

  preview.addEventListener('mousemove', event => {
    const rect = preview.getBoundingClientRect()
    const px = (event.clientX - rect.left) / rect.width - 0.5
    const py = (event.clientY - rect.top) / rect.height - 0.5
    preview.classList.remove('tilt-settle')
    targetX = -py * MAX_DEG
    targetY = px * MAX_DEG
    schedule()
  })

  preview.addEventListener('mouseleave', () => {
    preview.classList.add('tilt-settle')
    targetX = 0
    targetY = 0
    schedule()
  })
}

/**
 * Параллак bloom-свечения: свет за логотипом слегка смещается за курсором
 * по всей hero-секции. Сдвиг ограничен ±40px — эффект мягкий, не отвлекает.
 */
function setupBloomParallax() {
  const hero = document.querySelector('.hero')
  if (!hero) return

  const MAX_SHIFT = 40
  let rafId = null
  let shiftX = 0
  let shiftY = 0

  const apply = () => {
    hero.style.setProperty('--bloom-x', `${shiftX.toFixed(1)}px`)
    hero.style.setProperty('--bloom-y', `${shiftY.toFixed(1)}px`)
    rafId = null
  }

  hero.addEventListener('mousemove', event => {
    const rect = hero.getBoundingClientRect()
    const px = (event.clientX - rect.left) / rect.width - 0.5
    const py = (event.clientY - rect.top) / rect.height - 0.5
    shiftX = px * MAX_SHIFT
    shiftY = py * MAX_SHIFT
    if (rafId === null) rafId = requestAnimationFrame(apply)
  })

  hero.addEventListener('mouseleave', () => {
    shiftX = 0
    shiftY = 0
    if (rafId === null) rafId = requestAnimationFrame(apply)
  })
}

/**
 * Статистика релиза из GitHub API: версия, размер .exe и (когда они появятся)
 * скачивания. API обновляет download_count с задержкой до суток, поэтому ноль
 * не показываем. При любой ошибке (лимит API, офлайн) строка не появляется.
 */
async function setupDownloadStats() {
  const stats = document.getElementById('download-stats')
  if (!stats) return

  try {
    const response = await fetch(RELEASE_API, { headers: { Accept: 'application/vnd.github+json' } })
    if (!response.ok) return

    const release = await response.json()
    const version = release.tag_name || ''
    const assets = Array.isArray(release.assets) ? release.assets : []
    const exe = assets.find(a => typeof a.name === 'string' && a.name.endsWith('.exe'))
    const downloads = assets.reduce((sum, a) => sum + (a.download_count || 0), 0)

    // Кнопки GitHub ведут на конкретный релиз, если версия известна
    if (version) {
      document.querySelectorAll('.nav-github, .footer-link[href*="/releases"]').forEach(link => {
        link.href = `${RELEASES_URL}/tag/${encodeURIComponent(version)}`
      })
    }

    const parts = []
    if (version) parts.push(`<span class="accent">${escapeHtml(version)}</span>`)
    if (exe && exe.size) parts.push(formatBytes(exe.size))
    if (downloads > 0) parts.push(`${formatCount(downloads)} ${pluralDownloads(downloads)}`)
    if (parts.length === 0) return

    stats.innerHTML = parts.join(' · ')
    stats.hidden = false
  } catch {
    // API недоступен — страница работает без статистики
  }
}

function formatBytes(bytes) {
  const mb = bytes / (1024 * 1024)
  return `${mb >= 100 ? Math.round(mb) : mb.toFixed(1)} МБ`
}

function formatCount(count) {
  return count >= 1000 ? `${(count / 1000).toFixed(1)}k` : String(count)
}

/** Склонение: 1 скачивание, 2 скачивания, 5 скачиваний */
function pluralDownloads(n) {
  const mod10 = n % 10
  const mod100 = n % 100
  if (mod10 === 1 && mod100 !== 11) return 'скачивание'
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return 'скачивания'
  return 'скачиваний'
}

function escapeHtml(text) {
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}

