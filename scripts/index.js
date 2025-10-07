// scripts/index.js

// Inicializa Firebase
const database = firebase.database();

// ===== Funções da página inicial =====
function createRoom() {
  const creator = document.getElementById('creatorName').value.trim();
  const roomName = document.getElementById('roomName').value.trim();
  const roomCode = document.getElementById('roomCode').value.trim();
  const roomTimeMin = parseInt(document.getElementById('roomTime').value) || 10;

  if (!creator || !roomName || !roomCode) {
    return alert("Preencha todos os campos.");
  }

  const roomRef = database.ref("rooms/" + roomCode);

  roomRef.once("value", snapshot => {
    if (snapshot.exists()) {
      alert("Já existe uma sala com este código.");
    } else {
      const roomData = {
        roomName: roomName,
        creator: creator,
        createdAt: Date.now(),
        roomDuration: roomTimeMin * 60 * 1000,
        roomExpiresAt: Date.now() + roomTimeMin * 60 * 1000
      };

      roomRef.set(roomData).then(() => {
        localStorage.setItem("roomCode", roomCode);
        localStorage.setItem("userName", creator);
        window.location.href = "./chat.html";
      });
    }
  });
}


function joinRoom() {
  const userName = document.getElementById('userName').value.trim();
  const roomCode = document.getElementById('joinRoomCode').value.trim();

  if (!userName || !roomCode) {
    return alert("Preencha todos os campos.");
  }

  const roomRef = database.ref("rooms/" + roomCode);

  roomRef.once("value", snapshot => {
    if (snapshot.exists()) {
      localStorage.setItem("roomCode", roomCode);
      localStorage.setItem("userName", userName);
      window.location.href = "./chat.html";
    } else {
      alert("Sala não encontrada.");
    }
  });
}

