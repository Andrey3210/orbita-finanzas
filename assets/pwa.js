const install = document.querySelector('#install-app');
const dialog = document.querySelector('#install-dialog');
const standalone = matchMedia('(display-mode: standalone)');
let promptEvent;

const isInstalled = () => standalone.matches || navigator.standalone === true;
install.hidden = isInstalled();
standalone.addEventListener('change', () => { install.hidden = isInstalled(); });

window.addEventListener('beforeinstallprompt', event => {
  event.preventDefault();
  promptEvent = event;
});
window.addEventListener('appinstalled', () => {
  promptEvent = undefined;
  install.hidden = true;
});

function showInstructions() {
  const ios = /iPhone|iPad|iPod/i.test(navigator.userAgent)
    || (/Macintosh/i.test(navigator.userAgent) && navigator.maxTouchPoints > 1);
  const platform = ios ? 'ios' : /Android/i.test(navigator.userAgent) ? 'android' : null;
  for (const section of dialog.querySelectorAll('[data-platform]')) {
    section.hidden = Boolean(platform && section.dataset.platform !== platform);
  }
  dialog.showModal();
}

install.addEventListener('click', async () => {
  if (!promptEvent) {
    showInstructions();
    return;
  }
  const prompt = promptEvent;
  promptEvent = undefined;
  try {
    await prompt.prompt();
  } catch {
    showInstructions();
  }
});

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js', { updateViaCache: 'none' }).catch(error => {
    console.warn('foxio no pudo habilitar el acceso sin conexión.', error);
  });
}
