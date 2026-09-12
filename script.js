/*
========================================
RWANDA AI PLATFORM
AI ASSISTANT
FIRESTORE + GROQ
PAST CONVERSATIONS
STICKERS
VOICE AI
========================================
*/


/*
========================================
FIRESTORE
========================================
*/

import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  serverTimestamp,
  updateDoc,
  doc
} from "https://www.gstatic.com/firebasejs/12.17.0/firebase-firestore.js";


/*
========================================
FIREBASE AUTH
========================================
*/

import {
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/12.17.0/firebase-auth.js";


import {
  db,
  auth
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
DOM
========================================
*/

const askBtn =
  document.getElementById("askBtn");


const questionInput =
  document.getElementById("question");


const answerBox =
  document.getElementById("answer");


const newChatBtn =
  document.getElementById("newChatBtn");


const stickerBtn =
  document.getElementById("stickerBtn");


const stickerPicker =
  document.getElementById("stickerPicker");


const voiceBtn =
  document.getElementById("voiceBtn");


const voiceStatus =
  document.getElementById("voiceStatus");


const userEmail =
  document.getElementById("userEmail");


const logoutBtn =
  document.getElementById("logoutBtn");


const pastConversationsBtn =
  document.getElementById(
    "pastConversationsBtn"
  );


/*
========================================
STATE
========================================
*/

let currentUser = null;

let currentConversationId = null;

let conversationMessages = [];

let memories = [];

let isThinking = false;

let voiceQuestion = false;


/*
========================================
VOICE STATE
========================================
*/

let recognition = null;

let voiceSessionId = 0;

let shouldContinueListening = false;

let lastAcceptedFinal = "";

let lastAcceptedFinalTime = 0;

let voiceButtonListening = false;


/*
========================================
AUTH
========================================
*/

onAuthStateChanged(
  auth,
  async (user) => {

    currentUser =
      user;


    if (!user) {

      if (userEmail) {

        userEmail.textContent =
          "";

      }

      return;

    }


    if (userEmail) {

      userEmail.textContent =
        user.email ||
        "User";

    }


    await loadMemories();

  }
);


/*
========================================
LOAD MEMORIES
========================================
*/

async function loadMemories() {

  if (!currentUser) {
    return;
  }


  try {

    const q =
      query(
        collection(
          db,
          "memories"
        ),

        where(
          "userId",
          "==",
          currentUser.uid
        )
      );


    const snapshot =
      await getDocs(q);


    memories = [];


    snapshot.forEach(
      (item) => {

        memories.push({

          id:
            item.id,

          ...item.data()

        });

      }
    );


  } catch (error) {

    console.error(
      "Memory loading error:",
      error
    );

  }

}


/*
========================================
CREATE CONVERSATION
========================================
*/

async function createConversation() {

  if (!currentUser) {

    throw new Error(
      "User is not authenticated."
    );

  }


  const conversationRef =
    await addDoc(
      collection(
        db,
        "conversations"
      ),

      {

        userId:
          currentUser.uid,

        title:
          "New Conversation",

        createdAt:
          serverTimestamp(),

        updatedAt:
          serverTimestamp()

      }
    );


  currentConversationId =
    conversationRef.id;


  conversationMessages = [];


  return currentConversationId;

}


/*
========================================
CREATE CONVERSATION TITLE
========================================
*/

function createConversationTitle(
  text
) {

  if (!text) {

    return "New Conversation";

  }


  let title =
    String(text)
      .replace(/\s+/g, " ")
      .trim();


  if (!title) {

    return "New Conversation";

  }


  if (title.length > 65) {

    title =
      title
        .substring(0, 65)
        .trim() +
      "...";

  }


  return title;

}


/*
========================================
UPDATE CONVERSATION TITLE
========================================
*/

async function updateConversationTitle(
  conversationId,
  title
) {

  if (
    !conversationId ||
    !title
  ) {

    return;

  }


  try {

    await updateDoc(
      doc(
        db,
        "conversations",
        conversationId
      ),

      {

        title:
          title,

        updatedAt:
          serverTimestamp()

      }

    );


  } catch (error) {

    console.error(
      "Conversation title update error:",
      error
    );

  }

}


/*
========================================
SAVE MESSAGE
========================================
*/

async function saveMessage(
  role,
  text
) {

  if (
    !currentUser ||
    !currentConversationId ||
    !text
  ) {

    return;

  }


  try {

    await addDoc(
      collection(
        db,
        "messages"
      ),

      {

        conversationId:
          currentConversationId,

        userId:
          currentUser.uid,

        role:
          role,

        content:
          text,

        createdAt:
          serverTimestamp()

      }

    );


    /*
    First user message becomes title
    */

    if (
      role === "user" &&
      conversationMessages.filter(
        item =>
          item.role === "user"
      ).length === 1
    ) {

      const title =
        createConversationTitle(
          text
        );


      await updateConversationTitle(
        currentConversationId,
        title
      );

    }


  } catch (error) {

    console.error(
      "Save message error:",
      error
    );

  }

}


/*
========================================
CLEAN AI ANSWER
========================================
*/

function cleanAIAnswer(text) {

  if (!text) {
    return "";
  }


  let answer =
    String(text);


  /*
  ========================================
  REMOVE MARKDOWN HEADINGS
  ========================================
  */

  answer =
    answer.replace(
      /^\s*#{1,6}\s*/gm,
      ""
    );


  /*
  ========================================
  REMOVE BOLD / ITALIC MARKDOWN
  ========================================
  */

  answer =
    answer.replace(
      /\*\*/g,
      ""
    );


  answer =
    answer.replace(
      /__/g,
      ""
    );


  /*
  ========================================
  REMOVE MARKDOWN BULLETS
  ========================================
  */

  answer =
    answer.replace(
      /^\s*\*\s+/gm,
      ""
    );


  answer =
    answer.replace(
      /^\s*-\s+/gm,
      ""
    );


  /*
  ========================================
  REMOVE TABLE SYMBOL
  ========================================
  */

  answer =
    answer.replace(
      /\|/g,
      " "
    );


  /*
  ========================================
  REMOVE HORIZONTAL LINES
  ========================================
  */

  answer =
    answer.replace(
      /^\s*[-_=]{3,}\s*$/gm,
      ""
    );


  /*
  ========================================
  REMOVE CODE FENCES
  ========================================
  */

  answer =
    answer.replace(
      /```[a-zA-Z0-9_-]*/g,
      ""
    );


  answer =
    answer.replace(
      /```/g,
      ""
    );


  /*
  ========================================
  LATEX TEXT
  ========================================
  */

  answer =
    answer.replace(
      /\\text\{([^{}]*)\}/g,
      "$1"
    );


  answer =
    answer.replace(
      /\\mathrm\{([^{}]*)\}/g,
      "$1"
    );


  answer =
    answer.replace(
      /\\mathbf\{([^{}]*)\}/g,
      "$1"
    );


  answer =
    answer.replace(
      /\\operatorname\{([^{}]*)\}/g,
      "$1"
    );


  /*
  ========================================
  LATEX FRACTION
  ========================================
  */

  answer =
    answer.replace(
      /\\frac\{([^{}]*)\}\{([^{}]*)\}/g,
      "$1 / $2"
    );


  /*
  ========================================
  LATEX SQRT
  ========================================
  */

  answer =
    answer.replace(
      /\\sqrt\{([^{}]*)\}/g,
      "sqrt($1)"
    );


  /*
  ========================================
  LATEX SYMBOLS
  ========================================
  */

  answer =
    answer.replace(
      /\\times/g,
      "×"
    );


  answer =
    answer.replace(
      /\\cdot/g,
      "×"
    );


  answer =
    answer.replace(
      /\\div/g,
      "÷"
    );


  answer =
    answer.replace(
      /\\pm/g,
      "±"
    );


  answer =
    answer.replace(
      /\\leq/g,
      "≤"
    );


  answer =
    answer.replace(
      /\\le/g,
      "≤"
    );


  answer =
    answer.replace(
      /\\geq/g,
      "≥"
    );


  answer =
    answer.replace(
      /\\ge/g,
      "≥"
    );


  answer =
    answer.replace(
      /\\approx/g,
      "≈"
    );


  answer =
    answer.replace(
      /\\neq/g,
      "≠"
    );


  answer =
    answer.replace(
      /\\infty/g,
      "∞"
    );


  answer =
    answer.replace(
      /\\rightarrow/g,
      "→"
    );


  answer =
    answer.replace(
      /\\to/g,
      "→"
    );


  /*
  ========================================
  LATEX BRACKETS
  ========================================
  */

  answer =
    answer.replace(
      /\\\[/g,
      ""
    );


  answer =
    answer.replace(
      /\\\]/g,
      ""
    );


  answer =
    answer.replace(
      /\\\(/g,
      ""
    );


  answer =
    answer.replace(
      /\\\)/g,
      ""
    );


  /*
  ========================================
  REMOVE DOLLAR MATH MARKERS
  ========================================
  */

  answer =
    answer.replace(
      /\$\$/g,
      ""
    );


  answer =
    answer.replace(
      /\$/g,
      ""
    );


  /*
  ========================================
  LATEX ENVIRONMENTS
  ========================================
  */

  answer =
    answer.replace(
      /\\begin\{[^{}]*\}/g,
      ""
    );


  answer =
    answer.replace(
      /\\end\{[^{}]*\}/g,
      ""
    );


  /*
  ========================================
  COMMON LATEX COMMANDS
  ========================================
  */

  answer =
    answer.replace(
      /\\left/g,
      ""
    );


  answer =
    answer.replace(
      /\\right/g,
      ""
    );


  answer =
    answer.replace(
      /\\,/g,
      " "
    );


  answer =
    answer.replace(
      /\\;/g,
      " "
    );


  answer =
    answer.replace(
      /\\!/g,
      ""
    );


  answer =
    answer.replace(
      /\\quad/g,
      " "
    );


  /*
  ========================================
  SIMPLE POWERS
  ========================================
  */

  answer =
    answer.replace(
      /\^\{2\}/g,
      "²"
    );


  answer =
    answer.replace(
      /\^\{3\}/g,
      "³"
    );


  answer =
    answer.replace(
      /\^\{4\}/g,
      "⁴"
    );


  /*
  ========================================
  REMOVE REMAINING LATEX BACKSLASH
  ========================================
  */

  answer =
    answer.replace(
      /\\/g,
      ""
    );


  /*
  ========================================
  CLEAN SPACES
  ========================================
  */

  answer =
    answer.replace(
      /[ \t]+/g,
      " "
    );


  answer =
    answer.replace(
      /\n{3,}/g,
      "\n\n"
    );


  return answer.trim();

}


/*
========================================
PREPARE CONVERSATION VIEW
========================================
*/

function prepareConversationView() {

  if (!answerBox) {
    return;
  }


  /*
  Conversation stays inside
  its own scroll area.
  */

  answerBox.style.maxHeight =
    "70vh";


  answerBox.style.overflowY =
    "auto";


  answerBox.style.overflowX =
    "hidden";


  answerBox.style.scrollBehavior =
    "smooth";


  answerBox.style.boxSizing =
    "border-box";


  answerBox.style.scrollPaddingTop =
    "0px";


  answerBox.style.scrollPaddingBottom =
    "30px";

}


/*
========================================
SCROLL CURRENT ANSWER TO ITS TOP
========================================
*/

function scrollToCurrentAnswer(
  targetElement = null
) {

  if (!answerBox) {
    return;
  }


  setTimeout(
    () => {

      /*
      ====================================
      IMPORTANT
      ====================================

      DO NOT use scrollIntoView().

      That moves the whole webpage.

      We only scroll INSIDE answerBox.
      */


      if (targetElement) {

        /*
        Find the exact position of the
        current answer inside answerBox.
        */

        const boxRect =
          answerBox.getBoundingClientRect();


        const targetRect =
          targetElement.getBoundingClientRect();


        const targetTop =
          targetRect.top -
          boxRect.top +
          answerBox.scrollTop;


        /*
        CURRENT ANSWER STARTS AT TOP
        */

        answerBox.scrollTo({

          top:
            Math.max(
              0,
              targetTop
            ),

          behavior:
            "smooth"

        });


        return;

      }


      /*
      For a simple answer without
      conversation messages.
      */

      answerBox.scrollTo({

        top:
          0,

        behavior:
          "smooth"

      });

    },

    80
  );

}


/*
========================================
RENDER SIMPLE ANSWER
========================================
*/

function renderAnswer(text) {

  if (!answerBox) {
    return;
  }


  prepareConversationView();


  answerBox.innerText =
    cleanAIAnswer(text);


  answerBox.style.display =
    "block";


  answerBox.classList.add(
    "rwanda-ai-answer-active"
  );


  /*
  Answer starts at TOP.
  */

  scrollToCurrentAnswer();

}


/*
========================================
RENDER FULL CONVERSATION
========================================
*/

function renderConversation(
  messages
) {

  if (!answerBox) {
    return;
  }


  prepareConversationView();


  answerBox.innerHTML =
    "";


  answerBox.style.display =
    "block";


  let lastAssistantElement =
    null;


  messages.forEach(
    (message) => {

      const wrapper =
        document.createElement(
          "div"
        );


      /*
      ====================================
      BASE MESSAGE
      ====================================
      */

      wrapper.className =
        message.role === "user"
          ? "rwanda-user-message"
          : "rwanda-ai-message";


      /*
      ====================================
      LABEL
      ====================================
      */

      const label =
        document.createElement(
          "div"
        );


      label.className =
        "rwanda-message-label";


      label.textContent =
        message.role === "user"
          ? "YOU"
          : "RWANDA AI";


      /*
      ====================================
      CONTENT
      ====================================
      */

      const content =
        document.createElement(
          "div"
        );


      content.className =
        "rwanda-message-content";


      content.innerText =
        cleanAIAnswer(
          message.content || ""
        );


      /*
      ====================================
      USER MESSAGE
      ====================================
      */

      if (
        message.role === "user"
      ) {

        wrapper.style.marginBottom =
          "30px";


        wrapper.style.padding =
          "15px 17px";


        wrapper.style.borderRadius =
          "15px";


        wrapper.style.background =
          "#f4f4f5";


        wrapper.style.border =
          "1px solid #e5e7eb";

      }


      /*
      ====================================
      AI ANSWER
      ====================================
      */

      if (
        message.role === "assistant"
      ) {

        wrapper.style.marginTop =
          "12px";


        wrapper.style.marginBottom =
          "32px";


        wrapper.style.padding =
          "20px";


        wrapper.style.borderRadius =
          "18px";


        wrapper.style.background =
          "#eef6ff";


        wrapper.style.border =
          "1px solid #bfdbfe";


        wrapper.style.boxShadow =
          "0 5px 18px rgba(0, 0, 0, 0.09)";


        /*
        Keep reference to the
        current/latest AI answer.
        */

        lastAssistantElement =
          wrapper;

      }


      /*
      ====================================
      LABEL STYLE
      ====================================
      */

      label.style.fontSize =
        "12px";


      label.style.fontWeight =
        "700";


      label.style.marginBottom =
        "9px";


      label.style.letterSpacing =
        "0.5px";


      if (
        message.role === "assistant"
      ) {

        label.style.color =
          "#2563eb";

      } else {

        label.style.color =
          "#6b7280";

      }


      /*
      ====================================
      CONTENT STYLE
      ====================================
      */

      content.style.fontSize =
        "15px";


      content.style.lineHeight =
        "1.7";


      content.style.whiteSpace =
        "pre-wrap";


      content.style.wordBreak =
        "break-word";


      wrapper.appendChild(
        label
      );


      wrapper.appendChild(
        content
      );


      answerBox.appendChild(
        wrapper
      );

    }
  );


  answerBox.classList.add(
    "rwanda-ai-answer-active"
  );


  /*
  ========================================
  VERY IMPORTANT
  ========================================

  The latest/current Rwanda AI answer
  is placed at the TOP of the
  conversation viewport.

  The whole webpage does NOT scroll.
  */

  if (lastAssistantElement) {

    scrollToCurrentAnswer(
      lastAssistantElement
    );

  } else {

    scrollToCurrentAnswer();

  }

}


/*
========================================
BACKEND
========================================
*/

async function callBackend(
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

            action:
              "chat",

            userId:
              currentUser
                ? currentUser.uid
                : null,

            conversationId:
              currentConversationId,

            question:
              question,

            conversationMessages:
              conversationMessages,

            memories:
              memories,

            systemInstruction: `

You are Rwanda AI.

You are Rwanda AI Platform's intelligent assistant.

You were made and developed in Rwanda by Mr Patrick NIYIGABA, also known as Cobra.

Always identify yourself as Rwanda AI when identity is relevant.

Do not claim to be ChatGPT, Gemini, Claude, or another AI.

Answer naturally and accurately.

Use clear numbered answers when appropriate.

Do not use markdown tables.

Do not use unnecessary markdown symbols.

Do not use ##, **, |, or horizontal separator lines.

Keep answers readable and useful.

For mathematics, physics, science, and calculations, ALWAYS use plain text.

NEVER use LaTeX.

Do not use LaTeX commands such as:

\\text{}
\\frac{}
\\sqrt{}
\\times
\\cdot
\\[
\\]
\\(
\\)
$$

Write units in simple text such as:

m/s2
kg
N
J
W
km/h

Show calculations step by step in plain text.

Example:

Acceleration = 4 m/s2
Time = 10 s

Final speed = acceleration × time
Final speed = 4 × 10
Final speed = 40 m/s

Make mathematical answers easy to read and copy on a phone.

`

          })

      }
    );


  if (!response.ok) {

    throw new Error(
      "Backend request failed."
    );

  }


  const data =
    await response.json();


  if (!data) {

    throw new Error(
      "Invalid response from Rwanda AI backend."
    );

  }


  if (data.error) {

    throw new Error(
      data.error
    );

  }


  const answer =
    data.answer ||
    data.response ||
    data.message ||
    data.content;


  if (!answer) {

    throw new Error(
      "Invalid response from Rwanda AI backend."
    );

  }


  return cleanAIAnswer(
    answer
  );

}


