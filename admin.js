import {
  db,
  auth
} from "./firebase.js";


import {
  collection,
  addDoc
} from "https://www.gstatic.com/firebasejs/12.17.0/firebase-firestore.js";


import {
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/12.17.0/firebase-auth.js";


console.log("Admin system started");


/*
=========================
ADMIN LOGIN
=========================
*/

const loginBtn =
  document.getElementById("loginBtn");


if (loginBtn) {

  loginBtn.addEventListener(
    "click",
    async function () {

      const email =
        document
          .getElementById("email")
          .value
          .trim();


      const password =
        document
          .getElementById("password")
          .value;


      const message =
        document.getElementById(
          "loginMessage"
        );


      if (!email || !password) {

        message.innerHTML =
          "Please enter email and password.";

        return;

      }


      try {

        await signInWithEmailAndPassword(
          auth,
          email,
          password
        );


        window.location.href =
          "admin.html";


      }

      catch (error) {

        console.log(
          "Login error:",
          error
        );


        message.innerHTML =
          "Login failed. Check your email and password.";

      }

    }
  );

}


/*
=========================
PROJECT ADMIN PAGE
=========================
*/

const addKnowledgeBtn =
  document.getElementById(
    "addKnowledgeBtn"
  );


if (addKnowledgeBtn) {

  onAuthStateChanged(
    auth,
    function (user) {

      if (!user) {

        window.location.href =
          "admin-login.html";

      }

    }
  );

}


/*
=========================
ADD KNOWLEDGE
=========================
*/

if (addKnowledgeBtn) {

  addKnowledgeBtn.addEventListener(
    "click",
    async function () {

      const question =
        document
          .getElementById("question")
          .value
          .trim();


      const answer =
        document
          .getElementById("answer")
          .value
          .trim();


      const allKeywordsText =
        document
          .getElementById("allKeywords")
          .value
          .trim();


      const message =
        document.getElementById(
          "message"
        );


      /*
      =========================
      VALIDATION
      =========================
      */

      if (!question || !answer) {

        message.innerHTML =
          "Please enter both question and answer.";

        return;

      }


      /*
      =========================
      CONVERT KEYWORDS TO ARRAY
      =========================

      Each line becomes one
      possible search phrase.
      */

      const allKeywords =
        allKeywordsText
          .split("\n")
          .map(
            keyword =>
              keyword.trim()
          )
          .filter(
            keyword =>
              keyword.length > 0
          );


      try {

        /*
        =========================
        SAVE TO FIRESTORE
        =========================
        */

        await addDoc(
          collection(
            db,
            "knowledge"
          ),
          {

            question:
              question,

            answer:
              answer,

            allKeywords:
              allKeywords,

            createdAt:
              new Date()

          }
        );


        message.innerHTML =
          "Knowledge added successfully!";


        /*
        =========================
        CLEAR FORM
        =========================
        */

        document
          .getElementById(
            "question"
          )
          .value = "";


        document
          .getElementById(
            "answer"
          )
          .value = "";


        document
          .getElementById(
            "allKeywords"
          )
          .value = "";


      }

      catch (error) {

        console.log(
          "Knowledge error:",
          error
        );


        message.innerHTML =
          "Failed to add knowledge.";

      }

    }
  );

}


/*
=========================
LOGOUT
=========================
*/

const logoutBtn =
  document.getElementById(
    "logoutBtn"
  );


if (logoutBtn) {

  logoutBtn.addEventListener(
    "click",
    async function () {

      await signOut(auth);

      window.location.href =
        "admin-login.html";

    }
  );

}
