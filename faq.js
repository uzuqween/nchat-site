/** FAQ: плавное открытие и закрытие панелей <details> (Web Animations API). */
(() => {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const DURATION = 320
  const EASING = 'cubic-bezier(0.22, 1, 0.36, 1)'

  document.querySelectorAll('.faq-item').forEach(details => {
    const summary = details.querySelector('summary')
    const content = details.querySelector('.faq-answer')
    if (!summary || !content) return
    let anim = null

    summary.addEventListener('click', event => {
      if (reduce) return
      event.preventDefault()
      const closing = details.classList.contains('is-opening') || (details.open && !details.classList.contains('is-closing'))
      const start = content.offsetHeight
      if (anim) anim.cancel()

      if (closing) {
        details.classList.add('is-closing')
        anim = content.animate(
          [{ height: start + 'px', opacity: 1 }, { height: '0px', opacity: 0 }],
          { duration: DURATION, easing: EASING }
        )
        anim.onfinish = () => { details.open = false; details.classList.remove('is-closing'); anim = null }
      } else {
        details.open = true
        details.classList.add('is-opening')
        details.classList.remove('is-closing')
        const end = content.scrollHeight
        anim = content.animate(
          [{ height: start + 'px', opacity: 0 }, { height: end + 'px', opacity: 1 }],
          { duration: DURATION, easing: EASING }
        )
        anim.onfinish = () => { details.classList.remove('is-opening'); anim = null }
      }
      anim.oncancel = () => details.classList.remove('is-opening', 'is-closing')
    })
  })
})()