/*
========================================
ASK RWANDA AI
========================================
*/

async function askRwandaAI(
  voiceMode = false
) {

  if (isThinking) {
    return;
  }


  const question =
    questionInput
      ? questionInput.value.trim()
      : "";


  if (!question) {
    return;
  }


  if (!currentUser) {

    renderAnswer(
      "Please login first."
    );

    return;

  }


  isThinking =
    true;


  voiceQuestion =
    voiceMode;


  try {

    /*
    ======================================
    CREATE CONVERSATION IF NEEDED
    ======================================
    */

    if (!currentConversationId) {

      await createConversation();

    }


    /*
    ======================================
    USER MESSAGE
    ======================================
    */

    const userMessage = {

      role:
        "user",

      content:
        question

    };


    conversationMessages.push(
      userMessage
    );


    await saveMessage(
      "user",
      question
    );


    renderConversation(
      conversationMessages
    );


    /*
    ======================================
    THINKING MESSAGE
    ======================================
    */

    conversationMessages.push({

      role:
        "assistant",

      content:
        "Rwanda AI is thinking..."

    });


    renderConversation(
      conversationMessages
    );


    /*
    ======================================
    CALL BACKEND
    ======================================
    */

    const answer =
      await callBackend(
        question
      );


    /*
    ======================================
    REMOVE THINKING
    ======================================
    */

    conversationMessages =
      conversationMessages.filter(
        item =>
          item.content !==
          "Rwanda AI is thinking..."
      );


    /*
    ======================================
    ADD REAL ANSWER
    ======================================
    */

    conversationMessages.push({

      role:
        "assistant",

      content:
        answer

    });


    /*
    ======================================
    SAVE ANSWER
    ======================================
    */

    await saveMessage(
      "assistant",
      answer
    );


    /*
    ======================================
    RENDER CURRENT ANSWER
    ======================================
    */

    renderConversation(
      conversationMessages
    );


    /*
    ======================================
    VOICE ANSWER
    ======================================
    */

    if (voiceQuestion) {

      speakText(
        answer
      );

    }


    /*
    ======================================
    CLEAR INPUT
    ======================================
    */

    if (questionInput) {

      questionInput.value =
        "";

    }


  } catch (error) {

    console.error(
      "Rwanda AI error:",
      error
    );


    conversationMessages =
      conversationMessages.filter(
        item =>
          item.content !==
          "Rwanda AI is thinking..."
      );


    const errorMessage =
      "Sorry, Rwanda AI could not process your request right now. Please try again.";


    conversationMessages.push({

      role:
        "assistant",

      content:
        errorMessage

    });


    renderConversation(
      conversationMessages
    );

  }


  isThinking =
    false;

}


