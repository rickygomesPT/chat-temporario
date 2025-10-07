// ⚠️ Altere estas variáveis com suas credenciais Firebase
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

// Variáveis globais
let roomCodeGlobal = "";
let userNameGlobal = "";

// ====== INDEX.HTML ======
function createRoom() {
    const creator = document.getElementById('creatorName').value.trim();
    const roomName = document.getElementById('roomName').value.trim();
    const roomCode = document.getElementById('roomCode').value.trim();
    const roomTimeMin = parseInt(document.getElementById('roomTime').value) || 10;

    if (!creator || !roomName || !roomCode) return alert("Preencha todos os campos.");

    database.ref("rooms/" + roomCode).set({
        roomName: roomName,
        creator: creator,
        createdAt: Date.now(),
        roomDuration: roomTimeMin * 60 * 1000 // converter para ms
    }, (error) => {
        if (!error) {
            localStorage.setItem("userName", creator);
            localStorage.setItem("roomCode", roomCode);
            window.location.href = "./chat.html";
        }
    });
}

function joinRoom() {
    const user = document.getElementById('userName').value.trim();
    const roomCode = document.getElementById('joinRoomCode').value.trim();
    if (!user || !roomCode) return alert("Preencha todos os campos.");

    database.ref("rooms/" + roomCode).get().then((snapshot) => {
        if (snapshot.exists()) {
            localStorage.setItem("userName", user);
            localStorage.setItem("roomCode", roomCode);
            window.location.href = "./chat.html";
        } else {
            alert("Sala não encontrada.");
        }
    });
}

// ====== CHAT.HTML ======
if (window.location.pathname.endsWith("chat.html")) {
    const chatBox = document.getElementById("chatMessages");
    const countdownEl = document.getElementById("countdown");

    roomCodeGlobal = localStorage.getItem("roomCode");
    userNameGlobal = localStorage.getItem("userName");
    const roomRef = database.ref("rooms/" + roomCodeGlobal + "/messages");

    // Título da sala
    database.ref("rooms/" + roomCodeGlobal).get().then(snap => {
        if (snap.exists()) document.getElementById("roomTitle").textContent = snap.val().roomName;
    });

    // Ouvir novas mensagens
    roomRef.on("value", (snapshot) => {
        chatBox.innerHTML = "";
        const messages = snapshot.val() || {};
        Object.values(messages).forEach(msg => {
            const div = document.createElement("div");
            div.className = "chat-message " + (msg.user === userNameGlobal ? "user" : "other");
            if(msg.file){
                div.innerHTML = `${msg.user}: <a href="${msg.file}" target="_blank">${msg.fileName}</a>`;
            } else {
                div.textContent = `${msg.user}: ${msg.text}`;
            }
            chatBox.appendChild(div);
        });
        chatBox.scrollTop = chatBox.scrollHeight;
    });

    // Enviar mensagem
    window.sendMessage = function() {
        const input = document.getElementById("messageInput");
        const text = input.value.trim();
        if(!text) return;

        roomRef.push({ user: userNameGlobal, text: text, timestamp: Date.now() });
        input.value = "";
    };

    // Upload arquivo
    window.uploadFile = function() {
        const file = document.getElementById("fileInput").files[0];
        if(!file) return;
        if(file.size > 2*1024*1024) return alert("Arquivo muito grande! Max 2MB.");

        const fileRef = storage.ref(`${roomCodeGlobal}/${Date.now()}_${file.name}`);
        fileRef.put(file).then(snapshot => {
            snapshot.ref.getDownloadURL().then(url => {
                roomRef.push({ user: userNameGlobal, file: url, fileName: file.name, timestamp: Date.now() });
            });
        });
    };

    // Contador da sala
    function updateCountdown() {
        database.ref("rooms/" + roomCodeGlobal).get().then(snap => {
            if(!snap.exists()) return;
            const room = snap.val();
            const duration = room.roomDuration || 10*60*1000;
            const remaining = (room.createdAt + duration) - Date.now();
            if(remaining <= 0){
                countdownEl.textContent = "Sala expirada!";
            } else {
                const minutes = Math.floor(remaining / 60000);
                const seconds = Math.floor((remaining % 60000)/1000);
                countdownEl.textContent = `Sala expira em ${minutes}m ${seconds}s`;
            }
        });
    }
    setInterval(updateCountdown, 1000);

    // Editar tempo da sala
    window.editRoomTime = function() {
        const newTime = parseInt(document.getElementById("newTime").value);
        if(!newTime || newTime < 1) return alert("Digite um tempo válido.");
        database.ref("rooms/" + roomCodeGlobal).update({ roomDuration: newTime*60*1000 });
    };

    // Botão voltar
    window.goBack = function() {
        window.location.href = "./index.html";
    };

    // Apagar sala
    window.deleteRoom = function() {
        if(confirm("Deseja apagar esta sala? Todas as mensagens serão perdidas.")){
            database.ref("rooms/" + roomCodeGlobal).remove();
            localStorage.removeItem("roomCode");
            localStorage.removeItem("userName");
            window.location.href = "./index.html";
        }
    };
}
