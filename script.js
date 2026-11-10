// Появление секций, бургер-меню, tilt-превью, параллак bloom, статистика релиза,
// анимированное демо и лента «Что нового» из GitHub Releases.

const DOWNLOAD_URL = 'https://github.com/uzuqween/nchat-site/releases/latest/download/NChat.exe'
const RELEASE_API = 'https://api.github.com/repos/uzuqween/nchat-site/releases/latest'
const RELEASES_API = 'https://api.github.com/repos/uzuqween/nchat-site/releases?per_page=100'
const RELEASES_URL = 'https://github.com/uzuqween/nchat-site/releases'
const RELEASES_LIST_API = 'https://api.github.com/repos/uzuqween/nchat-site/releases?per_page=5'

const LANG = (document.documentElement.lang || 'ru').toLowerCase().startsWith('en') ? 'en' : 'ru'
const T = {
  ru: {
    soon: 'Сборка скоро появится', download: 'Скачать NChat.exe', closeMenu: 'Закрыть меню', openMenu: 'Открыть меню',
    mb: 'МБ', confirmed: 'подтверждено', latest: 'новое', locale: 'ru-RU',
    changelogError: 'Историю версий не удалось загрузить — она есть на GitHub.'
  },
  en: {
    soon: 'Build coming soon', download: 'Download NChat.exe', closeMenu: 'Close menu', openMenu: 'Open menu',
    mb: 'MB', confirmed: 'approved', latest: 'latest', locale: 'en-US',
    changelogError: 'Could not load the version history — it is available on GitHub.'
  }
}[LANG]

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

document.addEventListener('DOMContentLoaded', () => {
  setupDownload()
  setupReveal()
  setupNavToggle()
  setupDownloadStats()
  setupDemo()
  setupChangelog()
  setupCustomize()
  if (!prefersReducedMotion && window.matchMedia('(pointer: fine)').matches) {
    setupTilt()
    setupBloomParallax()
  }
})

