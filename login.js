/*
========================================================
RWANDA AI PLATFORM
USER LOGIN / SIGN UP
========================================================
*/

import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.17.0/firebase-auth.js";

import {
  auth
} from "./firebase.js";


/*
========================================================
ELEMENTS
========================================================
*/

const loginSection =
  document.getElementById(
    "loginSection"
  );


const signupSection =
  document.getElementById(
    "signupSection"
  );


const loginEmail =
  document.getElementById(
    "loginEmail"
  );


const loginPassword =
  document.getElementById(
    "loginPassword"
  );


const signupEmail =
  document.getElementById(
    "signupEmail"
  );


const signupPassword =
  document.getElementById(
    "signupPassword"
  );


const signupPassword2 =
  document.getElementById(
    "signupPassword2"
  );


const loginBtn =
  document.getElementById(
    "loginBtn"
  );


const signupBtn =
  document.getElementById(
    "signupBtn"
  );


const showSignupBtn =
  document.getElementById(
    "showSignupBtn"
  );


const showLoginBtn =
  document.getElementById(
    "showLoginBtn"
  );


const forgotPassword =
  document.getElementById(
    "forgotPassword"
  );


const authMessage =
  document.getElementById(
    "authMessage"
  );


/*
========================================================
MESSAGE
========================================================
*/

function showMessage(
  message,
  type = "error"
) {

  authMessage.textContent =
    message;


  authMessage.className =
    "message " +
    type;

}


/*
========================================================
SHOW LOGIN
========================================================
*/

function showLogin() {

  loginSection.classList.remove(
    "hidden"
  );


  signupSection.classList.add(
    "hidden"
  );


  showMessage(
    ""
  );

}


/*
========================================================
SHOW SIGNUP
========================================================
*/

function showSignup() {

  loginSection.classList.add(
    "hidden"
  );


  signupSection.classList.remove(
    "hidden"
  );


  showMessage(
    ""
  );

}


/*
========================================================
SHOW SIGNUP BUTTON
========================================================
*/

showSignupBtn.addEventListener(
  "click",
  showSignup
);


/*
========================================================
SHOW LOGIN BUTTON
========================================================
*/

showLoginBtn.addEventListener(
  "click",
  showLogin
);


/*
========================================================
LOGIN
========================================================
*/

loginBtn.addEventListener(
  "click",
  async function() {

    const email =
      loginEmail.value.trim();


    const password =
      loginPassword.value;


    if (!email) {

      showMessage(
        "Enter your email address."
      );

      return;

    }


    if (!password) {

      showMessage(
        "Enter your password."
      );

      return;

    }


    loginBtn.disabled =
      true;


    loginBtn.textContent =
      "Logging in...";


    try {

      await signInWithEmailAndPassword(

        auth,

        email,

        password

      );


      showMessage(
        "Login successful. Opening Rwanda AI...",
        "success"
      );


      setTimeout(
        function() {

          window.location.href =
            "ai.html";

        },
        700
      );


    } catch (error) {

      console.error(
        "Login error:",
        error
      );


      showMessage(
        getFirebaseErrorMessage(
          error
        )
      );

    } finally {

      loginBtn.disabled =
        false;


      loginBtn.textContent =
        "Login";

    }

  }
);


/*
========================================================
CREATE ACCOUNT
========================================================
*/

signupBtn.addEventListener(
  "click",
  async function() {

    const email =
      signupEmail.value.trim();


    const password =
      signupPassword.value;


    const password2 =
      signupPassword2.value;


    if (!email) {

      showMessage(
        "Enter your email address."
      );

      return;

    }


    if (password.length < 6) {

      showMessage(
        "Password must contain at least 6 characters."
      );

      return;

    }


    if (
      password !== password2
    ) {

      showMessage(
        "Passwords do not match."
      );

      return;

    }


    signupBtn.disabled =
      true;


    signupBtn.textContent =
      "Creating account...";


    try {

      await createUserWithEmailAndPassword(

        auth,

        email,

        password

      );


      showMessage(
        "Account created successfully. Opening Rwanda AI...",
        "success"
      );


      setTimeout(
        function() {

          window.location.href =
            "ai.html";

        },
        700
      );


    } catch (error) {

      console.error(
        "Signup error:",
        error
      );


      showMessage(
        getFirebaseErrorMessage(
          error
        )
      );

    } finally {

      signupBtn.disabled =
        false;


      signupBtn.textContent =
        "Create Account";

    }

  }
);


/*
========================================================
FORGOT PASSWORD
========================================================
*/

forgotPassword.addEventListener(
  "click",
  async function() {

    const email =
      loginEmail.value.trim();


    if (!email) {

      showMessage(
        "Enter your email first."
      );

      return;

    }


    try {

      await sendPasswordResetEmail(

        auth,

        email

      );


      showMessage(
        "Password reset email sent. Check your inbox.",
        "success"
      );


    } catch (error) {

      console.error(
        "Password reset error:",
        error
      );


      showMessage(
        getFirebaseErrorMessage(
          error
        )
      );

    }

  }
);


/*
========================================================
FIREBASE ERROR MESSAGES
========================================================
*/

function getFirebaseErrorMessage(
  error
) {

  const code =
    error.code || "";


  switch (code) {

    case "auth/invalid-email":

      return "The email address is not valid.";


    case "auth/user-not-found":

      return "No account was found with this email.";


    case "auth/wrong-password":

      return "Incorrect password.";


    case "auth/invalid-credential":

      return "Email or password is incorrect.";


    case "auth/email-already-in-use":

      return "This email already has an account.";


    case "auth/weak-password":

      return "Password is too weak. Use at least 6 characters.";


    case "auth/too-many-requests":

      return "Too many attempts. Please try again later.";


    case "auth/network-request-failed":

      return "Network error. Check your internet connection.";


    default:

      return (
        error.message ||
        "Authentication failed. Please try again."
      );

  }

}


/*
========================================================
CHECK CURRENT USER
========================================================
*/

onAuthStateChanged(
  auth,
  function(user) {

    if (user) {

      /*
      If already logged in,
      open Rwanda AI.
      */

      if (
        window.location.pathname.endsWith(
          "login.html"
        )
      ) {

        setTimeout(
          function() {

            window.location.href =
              "ai.html";

          },
          300
        );

      }

    }

  }
);