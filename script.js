/*
========================================
RWANDA AI PLATFORM
AI ASSISTANT
GROQ BACKEND
FAST VERSION
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
CALL RWANDA AI
========================================
*/

async function callRwandaAI(
  question
) {

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
              question,

            systemInstruction:

              "You are Rwanda AI Assistant. " +

              "Give accurate, complete and useful answers. " +

              "Answer in Kinyarwanda when the user " +
              "uses Kinyarwanda. " +

              "Answer in English when the user " +
              "uses English. " +

              "Prioritize Rwanda-specific information " +
              "when relevant. " +

              "Be clear, intelligent and direct. " +

              "Do not unnecessarily repeat the question."

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
      "Rwanda AI returned invalid JSON."
    );

  }


  /*
  ======================================
  BACKEND ERROR
  ======================================
  */

  if (
    !response.ok ||
    data.error
  ) {

    let message =
      data.error ||
      "Rwanda AI request failed.";


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


  /*
  ======================================
  ANSWER
  ======================================
  */

  const answer =
    String(
      data.answer ||
      ""
    ).trim();


  if (!answer) {

    throw new Error(
      "Rwanda AI returned no answer."
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
  ======================================
  EMPTY QUESTION
  ======================================
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
  ======================================
  DISABLE BUTTON
  ======================================
  */

  if (askBtn) {

    askBtn.disabled =
      true;

    askBtn.innerText =
      "Thinking...";

  }


  /*
  ======================================
  LOADING
  ======================================
  */

  answerBox.innerHTML = `

    <div class="ai-answer">

      <p>
        🤖 Rwanda AI is thinking...
      </p>

    </div>

  `;


  try {

    const result =
      await callRwandaAI(
        question
      );


    /*
    ====================================
    SHOW ANSWER
    ====================================
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
          ${result.model
            ? " • " +
              escapeHTML(
                result.model
              )
            : ""}
        </small>

      </div>

    `;


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
    ====================================
    ENABLE BUTTON
    ====================================
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
  "🇷🇼 Rwanda AI Platform - Groq backend connected."
);