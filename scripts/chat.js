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

// Pegar dados da sala do localStorage
const localRoomData = JSON.parse(localStorage.getItem("roomData"));

// Referência da sala
const roomRef = database.ref("rooms/" + roomCode);

// Criar a sala no Firebase caso ainda não exista
roomRef.get().then(snapshot => {
  if (!snapshot.exists() && localRoomData) {
    roomRef.set(localRoomData);
  }
});

// Atualizar topo da sala imediatamente depois de criar a sala
if (localRoomData) {
  document.getElementById("roomTitle").textContent = localRoomData.roomName || "Sala";
  document.getElementById("roomCode").textContent = "Código: " + roomCode;
  if (localRoomData.roomExpiresAt) {
  const remainingMin = Math.max(0, Math.ceil((localRoomData.roomExpiresAt - Date.now()) / 60000));
  countdownEl.textContent = `Sala expira em ${remainingMin}m`;
      } else {
        countdownEl.textContent = `Sala expira em ${Math.ceil((localRoomData.roomDuration || 10 * 60 * 1000) / 60000)}m`;
}
}

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
    if (!snap.exists()) {
      countdownEl.textContent = "Sala expirada!";
      return;
    }

    const room = snap.val();

    // Garantir que createdAt e roomDuration são números
    const createdAt = Number(room.createdAt) || Date.now();
    const roomDuration = Number(room.roomDuration) || 10 * 60 * 1000;

    // Calcula a hora de expiração
    const expires = Number(room.roomExpiresAt) || (createdAt + roomDuration);

    const remaining = expires - Date.now();

    if (remaining <= 0) {
      countdownEl.textContent = "Sala expirada!";
  
  // Apagar automaticamente após 5 segundos
  setTimeout(() => {
    database.ref("rooms/" + roomCode).remove()
      .then(() => {
          console.log("Sala expirada removida automaticamente.");
          alert("A sala expirou e foi eliminada.");
          window.location.href = "index.html";
          });
     }, 5000);
    return;
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

  // Limite de 8 MB (limite do uguu.se)
  if (file.size > 8 * 1024 * 1024) {
    alert("O ficheiro é demasiado grande (máx. 8MB).");
    return;
  }

  const formData = new FormData();
  formData.append("file", file);

  // Uguu.se API – sem CORS!
  fetch("https://uguu.se/api.php?d=upload-tool", {
    method: "POST",
    body: formData
  })
    .then(res => res.text())
    .then(link => {
      // Envia mensagem com link do ficheiro
      const msgData = {
        user: userName,
        fileName: file.name,
        fileUrl: link.trim(),
        timestamp: Date.now()
      };
      roomRef.push(msgData);
      fileInput.value = "";
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