/*
========================================
ASK BUTTON
========================================
*/

if (askBtn) {

  askBtn.addEventListener(
    "click",
    () => {

      askRwandaAI(
        false
      );

    }
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
    (event) => {

      if (
        event.key === "Enter" &&
        !event.shiftKey
      ) {

        event.preventDefault();


        askRwandaAI(
          false
        );

      }

    }
  );

}


/*
========================================
NEW CHAT
========================================
*/

if (newChatBtn) {

  newChatBtn.addEventListener(
    "click",
    () => {

      currentConversationId =
        null;


      conversationMessages =
        [];


      voiceQuestion =
        false;


      if (answerBox) {

        answerBox.innerHTML =
          "";


        answerBox.style.display =
          "none";


        answerBox.scrollTop =
          0;

      }


      if (questionInput) {

        questionInput.value =
          "";


        questionInput.focus();

      }

    }
  );

}


/*
========================================
PAST CONVERSATIONS DESIGN
========================================
*/

function createPastConversationsDesign() {

  if (
    document.getElementById(
      "rwandaPastConversations"
    )
  ) {

    return;

  }


  const panel =
    document.createElement(
      "div"
    );


  panel.id =
    "rwandaPastConversations";


  panel.innerHTML = `

    <div class="rwanda-conversation-overlay">

      <div class="rwanda-conversation-modal">

        <div class="rwanda-conversation-header">

          <div>

            <h2>
              Past Conversations
            </h2>

            <p>
              Your conversations with Rwanda AI
            </p>

          </div>


          <button
            type="button"
            class="rwanda-close-conversations"
            id="rwandaCloseConversations"
          >
            ✕
          </button>

        </div>


        <div class="rwanda-conversation-search">

          <span>🔎</span>

          <input
            type="text"
            id="rwandaConversationSearch"
            placeholder="Search conversations..."
          >

        </div>


        <div
          id="rwandaConversationList"
          class="rwanda-conversation-list"
        >

          <div class="rwanda-conversation-loading">
            Loading conversations...
          </div>

        </div>

      </div>

    </div>

  `;


  document.body.appendChild(
    panel
  );


  const style =
    document.createElement(
      "style"
    );


  style.id =
    "rwandaPastConversationStyles";


  style.textContent = `

    #rwandaPastConversations {

      display: none;

      position: fixed;

      inset: 0;

      z-index: 99999;

    }


    .rwanda-conversation-overlay {

      position: fixed;

      inset: 0;

      background:
        rgba(0,0,0,0.58);

      display: flex;

      justify-content: center;

      align-items: center;

      padding: 18px;

      box-sizing: border-box;

    }


    .rwanda-conversation-modal {

      width: 100%;

      max-width: 650px;

      max-height: 88vh;

      background: #ffffff;

      border-radius: 20px;

      overflow: hidden;

      box-shadow:
        0 20px 60px
        rgba(0,0,0,0.30);

      display: flex;

      flex-direction: column;

    }


    .rwanda-conversation-header {

      display: flex;

      align-items: center;

      justify-content: space-between;

      padding: 20px;

      border-bottom:
        1px solid #eeeeee;

    }


    .rwanda-conversation-header h2 {

      margin: 0;

      font-size: 21px;

      color: #111827;

    }


    .rwanda-conversation-header p {

      margin:
        5px 0 0;

      font-size: 13px;

      color: #6b7280;

    }


    .rwanda-close-conversations {

      width: 40px;

      height: 40px;

      border: none;

      border-radius: 50%;

      background: #f3f4f6;

      font-size: 20px;

      cursor: pointer;

    }


    .rwanda-conversation-search {

      margin:
        15px 18px;

      padding:
        11px 14px;

      background: #f3f4f6;

      border-radius: 13px;

      display: flex;

      align-items: center;

      gap: 8px;

    }


    .rwanda-conversation-search input {

      border: none;

      outline: none;

      background: transparent;

      width: 100%;

      font-size: 14px;

    }


    .rwanda-conversation-list {

      overflow-y: auto;

      padding:
        0 15px 18px;

    }


    .rwanda-conversation-group-title {

      font-size: 12px;

      font-weight: 700;

      color: #6b7280;

      padding:
        12px 6px 7px;

      text-transform:
        uppercase;

    }


    .rwanda-conversation-card {

      width: 100%;

      border:
        1px solid #eeeeee;

      background: #ffffff;

      border-radius: 14px;

      padding: 14px;

      margin-bottom: 9px;

      display: flex;

      align-items: center;

      gap: 12px;

      text-align: left;

      cursor: pointer;

      box-sizing: border-box;

      transition: 0.2s;

    }


    .rwanda-conversation-card:hover {

      background: #f8fafc;

      transform:
        translateY(-1px);

    }


    .rwanda-conversation-icon {

      width: 40px;

      height: 40px;

      min-width: 40px;

      border-radius: 12px;

      background: #eef2ff;

      display: flex;

      align-items: center;

      justify-content: center;

      font-size: 19px;

    }


    .rwanda-conversation-info {

      min-width: 0;

      flex: 1;

    }


    .rwanda-conversation-title {

      font-size: 14px;

      font-weight: 600;

      color: #111827;

      overflow: hidden;

      white-space: nowrap;

      text-overflow: ellipsis;

    }


    .rwanda-conversation-date {

      margin-top: 4px;

      font-size: 11px;

      color: #9ca3af;

    }


    .rwanda-conversation-arrow {

      color: #9ca3af;

      font-size: 20px;

    }


    .rwanda-conversation-empty {

      text-align: center;

      padding:
        45px 20px;

      color: #6b7280;

      font-size: 14px;

    }


    .rwanda-conversation-loading {

      text-align: center;

      padding:
        35px 10px;

      color: #6b7280;

      font-size: 14px;

    }


    @media (max-width: 600px) {

      .rwanda-conversation-overlay {

        padding: 0;

        align-items: flex-end;

      }


      .rwanda-conversation-modal {

        max-width: none;

        max-height: 92vh;

        border-radius:
          20px 20px 0 0;

      }


      .rwanda-conversation-header {

        padding: 17px;

      }

    }

  `;


  document.head.appendChild(
    style
  );


  const closeButton =
    document.getElementById(
      "rwandaCloseConversations"
    );


  if (closeButton) {

    closeButton.addEventListener(
      "click",
      closePastConversations
    );

  }


  const searchInput =
    document.getElementById(
      "rwandaConversationSearch"
    );


  if (searchInput) {

    searchInput.addEventListener(
      "input",
      filterPastConversations
    );

  }

}


