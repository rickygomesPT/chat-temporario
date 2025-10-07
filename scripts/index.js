// ===== Funções da página inicial =====

function createRoom() {
  const creator = document.getElementById('creatorName').value.trim();
  const roomName = document.getElementById('roomName').value.trim();
  const roomCode = document.getElementById('roomCode').value.trim();
  const roomTimeMin = parseInt(document.getElementById('roomTime').value) || 10;

  if (!creator || !roomName || !roomCode) return alert("Preencha todos os campos.");

  const roomData = {
    roomName: roomName,
    creator: creator,
    createdAt: Date.now(),
    roomDuration: roomTimeMin * 60 * 1000,
    roomExpiresAt: Date.now() + roomTimeMin * 60 * 1000
  };

  localStorage.setItem("roomData", JSON.stringify(roomData));
  localStorage.setItem("roomCode", roomCode);
  localStorage.setItem("userName", creator);

  window.location.href = "./chat.html";
}

function joinRoom() {
  const user = document.getElementById('userName').value.trim();
  const roomCode = document.getElementById('joinRoomCode').value.trim();

  if (!user || !roomCode) {
    alert("Preencha todos os campos.");
    return;
  }

  // Verificar se a sala existe no Firebase antes de entrar
  const db = firebase.database();
  db.ref("rooms/" + roomCode).get().then(snapshot => {
    if (snapshot.exists()) {
      // Sala existe → entrar
      localStorage.setItem("roomCode", roomCode);
      localStorage.setItem("userName", user);
      window.location.href = "./chat.html";
    } else {
      // Sala não existe → erro
      alert("⚠️ A sala com o código '" + roomCode + "' não existe!");
    }
  }).catch(error => {
    console.error("Erro ao verificar a sala:", error);
    alert("Ocorreu um erro ao tentar aceder à sala.");
  });
}

