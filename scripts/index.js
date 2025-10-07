// scripts/index.js

// Inicializa Firebase
const database = firebase.database();

// ===== Funções da página inicial =====
function createRoom() {
  const creator = document.getElementById('creatorName').value.trim();
  const roomName = document.getElementById('roomName').value.trim();
  const roomCode = document.getElementById('roomCode').value.trim();
  const roomTimeMin = parseInt(document.getElementById('roomTime').value) || 10;

  if (!creator || !roomName || !roomCode) return alert("Preencha todos os campos.");

  const roomRef = database.ref("rooms/" + roomCode);

  // Verifica se já existe uma sala com este código
  roomRef.get().then(snapshot => {
    if (snapshot.exists()) {
      alert("❌ Já existe uma sala com este código. Escolhe outro.");
      return;
    }

    // Se não existir, cria
    const roomData = {
      roomName: roomName,
      creator: creator,
      createdAt: Date.now(),
      roomDuration: roomTimeMin * 60 * 1000,
      roomExpiresAt: Date.now() + roomTimeMin * 60 * 1000
    };

    // Adiciona à base de dados
    roomRef.set(roomData).then(() => {
      // Guarda dados localmente
      localStorage.setItem("roomData", JSON.stringify(roomData));
      localStorage.setItem("roomCode", roomCode);
      localStorage.setItem("userName", creator);

      window.location.href = "./chat.html";
    });
  });
}

function joinRoom() {
  const user = document.getElementById('userName').value.trim();
  const roomCode = document.getElementById('joinRoomCode').value.trim();
  if (!user || !roomCode) return alert("Preencha todos os campos.");

  localStorage.setItem("roomCode", roomCode);
  localStorage.setItem("userName", user);
  window.location.href = "./chat.html";
}