/*
========================================
OPEN PAST CONVERSATIONS
========================================
*/

async function openPastConversations() {

  createPastConversationsDesign();


  const panel =
    document.getElementById(
      "rwandaPastConversations"
    );


  if (!panel) {
    return;
  }


  panel.style.display =
    "block";


  await loadPastConversations();

}


/*
========================================
CLOSE PAST CONVERSATIONS
========================================
*/

function closePastConversations() {

  const panel =
    document.getElementById(
      "rwandaPastConversations"
    );


  if (panel) {

    panel.style.display =
      "none";

  }

}


/*
========================================
LOAD PAST CONVERSATIONS
========================================
*/

let loadedPastConversations =
  [];


async function loadPastConversations() {

  const list =
    document.getElementById(
      "rwandaConversationList"
    );


  if (
    !list ||
    !currentUser
  ) {

    return;

  }


  list.innerHTML = `

    <div class="rwanda-conversation-loading">

      Loading conversations...

    </div>

  `;


  try {

    const conversationQuery =
      query(
        collection(
          db,
          "conversations"
        ),

        where(
          "userId",
          "==",
          currentUser.uid
        )
      );


    const conversationSnapshot =
      await getDocs(
        conversationQuery
      );


    const messageQuery =
      query(
        collection(
          db,
          "messages"
        ),

        where(
          "userId",
          "==",
          currentUser.uid
        )
      );


    const messageSnapshot =
      await getDocs(
        messageQuery
      );


    const allMessages =
      [];


    messageSnapshot.forEach(
      (item) => {

        allMessages.push({

          id:
            item.id,

          ...item.data()

        });

      }
    );


    const groupedMessages =
      {};


    allMessages.forEach(
      (message) => {

        if (
          !groupedMessages[
            message.conversationId
          ]
        ) {

          groupedMessages[
            message.conversationId
          ] = [];

        }


        groupedMessages[
          message.conversationId
        ].push(
          message
        );

      }
    );


    loadedPastConversations =
      [];


    conversationSnapshot.forEach(
      (item) => {

        const data =
          item.data();


        const messages =
          groupedMessages[
            item.id
          ] || [];


        messages.sort(
          (a, b) => {

            const timeA =
              a.createdAt?.toMillis
                ? a.createdAt.toMillis()
                : 0;


            const timeB =
              b.createdAt?.toMillis
                ? b.createdAt.toMillis()
                : 0;


            return (
              timeA - timeB
            );

          }
        );


        const firstUserMessage =
          messages.find(
            message =>
              message.role === "user" &&
              message.content
          );


        let title =
          data.title;


        if (
          !title ||
          title ===
            "New Conversation" ||
          title ===
            "undefined"
        ) {

          if (
            firstUserMessage
          ) {

            title =
              createConversationTitle(
                firstUserMessage.content
              );

          } else {

            title =
              "Conversation";

          }

        }


        loadedPastConversations.push({

          id:
            item.id,

          title:
            title,

          messages:
            messages,

          createdAt:
            data.createdAt,

          updatedAt:
            data.updatedAt

        });

      }
    );


    loadedPastConversations.sort(
      (a, b) => {

        const timeA =
          a.updatedAt?.toMillis
            ? a.updatedAt.toMillis()
            : (
                a.createdAt?.toMillis
                  ? a.createdAt.toMillis()
                  : 0
              );


        const timeB =
          b.updatedAt?.toMillis
            ? b.updatedAt.toMillis()
            : (
                b.createdAt?.toMillis
                  ? b.createdAt.toMillis()
                  : 0
              );


        return (
          timeB - timeA
        );

      }
    );


    renderPastConversations(
      loadedPastConversations
    );


  } catch (error) {

    console.error(
      "Past conversations error:",
      error
    );


    list.innerHTML = `

      <div class="rwanda-conversation-empty">

        Unable to load past conversations.
        Please try again.

      </div>

    `;

  }

}