/** Кнопка скачивания: подстановка прямой ссылки на файл релиза. */
function setupDownload() {
  const btn = document.getElementById('download-btn')
  if (!(btn instanceof HTMLAnchorElement)) return

  // Звук при нажатии «Скачать» (тихий, без блокировки скачивания)
  const sound = new Audio('/nchat-site/assets/download.mp3')
  sound.preload = 'auto'
  sound.volume = 0.8
  btn.addEventListener('click', () => {
    sound.currentTime = 0
    sound.play().catch(() => {})
  })

  if (DOWNLOAD_URL) {
    btn.href = DOWNLOAD_URL
    return
  }

  btn.addEventListener('click', event => {
    event.preventDefault()
    btn.textContent = T.soon
    setTimeout(() => { btn.textContent = T.download }, 2000)
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
    toggle.setAttribute('aria-label', open ? T.closeMenu : T.openMenu)
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
    const headers = { Accept: 'application/vnd.github+json' }
    const [response, allResponse] = await Promise.all([
      fetch(RELEASE_API, { headers }),
      fetch(RELEASES_API, { headers }).catch(() => null)
    ])
    if (!response.ok) return

    const release = await response.json()
    const version = release.tag_name || ''
    const assets = Array.isArray(release.assets) ? release.assets : []
    const exe = assets.find(a => typeof a.name === 'string' && a.name.endsWith('.exe'))

    // Скачивания — сумма по всем релизам, иначе счётчик обнуляется с каждой новой версией
    const sumAssets = list => list.reduce((sum, a) => sum + (a.download_count || 0), 0)
    let downloads = sumAssets(assets)
    if (allResponse && allResponse.ok) {
      const releases = await allResponse.json()
      if (Array.isArray(releases)) {
        downloads = releases.reduce((sum, r) => sum + sumAssets(Array.isArray(r.assets) ? r.assets : []), 0)
      }
    }

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
  return `${mb >= 100 ? Math.round(mb) : mb.toFixed(1)} ${T.mb}`
}

function formatCount(count) {
  return count >= 1000 ? `${(count / 1000).toFixed(1)}k` : String(count)
}

/** Склонение: 1 скачивание, 2 скачивания, 5 скачиваний */
function pluralDownloads(n) {
  if (LANG === 'en') return n === 1 ? 'download' : 'downloads'
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



/* ─────────── Демо-окно ─────────── */

/**
 * Сценарии демо. Шаги: user — сообщение пользователя (печатается в поле ввода),
 * tool — вызов инструмента (сначала […] / [?], затем [✓]), bot — ответ модели.
 * Инструменты — реальные из NChat (см. релизы v1.0.6–v1.0.7).
 */
const DEMO_SCENARIOS_RU = [
  {
    tab: 'git',
    title: 'NChat — nchat-site',
    steps: [
      { type: 'user', text: 'закоммить изменения и запушь' },
      { type: 'tool', name: 'git_status', done: '3 файла изменено' },
      { type: 'tool', name: 'git_commit -m "fix: светлая тема"', done: 'коммит a1f3c9e' },
      { type: 'tool', name: 'git push origin master', ask: true, done: 'отправлено' },
      { type: 'bot', html: 'Готово: 3 файла в <code>master</code>, ветка синхронизирована.' }
    ]
  },
  {
    tab: 'логи',
    title: 'NChat — backend',
    steps: [
      { type: 'user', text: 'почему сервер падает при старте?' },
      { type: 'tool', name: 'tail_file logs/server.log', done: '50 строк' },
      { type: 'tool', name: 'read_file src/db.ts', done: 'прочитано' },
      { type: 'bot', html: 'В логе <code>ECONNREFUSED 127.0.0.1:5432</code> — Postgres не запущен. Запустить службу?' }
    ]
  },
  {
    tab: 'видео',
    title: 'NChat — Загрузки',
    steps: [
      { type: 'user', text: 'вытащи звук из clip.mp4 в mp3' },
      { type: 'tool', name: 'extract_audio clip.mp4 → clip.mp3', ask: true, done: 'готово' },
      { type: 'bot', html: 'Сохранил <code>clip.mp3</code> рядом с видео. Обрезать начало?' }
    ]
  },
  {
    tab: 'аудит',
    title: 'NChat — web-app',
    steps: [
      { type: 'user', text: 'проверь зависимости на уязвимости' },
      { type: 'tool', name: 'dependency_audit', done: '2 уязвимости' },
      { type: 'tool', name: 'outdated_packages', done: '5 пакетов устарели' },
      { type: 'bot', html: 'Критичных нет. <code>axios</code> и <code>vite</code> стоит обновить — сделать?' }
    ]
  }
]

const DEMO_SCENARIOS_EN = [
  {
    tab: 'git',
    title: 'NChat — nchat-site',
    steps: [
      { type: 'user', text: 'commit the changes and push' },
      { type: 'tool', name: 'git_status', done: '3 files changed' },
      { type: 'tool', name: 'git_commit -m "fix: light theme"', done: 'commit a1f3c9e' },
      { type: 'tool', name: 'git push origin master', ask: true, done: 'pushed' },
      { type: 'bot', html: 'Done: 3 files on <code>master</code>, branch is in sync.' }
    ]
  },
  {
    tab: 'logs',
    title: 'NChat — backend',
    steps: [
      { type: 'user', text: 'why does the server crash on startup?' },
      { type: 'tool', name: 'tail_file logs/server.log', done: '50 lines' },
      { type: 'tool', name: 'read_file src/db.ts', done: 'read' },
      { type: 'bot', html: 'The log shows <code>ECONNREFUSED 127.0.0.1:5432</code> — Postgres isn\'t running. Start the service?' }
    ]
  },
  {
    tab: 'video',
    title: 'NChat — Downloads',
    steps: [
      { type: 'user', text: 'extract the audio from clip.mp4 to mp3' },
      { type: 'tool', name: 'extract_audio clip.mp4 → clip.mp3', ask: true, done: 'done' },
      { type: 'bot', html: 'Saved <code>clip.mp3</code> next to the video. Trim the beginning?' }
    ]
  },
  {
    tab: 'audit',
    title: 'NChat — web-app',
    steps: [
      { type: 'user', text: 'check dependencies for vulnerabilities' },
      { type: 'tool', name: 'dependency_audit', done: '2 vulnerabilities' },
      { type: 'tool', name: 'outdated_packages', done: '5 packages outdated' },
      { type: 'bot', html: 'Nothing critical. <code>axios</code> and <code>vite</code> should be updated — do it?' }
    ]
  }
]

const DEMO_SCENARIOS = LANG === 'en' ? DEMO_SCENARIOS_EN : DEMO_SCENARIOS_RU

function setupDemo() {
  const body = document.getElementById('demo-body')
  const input = document.getElementById('demo-input')
  const title = document.getElementById('demo-title')
  const tabs = document.getElementById('demo-tabs')
  if (!body || !input || !title || !tabs) return

  let runId = 0
  let current = 0
  let started = false

  const sleep = ms => new Promise(resolve => setTimeout(resolve, prefersReducedMotion ? 0 : ms))

  const tabButtons = DEMO_SCENARIOS.map((scenario, index) => {
    const btn = document.createElement('button')
    btn.className = 'demo-tab'
    btn.type = 'button'
    btn.setAttribute('role', 'tab')
    btn.textContent = scenario.tab
    btn.addEventListener('click', () => play(index))
    tabs.appendChild(btn)
    return btn
  })

  const toolLine = (status, cls, text) => {
    const row = document.createElement('div')
    row.className = 'demo-tool'
    row.innerHTML = `<span class="st ${cls}">${status}</span>${escapeHtml(text)}`
    return row
  }

  async function play(index) {
    const id = ++runId
    const alive = () => id === runId
    current = index
    const scenario = DEMO_SCENARIOS[index]

    tabButtons.forEach((btn, i) => btn.setAttribute('aria-selected', String(i === index)))
    title.textContent = scenario.title
    body.innerHTML = ''
    input.textContent = ''

    for (const step of scenario.steps) {
      if (!alive()) return

      if (step.type === 'user') {
        for (const ch of step.text) {
          if (!alive()) return
          input.textContent += ch
          await sleep(38)
        }
        await sleep(350)
        if (!alive()) return
        input.textContent = ''
        const msg = document.createElement('div')
        msg.className = 'demo-msg user'
        msg.textContent = step.text
        body.appendChild(msg)
        await sleep(500)
      }

      if (step.type === 'tool') {
        const row = toolLine(step.ask ? '[?]' : '[…]', step.ask ? 'ask' : 'run',
          step.ask ? `${step.name} — ${T.confirmed}` : step.name)
        body.appendChild(row)
        await sleep(step.ask ? 1100 : 800)
        if (!alive()) return
        row.replaceWith(toolLine('[✓]', 'ok', `${step.name} · ${step.done}`))
        await sleep(350)
      }

      if (step.type === 'bot') {
        const msg = document.createElement('div')
        msg.className = 'demo-msg bot'
        msg.innerHTML = step.html
        body.appendChild(msg)
      }
    }

    if (prefersReducedMotion) return
    await sleep(3200)
    if (alive()) play((current + 1) % DEMO_SCENARIOS.length)
  }

  // Запуск, когда демо попадает в экран, чтобы анимация не прошла впустую
  const start = () => { if (!started) { started = true; play(0) } }
  if ('IntersectionObserver' in window) {
    const obs = new IntersectionObserver(entries => {
      if (entries.some(e => e.isIntersecting)) { start(); obs.disconnect() }
    }, { threshold: 0.3 })
    obs.observe(body)
  } else {
    start()
  }
}

/* ─────────── Что нового ─────────── */

/** Последние релизы из GitHub API. Первый раскрыт, остальные свёрнуты. */
async function setupChangelog() {
  const list = document.getElementById('changelog-list')
  if (!list) return

  try {
    const response = await fetch(RELEASES_LIST_API, { headers: { Accept: 'application/vnd.github+json' } })
    if (!response.ok) throw new Error(String(response.status))
    const releases = (await response.json()).filter(r => !r.draft)
    if (releases.length === 0) throw new Error('empty')

    // Английская версия: переводы описаний релизов лежат в en/releases.json (ключ — тег)
    let translations = {}
    if (LANG === 'en') {
      try {
        const tr = await fetch('releases.json', { cache: 'no-cache' })
        if (tr.ok) translations = await tr.json()
      } catch { /* нет перевода — показываем оригинал */ }
    }

    list.innerHTML = ''
    releases.forEach((release, index) => {
      const details = document.createElement('details')
      details.className = 'release'
      if (index === 0) details.open = true

      const date = release.published_at
        ? new Date(release.published_at).toLocaleDateString(T.locale, { day: 'numeric', month: 'long', year: 'numeric' })
        : ''

      details.innerHTML = `
        <summary>
          <span class="release-tag">${escapeHtml(release.tag_name || '')}</span>
          ${index === 0 ? `<span class="release-latest">${T.latest}</span>` : ''}
          <span class="release-date">${escapeHtml(date)}</span>
        </summary>
        <div class="release-body">${renderReleaseNotes(translations[release.tag_name] || release.body || '')}</div>`
      list.appendChild(details)
    })
  } catch {
    list.innerHTML = `<p class="changelog-fallback">${T.changelogError}</p>`
  }
}

/** Мини-рендер Markdown из описаний релизов: ###, списки, **жирный**, `код`. */
function renderReleaseNotes(markdown) {
  const inline = text => escapeHtml(text)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')

  const out = []
  let inList = false
  const closeList = () => { if (inList) { out.push('</ul>'); inList = false } }

  for (const raw of markdown.split(/\r?\n/)) {
    const line = raw.trim()
    if (!line || /^##\s/.test(line)) { closeList(); continue } // заголовок «## NChat vX» дублирует тег
    if (/^#{3,}\s/.test(line)) { closeList(); out.push(`<h4>${inline(line.replace(/^#+\s*/, ''))}</h4>`); continue }
    if (/^[-*]\s/.test(line)) {
      if (!inList) { out.push('<ul>'); inList = true }
      out.push(`<li>${inline(line.slice(2))}</li>`)
      continue
    }
    closeList()
    out.push(`<p>${inline(line)}</p>`)
  }
  closeList()
  return out.join('')
}

/**
 * «Под себя»: свотчи меняют --pick-rgb блока — свечение, рамка скриншота и маркеры списка.
 * До первого клика цвета листаются сами раз в 2,6 с (если анимации не отключены в системе).
 */
function setupCustomize() {
  const root = document.querySelector('.customize')
  const shot = document.getElementById('customize-shot')
  const swatches = root ? [...root.querySelectorAll('.swatch')] : []
  if (!root || !swatches.length) return

  let index = 1
  let timer = null

  const pick = (i, fromUser) => {
    index = i
    swatches.forEach((s, n) => s.classList.toggle('active', n === i))
    root.style.setProperty('--pick-rgb', swatches[i].dataset.rgb)
    if (shot && !prefersReducedMotion) {
      shot.classList.remove('pulse')
      void shot.offsetWidth
      shot.classList.add('pulse')
    }
    if (fromUser && timer) { clearInterval(timer); timer = null }
  }

  swatches.forEach((s, i) => s.addEventListener('click', () => pick(i, true)))
  pick(index, false)

  if (prefersReducedMotion || !('IntersectionObserver' in window)) return
  const obs = new IntersectionObserver(entries => {
    const visible = entries.some(e => e.isIntersecting)
    if (visible && !timer && !root.dataset.touched) {
      timer = setInterval(() => pick((index + 1) % swatches.length, false), 2600)
    } else if (!visible && timer) {
      clearInterval(timer); timer = null
    }
  }, { threshold: 0.3 })
  obs.observe(root)
  swatches.forEach(s => s.addEventListener('click', () => { root.dataset.touched = '1' }))
}
