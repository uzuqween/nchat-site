/** FAQ: плавное открытие и закрытие панелей <details> (CSS transition по высоте). */
(() => {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  document.querySelectorAll('.faq-item').forEach(details => {
    const summary = details.querySelector('summary')
    const content = details.querySelector('.faq-answer')
    if (!summary || !content) return

    let timer = null
    const finish = () => {
      clearTimeout(timer)
      if (details.classList.contains('is-closing')) details.open = false
      details.classList.remove('is-opening', 'is-closing')
      content.style.height = ''
      content.style.opacity = ''
    }

    content.addEventListener('transitionend', event => {
      if (event.target === content && event.propertyName === 'height') finish()
    })

    summary.addEventListener('click', event => {
      if (reduce) return
      event.preventDefault()
      clearTimeout(timer)
      timer = setTimeout(finish, 500) // запасной вариант, если transitionend не придёт

      const closing = details.classList.contains('is-opening') ||
        (details.open && !details.classList.contains('is-closing'))

      if (closing) {
        content.style.height = content.offsetHeight + 'px'
        details.classList.remove('is-opening')
        details.classList.add('is-closing')
        void content.offsetHeight // фиксируем стартовую высоту
        requestAnimationFrame(() => {
          content.style.height = '0px'
          content.style.opacity = '0'
        })
      } else {
        const from = details.open ? content.offsetHeight : 0
        details.classList.remove('is-closing')
        details.classList.add('is-opening')
        content.style.height = from + 'px'
        content.style.opacity = '0'
        details.open = true
        void content.offsetHeight // стартовая высота применена до анимации
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            content.style.height = content.scrollHeight + 'px'
            content.style.opacity = '1'
          })
        })
      }
    })
  })
})()