/*
========================================
FORMAT DATE
========================================
*/

function formatConversationDate(
  timestamp
) {

  if (
    !timestamp ||
    !timestamp.toDate
  ) {

    return "";

  }


  const date =
    timestamp.toDate();


  return date.toLocaleString(
    [],
    {

      dateStyle:
        "medium",

      timeStyle:
        "short"

    }
  );

}


/*
========================================
DATE GROUP
========================================
*/

function getConversationGroup(
  timestamp
) {

  if (
    !timestamp ||
    !timestamp.toDate
  ) {

    return "Older";

  }


  const date =
    timestamp.toDate();


  const now =
    new Date();


  const today =
    new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    );


  const messageDay =
    new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate()
    );


  const difference =
    Math.floor(
      (
        today.getTime() -
        messageDay.getTime()
      ) /
      86400000
    );


  if (
    difference === 0
  ) {

    return "Today";

  }


  if (
    difference === 1
  ) {

    return "Yesterday";

  }


  if (
    difference <= 7
  ) {

    return "Previous 7 Days";

  }


  return "Older";

}


/*
========================================
RENDER PAST CONVERSATIONS
========================================
*/

function renderPastConversations(
  conversations
) {

  const list =
    document.getElementById(
      "rwandaConversationList"
    );


  if (!list) {
    return;
  }


  list.innerHTML =
    "";


  if (
    !conversations.length
  ) {

    list.innerHTML = `

      <div class="rwanda-conversation-empty">

        No past conversations yet.

      </div>

    `;

    return;

  }


  const groups =
    {};


  conversations.forEach(
    (conversation) => {

      const timestamp =
        conversation.updatedAt ||
        conversation.createdAt;


      const group =
        getConversationGroup(
          timestamp
        );


      if (!groups[group]) {

        groups[group] =
          [];

      }


      groups[group].push(
        conversation
      );

    }
  );


  const order = [

    "Today",

    "Yesterday",

    "Previous 7 Days",

    "Older"

  ];


  order.forEach(
    (groupName) => {

      if (
        !groups[groupName]
      ) {

        return;

      }


      const groupTitle =
        document.createElement(
          "div"
        );


      groupTitle.className =
        "rwanda-conversation-group-title";


      groupTitle.textContent =
        groupName;


      list.appendChild(
        groupTitle
      );


      groups[groupName].forEach(
        (conversation) => {

          const button =
            document.createElement(
              "button"
            );


          button.type =
            "button";


          button.className =
            "rwanda-conversation-card";


          const timestamp =
            conversation.updatedAt ||
            conversation.createdAt;


          button.innerHTML = `

            <div class="rwanda-conversation-icon">

              💬

            </div>


            <div class="rwanda-conversation-info">

              <div class="rwanda-conversation-title">

                ${escapeHTML(
                  conversation.title
                )}

              </div>


              <div class="rwanda-conversation-date">

                ${escapeHTML(
                  formatConversationDate(
                    timestamp
                  )
                )}

              </div>

            </div>


            <div class="rwanda-conversation-arrow">

              ›

            </div>

          `;


          button.addEventListener(
            "click",
            () => {

              openPastConversation(
                conversation
              );

            }
          );


          list.appendChild(
            button
          );

        }
      );

    }
  );

}


