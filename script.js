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

// Inicializa Firebase
firebase.initializeApp(firebaseConfig);
const database = firebase.database();

// Variáveis globais
let roomCodeGlobal = "";
let userNameGlobal = "";

// Criar Sala
function createRoom() {
    const creator = document.getElementById('creatorName').value.trim();
    const roomName = document.getElementById('roomName').value.trim();
    const roomCode = document.getElementById('roomCode').value.trim();

    if (!creator || !roomName || !roomCode) return alert("Preencha todos os campos.");

    database.ref("rooms/" + roomCode).set({
        roomName: roomName,
        creator: creator,
        createdAt: Date.now()
    }, (error) => {
        if (!error) {
            localStorage.setItem("userName", creator);
            localStorage.setItem("roomCode", roomCode);
            window.location.href = "chat.html";
        }
    });
}

// Entrar Sala
function joinRoom() {
    const user = document.getElementById('userName').value.trim();
    const roomCode = document.getElementById('joinRoomCode').value.trim();

    if (!user || !roomCode) return alert("Preencha todos os campos.");

    database.ref("rooms/" + roomCode).get().then((snapshot) => {
        if (snapshot.exists()) {
            localStorage.setItem("userName", user);
            localStorage.setItem("roomCode", roomCode);
            window.location.href = "chat.html";
        } else {
            alert("Sala não encontrada.");
        }
    });
}

// Chat
if (window.location.pathname.endsWith("chat.html")) {
    const chatBox = document.getElementById("chatMessages");
    const roomCode = localStorage.getItem("roomCode");
    const userName = localStorage.getItem("userName");
    roomCodeGlobal = roomCode;
    userNameGlobal = userName;

    const roomRef = database.ref("rooms/" + roomCode + "/messages");

    // Título da sala
    database.ref("rooms/" + roomCode).get().then(snap => {
        if (snap.exists()) document.getElementById("roomTitle").textContent = snap.val().roomName;
    });

    // Ouvir novas mensagens
    roomRef.on("value", (snapshot) => {
        chatBox.innerHTML = "";
        const messages = snapshot.val() || {};
        Object.values(messages).forEach(msg => {
            const div = document.createElement("div");
            div.className = "chat-message " + (msg.user === userName ? "user" : "other");
            div.textContent = msg.user + ": " + msg.text;
            chatBox.appendChild(div);
        });
        chatBox.scrollTop = chatBox.scrollHeight;
    });

    // Enviar mensagem
    window.sendMessage = function() {
        const input = document.getElementById("messageInput");
        const text = input.value.trim();
        if (!text) return;

        roomRef.push({ user: userName, text: text, timestamp: Date.now() });
        input.value = "";
    };

    //Botão voltar à página principal
    function goBack() {
        window.location.href = "./index.html"; // ou caminho relativo correto
    }
   
    // Apagar sala
    window.deleteRoom = function() {
        if (confirm("Deseja apagar esta sala? Todas as mensagens serão perdidas.")) {
            database.ref("rooms/" + roomCode).remove();
            localStorage.removeItem("roomCode");
            localStorage.removeItem("userName");
            window.location.href = "index.html";
        }
    };

    // Apagar chat ao fechar a aba (se for o criador)
    window.addEventListener("beforeunload", () => {
        database.ref("rooms/" + roomCode).get().then(snap => {
            if (snap.exists() && snap.val().creator === userName) {
                database.ref("rooms/" + roomCode).remove();
            }
        });
    });
}
