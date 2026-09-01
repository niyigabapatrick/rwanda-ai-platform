/*
========================================
RWANDA AI PLATFORM MAIN SCRIPT
========================================
*/

import { db } from "./firebase.js";

import {
  collection,
  addDoc,
  getDocs
} from "https://www.gstatic.com/firebasejs/12.17.0/firebase-firestore.js";


console.log("Rwanda AI Platform started");


/*
========================================
GEMINI GOOGLE APPS SCRIPT WEB APP
========================================
*/

const GEMINI_URL =
  "https://script.google.com/macros/s/AKfycbyTAmEzsx0IXCVm7TwrDwO0K30gi7fCquiIwXHNvTWlZwhSKdw0db2v5FuhrPeoK3qF/exec";


let providers = [];


/*
========================================
LOAD PROVIDERS
========================================
*/

async function loadProviders() {

  try {

    const snapshot =
      await getDocs(
        collection(db, "providers")
      );

    providers = [];

    snapshot.forEach(function(doc) {

      providers.push({
        id: doc.id,
        ...doc.data()
      });

    });

    console.log(
      "Providers loaded:",
      providers
    );

  } catch (error) {

    console.error(
      "Provider loading error:",
      error
    );

  }

}

loadProviders();


/*
========================================
SERVICE SEARCH
========================================
*/

const searchBtn =
  document.getElementById("searchBtn");


if (searchBtn) {

  searchBtn.addEventListener(
    "click",
    function() {

      const searchInput =
        document.getElementById("searchInput");

      const resultBox =
        document.getElementById("result");


      if (!searchInput || !resultBox) {

        console.error(
          "Search elements not found."
        );

        return;

      }


      const searchValue =
        searchInput.value
          .toLowerCase()
          .trim();


      if (!searchValue) {

        resultBox.innerHTML =
          "<p>Please enter a search.</p>";

        return;

      }


      const result =
        providers.filter(function(item) {

          return (

            (
              item.service &&
              String(item.service)
                .toLowerCase()
                .includes(searchValue)
            )

            ||

            (
              item.category &&
              String(item.category)
                .toLowerCase()
                .includes(searchValue)
            )

            ||

            (
              item.location &&
              String(item.location)
                .toLowerCase()
                .includes(searchValue)
            )

            ||

            (
              item.name &&
              String(item.name)
                .toLowerCase()
                .includes(searchValue)
            )

          );

        });


      if (result.length > 0) {

        resultBox.innerHTML =
          result.map(function(item) {

            return `

              <div class="card">

                <h3>${escapeHTML(item.name || "")}</h3>

                <p>
                  Service:
                  ${escapeHTML(item.service || "")}
                </p>

                <p>
                  Price:
                  ${escapeHTML(item.price || "")}
                </p>

                <p>
                  Category:
                  ${escapeHTML(item.category || "")}
                </p>

                <p>
                  Location:
                  ${escapeHTML(item.location || "")}
                </p>

                <p>
                  Phone:
                  ${escapeHTML(item.phone || "")}
                </p>

              </div>

            `;

          }).join("");


      } else {

        resultBox.innerHTML =
          "<p>No provider found.</p>";

      }

    }
  );

}


/*
========================================
REGISTER PROVIDER
========================================
*/

const registerBtn =
  document.getElementById("registerBtn");


if (registerBtn) {

  registerBtn.addEventListener(
    "click",
    async function() {

      const nameElement =
        document.getElementById("name");

      const serviceElement =
        document.getElementById("service");

      const priceElement =
        document.getElementById("price");

      const categoryElement =
        document.getElementById("category");

      const locationElement =
        document.getElementById("location");

      const phoneElement =
        document.getElementById("phone");

      const message =
        document.getElementById("message");


      if (
        !nameElement ||
        !serviceElement ||
        !priceElement ||
        !categoryElement ||
        !locationElement ||
        !phoneElement ||
        !message
      ) {

        console.error(
          "Registration elements not found."
        );

        return;

      }


      const name =
        nameElement.value.trim();

      const service =
        serviceElement.value.trim();

      const price =
        priceElement.value.trim();

      const category =
        categoryElement.value.trim();

      const location =
        locationElement.value.trim();

      const phone =
        phoneElement.value.trim();


      if (
        !name ||
        !service ||
        !price ||
        !category ||
        !location ||
        !phone
      ) {

        message.innerHTML =
          "Please fill all fields.";

        return;

      }


      try {

        await addDoc(
          collection(db, "providers"),
          {

            name: name,

            service: service,

            price: price,

            category: category,

            location: location,

            phone: phone,

            createdAt: new Date()

          }
        );


        message.innerHTML =
          "Registration Successfully";


        nameElement.value = "";
        serviceElement.value = "";
        priceElement.value = "";
        categoryElement.value = "";
        locationElement.value = "";
        phoneElement.value = "";


        await loadProviders();


      } catch (error) {

        console.error(
          "Registration error:",
          error
        );


        message.innerHTML =
          error.message;

      }

    }
  );

}


