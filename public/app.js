const helloMessageEl = document.querySelector('#helloMessage');
const messageListEl = document.querySelector('#messageList');
const messageCountEl = document.querySelector('#messageCount');
const refreshBtn = document.querySelector('#refreshBtn');
const simulateErrorBtn = document.querySelector('#simulateErrorBtn');
const formEl = document.querySelector('#messageForm');
const clearBtn = document.querySelector('#clearBtn');

const dialogEl = document.querySelector('#appDialog');
const dialogTitleEl = document.querySelector('#dialogTitle');
const dialogMessageEl = document.querySelector('#dialogMessage');
const dialogConfirmBtn = dialogEl.querySelector('button[value="confirm"]');
const dialogCancelBtn = dialogEl.querySelector('button[value="cancel"]');

async function fetchJSON(url, options) {
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
    },
    ...options,
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMessage = payload?.error ?? 'unbekannter_fehler';
    const error = new Error(errorMessage);
    error.status = response.status;
    throw error;
  }

  return payload;
}

function showDialog({ title, message, confirmText = 'OK', cancelText = 'Schließen', hideCancel = false }) {
  dialogTitleEl.textContent = title;
  dialogMessageEl.textContent = message;
  dialogConfirmBtn.textContent = confirmText;
  dialogCancelBtn.textContent = cancelText;
  dialogCancelBtn.style.display = hideCancel ? 'none' : 'inline-flex';

  return new Promise((resolve) => {
    const handleClose = () => {
      dialogEl.removeEventListener('close', handleClose);
      resolve(dialogEl.returnValue === 'confirm');
    };

    dialogEl.addEventListener('close', handleClose, { once: true });
    dialogEl.showModal();
  });
}

async function loadGreeting() {
  try {
    helloMessageEl.textContent = 'Lade Begrüßung…';
    const { data } = await fetchJSON('/api/hello');
    helloMessageEl.textContent = data?.text ?? 'Keine Nachricht gefunden.';
  } catch (error) {
    helloMessageEl.textContent = 'Keine Begrüßung verfügbar.';
    await showDialog({
      title: 'Fehler beim Laden',
      message: `Status ${error.status ?? '?'}: ${error.message}`,
    });
  }
}

function renderMessages(messages) {
  messageListEl.innerHTML = '';

  messages.forEach((message) => {
    const li = document.createElement('li');
    const text = document.createElement('p');
    text.textContent = message.text;
    text.className = 'message-text';

    const meta = document.createElement('span');
    meta.className = 'message-meta';
    meta.textContent = `#${message.id} · ${new Date(message.created_at).toLocaleString()}`;

    li.append(text, meta);
    messageListEl.appendChild(li);
  });

  messageCountEl.textContent = String(messages.length);
}

async function loadMessages() {
  try {
    const { data } = await fetchJSON('/api/messages');
    renderMessages(data);
  } catch (error) {
    renderMessages([]);
    await showDialog({
      title: 'Fehler beim Laden',
      message: `Status ${error.status ?? '?'}: ${error.message}`,
    });
  }
}

async function handleFormSubmit(event) {
  event.preventDefault();
  const formData = new FormData(formEl);
  const text = formData.get('text');

  try {
    await fetchJSON('/api/messages', {
      method: 'POST',
      body: JSON.stringify({ text }),
    });

    formEl.reset();

    await showDialog({
      title: 'Gespeichert',
      message: 'Der neue Eintrag wurde gespeichert.',
      hideCancel: true,
      confirmText: 'Weiter',
    });

    await Promise.all([loadGreeting(), loadMessages()]);
  } catch (error) {
    await showDialog({
      title: 'Speichern fehlgeschlagen',
      message: `Status ${error.status ?? '?'}: ${error.message}`,
    });
  }
}

async function handleSimulateError() {
  try {
    await fetchJSON('/api/messages/simulate-error');
  } catch (error) {
    await showDialog({
      title: 'Demonstrationsfehler',
      message: `Status ${error.status ?? '?'}: ${error.message}`,
    });
  }
}

async function handleClearForm() {
  const confirmed = await showDialog({
    title: 'Formular leeren?',
    message: 'Möchtest du den eingegebenen Text wirklich verwerfen?',
    confirmText: 'Ja, verwerfen',
    cancelText: 'Nein',
  });

  if (confirmed) {
    formEl.reset();
  }
}

refreshBtn.addEventListener('click', async () => {
  await Promise.all([loadGreeting(), loadMessages()]);
});

simulateErrorBtn.addEventListener('click', handleSimulateError);
formEl.addEventListener('submit', handleFormSubmit);
clearBtn.addEventListener('click', handleClearForm);

await Promise.all([loadGreeting(), loadMessages()]);