/*
========================================
ESCAPE HTML
========================================
*/

function escapeHTML(text) {

  const div =
    document.createElement(
      "div"
    );


  div.textContent =
    text || "";


  return div.innerHTML;

}


/*
========================================
SEARCH CONVERSATIONS
========================================
*/

function filterPastConversations(
  event
) {

  const search =
    event.target.value
      .toLowerCase()
      .trim();


  if (!search) {

    renderPastConversations(
      loadedPastConversations
    );

    return;

  }


  const filtered =
    loadedPastConversations.filter(
      conversation => {

        const title =
          (
            conversation.title ||
            ""
          )
            .toLowerCase();


        const content =
          conversation.messages
            .map(
              message =>
                message.content ||
                ""
            )
            .join(" ")
            .toLowerCase();


        return (
          title.includes(search) ||
          content.includes(search)
        );

      }
    );


  renderPastConversations(
    filtered
  );

}


/*
========================================
OPEN FULL PAST CONVERSATION
========================================
*/

function openPastConversation(
  conversation
) {

  if (!conversation) {
    return;
  }


  currentConversationId =
    conversation.id;


  conversationMessages =
    conversation.messages.map(
      message => ({

        role:
          message.role,

        content:
          message.content ||
          ""

      })
    );


  renderConversation(
    conversationMessages
  );


  closePastConversations();

}


/*
========================================
PAST CONVERSATIONS BUTTON
========================================
*/

if (pastConversationsBtn) {

  pastConversationsBtn.addEventListener(
    "click",
    openPastConversations
  );

}


/*
========================================
STICKERS
========================================
*/

if (stickerBtn) {

  stickerBtn.addEventListener(
    "click",
    () => {

      if (!stickerPicker) {
        return;
      }


      const isVisible =
        stickerPicker.style.display ===
        "block";


      stickerPicker.style.display =
        isVisible
          ? "none"
          : "block";

    }
  );

}


if (stickerPicker) {

  stickerPicker.addEventListener(
    "click",
    (event) => {

      const target =
        event.target;


      if (
        target.tagName !== "BUTTON" &&
        !target.classList.contains(
          "sticker"
        )
      ) {

        return;

      }


      const sticker =
        target.dataset.sticker ||
        target.textContent;


      if (!sticker) {
        return;
      }


      if (questionInput) {

        questionInput.value +=
          sticker;


        questionInput.focus();

      }


      stickerPicker.style.display =
        "none";

    }
  );

}


/*
========================================
LOGOUT
========================================
*/

if (logoutBtn) {

  logoutBtn.addEventListener(
    "click",
    async () => {

      try {

        await signOut(
          auth
        );

      } catch (error) {

        console.error(
          "Logout error:",
          error
        );

      }

    }
  );

}


/*
========================================
VOICE SUPPORT
========================================
*/

function checkRecognitionSupport() {

  return !!(
    window.SpeechRecognition ||
    window.webkitSpeechRecognition
  );

}


/*
========================================
NORMALIZE VOICE TEXT
========================================
*/

function normalizeVoiceText(
  text
) {

  return String(
    text || ""
  )
    .replace(
      /\s+/g,
      " "
    )
    .trim();

}


/*
========================================
ACCEPT FINAL TRANSCRIPT
========================================
*/

