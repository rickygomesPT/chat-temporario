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
  const file = document.getElementById("fileInput").files[0];
  if (!file) return;
  if (file.size > 2 * 1024 * 1024) return alert("Arquivo muito grande! Máx: 2MB.");

  const fileRef = storage.ref(`${roomCode}/${Date.now()}_${file.name}`);
  fileRef.put(file).then(snapshot => {
    snapshot.ref.getDownloadURL().then(url => {
      roomRef.push({ user: userName, file: url, fileName: file.name, timestamp: Date.now() });
    });
  });
}

// Contagem decrescente
function updateCountdown() {
  database.ref("rooms/" + roomCode).get().then(snap => {
    if (!snap.exists()) return;
    const room = snap.val();
    const duration = room.roomDuration || 10 * 60 * 1000;
    const remaining = (room.createdAt + duration) - Date.now();
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

// Editar tempo
function editRoomTime() {
  const newTime = parseInt(document.getElementById("newTime").value);
  if (!newTime || newTime < 1) return alert("Digite um tempo válido.");
  database.ref("rooms/" + roomCode).update({ roomDuration: newTime * 60 * 1000 });
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
