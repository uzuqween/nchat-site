// Плавное появление секций при прокрутке и подстановка ссылки на скачивание.

// Ссылка на файл релиза. Когда сборка появится в GitHub Releases — заменить
// на прямой URL вида https://github.com/USER/REPO/releases/latest/download/NChat.exe
const DOWNLOAD_URL = 'https://github.com/uzuqween/nchat-site/releases/latest/download/NChat.exe'

/**
 * Звук клика по всей странице. Новый Audio на каждый клик — быстрые повторные
 * клики не обрывают друг друга. Питч слегка рандомится (playbackRate), чтобы
 * повторы не звучали механически одинаково.
 */
function setupClickSound() {
  const src = 'assets/click.mp3'
  document.addEventListener('click', () => {
    const audio = new Audio(src)
    audio.volume = 0.3
    // ±6% от нормальной скорости — заметный, но не искажающий разброс тона.
    audio.playbackRate = 0.94 + Math.random() * 0.12
    audio.play().catch(() => {})
  })
}

document.addEventListener('DOMContentLoaded', () => {
  setupDownload()
  setupReveal()
  setupClickSound()
})

/**
 * Кнопка скачивания. Пока прямой ссылки нет, клик не ведёт на битый адрес,
 * а сообщает, что сборка ещё не опубликована.
 */
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

/**
 * Секции проявляются, когда попадают в область видимости. Без библиотек —
 * через IntersectionObserver. Если API недоступен, показываем всё сразу.
 */
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