function acceptFinalTranscript(
  text
) {

  const normalized =
    normalizeVoiceText(
      text
    );


  if (!normalized) {
    return;
  }


  const now =
    Date.now();


  if (
    normalized ===
      lastAcceptedFinal &&
    now -
      lastAcceptedFinalTime <
      1800
  ) {

    return;

  }


  lastAcceptedFinal =
    normalized;


  lastAcceptedFinalTime =
    now;


  if (questionInput) {

    questionInput.value =
      normalized;

  }

}


/*
========================================
DISPLAY VOICE TEXT
========================================
*/

function displayVoiceText(
  text,
  isFinal = false
) {

  const normalized =
    normalizeVoiceText(
      text
    );


  if (!normalized) {
    return;
  }


  if (isFinal) {

    acceptFinalTranscript(
      normalized
    );

    return;

  }


  if (questionInput) {

    questionInput.value =
      normalized;

  }

}


/*
========================================
CREATE RECOGNITION SESSION
========================================
*/

function createRecognitionSession() {

  const SpeechRecognition =
    window.SpeechRecognition ||
    window.webkitSpeechRecognition;


  if (!SpeechRecognition) {
    return null;
  }


  const localSession =
    ++voiceSessionId;


  const recognitionInstance =
    new SpeechRecognition();


  /*
  ======================================
  VOICE LANGUAGE
  ======================================
  */

  recognitionInstance.lang =
    "en-US";


  recognitionInstance.continuous =
    false;


  recognitionInstance.interimResults =
    true;


  recognitionInstance.maxAlternatives =
    1;


  /*
  ======================================
  START
  ======================================
  */

  recognitionInstance.onstart =
    () => {

      if (
        localSession !==
        voiceSessionId
      ) {

        return;

      }


      if (voiceStatus) {

        voiceStatus.textContent =
          "Listening...";

      }


      if (voiceBtn) {

        voiceBtn.classList.add(
          "listening"
        );

      }

    };


  /*
  ======================================
  RESULT
  ======================================
  */

  recognitionInstance.onresult =
    (event) => {

      if (
        localSession !==
        voiceSessionId
      ) {

        return;

      }


      let interim =
        "";


      let finalText =
        "";


      for (
        let i =
          event.resultIndex;

        i <
          event.results.length;

        i++
      ) {

        const transcript =
          event.results[i][0]
            .transcript;


        if (
          event.results[i]
            .isFinal
        ) {

          finalText +=
            transcript;

        } else {

          interim +=
            transcript;

        }

      }


      if (finalText) {

        displayVoiceText(
          finalText,
          true
        );

      } else if (interim) {

        displayVoiceText(
          interim,
          false
        );

      }

    };


  /*
  ======================================
  ERROR
  ======================================
  */

  recognitionInstance.onerror =
    (event) => {

      if (
        localSession !==
        voiceSessionId
      ) {

        return;

      }


      console.error(
        "Speech recognition error:",
        event.error
      );


      if (
        event.error ===
        "not-allowed"
      ) {

        shouldContinueListening =
          false;


        voiceButtonListening =
          false;


        if (voiceStatus) {

          voiceStatus.textContent =
            "Microphone permission denied.";

        }


        if (voiceBtn) {

          voiceBtn.classList.remove(
            "listening"
          );

        }

      }


      if (
        event.error ===
        "no-speech"
      ) {

        if (voiceStatus) {

          voiceStatus.textContent =
            "No speech detected.";

        }

      }

    };


  /*
  ======================================
  END
  ======================================
  */

  recognitionInstance.onend =
    () => {

      if (
        localSession !==
        voiceSessionId
      ) {

        return;

      }


      if (
        shouldContinueListening
      ) {

        setTimeout(
          () => {

            if (
              shouldContinueListening &&
              localSession ===
                voiceSessionId
            ) {

              try {

                recognitionInstance.start();

              } catch (error) {

                console.log(
                  "Recognition restart:",
                  error
                );

              }

            }

          },
          250
        );


      } else {

        if (voiceStatus) {

          voiceStatus.textContent =
            "";

        }


        if (voiceBtn) {

          voiceBtn.classList.remove(
            "listening"
          );

        }

      }

    };


  return recognitionInstance;

}


/*
========================================
START RECOGNITION SESSION
========================================
*/

function startRecognitionSession() {

  recognition =
    createRecognitionSession();


  if (!recognition) {
    return;
  }


  try {

    recognition.start();

  } catch (error) {

    console.error(
      "Recognition start error:",
      error
    );

  }

}


/*
========================================
START VOICE
========================================
*/

function startVoiceRecognition() {

  if (
    !checkRecognitionSupport()
  ) {

    if (voiceStatus) {

      voiceStatus.textContent =
        "Voice recognition is not supported on this browser.";

    }

    return;

  }


  shouldContinueListening =
    true;


  lastAcceptedFinal =
    "";


  lastAcceptedFinalTime =
    0;


  if (questionInput) {

    questionInput.value =
      "";

  }


  startRecognitionSession();

}


/*
========================================
STOP VOICE
========================================
*/

function stopVoiceRecognition() {

  shouldContinueListening =
    false;


  voiceSessionId++;


  if (recognition) {

    try {

      recognition.stop();

    } catch (error) {

      console.log(
        "Recognition stop:",
        error
      );

    }

  }


  recognition =
    null;


  if (voiceStatus) {

    voiceStatus.textContent =
      "";

  }


  if (voiceBtn) {

    voiceBtn.classList.remove(
      "listening"
    );

  }


  voiceButtonListening =
    false;


  const voiceText =
    questionInput
      ? questionInput.value.trim()
      : "";


  if (voiceText) {

    askRwandaAI(
      true
    );

  }

}


/*
========================================
VOICE BUTTON
========================================
*/

if (voiceBtn) {

  voiceBtn.addEventListener(
    "click",
    () => {

      if (
        !voiceButtonListening
      ) {

        voiceButtonListening =
          true;


        startVoiceRecognition();


      } else {

        voiceButtonListening =
          false;


        stopVoiceRecognition();

      }

    }
  );

}


/*
========================================
DETECT SPEECH LANGUAGE
========================================
*/

