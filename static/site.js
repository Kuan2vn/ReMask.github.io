const backToTop = document.querySelector('.back-to-top');
window.addEventListener('scroll', () => { backToTop.hidden = window.scrollY < 700; }, { passive: true });
backToTop.addEventListener('click', () => { window.scrollTo({ top: 0 }); });