/*
========================================
TEXT NORMALIZATION
========================================
*/

function normalizeText(text) {

  return String(text || "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();

}


/*
========================================
KNOWLEDGE BASE SCORE
========================================
*/

function calculateScore(
  userQuestion,
  data
) {

  const question =
    normalizeText(userQuestion);

  const savedQuestion =
    normalizeText(
      data.question
    );

  const keywords =
    normalizeText(
      data.keywords
    );


  const userWords =
    question
      .split(" ")
      .filter(function(word) {

        return word.length > 2;

      });


  let score = 0;


  userWords.forEach(function(word) {

    if (
      savedQuestion.includes(word)
    ) {

      score += 3;

    }


    if (
      keywords.includes(word)
    ) {

      score += 5;

    }

  });


  return score;

}


/*
========================================
MAIN AI FUNCTION
========================================
*/

async function askRwandaAI(
  question,
  answerBox
) {

  /*
  ========================================
  LOADING
  ========================================
  */

  answerBox.innerHTML =
    "<p>Ndimo gushaka igisubizo...</p>";


  try {

    /*
    ========================================
    STEP 1
    FIRESTORE KNOWLEDGE BASE
    ========================================
    */

    console.log(
      "Searching Firestore Knowledge Base..."
    );


    const snapshot =
      await getDocs(
        collection(db, "knowledge")
      );


    console.log(
      "Knowledge documents:",
      snapshot.size
    );


    let bestAnswer = "";

    let bestScore = 0;


    snapshot.forEach(function(doc) {

      const data =
        doc.data();


      const score =
        calculateScore(
          question,
          data
        );


      console.log(
        "Knowledge:",
        data.question,
        "Score:",
        score
      );


      if (
        score > bestScore
      ) {

        bestScore =
          score;

        bestAnswer =
          String(
            data.answer || ""
          );

      }

    });


    /*
    ========================================
    STEP 2
    KNOWLEDGE BASE ANSWER
    ========================================
    */

    if (
      bestScore >= 3 &&
      bestAnswer
    ) {

      console.log(
        "Answer found in Knowledge Base."
      );


      answerBox.innerHTML =
        "<p>" +
        escapeHTML(bestAnswer) +
        "</p>";


      speakAnswer(bestAnswer);

      return;

    }


    /*
    ========================================
    STEP 3
    GEMINI FALLBACK
    ========================================
    */

    console.log(
      "No suitable Knowledge Base answer."
    );

    console.log(
      "Sending question to Gemini..."
    );


    const requestBody = {

      question:
        question,

      systemInstruction:
        "You are Rwanda AI Assistant. Answer clearly, accurately and helpfully. When the question is about Rwanda, prioritize Rwanda-specific information. Respond in the same language used by the user."

    };


    const response =
      await fetch(
        GEMINI_URL,
        {

          method:
            "POST",

          headers: {

            "Content-Type":
              "text/plain;charset=utf-8"

          },

          body:
            JSON.stringify(
              requestBody
            )

        }
      );


    console.log(
      "Gemini HTTP status:",
      response.status
    );


    const responseText =
      await response.text();


    console.log(
      "Gemini raw response:",
      responseText
    );


    /*
    ========================================
    PARSE JSON
    ========================================
    */

    let result;


    try {

      result =
        JSON.parse(
          responseText
        );

    } catch (jsonError) {

      console.error(
        "Gemini returned invalid JSON:",
        jsonError
      );


      answerBox.innerHTML =
        "<p>Gemini yagarutse n'igisubizo kitari JSON. Reba Console.</p>";

      return;

    }


    /*
    ========================================
    GEMINI ERROR
    ========================================
    */

    if (
      result.error
    ) {

      console.error(
        "Gemini server error:",
        result
      );


      let errorMessage =
        "Gemini yanze gusubiza.";


      if (
        result.details
      ) {

        errorMessage +=
          " " +
          JSON.stringify(
            result.details
          );

      }


      answerBox.innerHTML =
        "<p>" +
        escapeHTML(
          errorMessage
        ) +
        "</p>";


      return;

    }


    /*
    ========================================
    GET ANSWER
    ========================================
    */

    const geminiAnswer =
      result.answer ||
      result.response ||
      result.text ||
      "";


    /*
    ========================================
    DISPLAY GEMINI ANSWER
    ========================================
    */

    if (
      geminiAnswer
    ) {

      console.log(
        "Gemini answer received."
      );


      answerBox.innerHTML =
        "<p>" +
        escapeHTML(
          String(geminiAnswer)
        ) +
        "</p>";


      speakAnswer(
        String(geminiAnswer)
      );


    } else {

      console.error(
        "Gemini returned no answer:",
        result
      );


      answerBox.innerHTML =
        "<p>Gemini ntiyagaruye igisubizo.</p>";

    }


  } catch (error) {

    console.error(
      "AI connection error:",
      error
    );


    answerBox.innerHTML =
      "<p>Habaye ikibazo cyo kuvugana na AI. Reba Console.</p>";

  }

}


/*
========================================
NORMAL AI ASSISTANT BUTTON
========================================
*/

const askBtn =
  document.getElementById("askBtn");


if (askBtn) {

  askBtn.addEventListener(
    "click",
    async function() {

      const questionInput =
        document.getElementById("question");

      const answerBox =
        document.getElementById("answer");


      if (
        !questionInput ||
        !answerBox
      ) {

        console.error(
          "AI elements not found."
        );

        return;

      }


      const question =
        questionInput.value.trim();


      if (!question) {

        answerBox.innerHTML =
          "<p>Please ask a question.</p>";

        return;

      }


      await askRwandaAI(
        question,
        answerBox
      );

    }
  );

}


/*
========================================
VOICE → AI
READ QUESTION FROM URL
========================================
*/

const urlParams =
  new URLSearchParams(
    window.location.search
  );


const voiceQuestion =
  urlParams.get(
    "question"
  );


if (
  voiceQuestion
) {

  const questionInput =
    document.getElementById(
      "question"
    );

  const answerBox =
    document.getElementById(
      "answer"
    );


  if (
    questionInput &&
    answerBox
  ) {

    console.log(
      "Voice question received:",
      voiceQuestion
    );


    questionInput.value =
      voiceQuestion;


    /*
    ========================================
    AUTO ASK AI
    ========================================
    */

    askRwandaAI(
      voiceQuestion,
      answerBox
    );

  }

}


/*
========================================
AI VOICE OUTPUT
========================================
*/

function speakAnswer(text) {

  if (
    !("speechSynthesis" in window)
  ) {

    console.log(
      "Speech synthesis is not supported."
    );

    return;

  }


  try {

    window.speechSynthesis.cancel();


    const speech =
      new SpeechSynthesisUtterance(
        String(text)
      );


    speech.lang =
      detectSpeechLanguage(
        text
      );


    speech.rate =
      0.95;


    speech.pitch =
      1;


    window.speechSynthesis.speak(
      speech
    );


  } catch (error) {

    console.error(
      "Speech synthesis error:",
      error
    );

  }

}


/*
========================================
LANGUAGE DETECTION
========================================
*/

function detectSpeechLanguage(text) {

  const value =
    String(text || "")
      .toLowerCase();


  /*
  KINYARWANDA
  */

  const kinyarwandaWords = [

    "ni",
    "iki",
    "iki?",
    "ese",
    "muri",
    "rwanda",
    "umuntu",
    "abantu",
    "amakuru",
    "ndashaka",
    "wabigenza",
    "gute",
    "iki",
    "nde",
    "hehe",
    "ryari"

  ];


  let kinyarwandaScore =
    0;


  kinyarwandaWords.forEach(
    function(word) {

      if (
        value.includes(
          word
        )
      ) {

        kinyarwandaScore++;

      }

    }
  );


  if (
    kinyarwandaScore >= 2
  ) {

    return "rw-RW";

  }


  /*
  DEFAULT
  */

  return "en-US";

}


/*
========================================
SECURITY
ESCAPE HTML
========================================
*/

function escapeHTML(text) {

  return String(text || "")
    .replace(
      /&/g,
      "&amp;"
    )
    .replace(
      /</g,
      "&lt;"
    )
    .replace(
      />/g,
      "&gt;"
    )
    .replace(
      /"/g,
      "&quot;"
    )
    .replace(
      /'/g,
      "&#039;"
    );

}