function detectSpeechLanguage(
  text
) {

  const value =
    String(text || "")
      .toLowerCase();


  const kinyarwandaWords = [

    "ndi",
    "iki",
    "ese",
    "ute",
    "gute",
    "wabigenza",
    "urakoze",
    "amakuru",
    "murakoze",
    "rwanda",
    "yego",
    "oya",
    "ni gute"

  ];


  const frenchWords = [

    "bonjour",
    "comment",
    "merci",
    "pour",
    "avec",
    "quelle",
    "quel",
    "français"

  ];


  const hasKinyarwanda =
    kinyarwandaWords.some(
      word =>
        value.includes(word)
    );


  const hasFrench =
    frenchWords.some(
      word =>
        value.includes(word)
    );


  if (hasKinyarwanda) {

    return "rw-RW";

  }


  if (hasFrench) {

    return "fr-FR";

  }


  return "en-US";

}


/*
========================================
VOICE SPEAKING DESIGN
========================================
*/

function createVoiceSpeakingDesign() {

  if (
    document.getElementById(
      "rwandaVoiceSpeaking"
    )
  ) {

    return;

  }


  const indicator =
    document.createElement(
      "div"
    );


  indicator.id =
    "rwandaVoiceSpeaking";


  indicator.innerHTML = `

    <div class="rwanda-voice-speaking-icon">

      🔊

    </div>


    <div class="rwanda-voice-speaking-text">

      <strong>
        Rwanda AI
      </strong>

      <span>
        is speaking...
      </span>

    </div>


    <button
      type="button"
      id="rwandaStopSpeaking"
      class="rwanda-stop-speaking"
    >

      Stop

    </button>

  `;


  indicator.style.display =
    "none";


  document.body.appendChild(
    indicator
  );


  const style =
    document.createElement(
      "style"
    );


  style.id =
    "rwandaVoiceSpeakingStyles";


  style.textContent = `

    #rwandaVoiceSpeaking {

      position: fixed;

      left: 50%;

      bottom: 22px;

      transform:
        translateX(-50%);

      z-index: 100000;

      display: flex;

      align-items: center;

      gap: 11px;

      padding:
        12px 14px;

      background:
        #ffffff;

      border:
        1px solid #dbeafe;

      border-radius:
        18px;

      box-shadow:
        0 10px 35px
        rgba(0,0,0,0.16);

      font-family:
        Arial,
        sans-serif;

      min-width:
        245px;

      max-width:
        90vw;

      box-sizing:
        border-box;

    }


    .rwanda-voice-speaking-icon {

      width:
        40px;

      height:
        40px;

      border-radius:
        50%;

      background:
        #eff6ff;

      display:
        flex;

      align-items:
        center;

      justify-content:
        center;

      font-size:
        20px;

      animation:
        rwandaVoicePulse
        1.2s infinite;

    }


    .rwanda-voice-speaking-text {

      flex:
        1;

      min-width:
        0;

      display:
        flex;

      flex-direction:
        column;

      gap:
        2px;

    }


    .rwanda-voice-speaking-text strong {

      font-size:
        13px;

      color:
        #2563eb;

    }


    .rwanda-voice-speaking-text span {

      font-size:
        12px;

      color:
        #6b7280;

    }


    .rwanda-stop-speaking {

      border:
        none;

      background:
        #f3f4f6;

      color:
        #111827;

      padding:
        8px 12px;

      border-radius:
        10px;

      font-size:
        12px;

      font-weight:
        600;

      cursor:
        pointer;

    }


    .rwanda-stop-speaking:hover {

      background:
        #e5e7eb;

    }


    @keyframes rwandaVoicePulse {

      0% {

        transform:
          scale(1);

      }

      50% {

        transform:
          scale(1.10);

      }

      100% {

        transform:
          scale(1);

      }

    }


    @media (max-width: 600px) {

      #rwandaVoiceSpeaking {

        bottom:
          15px;

        min-width:
          220px;

        padding:
          10px 12px;

      }


      .rwanda-voice-speaking-icon {

        width:
          36px;

        height:
          36px;

      }

    }

  `;


  document.head.appendChild(
    style
  );


  const stopButton =
    document.getElementById(
      "rwandaStopSpeaking"
    );


  if (stopButton) {

    stopButton.addEventListener(
      "click",
      () => {

        window.speechSynthesis.cancel();


        hideVoiceSpeakingDesign();

      }
    );

  }

}


/*
========================================
SHOW VOICE SPEAKING
========================================
*/

function showVoiceSpeakingDesign() {

  createVoiceSpeakingDesign();


  const indicator =
    document.getElementById(
      "rwandaVoiceSpeaking"
    );


  if (indicator) {

    indicator.style.display =
      "flex";

  }

}


/*
========================================
HIDE VOICE SPEAKING
========================================
*/

function hideVoiceSpeakingDesign() {

  const indicator =
    document.getElementById(
      "rwandaVoiceSpeaking"
    );


  if (indicator) {

    indicator.style.display =
      "none";

  }

}


/*
========================================
SPEAK TEXT
========================================
*/

function speakText(text) {

  if (
    !(
      "speechSynthesis"
      in window
    )
  ) {

    return;

  }


  const cleanText =
    cleanAIAnswer(
      text
    );


  if (!cleanText) {
    return;
  }


  window.speechSynthesis.cancel();


  showVoiceSpeakingDesign();


  const utterance =
    new SpeechSynthesisUtterance(
      cleanText
    );


  utterance.lang =
    detectSpeechLanguage(
      cleanText
    );


  utterance.rate =
    0.95;


  utterance.pitch =
    1;


  const voices =
    window.speechSynthesis
      .getVoices();


  const femaleVoice =
    voices.find(
      voice =>
        /female|samantha|zira|google uk english female|microsoft/i
          .test(
            voice.name
          )
    );


  if (femaleVoice) {

    utterance.voice =
      femaleVoice;

  }


  utterance.onstart =
    () => {

      showVoiceSpeakingDesign();

    };


  utterance.onend =
    () => {

      hideVoiceSpeakingDesign();

    };


  utterance.onerror =
    () => {

      hideVoiceSpeakingDesign();

    };


  window.speechSynthesis.speak(
    utterance
  );

}


/*
========================================
INITIALIZE
========================================
*/

createPastConversationsDesign();

createVoiceSpeakingDesign();

prepareConversationView();


/*
========================================
GLOBAL
========================================
*/

window.RwandaAI = {

  askRwandaAI,

  startVoiceRecognition,

  stopVoiceRecognition,

  openPastConversations,

  closePastConversations,

  speakText

};
