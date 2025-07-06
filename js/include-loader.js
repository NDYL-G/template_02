// js/include-loader.js
async function loadInclude(id, file) {
  const el = document.getElementById(id);
  if (!el) return;
  try {
    const res = await fetch(file);
    const html = await res.text();
    el.innerHTML = html;
  } catch (err) {
    el.innerHTML = `<p style="color: red;">Failed to load ${file}</p>`;
  }
}
document.addEventListener('DOMContentLoaded', () => {
  const prefix = window.location.pathname.includes('/html/') ? '' : 'html/';
  loadInclude('header', `${prefix}header.html`);
  loadInclude('footer', `${prefix}footer.html`);
});
