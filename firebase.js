import { initializeApp } from "https://www.gstatic.com/firebasejs/12.17.0/firebase-app.js";

import { getFirestore } from "https://www.gstatic.com/firebasejs/12.17.0/firebase-firestore.js";

// firebase configuration

const firebaseConfig = {
  apiKey:"AIzaSyAC4p2PggBGtInM0bfCjfxf5XV-wtHJP24",
  authDomain:"rwanda-ai-platform.firebaseapp.com",
 projectId:"rwanda-ai-platform",
 storageBucket:"rwanda-ai-platform.firebasestorage.app",
 messagingSenderId:"586349022009",
 appId:"1:586349022009:web:60655601e3119489d2b6e8"
};
  
  
 // Initialize firebase
 
 const app =
 initializeApp(firebaseConfig);
 
 // Initialize firebase
 
 const db =
 getFirestore(app);
 
 
 // Export database
 
 export { db }
 
 