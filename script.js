/*
========================================
RWANDA AI PLATFORM
AI ASSISTANT
FIRESTORE KNOWLEDGE + GROQ
========================================
*/


/*
========================================
FIREBASE
========================================
*/

import {
  collection,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import {
  db
} from "./firebase.js";


/*
========================================
GROQ BACKEND
========================================
*/

const GROQ_URL =
  "https://script.google.com/macros/s/AKfycbzYcSa16qAHxpW4b-Tvwe8bjG0cGRtOa0XFXaFi3RjYNuZpauqZ9TOgNL4C4tqU9dhYiQ/exec";


/*
========================================
ELEMENTS
========================================
*/

const askBtn =
  document.getElementById("askBtn");


const questionInput =
  document.getElementById("question");


const answerBox =
  document.getElementById("answer");


/*
========================================
ESCAPE HTML
========================================
*/

function escapeHTML(text) {

  return String(text || "")

    .replace(/&/g, "&amp;")

    .replace(/</g, "&lt;")

    .replace(/>/g, "&gt;")

    .replace(/"/g, "&quot;")

    .replace(/'/g, "&#039;");

}


/*
========================================
FORMAT ANSWER
========================================
*/

function formatAnswer(text) {

  return escapeHTML(
    String(text || "").trim()
  )

    .replace(/\r\n/g, "\n")

    .replace(/\r/g, "\n")

    .replace(
      /\n\n+/g,
      "<br><br>"
    )

    .replace(
      /\n/g,
      "<br>"
    );

}


/*
========================================
NORMALIZE TEXT
========================================
*/

function normalizeText(text) {

  return String(text || "")

    .toLowerCase()

    .normalize("NFD")

    .replace(
      /[\u0300-\u036f]/g,
      ""
    )

    .replace(
      /[^\p{L}\p{N}\s]/gu,
      " "
    )

    .replace(
      /\s+/g,
      " "
    )

    .trim();

}


/*
========================================
CREATE WORDS
========================================
*/

function getWords(text) {

  return normalizeText(text)

    .split(" ")

    .filter(function(word) {

      return word.length >= 2;

    });

}


/*
========================================
CALCULATE MATCH
========================================
*/

function calculateMatch(
  question,
  item
) {

  const userText =
    normalizeText(
      question
    );


  const questionText =
    normalizeText(
      item.question
    );


  const keywordsText =
    normalizeText(
      Array.isArray(
        item.keywords
      )
        ? item.keywords.join(" ")
        : item.keywords || ""
    );


  const categoryText =
    normalizeText(
      item.category || ""
    );


  /*
  ======================================
  EXACT QUESTION
  ======================================
  */

  if (
    questionText &&
    userText === questionText
  ) {

    return 1000;

  }


  let score = 0;


  /*
  ======================================
  QUESTION CONTAINS
  ======================================
  */

  if (
    questionText &&
    (
      userText.includes(
        questionText
      ) ||
      questionText.includes(
        userText
      )
    )
  ) {

    score += 300;

  }


  /*
  ======================================
  QUESTION WORDS
  ======================================
  */

  const userWords =
    getWords(
      userText
    );


  const storedQuestionWords =
    getWords(
      questionText
    );


  storedQuestionWords.forEach(
    function(word) {

      if (
        userWords.includes(
          word
        )
      ) {

        score += 20;

      }

    }
  );


  /*
  ======================================
  KEYWORDS
  ======================================
  */

  const keywords =
    getWords(
      keywordsText
    );


  keywords.forEach(
    function(keyword) {

      if (
        userText.includes(
          keyword
        )
      ) {

        score += 60;

      }

    }
  );


  /*
  ======================================
  CATEGORY
  ======================================
  */

  if (
    categoryText &&
    userText.includes(
      categoryText
    )
  ) {

    score += 15;

  }


  return score;

}


/*
========================================
SEARCH FIRESTORE KNOWLEDGE
========================================
*/

async function searchKnowledge(
  question
) {

  try {

    const snapshot =
      await getDocs(
        collection(
          db,
          "knowledge"
        )
      );


    if (
      snapshot.empty
    ) {

      console.log(
        "Knowledge collection is empty."
      );

      return null;

    }


    let bestMatch =
      null;


    let bestScore =
      0;


    snapshot.forEach(
      function(doc) {

        const item =
          doc.data();


        /*
        ================================
        REQUIRE QUESTION + ANSWER
        ================================
        */

        if (
          !item.question ||
          !item.answer
        ) {

          return;

        }


        const score =
          calculateMatch(
            question,
            item
          );


        if (
          score > bestScore
        ) {

          bestScore =
            score;

          bestMatch = {

            id:
              doc.id,

            question:
              item.question,

            answer:
              item.answer,

            keywords:
              item.keywords || "",

            category:
              item.category || "",

            language:
              item.language || "",

            score:
              score

          };

        }

      }
    );


    /*
    ====================================
    MINIMUM MATCH
    ====================================
    */

    if (
      !bestMatch ||
      bestScore < 20
    ) {

      return null;

    }


    console.log(
      "Firestore knowledge match:",
      bestMatch
    );


    return bestMatch;


  } catch (error) {

    console.error(
      "Firestore knowledge search failed:",
      error
    );


    /*
    ====================================
    IMPORTANT:
    FIRESTORE ERROR DOES NOT STOP AI
    ====================================
    */

    return null;

  }

}


/*
========================================
CALL GROQ
========================================
*/

async function callGroq(
  question,
  knowledgeContext = ""
) {

  const systemInstruction =

    "You are Rwanda AI Assistant. " +

    "Give accurate, complete and useful answers. " +

    "Answer in Kinyarwanda when the user uses Kinyarwanda. " +

    "Answer in English when the user uses English. " +

    "Prioritize Rwanda-specific information when relevant. " +

    "Be clear, intelligent and direct. " +

    "Do not unnecessarily repeat the question.";


  let finalQuestion =
    question;


  /*
  ====================================
  USE FIRESTORE CONTEXT IF AVAILABLE
  ====================================
  */

  if (
    knowledgeContext
  ) {

    finalQuestion =

      "Use the following Rwanda AI " +
      "knowledge as helpful context. " +

      "If it directly answers the question, " +
      "use it accurately. " +

      "Do not mention that you received " +
      "a knowledge context.\n\n" +

      "KNOWLEDGE:\n" +

      knowledgeContext +

      "\n\nUSER QUESTION:\n" +

      question;

  }


  const response =
    await fetch(
      GROQ_URL,
      {

        method:
          "POST",

        headers: {

          "Content-Type":
            "text/plain;charset=utf-8"

        },

        body:
          JSON.stringify({

            question:
              finalQuestion,

            systemInstruction:
              systemInstruction

          })

        }

      );


  const responseText =
    await response.text();


  let data;


  try {

    data =
      JSON.parse(
        responseText
      );

  } catch (error) {

    throw new Error(
      "Groq returned invalid JSON."
    );

  }


  /*
  ====================================
  GROQ ERROR
  ====================================
  */

  if (
    !response.ok ||
    data.error
  ) {

    let message =
      data.error ||
      "Groq request failed.";


    if (
      typeof message ===
      "object"
    ) {

      message =
        message.message ||
        JSON.stringify(
          message
        );

    }


    throw new Error(
      message
    );

  }


  const answer =
    String(
      data.answer ||
      ""
    ).trim();


  if (!answer) {

    throw new Error(
      "Groq returned no answer."
    );

  }


  return {

    answer:
      answer,

    model:
      data.model ||
      "Groq",

    provider:
      data.provider ||
      "Groq"

  };

}


/*
========================================
VOICE AI
========================================
*/

function getSpeechVoices() {

  if (
    !("speechSynthesis" in window)
  ) {

    return [];

  }

  return window.speechSynthesis
    .getVoices();

}


/*
========================================
FIND FEMALE VOICE
========================================
*/

function findFemaleVoice() {

  const voices =
    getSpeechVoices();


  if (!voices.length) {

    return null;

  }


  /*
  ======================================
  FEMALE VOICE NAMES
  ======================================
  */

  const femaleNames = [

    "female",
    "woman",
    "samantha",
    "zira",
    "karen",
    "victoria",
    "susan",
    "google uk english female",
    "google us english"

  ];


  /*
  ======================================
  FIND FEMALE VOICE
  ======================================
  */

  const femaleVoice =
    voices.find(
      function(voice) {

        const name =
          voice.name.toLowerCase();

        return femaleNames.some(
          function(word) {

            return name.includes(
              word
            );

          }
        );

      }
    );


  return femaleVoice || null;

}


/*
========================================
DETECT LANGUAGE
========================================
*/

function detectSpeechLanguage(
  text
) {

  const value =
    String(text || "")
      .toLowerCase();


  /*
  ======================================
  COMMON KINYARWANDA WORDS
  ======================================
  */

  const kinyarwandaWords = [

    "muraho",
    "amakuru",
    "uraho",
    "ese",
    "ni iki",
    "iki",
    "nde",
    "hehe",
    "ryari",
    "gute",
    "kuki",
    "nshaka",
    "ndashaka",
    "mbwira",
    "wavuga",
    "wabwira",
    "nshobora",
    "ushobora",
    "umuntu",
    "abantu",
    "rwanda",
    "murakoze",
    "urakoze",
    "yego",
    "oya",
    "byiza",
    "amafaranga",
    "akazi",
    "ubucuruzi",
    "ikoranabuhanga",
    "tekinoloji",
    "kwiga"

  ];


  const isKinyarwanda =
    kinyarwandaWords.some(
      function(word) {

        return value.includes(
          word
        );

      }
    );


  if (
    isKinyarwanda
  ) {

    return "rw-RW";

  }


  return "en-US";

}


/*
========================================
SPEAK ANSWER
========================================
*/

function speakAnswer(
  text
) {

  if (
    !("speechSynthesis" in window)
  ) {

    console.log(
      "Voice AI is not supported on this device."
    );

    return;

  }


  const cleanText =
    String(text || "").trim();


  if (!cleanText) {

    return;

  }


  /*
  ======================================
  STOP PREVIOUS SPEECH
  ======================================
  */

  window.speechSynthesis.cancel();


  /*
  ======================================
  CREATE SPEECH
  ======================================
  */

  const speech =
    new SpeechSynthesisUtterance(
      cleanText
    );


  /*
  ======================================
  LANGUAGE
  ======================================
  */

  speech.lang =
    detectSpeechLanguage(
      cleanText
    );


  /*
  ======================================
  VOICE SPEED
  ======================================
  */

  speech.rate =
    0.95;


  /*
  ======================================
  PITCH
  ======================================
  */

  speech.pitch =
    1.05;


  /*
  ======================================
  VOLUME
  ======================================
  */

  speech.volume =
    1;


  /*
  ======================================
  FEMALE VOICE
  ======================================
  */

  const femaleVoice =
    findFemaleVoice();


  if (
    femaleVoice
  ) {

    speech.voice =
      femaleVoice;

  }


  /*
  ======================================
  READ ANSWER
  ======================================
  */

  window.speechSynthesis.speak(
    speech
  );

}


/*
========================================
SPEAK WHEN VOICES ARE READY
========================================
*/

function speakAnswerWhenReady(
  text
) {

  if (
    !("speechSynthesis" in window)
  ) {

    return;

  }


  const voices =
    getSpeechVoices();


  if (
    voices.length > 0
  ) {

    speakAnswer(
      text
    );

    return;

  }


  /*
  ======================================
  ANDROID MAY LOAD VOICES LATER
  ======================================
  */

  window.speechSynthesis.onvoiceschanged =
    function() {

      speakAnswer(
        text
      );

    };

}


/*
========================================
CLEAR SEARCH BAR
========================================
*/

function clearQuestionInput() {

  if (
    !questionInput
  ) {

    return;

  }


  /*
  ======================================
  CLEAR CURRENT QUESTION
  ======================================
  */

  questionInput.value =
    "";


  /*
  ======================================
  PUT CURSOR BACK
  ======================================
  */

  questionInput.focus();

}


/*
========================================
ASK RWANDA AI
========================================
*/

async function askRwandaAI() {

  if (
    !questionInput ||
    !answerBox
  ) {

    return;

  }


  const question =
    questionInput.value.trim();


  /*
  ====================================
  EMPTY QUESTION
  ====================================
  */

  if (!question) {

    answerBox.innerHTML = `

      <div class="ai-answer">

        <p>
          Please ask a question.
        </p>

      </div>

    `;

    return;

  }


  /*
  ====================================
  DISABLE BUTTON
  ====================================
  */

  if (askBtn) {

    askBtn.disabled =
      true;

    askBtn.innerText =
      "Thinking...";

  }


  /*
  ====================================
  LOADING
  ====================================
  */

  answerBox.innerHTML = `

    <div class="ai-answer">

      <p>
        🤖 Rwanda AI is thinking...
      </p>

    </div>

  `;


  try {

    /*
    ==================================
    STEP 1
    FIRESTORE
    ==================================
    */

    const knowledge =
      await searchKnowledge(
        question
      );


    /*
    ==================================
    FIRESTORE ANSWER FOUND
    ==================================
    */

    if (
      knowledge
    ) {

      answerBox.innerHTML = `

        <div class="ai-answer">

          <p>
            ${formatAnswer(
              knowledge.answer
            )}
          </p>

          <small>
            🇷🇼 Rwanda AI Knowledge
          </small>

        </div>

      `;


      console.log(
        "Answer source: Firestore"
      );


      /*
      ==================================
      VOICE AI
      ==================================
      */

      if (
        voiceQuestion
      ) {

        speakAnswerWhenReady(
          knowledge.answer
        );

      }


      /*
      ==================================
      CLEAR SEARCH BAR
      ==================================
      */

      clearQuestionInput();


      return;

    }


    /*
    ==================================
    STEP 2
    GROQ FALLBACK
    ==================================
    */

    console.log(
      "Knowledge not found. Calling Groq..."
    );


    const result =
      await callGroq(
        question
      );


    /*
    ==================================
    SHOW GROQ ANSWER
    ==================================
    */

    answerBox.innerHTML = `

      <div class="ai-answer">

        <p>
          ${formatAnswer(
            result.answer
          )}
        </p>

        <small>
          Powered by
          ${escapeHTML(
            result.provider
          )}
          ${
            result.model
              ? " • " +
                escapeHTML(
                  result.model
                )
              : ""
          }
        </small>

      </div>

    `;


    /*
    ==================================
    VOICE AI
    ==================================
    */

    if (
      voiceQuestion
    ) {

      speakAnswerWhenReady(
        result.answer
      );

    }


    /*
    ==================================
    CLEAR SEARCH BAR
    ==================================
    */

    clearQuestionInput();


  } catch (error) {

    console.error(
      "Rwanda AI error:",
      error
    );


    answerBox.innerHTML = `

      <div class="ai-answer">

        <p>
          ❌ Rwanda AI failed.
        </p>

        <p>
          ${formatAnswer(
            error.message
          )}
        </p>

      </div>

    `;


  } finally {

    /*
    ==================================
    ENABLE BUTTON
    ==================================
    */

    if (askBtn) {

      askBtn.disabled =
        false;

      askBtn.innerText =
        "Ask Rwanda AI";

    }

  }

}


/*
========================================
BUTTON
========================================
*/

if (askBtn) {

  askBtn.addEventListener(
    "click",
    askRwandaAI
  );

}


/*
========================================
ENTER KEY
========================================
*/

if (questionInput) {

  questionInput.addEventListener(
    "keydown",
    function(event) {

      if (
        event.key === "Enter" &&
        !event.shiftKey
      ) {

        event.preventDefault();

        askRwandaAI();

      }

    }
  );

}


/*
========================================
VOICE QUESTION
========================================
*/

const params =
  new URLSearchParams(
    window.location.search
  );


const voiceQuestion =
  params.get(
    "question"
  );


if (
  voiceQuestion &&
  questionInput
) {

  questionInput.value =
    voiceQuestion;


  setTimeout(
    function() {

      askRwandaAI();

    },
    100
  );

}


/*
========================================
READY
========================================
*/

console.log(
  "🇷🇼 Rwanda AI Platform - Firestore Knowledge + Groq + Voice AI ready."
);