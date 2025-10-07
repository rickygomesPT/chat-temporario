// firebaseConfig.js
// Configuração do Firebase
const firebaseConfig = {
  apiKey: "AIzaSyDT6QUagkLGAh3QzmmwDATtRlsg2DbwRRw",
  authDomain: "world-tycoon-sxop6.firebaseapp.com",
  databaseURL: "https://world-tycoon-sxop6-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "world-tycoon-sxop6",
  storageBucket: "world-tycoon-sxop6.firebasestorage.app",
  messagingSenderId: "1091254344255",
  appId: "1:1091254344255:web:4d45ef9db876895d7e768a"
};

// Inicializa Firebase apenas se ainda não estiver inicializado
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}


