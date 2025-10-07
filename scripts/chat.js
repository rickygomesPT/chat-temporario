// chat.js

// Inicializar Firebase
const firebaseConfig = {
  apiKey: "AIzaSyDT6QUagkLGAh3QzmmwDATtRlsg2DbwRRw",
  authDomain: "world-tycoon-sxop6.firebaseapp.com",
  databaseURL: "https://world-tycoon-sxop6-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "world-tycoon-sxop6",
  storageBucket: "world-tycoon-sxop6.firebasestorage.app",
  messagingSenderId: "1091254344255",
  appId: "1:1091254344255:web:4d45ef9db876895d7e768a"
};

firebase.initializeApp(firebaseConfig);

const database = firebase.database();
const storage = firebase.storage();

const chatBox = document.getElementById("chatBox");
const messageInput = document.getElementById("messageInput");
const countdownEl = document.getElementById("countdown");
const fileInput = document.getElementById("fileInput");

let roomCode = localStorage.getItem("roomCode");
let userName = localStorage.getItem("userName");

if (!roomCode || !userName) {
  window.location.href = "index.html";
}

const roomRef = database.ref("rooms/" + roomCode);

// --- Header: nome da sala e código ---
database.ref("rooms/" + roomCode).get().then(snapshot => {
  if (!snapshot.exists()) return;
  const room = snapshot.val();
  document.getElementById("roomTitle").textContent = room.roomName || "Sala";
  document.getElementById("roomCode").textContent = "Código: " + roomCode;
});

// --- Enviar mensagem ---
function sendMessage() {
  const text = messageInput.value.trim();
  if (text === "") return;

  roomRef.push({
    user: userName,
    text: text,
    timestamp: Date.now()
  });

  messageInput.value = "";
}

// --- Receber mensagens ---
roomRef.on("value", snapshot => {
  chatBox.innerHTML = "";
  const data = snapshot.val();
  if (!data) return;

  Object.values(data).forEach(msg => {
    if (typeof msg !== "object" || (!msg.text && !msg.file)) return;

    const div = document.createElement("div");
    div.className = "chat-message " + (msg.user === userName ? "user" : "other");

    if (msg.file) {
      // Verifica se é imagem
      if (msg.fileName.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
        messageDiv.innerHTML += `<br><img src="${msg.fileUrl}" alt="${msg.fileName}" style="max-width:200px;border-radius:8px;margin-top:5px;">`;
      } else {
        messageDiv.innerHTML += `<br><a href="${msg.fileUrl}" target="_blank">📎 ${msg.fileName}</a>`;
      }
    } else {
      div.innerHTML = `${msg.user}: ${escapeHtml(msg.text || "")}`;
    }

    const ts = msg.timestamp || msg.time || 0;
    const timeStr = ts
      ? new Date(ts).toLocaleString("pt-PT", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          day: "2-digit",
          month: "2-digit"
        })
      : "";

    const timeEl = document.createElement("div");
    timeEl.className = "text-muted small mt-1";
    timeEl.textContent = timeStr;

    div.appendChild(timeEl);
    chatBox.appendChild(div);
  });

  chatBox.scrollTop = chatBox.scrollHeight;
});

function escapeHtml(unsafe) {
  return unsafe
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

// --- Countdown ---
function updateCountdown() {
  database.ref("rooms/" + roomCode).get().then(snap => {
    if (!snap.exists()) return;
    const room = snap.val();
    const expires =
      room.roomExpiresAt || (room.createdAt + (room.roomDuration || 10 * 60 * 1000));
    const remaining = expires - Date.now();

    if (remaining <= 0) {
      countdownEl.textContent = "Sala expirada!";
    } else {
      const minutes = Math.floor(remaining / 60000);
      const seconds = Math.floor((remaining % 60000) / 1000);
      countdownEl.textContent = `Sala expira em ${minutes}m ${seconds}s`;
    }
  });
}

setInterval(updateCountdown, 1000);

// --- Editar tempo da sala ---
function editRoomTime() {
  const newTime = parseInt(document.getElementById("newTime").value, 10);
  if (!newTime || newTime < 1) return alert("Digite um tempo válido.");

  const newDurationMs = newTime * 60 * 1000;
  const newExpiresAt = Date.now() + newDurationMs;

  database
    .ref("rooms/" + roomCode)
    .update({
      roomDuration: newDurationMs,
      roomExpiresAt: newExpiresAt
    })
    .then(() => {
      console.log("Tempo atualizado para", newTime, "minutos");
    });
}

// --- Função para enviar ficheiros via file.io ---
function uploadFile() {
  const fileInput = document.getElementById("fileInput");
  const file = fileInput.files[0];
  if (!file) {
    alert("Escolhe um ficheiro primeiro!");
    return;
  }

  // Criar FormData para enviar o ficheiro
  const formData = new FormData();
  formData.append("file", file);

  // Enviar ficheiro para File.io
  fetch("https://corsproxy.io/?https://file.io", {
    method: "POST",
    body: formData
  })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        // Envia a mensagem para o Firebase com o link do ficheiro
        const msgData = {
          user: userName,
          fileName: file.name,
          fileUrl: data.link,
          timestamp: Date.now()
        };
        roomRef.push(msgData);
        fileInput.value = ""; // limpar input
      } else {
        alert("Erro ao enviar o ficheiro. Tenta novamente.");
        console.error(data);
      }
    })
    .catch(err => {
      console.error("Erro no upload:", err);
      alert("Erro ao enviar o ficheiro.");
    });
}


// --- Apagar sala manualmente ---
function deleteRoom() {
  if (
    confirm(
      "Deseja apagar esta sala? Todas as mensagens e ficheiros serão eliminados."
    )
  ) {
    database.ref("rooms/" + roomCode).remove();
    localStorage.removeItem("roomCode");
    localStorage.removeItem("userName");
    window.location.href = "index.html";
  }
}

// --- Botão voltar ---
function goBack() {
  window.location.href = "index.html";
}
