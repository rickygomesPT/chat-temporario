// ===== Inicializar Firebase apenas no chat =====
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

let roomCode = localStorage.getItem("roomCode");
let userName = localStorage.getItem("userName");
const chatBox = document.getElementById("chatMessages");
const countdownEl = document.getElementById("countdown");

const roomRef = database.ref("rooms/" + roomCode + "/messages");

// Criar sala no Firebase se ainda não existir
database.ref("rooms/" + roomCode).get().then(snapshot => {
  if (!snapshot.exists()) {
    const localRoomData = JSON.parse(localStorage.getItem("roomData"));
    if (localRoomData) database.ref("rooms/" + roomCode).set(localRoomData);
  } else {
    const room = snapshot.val();
    document.getElementById("roomTitle").textContent = room.roomName || 'Sala';
    document.getElementById("roomCode").textContent = 'Código: ' + roomCode;
  }
});

// Ouvir mensagens
roomRef.on("value", (snapshot) => {
  chatBox.innerHTML = "";
  const messages = snapshot.val() || {};
  Object.values(messages).forEach(msg => {
    const div = document.createElement("div");
    div.className = "chat-message " + (msg.user === userName ? "user" : "other");
    if (msg.file) {
      div.innerHTML = `${msg.user}: <a href="${msg.file}" target="_blank">${msg.fileName}</a>`;
    } else {
      div.textContent = `${msg.user}: ${msg.text}`;
    }
    chatBox.appendChild(div);
  });
  chatBox.scrollTop = chatBox.scrollHeight;
});

// Enviar mensagem
function sendMessage() {
  const input = document.getElementById("messageInput");
  const text = input.value.trim();
  if (!text) return;
  roomRef.push({ user: userName, text: text, timestamp: Date.now() });
  input.value = "";
}

// Upload de ficheiro
function uploadFile() {
  const fileInput = document.getElementById("fileInput");
  const file = fileInput.files[0];
  if (!file) return alert("Escolha um ficheiro.");
  if (file.size > 2 * 1024 * 1024) return alert("Arquivo muito grande! Máx: 2MB.");

  // debug rápido: confirmar storage configurado
  if (!storage || typeof storage.ref !== 'function') {
    console.error('Firebase Storage não está inicializado. Verifica os scripts e o storageBucket do config.');
    return alert('Erro interno: Storage não inicializado (ver console).');
  }

  const fileRef = storage.ref(`${roomCode}/${Date.now()}_${file.name}`);
  const uploadTask = fileRef.put(file);

  // criar UI de progresso simples (opcional)
  const progressEl = document.createElement('div');
  progressEl.className = "text-center small text-muted";
  progressEl.textContent = "A enviar...";
  chatBox.appendChild(progressEl);
  chatBox.scrollTop = chatBox.scrollHeight;

  uploadTask.on('state_changed',
    snapshot => {
      const percent = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
      progressEl.textContent = `Upload: ${percent}%`;
    },
    error => {
      console.error('Upload error:', error);
      progressEl.textContent = "Erro no upload.";
      setTimeout(() => progressEl.remove(), 3000);
    },
    () => {
      uploadTask.snapshot.ref.getDownloadURL().then(url => {
        // push mensagem com ficheiro
        roomRef.push({
          user: userName,
          file: url,
          fileName: file.name,
          timestamp: Date.now()
        });
        progressEl.textContent = "Ficheiro enviado!";
        setTimeout(() => progressEl.remove(), 1500);
        fileInput.value = ""; // limpar input
      });
    }
  );
}


// Contagem decrescente
function updateCountdown() {
  database.ref("rooms/" + roomCode).get().then(snap => {
    if (!snap.exists()) return;
    const room = snap.val();
    // prefer roomExpiresAt, fallback para createdAt + roomDuration
    const expires = room.roomExpiresAt || (room.createdAt + (room.roomDuration || 10*60*1000));
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
//setInterval(updateCountdown, 1000);

// Editar tempo
function editRoomTime() {
  const newTime = parseInt(document.getElementById("newTime").value, 10);
  if (!newTime || newTime < 1) return alert("Digite um tempo válido.");
  const newDurationMs = newTime * 60 * 1000;
  const newExpiresAt = Date.now() + newDurationMs;
  database.ref("rooms/" + roomCode).update({
    roomDuration: newDurationMs,
    roomExpiresAt: newExpiresAt
  }).then(() => {
    // feedback imediato (opcional)
    console.log("Tempo atualizado para", newTime, "minutos");
  });
}

// Voltar e apagar
function goBack() {
  window.location.href = "./index.html";
}

function deleteRoom() {
  if (confirm("Deseja apagar esta sala?")) {
    database.ref("rooms/" + roomCode).remove();
    localStorage.clear();
    window.location.href = "./index.html";
  }
}
