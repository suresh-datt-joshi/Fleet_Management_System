export const dismissHtmlSplash = () => {
  const el = document.getElementById('app-splash');
  if (!el) return;

  el.classList.add('app-splash--hide');
  window.setTimeout(() => {
    el.remove();
    document.documentElement.style.overflow = 'auto';
    document.body.style.overflow = 'auto';
  }, 450);
};
