
async function loadInclude(id, file, callback) {
  const el = document.getElementById(id);
  if (!el) {
    console.warn(`Element with id '${id}' not found.`);
    return;
  }

  try {
    const res = await fetch(file);
    if (!res.ok) throw new Error(`HTTP ${res.status} - ${res.statusText}`);
    const html = await res.text();
    el.innerHTML = html;
    if (callback) callback();
  } catch (err) {
    el.innerHTML = `<p style="color: red;">Failed to load ${file}</p>`;
    console.error(`Failed to load ${file}:`, err);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const prefix = window.location.pathname.includes('/html/') ? '' : 'html/';

  loadInclude('header', `${prefix}header.html`, () => {
    const script = document.createElement('script');
    script.src = `/js/menu-loader.js`;  // Use root-relative path
    document.body.appendChild(script);
  });

  loadInclude('footer', `${prefix}footer.html`, () => {
    const yearSpan = document.getElementById('year');
    if (yearSpan) {
      yearSpan.textContent = new Date().getFullYear();
      console.log(`✅ Footer loaded. Year set to ${new Date().getFullYear()}`);
    }
  });
});
