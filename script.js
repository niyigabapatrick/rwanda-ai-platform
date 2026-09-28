/*
==========================================================
RWANDA AI PLATFORM
AI ASSISTANT
FIREBASE + GROQ BACKEND
PAST CONVERSATIONS
MEMORIES
VOICE AI
STICKERS
DIRECT GOOGLE IMAGE SEARCH
CLEAN NORMAL CALCULATION ANSWERS
==========================================================
*/


/*
==========================================================
FIREBASE
==========================================================
*/

import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  query,
  where,
  serverTimestamp,
  doc,
  updateDoc
} from "https://www.gstatic.com/firebasejs/12.17.0/firebase-firestore.js";

import {
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/12.17.0/firebase-auth.js";

import {
  db,
  auth
} from "./firebase.js";


/*
==========================================================
BACKEND
==========================================================
*/

const BACKEND_URL =
  "https://script.google.com/macros/s/AKfycbxR5kc1QZ-RpqpkmoPiGA5LEeTnKglTmPBDFP00VLLH3_7QwJZP0tzxLnJYSnGWFHWp9A/exec";


/*
==========================================================
STATE
==========================================================
*/

let currentUser = null;
let currentConversationId = null;
let currentConversationTitle = "New Conversation";
let conversationMessages = [];
let userMemories = [];
let isSending = false;

let recognition = null;
let isListening = false;

let deferredInstallPrompt = null;


/*
==========================================================
DOM
==========================================================
*/

const questionInput =
  document.getElementById("question");

const askBtn =
  document.getElementById("askBtn");

const answerBox =
  document.getElementById("answer");

const statusBox =
  document.getElementById("status");

const userEmailBox =
  document.getElementById("userEmail");

const logoutBtn =
  document.getElementById("logoutBtn");

const newChatBtn =
  document.getElementById("newChatBtn");

const pastConversationsBtn =
  document.getElementById("pastConversationsBtn");

const pastConversationsPanel =
  document.getElementById("pastConversationsPanel");

const pastConversationsList =
  document.getElementById("pastConversationsList");

const voiceBtn =
  document.getElementById("voiceBtn");

const voiceStatus =
  document.getElementById("voiceStatus");

const stickerBtn =
  document.getElementById("stickerBtn");

const stickerPicker =
  document.getElementById("stickerPicker");

const conversationModal =
  document.getElementById("conversationModal");

const conversationModalContent =
  document.getElementById("conversationModalContent");

const closeConversationModal =
  document.getElementById("closeConversationModal");

const installNotification =
  document.getElementById("rwandaAIInstallNotification");

const installNotificationClose =
  document.getElementById("installNotificationClose");


/*
==========================================================
UTILITY
==========================================================
*/

function setStatus(message) {
  if (statusBox) {
    statusBox.textContent = message || "";
  }
}


function setVoiceStatus(message) {
  if (voiceStatus) {
    voiceStatus.textContent = message || "";
  }
}


function scrollToAnswer() {
  if (!answerBox) return;

  setTimeout(() => {
    answerBox.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  }, 100);
}


function escapeHTML(text) {
  const div = document.createElement("div");
  div.textContent = text == null ? "" : String(text);
  return div.innerHTML;
}


function escapeRegExp(value) {
  return String(value).replace(
    /[.*+?^${}()|[\]\\]/g,
    "\\$&"
  );
}


/*
==========================================================
COPY ANSWER
==========================================================
*/

async function copyAnswerText(text, button = null) {

  const cleanText =
    cleanAIAnswer(text);

  if (!cleanText) return;

  const originalText =
    button
      ? button.textContent
      : "";

  try {

    if (
      navigator.clipboard &&
      navigator.clipboard.writeText
    ) {

      await navigator.clipboard.writeText(
        cleanText
      );

    } else {

      const textarea =
        document.createElement("textarea");

      textarea.value =
        cleanText;

      textarea.style.position =
        "fixed";

      textarea.style.opacity =
        "0";

      document.body.appendChild(
        textarea
      );

      textarea.focus();
      textarea.select();

      document.execCommand(
        "copy"
      );

      document.body.removeChild(
        textarea
      );
    }

    if (button) {

      button.textContent =
        "✓ Copied";

      button.style.background =
        "#000000";

      button.style.color =
        "#ffffff";

      setTimeout(() => {

        button.textContent =
          originalText || "📋 Copy";

        button.style.background =
          "";

        button.style.color =
          "";

      }, 1500);
    }

    setStatus(
      "Answer copied."
    );

  } catch (error) {

    console.error(
      "Copy answer error:",
      error
    );

    setStatus(
      "Could not copy the answer."
    );
  }
}


/*
==========================================================
CALCULATION CLEANING
==========================================================
*/

function superscript(value) {

  const map = {
    "0": "⁰",
    "1": "¹",
    "2": "²",
    "3": "³",
    "4": "⁴",
    "5": "⁵",
    "6": "⁶",
    "7": "⁷",
    "8": "⁸",
    "9": "⁹",
    "+": "⁺",
    "-": "⁻",
    "=": "⁼",
    "(": "⁽",
    ")": "⁾",
    "n": "ⁿ",
    "i": "ⁱ"
  };

  return String(value || "")
    .split("")
    .map(c => map[c] || c)
    .join("");
}


function readLatexGroup(text, startIndex) {

  if (text[startIndex] !== "{") {
    return {
      content: "",
      end: startIndex
    };
  }

  let depth = 0;

  for (let i = startIndex; i < text.length; i++) {

    if (text[i] === "{") {
      depth++;
    }

    if (text[i] === "}") {
      depth--;

      if (depth === 0) {
        return {
          content: text.slice(
            startIndex + 1,
            i
          ),
          end: i + 1
        };
      }
    }
  }

  return {
    content: text.slice(startIndex + 1),
    end: text.length
  };
}


function convertLatexFractions(text) {

  let result = "";
  let i = 0;

  while (i < text.length) {

    if (
      text.startsWith("\\frac", i)
    ) {

      let j = i + 5;

      while (
        j < text.length &&
        /\s/.test(text[j])
      ) {
        j++;
      }

      if (text[j] === "{") {

        const numerator =
          readLatexGroup(text, j);

        j = numerator.end;

        while (
          j < text.length &&
          /\s/.test(text[j])
        ) {
          j++;
        }

        if (text[j] === "{") {

          const denominator =
            readLatexGroup(text, j);

          const top =
            convertLatexFractions(
              numerator.content
            );

          const bottom =
            convertLatexFractions(
              denominator.content
            );

          result +=
            "(" +
            top +
            ")/(" +
            bottom +
            ")";

          i =
            denominator.end;

          continue;
        }
      }
    }

    result += text[i];
    i++;
  }

  return result;
}


function removeLatexCommandGroups(text) {

  const commands = [
    "\\boxed",
    "\\text",
    "\\mathrm",
    "\\mathbf",
    "\\mathit",
    "\\operatorname",
    "\\displaystyle"
  ];

  let result = text;

  for (const command of commands) {

    let index;

    while (
      (index = result.indexOf(command)) !== -1
    ) {

      let j =
        index + command.length;

      while (
        j < result.length &&
        /\s/.test(result[j])
      ) {
        j++;
      }

      if (result[j] !== "{") {

        result =
          result.slice(0, index) +
          result.slice(j);

        continue;
      }

      const group =
        readLatexGroup(result, j);

      result =
        result.slice(0, index) +
        group.content +
        result.slice(group.end);
    }
  }

  return result;
}


function convertSquareRoots(text) {

  let result = text;
  let safety = 0;

  while (
    result.includes("\\sqrt") &&
    safety < 100
  ) {

    safety++;

    const index =
      result.indexOf("\\sqrt");

    let j =
      index + 5;

    while (
      j < result.length &&
      /\s/.test(result[j])
    ) {
      j++;
    }

    if (result[j] === "[") {

      const close =
        result.indexOf("]", j);

      if (close !== -1) {
        j = close + 1;
      }
    }

    while (
      j < result.length &&
      /\s/.test(result[j])
    ) {
      j++;
    }

    if (result[j] === "{") {

      const group =
        readLatexGroup(result, j);

      result =
        result.slice(0, index) +
        "√(" +
        group.content +
        ")" +
        result.slice(group.end);

    } else {

      const match =
        result.slice(j)
          .match(
            /^[A-Za-z0-9]+/
          );

      if (match) {

        result =
          result.slice(0, index) +
          "√(" +
          match[0] +
          ")" +
          result.slice(
            j + match[0].length
          );

      } else {

        result =
          result.slice(0, index) +
          result.slice(j);
      }
    }
  }

  return result;
}


function replaceLatexSymbols(text) {

  const symbols = {

    "\\times": "×",
    "\\cdot": "·",
    "\\div": "÷",
    "\\pm": "±",
    "\\mp": "∓",

    "\\leq": "≤",
    "\\le": "≤",
    "\\geq": "≥",
    "\\ge": "≥",
    "\\neq": "≠",

    "\\approx": "≈",
    "\\equiv": "≡",
    "\\sim": "∼",

    "\\infty": "∞",

    "\\pi": "π",
    "\\theta": "θ",
    "\\alpha": "α",
    "\\beta": "β",
    "\\gamma": "γ",
    "\\delta": "δ",
    "\\Delta": "Δ",

    "\\lambda": "λ",
    "\\mu": "μ",
    "\\sigma": "σ",
    "\\omega": "ω",
    "\\Omega": "Ω",

    "\\Gamma": "Γ",
    "\\zeta": "ζ",

    "\\sum": "Σ",
    "\\prod": "Π",
    "\\int": "∫",
    "\\oint": "∮",

    "\\partial": "∂",
    "\\nabla": "∇",

    "\\rightarrow": "→",
    "\\longrightarrow": "→",
    "\\to": "→",

    "\\left": "",
    "\\right": "",

    "\\qquad": " ",
    "\\quad": " ",
    "\\,": " ",
    "\\;": " ",
    "\\:": " ",
    "\\!": " ",

    "\\ldots": "...",
    "\\cdots": "...",

    "\\%": "%",
    "\\degree": "°"
  };

  let result = text;

  Object.keys(symbols).forEach(command => {

    result =
      result.replace(
        new RegExp(
          escapeRegExp(command),
          "g"
        ),
        symbols[command]
      );

  });

  return result;
}


function convertPowers(text) {

  let result = text;

  result =
    result.replace(
      /\^\s*\{([^{}]+)\}/g,
      (match, power) =>
        superscript(power)
    );

  result =
    result.replace(
      /\^\s*([0-9]+)/g,
      (match, power) =>
        superscript(power)
    );

  result =
    result.replace(
      /\^\s*n\b/g,
      "ⁿ"
    );

  result =
    result.replace(
      /\^\s*i\b/g,
      "ⁱ"
    );

  result =
    result.replace(
      /\^\s*/g,
      ""
    );

  return result;
}


function convertSubscripts(text) {

  const subMap = {
    "0": "₀",
    "1": "₁",
    "2": "₂",
    "3": "₃",
    "4": "₄",
    "5": "₅",
    "6": "₆",
    "7": "₇",
    "8": "₈",
    "9": "₉",
    "+": "₊",
    "-": "₋",
    "(": "₍",
    ")": "₎",
    "n": "ₙ"
  };

  let result = text;

  result =
    result.replace(
      /_\s*\{([^{}]+)\}/g,
      (match, sub) =>
        sub
          .split("")
          .map(c => subMap[c] || c)
          .join("")
    );

  result =
    result.replace(
      /_\s*([0-9]+)/g,
      (match, sub) =>
        sub
          .split("")
          .map(c => subMap[c] || c)
          .join("")
    );

  return result;
}


function cleanMathematics(text) {

  let answer =
    String(text || "");

  answer =
    answer.replace(
      /≤ft/g,
      "("
    );

  answer =
    answer.replace(
      /≥ight/g,
      ")"
    );

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
      /\$\$/g,
      ""
    );

  answer =
    answer.replace(
      /\$/g,
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
    convertLatexFractions(
      answer
    );

  answer =
    convertSquareRoots(
      answer
    );

  answer =
    removeLatexCommandGroups(
      answer
    );

  answer =
    replaceLatexSymbols(
      answer
    );

  answer =
    convertPowers(
      answer
    );

  answer =
    convertSubscripts(
      answer
    );

  answer =
    answer.replace(
      /d\)\s*\/\s*\(dx\)/gi,
      "d/dx"
    );

  answer =
    answer.replace(
      /d\s*\/\s*\(dx\)/gi,
      "d/dx"
    );

  answer =
    answer.replace(
      /\(dx\)/gi,
      "dx"
    );

  answer =
    answer.replace(
      /\\[A-Za-z]+/g,
      ""
    );

  answer =
    answer.replace(
      /\\[\s,;!:]+/g,
      " "
    );

  answer =
    answer.replace(
      /[{}]/g,
      ""
    );

  answer =
    answer.replace(
      /\bboxed\b(?=\s*[:=])/gi,
      ""
    );

  answer =
    answer.replace(
      /\bfrac\b(?=\s*\()/gi,
      ""
    );

  answer =
    answer.replace(
      /\bsqrt\b(?=\s*\()/gi,
      "√"
    );

  answer =
    answer.replace(
      /[ \t]{2,}/g,
      " "
    );

  return answer;
}


/*
==========================================================
FINAL AI ANSWER CLEANER
==========================================================
*/

function cleanAIAnswer(text) {

  if (
    text === null ||
    text === undefined ||
    String(text).trim() === ""
  ) {
    return "Rwanda AI did not return an answer.";
  }

  let answer =
    String(text);

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

  answer =
    cleanMathematics(
      answer
    );

  answer =
    answer.replace(
      /^\s*#{1,6}\s*/gm,
      ""
    );

  answer =
    answer.replace(
      /^\s*[-*]\s+/gm,
      "• "
    );

  answer =
    answer.replace(
      /^\s*[-_=]{3,}\s*$/gm,
      ""
    );

  answer =
    answer.replace(
      /¥/g,
      ""
    );

  answer =
    answer.replace(
      /\n{4,}/g,
      "\n\n"
    );

  answer =
    answer.replace(
      /[ \t]+\n/g,
      "\n"
    );

  return answer.trim();
}


/*
==========================================================
ANSWER COPY BUTTON HTML
==========================================================
*/

function createCopyButton(text) {

  const button =
    document.createElement(
      "button"
    );

  button.type =
    "button";

  button.textContent =
    "📋 Copy";

  button.className =
    "rwanda-ai-copy-button";

  button.style.cssText =
    "display:inline-flex;" +
    "align-items:center;" +
    "justify-content:center;" +
    "gap:6px;" +
    "margin-top:12px;" +
    "padding:8px 14px;" +
    "border:1px solid #000000;" +
    "border-radius:8px;" +
    "background:#ffffff;" +
    "color:#000000;" +
    "font-weight:800;" +
    "font-size:13px;" +
    "cursor:pointer;";

  button.addEventListener(
    "click",
    () => {
      copyAnswerText(
        text,
        button
      );
    }
  );

  return button;
}


/*
==========================================================
DISPLAY ANSWER
==========================================================
*/

function displayAnswer(text) {

  if (!answerBox) return;

  const cleaned =
    cleanAIAnswer(text);

  answerBox.innerHTML = "";

  const answerHeader =
    document.createElement(
      "div"
    );

  answerHeader.textContent =
    "Rwanda AI:";

  answerHeader.style.cssText =
    "font-weight:900;" +
    "color:#000000;" +
    "margin-bottom:8px;";

  const answerContent =
    document.createElement(
      "div"
    );

  answerContent.className =
    "rwanda-ai-answer-text";

  answerContent.style.cssText =
    "font-weight:700;" +
    "color:#000000;" +
    "line-height:1.65;" +
    "word-wrap:break-word;";

  answerContent.innerHTML =
    escapeHTML(cleaned)
      .replace(
        /\*\*(.*?)\*\*/g,
        "<strong>$1</strong>"
      )
      .replace(
        /\n/g,
        "<br>"
      );

  answerBox.appendChild(
    answerHeader
  );

  answerBox.appendChild(
    answerContent
  );

  answerBox.appendChild(
    createCopyButton(
      cleaned
    )
  );
}


/*
==========================================================
DISPLAY USER
==========================================================
*/

function displayUserMessage(text) {

  if (!answerBox) return;

  const safe =
    escapeHTML(text);

  answerBox.innerHTML =
    "<strong>You:</strong><br>" +
    safe.replace(/\n/g, "<br>") +
    "<br><br>";
}


/*
==========================================================
LOADING
==========================================================
*/

function displayLoading() {

  if (!answerBox) return;

  answerBox.innerHTML =
    "<strong>Rwanda AI:</strong><br>" +
    "Thinking...";
}


/*
==========================================================
IMAGE REQUEST DETECTION
==========================================================
*/

function shouldSearchImages(question) {

  const text =
    String(question || "")
      .toLowerCase()
      .trim();

  if (!text) return false;

  const patterns = [

    /\bimage\b/,
    /\bimages\b/,
    /\bphoto\b/,
    /\bphotos\b/,
    /\bpicture\b/,
    /\bpictures\b/,
    /\bpics?\b/,
    /\bphotograph\b/,
    /\bphotographs\b/,
    /\bshow me\b/,
    /\bvisual\b/,
    /\bvisuals\b/,
    /\blook at\b/,
    /\bwhat does .* look like\b/,

    /\bifoto\b/,
    /\bamafoto\b/,
    /\bifoto rya\b/,
    /\bamafoto ya\b/,
    /\bnyereka ifoto\b/,
    /\bnyereka amafoto\b/,
    /\bmwereke ifoto\b/,
    /\bmwereke amafoto\b/,
    /\bndifuza kubona ifoto\b/,
    /\bndifuza kubona amafoto\b/

  ];

  return patterns.some(
    pattern => pattern.test(text)
  );
}


/*
==========================================================
GOOGLE IMAGE QUERY
==========================================================
*/

function buildImageSearchQuery(question) {

  let result =
    String(question || "")
      .trim();

  const english = [

    "show me images of",
    "show me image of",
    "show me pictures of",
    "show me picture of",
    "show me photos of",
    "show me photo of",
    "show images of",
    "show image of",
    "show pictures of",
    "show picture of",
    "show photos of",
    "show photo of",
    "show me pics of",
    "show pics of",
    "images of",
    "image of",
    "pictures of",
    "picture of",
    "photos of",
    "photo of",
    "pics of",
    "show me",
    "show"
  ];

  english.forEach(phrase => {

    result =
      result.replace(
        new RegExp(
          escapeRegExp(phrase),
          "gi"
        ),
        " "
      );
  });

  const kinyarwanda = [

    "nyereka amafoto ya",
    "nyereka amafoto",
    "nyereka ifoto ya",
    "nyereka ifoto",
    "mwereke amafoto ya",
    "mwereke amafoto",
    "mwereke ifoto ya",
    "mwereke ifoto",
    "amafoto ya",
    "amafoto",
    "ifoto ya",
    "ifoto"
  ];

  kinyarwanda.forEach(phrase => {

    result =
      result.replace(
        new RegExp(
          escapeRegExp(phrase),
          "gi"
        ),
        " "
      );
  });

  result =
    result.replace(
      /[?？!！]/g,
      " "
    );

  result =
    result
      .replace(/\s+/g, " ")
      .trim();

  if (!result) {

    result =
      String(question || "")
        .replace(/[?？!！]/g, "")
        .trim();
  }

  return result;
}


/*
==========================================================
OPEN GOOGLE IMAGES
==========================================================
*/

function openGoogleImagesImmediately(question) {

  const imageQuery =
    buildImageSearchQuery(
      question
    );

  const url =
    "https://www.google.com/search?tbm=isch&q=" +
    encodeURIComponent(imageQuery);

  const tab =
    window.open(
      url,
      "_blank"
    );

  if (tab) {

    try {
      tab.opener = null;
    } catch (error) {}

    return {
      opened: true,
      query: imageQuery,
      url: url
    };
  }

  return {
    opened: false,
    query: imageQuery,
    url: url
  };
}


/*
==========================================================
IMAGE LOADING
==========================================================
*/

function displayImageLoading(query) {

  if (!answerBox) return;

  answerBox.innerHTML =
    "<div style=\"" +
    "text-align:center;" +
    "padding:25px 10px;" +
    "font-family:inherit;" +
    "\">" +

    "<div style=\"" +
    "font-size:42px;" +
    "margin-bottom:12px;" +
    "\">🖼️</div>" +

    "<div style=\"" +
    "font-size:18px;" +
    "font-weight:700;" +
    "margin-bottom:8px;" +
    "\">" +
    "Opening Google Images..." +
    "</div>" +

    "<div style=\"" +
    "font-size:14px;" +
    "opacity:.75;" +
    "\">" +
    "Searching images for: " +
    escapeHTML(query) +
    "</div>" +

    "</div>";
}


/*
==========================================================
GOOGLE FALLBACK
==========================================================
*/

function displayGoogleFallback(url, query) {

  if (!answerBox) return;

  answerBox.innerHTML =
    "<div style=\"" +
    "text-align:center;" +
    "padding:20px 10px;" +
    "\">" +

    "<div style=\"font-size:38px;\">🖼️</div>" +

    "<div style=\"" +
    "font-size:18px;" +
    "font-weight:700;" +
    "margin:10px 0;" +
    "\">" +
    "Google Images is ready" +
    "</div>" +

    "<div style=\"" +
    "font-size:14px;" +
    "margin-bottom:15px;" +
    "\">" +
    "Tap below to view images for " +
    escapeHTML(query) +
    "</div>" +

    "<a href=\"" +
    escapeHTML(url) +
    "\" target=\"_blank\" " +
    "rel=\"noopener noreferrer\" " +
    "style=\"" +
    "display:inline-block;" +
    "padding:12px 18px;" +
    "border-radius:10px;" +
    "text-decoration:none;" +
    "font-weight:700;" +
    "background:#1b5e20;" +
    "color:white;" +
    "\">" +
    "Open Google Images →" +
    "</a>" +

    "</div>";
}


/*
==========================================================
CONVERSATION CATEGORY DETECTION
==========================================================
*/

function detectConversationCategory(text) {

  const value =
    String(text || "")
      .toLowerCase();

  /*
  POLYNOMIAL
  */

  if (
    /\bpolynomial\b/.test(value) ||
    /\bpolynomials\b/.test(value) ||
    /\bp\(x\)\b/.test(value) ||
    /\bf\(x\)\b/.test(value) ||
    /\bx[⁰¹²³⁴⁵⁶⁷⁸⁹]+\b/.test(value) ||
    /\bx\^\d+/.test(value) ||
    /\bx\s*\+\s*1\/x/.test(value) ||
    /\bx\s*-\s*\d+/.test(value) &&
    /roots?/.test(value)
  ) {
    return "Polynomial";
  }


  /*
  INTEGRAL
  */

  if (
    /\bintegral\b/.test(value) ||
    /\bintegrals\b/.test(value) ||
    /∫/.test(value) ||
    /\\int/.test(value) ||
    /\bdx\b/.test(value) ||
    /\bantiderivative\b/.test(value)
  ) {
    return "Integral";
  }


  /*
  TRIGONOMETRY
  */

  if (
    /\btrigonometry\b/.test(value) ||
    /\btrigonometric\b/.test(value) ||
    /\bsin\b/.test(value) ||
    /\bcos\b/.test(value) ||
    /\btan\b/.test(value) ||
    /\bcot\b/.test(value) ||
    /\bsec\b/.test(value) ||
    /\bcsc\b/.test(value)
  ) {
    return "Trigonometry";
  }


  /*
  GEOMETRY
  */

  if (
    /\bgeometry\b/.test(value) ||
    /\btriangle\b/.test(value) ||
    /\bcircle\b/.test(value) ||
    /\bquadrilateral\b/.test(value) ||
    /\bpolygon\b/.test(value) ||
    /\bangle\b/.test(value) ||
    /\barea\b/.test(value) ||
    /\bperimeter\b/.test(value) ||
    /\bcircumradius\b/.test(value) ||
    /\binradius\b/.test(value)
  ) {
    return "Geometry";
  }


  /*
  REAL ROOTS / EQUATIONS
  */

  if (
    /\breal roots?\b/.test(value) ||
    /\bfind all real roots?\b/.test(value) ||
    /\bsolve for x\b/.test(value) ||
    /\bequation\b/.test(value) ||
    /\bquadratic\b/.test(value) ||
    /\broot of\b/.test(value)
  ) {
    return "Real Roots";
  }


  /*
  PHYSICS
  */

  if (
    /\bphysics\b/.test(value) ||
    /\bvelocity\b/.test(value) ||
    /\bacceleration\b/.test(value) ||
    /\bforce\b/.test(value) ||
    /\benergy\b/.test(value) ||
    /\bmomentum\b/.test(value) ||
    /\bgravity\b/.test(value) ||
    /\bnewton\b/.test(value) ||
    /\bnavier[\s-]?stokes\b/.test(value)
  ) {
    return "Physics";
  }


  /*
  CHEMISTRY
  */

  if (
    /\bchemistry\b/.test(value) ||
    /\bchemical\b/.test(value) ||
    /\bmolecule\b/.test(value) ||
    /\batom\b/.test(value) ||
    /\bmol\b/.test(value) ||
    /\bmolar\b/.test(value) ||
    /\bacid\b/.test(value) ||
    /\bbase\b/.test(value) ||
    /\bchemical equation\b/.test(value)
  ) {
    return "Chemistry";
  }


  /*
  ASTRONOMY
  */

  if (
    /\bastronomy\b/.test(value) ||
    /\bplanet\b/.test(value) ||
    /\bstar\b/.test(value) ||
    /\bgalaxy\b/.test(value) ||
    /\bblack hole\b/.test(value) ||
    /\bsolar system\b/.test(value) ||
    /\buniverse\b/.test(value) ||
    /\bsun\b/.test(value) ||
    /\bmoon\b/.test(value)
  ) {
    return "Astronomy";
  }


  /*
  BIOLOGY
  */

  if (
    /\bbiology\b/.test(value) ||
    /\bcell\b/.test(value) ||
    /\bdna\b/.test(value) ||
    /\bgenetics\b/.test(value) ||
    /\bprotein\b/.test(value) ||
    /\borganism\b/.test(value) ||
    /\bphotosynthesis\b/.test(value)
  ) {
    return "Biology";
  }


  /*
  MATHEMATICS GENERAL
  */

  if (
    /\bmathematics\b/.test(value) ||
    /\bmath\b/.test(value) ||
    /\bcalculate\b/.test(value) ||
    /\bcalculation\b/.test(value) ||
    /\bsolve\b/.test(value) ||
    /\bderivative\b/.test(value) ||
    /\bmatrix\b/.test(value) ||
    /\bprobability\b/.test(value)
  ) {
    return "Mathematics";
  }


  /*
  RWANDA / GEOGRAPHY
  */

  if (
    /\brwanda\b/.test(value) ||
    /\bprovince\b/.test(value) ||
    /\bdistrict\b/.test(value) ||
    /\bmountain\b/.test(value) ||
    /\blake\b/.test(value) ||
    /\bforest\b/.test(value) ||
    /\briver\b/.test(value)
  ) {
    return "Rwanda / Geography";
  }


  /*
  DEFAULT
  */

  return "General";
}


/*
==========================================================
CONVERSATION CATEGORY BADGE
==========================================================
*/

function createCategoryBadge(category) {

  const badge =
    document.createElement(
      "span"
    );

  badge.className =
    "conversation-category";

  badge.textContent =
    category;

  badge.style.cssText =
    "display:inline-block;" +
    "margin-top:6px;" +
    "padding:3px 8px;" +
    "border-radius:999px;" +
    "background:#000000;" +
    "color:#ffffff;" +
    "font-size:11px;" +
    "font-weight:800;" +
    "letter-spacing:.2px;";

  return badge;
}


/*
==========================================================
AUTH
==========================================================
*/

onAuthStateChanged(
  auth,
  async user => {

    currentUser = user;

    if (!user) {

      if (userEmailBox) {
        userEmailBox.textContent =
          "Not signed in";
      }

      setStatus(
        "Please login to use Rwanda AI."
      );

      if (askBtn) {
        askBtn.disabled = true;
      }

      if (newChatBtn) {
        newChatBtn.disabled = true;
      }

      return;
    }

    if (userEmailBox) {
      userEmailBox.textContent =
        user.email || "Signed in";
    }

    if (askBtn) {
      askBtn.disabled = false;
    }

    if (newChatBtn) {
      newChatBtn.disabled = false;
    }

    setStatus("");

    try {

      await loadUserMemories();
      await loadPastConversations();

    } catch (error) {

      console.error(
        "Initial Firebase loading error:",
        error
      );
    }
  }
);


/*
==========================================================
LOGOUT
==========================================================
*/

if (logoutBtn) {

  logoutBtn.addEventListener(
    "click",
    async () => {

      try {

        await signOut(auth);

        currentUser = null;
        currentConversationId = null;
        currentConversationTitle =
          "New Conversation";

        conversationMessages = [];
        userMemories = [];

        if (questionInput) {
          questionInput.value = "";
        }

        if (answerBox) {
          answerBox.innerHTML =
            '<span class="answer-placeholder">' +
            "Please login to use Rwanda AI." +
            "</span>";
        }

        setStatus("");

      } catch (error) {

        console.error(
          "Logout error:",
          error
        );

        setStatus(
          "Logout failed."
        );
      }
    }
  );
}


/*
==========================================================
NEW CHAT
==========================================================
*/

if (newChatBtn) {

  newChatBtn.addEventListener(
    "click",
    () => {

      currentConversationId = null;

      currentConversationTitle =
        "New Conversation";

      conversationMessages = [];

      if (questionInput) {

        questionInput.value = "";
        questionInput.focus();

      }

      if (answerBox) {

        answerBox.innerHTML =
          '<span class="answer-placeholder">' +
          "Rwanda AI is ready. Ask your question." +
          "</span>";

      }

      setStatus("");

      if (pastConversationsPanel) {

        pastConversationsPanel.classList.remove(
          "open"
        );
      }
    }
  );
}


/*
==========================================================
PAST CONVERSATIONS BUTTON
==========================================================
*/

if (pastConversationsBtn) {

  pastConversationsBtn.addEventListener(
    "click",
    async () => {

      if (!currentUser) {

        setStatus(
          "Please login first."
        );

        return;
      }

      if (!pastConversationsPanel) {
        return;
      }

      const opening =
        !pastConversationsPanel.classList.contains(
          "open"
        );

      if (opening) {

        pastConversationsPanel.classList.add(
          "open"
        );

        await loadPastConversations();

      } else {

        pastConversationsPanel.classList.remove(
          "open"
        );
      }
    }
  );
}


/*
==========================================================
SEND BUTTON
==========================================================
*/

if (askBtn) {

  askBtn.addEventListener(
    "click",
    sendMessage
  );
}


/*
==========================================================
ENTER
==========================================================
*/

if (questionInput) {

  questionInput.addEventListener(
    "keydown",
    event => {

      if (
        event.key === "Enter" &&
        !event.shiftKey
      ) {

        event.preventDefault();

        sendMessage();
      }
    }
  );
}


/*
==========================================================
SEND MESSAGE
==========================================================
*/

async function sendMessage() {

  if (isSending) return;

  if (!currentUser) {

    setStatus(
      "Please login first."
    );

    return;
  }

  const question =
    questionInput
      ? questionInput.value.trim()
      : "";

  if (!question) {

    setStatus(
      "Please enter a question."
    );

    if (questionInput) {
      questionInput.focus();
    }

    return;
  }

  isSending = true;

  if (askBtn) {
    askBtn.disabled = true;
  }

  if (questionInput) {
    questionInput.disabled = true;
  }


  /*
  ========================================================
  DIRECT GOOGLE IMAGES
  ========================================================
  */

  if (
    shouldSearchImages(question)
  ) {

    const imageQuery =
      buildImageSearchQuery(
        question
      );

    displayImageLoading(
      imageQuery
    );

    scrollToAnswer();

    setStatus(
      "Opening Google Images..."
    );

    const googleResult =
      openGoogleImagesImmediately(
        question
      );

    if (questionInput) {
      questionInput.value = "";
    }

    if (googleResult.opened) {

      if (answerBox) {

        answerBox.innerHTML =
          "<div style=\"" +
          "text-align:center;" +
          "padding:20px 10px;" +
          "\">" +

          "<div style=\"font-size:42px;\">" +
          "🖼️" +
          "</div>" +

          "<div style=\"" +
          "font-size:18px;" +
          "font-weight:700;" +
          "margin:10px 0;" +
          "\">" +
          "Google Images opened" +
          "</div>" +

          "<div style=\"" +
          "font-size:14px;" +
          "opacity:.8;" +
          "line-height:1.5;" +
          "\">" +

          "Showing images for:<br>" +

          "<strong>" +
          escapeHTML(imageQuery) +
          "</strong>" +

          "<br><br>" +

          "View the images in Google, then return to Rwanda AI." +

          "</div>" +

          "</div>";
      }

      setStatus(
        "Google Images opened. You can return to Rwanda AI anytime."
      );

    } else {

      displayGoogleFallback(
        googleResult.url,
        googleResult.query
      );

      setStatus(
        "Google Images was blocked by the browser. Tap Open Google Images."
      );
    }

    isSending = false;

    if (askBtn) {
      askBtn.disabled = false;
    }

    if (questionInput) {

      questionInput.disabled = false;
      questionInput.focus();
    }

    return;
  }


  /*
  ========================================================
  NORMAL AI QUESTION
  ========================================================
  */

  setStatus(
    "Rwanda AI is thinking..."
  );

  conversationMessages.push({
    role: "user",
    content: question
  });

  displayUserMessage(question);
  displayLoading();
  scrollToAnswer();


  try {

    if (!currentConversationId) {

      currentConversationTitle =
        makeConversationTitle(
          question
        );

      currentConversationId =
        await createConversation(
          currentConversationTitle
        );
    }


    await saveMessage(
      currentConversationId,
      "user",
      question
    );


    const response =
      await callRwandaAI({

        action: "chat",

        question: question,

        userId:
          currentUser.uid,

        conversationId:
          currentConversationId,

        conversationTitle:
          currentConversationTitle,

        conversationMessages:
          conversationMessages,

        memories:
          userMemories,

        systemInstruction:
          "You are Rwanda AI. " +
          "Answer normally and clearly. " +
          "For mathematics, physics, chemistry and astronomy calculations, " +
          "DO NOT use LaTeX. " +
          "DO NOT use \\frac, \\sqrt, \\boxed, \\left, \\right, \\qquad or other LaTeX commands. " +
          "DO NOT use caret notation such as x^2. " +
          "Use Unicode powers such as x², x³ and x⁴. " +
          "Write fractions normally such as (a)/(b). " +
          "Write square roots as √(x). " +
          "Keep calculations easy to read and copy on a phone. " +
          "Do not output raw LaTeX."
      });


    if (!response) {

      throw new Error(
        "Empty response from Rwanda AI backend."
      );
    }


    if (
      response.success === false
    ) {

      throw new Error(
        response.error ||
        response.message ||
        "Rwanda AI backend returned an error."
      );
    }


    const aiAnswer =
      response.answer ||
      response.message ||
      response.text ||
      response.response ||
      "Rwanda AI did not return an answer.";


    const cleanedAnswer =
      cleanAIAnswer(
        aiAnswer
      );


    conversationMessages.push({
      role: "assistant",
      content: cleanedAnswer
    });


    displayAnswer(
      cleanedAnswer
    );

    scrollToAnswer();


    await saveMessage(
      currentConversationId,
      "assistant",
      cleanedAnswer
    );


    await updateConversation(
      currentConversationId,
      {
        title:
          currentConversationTitle,

        updatedAt:
          serverTimestamp(),

        messageCount:
          conversationMessages.length
      }
    );


    if (questionInput) {
      questionInput.value = "";
    }


    setStatus(
      "Rwanda AI answered."
    );


    try {

      await extractAndSaveMemories(
        question,
        cleanedAnswer
      );

    } catch (memoryError) {

      console.warn(
        "Memory extraction skipped:",
        memoryError
      );
    }


    try {

      await loadPastConversations();

    } catch (conversationError) {

      console.warn(
        "Conversation refresh failed:",
        conversationError
      );
    }

  } catch (error) {

    console.error(
      "Rwanda AI error:",
      error
    );


    if (
      conversationMessages.length > 0 &&
      conversationMessages[
        conversationMessages.length - 1
      ].role === "user"
    ) {

      conversationMessages.pop();
    }


    if (answerBox) {

      answerBox.innerHTML =
        "<strong>Rwanda AI:</strong><br>" +
        escapeHTML(
          getFriendlyError(error)
        );
    }

    setStatus(
      "Rwanda AI could not answer."
    );

  } finally {

    isSending = false;

    if (askBtn) {
      askBtn.disabled = false;
    }

    if (questionInput) {

      questionInput.disabled = false;
      questionInput.focus();
    }
  }
}


/*
==========================================================
CALL APPS SCRIPT
==========================================================
*/

async function callRwandaAI(payload) {

  const response =
    await fetch(
      BACKEND_URL,
      {
        method: "POST",

        headers: {
          "Content-Type":
            "text/plain;charset=utf-8"
        },

        body:
          JSON.stringify(payload)
      }
    );


  const rawText =
    await response.text();


  if (!response.ok) {

    throw new Error(
      "HTTP " +
      response.status +
      ": " +
      rawText
    );
  }


  let data;

  try {

    data =
      JSON.parse(rawText);

  } catch (error) {

    console.error(
      "Invalid JSON from backend:",
      rawText
    );

    throw new Error(
      "Backend returned invalid JSON."
    );
  }

  return data;
}


/*
==========================================================
CONVERSATION TITLE
==========================================================
*/

function makeConversationTitle(question) {

  let title =
    String(question || "")
      .trim();

  if (!title) {
    return "New Conversation";
  }

  if (title.length > 55) {

    title =
      title.substring(0, 55).trim() +
      "...";
  }

  return title;
}


/*
==========================================================
CREATE CONVERSATION
==========================================================
*/

async function createConversation(title) {

  if (!currentUser) {

    throw new Error(
      "User is not signed in."
    );
  }

  const ref =
    await addDoc(
      collection(
        db,
        "conversations"
      ),
      {
        userId:
          currentUser.uid,

        title:
          title ||
          "New Conversation",

        createdAt:
          serverTimestamp(),

        updatedAt:
          serverTimestamp(),

        messageCount:
          0
      }
    );

  return ref.id;
}


/*
==========================================================
SAVE MESSAGE
==========================================================
*/

async function saveMessage(
  conversationId,
  role,
  content
) {

  if (!currentUser) {

    throw new Error(
      "User is not signed in."
    );
  }

  if (!conversationId) {

    throw new Error(
      "Missing conversation ID."
    );
  }

  await addDoc(
    collection(
      db,
      "conversations",
      conversationId,
      "messages"
    ),
    {
      userId:
        currentUser.uid,

      role:
        role,

      content:
        String(content || ""),

      createdAt:
        serverTimestamp()
    }
  );
}


/*
==========================================================
UPDATE CONVERSATION
==========================================================
*/

async function updateConversation(
  conversationId,
  data
) {

  if (!conversationId) return;

  await updateDoc(
    doc(
      db,
      "conversations",
      conversationId
    ),
    data
  );
}


/*
==========================================================
LOAD PAST CONVERSATIONS
==========================================================
*/

async function loadPastConversations() {

  if (!currentUser) return;

  if (!pastConversationsList) return;

  pastConversationsList.innerHTML =
    '<div class="empty-conversations">' +
    "Loading conversations..." +
    "</div>";

  try {

    const q =
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


    const snapshot =
      await getDocs(q);


    const conversations = [];


    /*
    ------------------------------------------------------
    Read conversations
    ------------------------------------------------------
    */

    for (
      const item of snapshot.docs
    ) {

      const data =
        item.data() || {};

      let category =
        data.category ||
        "";

      /*
      If old conversation has no category,
      inspect its messages.
      */

      if (!category) {

        try {

          const messageSnapshot =
            await getDocs(
              collection(
                db,
                "conversations",
                item.id,
                "messages"
              )
            );

          let combinedText =
            String(
              data.title || ""
            );

          messageSnapshot.forEach(
            messageItem => {

              const messageData =
                messageItem.data() || {};

              combinedText +=
                " " +
                String(
                  messageData.content || ""
                );
            }
          );

          category =
            detectConversationCategory(
              combinedText
            );

        } catch (messageError) {

          console.warn(
            "Could not inspect conversation messages:",
            messageError
          );

          category =
            detectConversationCategory(
              data.title || ""
            );
        }
      }


      conversations.push({

        id:
          item.id,

        title:
          data.title ||
          "Untitled Conversation",

        category:
          category ||
          "General",

        createdAt:
          data.createdAt ||
          null,

        updatedAt:
          data.updatedAt ||
          null,

        messageCount:
          data.messageCount ||
          0
      });
    }


    conversations.sort(
      (a, b) =>
        getTimestampMillis(
          b.updatedAt ||
          b.createdAt
        ) -
        getTimestampMillis(
          a.updatedAt ||
          a.createdAt
        )
    );


    if (
      conversations.length === 0
    ) {

      pastConversationsList.innerHTML =
        '<div class="empty-conversations">' +
        "No past conversations yet." +
        "</div>";

      return;
    }


    pastConversationsList.innerHTML =
      "";


    conversations.forEach(
      conversation => {

        const button =
          document.createElement(
            "button"
          );

        button.type =
          "button";

        button.className =
          "conversation-item";


        button.style.cssText =
          "display:block;" +
          "width:100%;" +
          "text-align:left;" +
          "cursor:pointer;";


        const title =
          document.createElement(
            "div"
          );

        title.className =
          "conversation-title";

        title.textContent =
          conversation.title;


        const category =
          createCategoryBadge(
            conversation.category
          );


        const date =
          document.createElement(
            "div"
          );

        date.className =
          "conversation-date";

        date.textContent =
          formatDate(
            conversation.updatedAt ||
            conversation.createdAt
          );


        button.appendChild(
          title
        );

        button.appendChild(
          category
        );

        button.appendChild(
          date
        );


        button.addEventListener(
          "click",
          () =>
            openConversation(
              conversation.id
            )
        );


        pastConversationsList.appendChild(
          button
        );
      }
    );

  } catch (error) {

    console.error(
      "Load conversations error:",
      error
    );

    pastConversationsList.innerHTML =
      '<div class="empty-conversations">' +
      "Could not load conversations." +
      "</div>";
  }
}


/*
==========================================================
OPEN CONVERSATION
==========================================================
*/

async function openConversation(
  conversationId
) {

  if (!currentUser || !conversationId) {
    return;
  }

  try {

    setStatus(
      "Loading conversation..."
    );


    const conversationSnapshot =
      await getDoc(
        doc(
          db,
          "conversations",
          conversationId
        )
      );


    if (
      !conversationSnapshot.exists()
    ) {

      throw new Error(
        "Conversation no longer exists."
      );
    }


    const conversationData =
      conversationSnapshot.data();


    currentConversationId =
      conversationId;

    currentConversationTitle =
      conversationData.title ||
      "Conversation";


    const messagesSnapshot =
      await getDocs(
        collection(
          db,
          "conversations",
          conversationId,
          "messages"
        )
      );


    const loadedMessages = [];


    messagesSnapshot.forEach(item => {

      const data =
        item.data() || {};

      loadedMessages.push({

        id:
          item.id,

        role:
          data.role ||
          "assistant",

        content:
          data.content ||
          "",

        createdAt:
          data.createdAt ||
          null
      });
    });


    loadedMessages.sort(
      (a, b) =>
        getTimestampMillis(
          a.createdAt
        ) -
        getTimestampMillis(
          b.createdAt
        )
    );


    conversationMessages =
      loadedMessages.map(
        message => ({
          role:
            message.role,

          content:
            message.content
        })
      );


    showConversationModal(
      currentConversationTitle,
      loadedMessages
    );


    const latestAssistant =
      [...loadedMessages]
        .reverse()
        .find(
          message =>
            message.role ===
            "assistant"
        );


    if (latestAssistant) {

      displayAnswer(
        latestAssistant.content
      );

    } else if (
      loadedMessages.length
    ) {

      displayUserMessage(
        loadedMessages[
          loadedMessages.length - 1
        ].content
      );
    }


    if (pastConversationsPanel) {

      pastConversationsPanel.classList.remove(
        "open"
      );
    }


    setStatus(
      "Conversation loaded."
    );

  } catch (error) {

    console.error(
      "Open conversation error:",
      error
    );

    setStatus(
      "Could not open conversation."
    );
  }
}


/*
==========================================================
CONVERSATION MODAL
==========================================================
*/

function showConversationModal(
  title,
  messages
) {

  if (
    !conversationModal ||
    !conversationModalContent
  ) {
    return;
  }


  conversationModalContent.innerHTML =
    "";


  /*
  --------------------------------------------------------
  Conversation category
  --------------------------------------------------------
  */

  let combinedText =
    String(title || "");

  messages.forEach(
    message => {

      combinedText +=
        " " +
        String(
          message.content || ""
        );
    }
  );


  const category =
    detectConversationCategory(
      combinedText
    );


  const categoryBadge =
    createCategoryBadge(
      category
    );


  categoryBadge.style.marginBottom =
    "14px";


  conversationModalContent.appendChild(
    categoryBadge
  );


  /*
  --------------------------------------------------------
  Messages
  --------------------------------------------------------
  */

  messages.forEach(message => {

    const block =
      document.createElement(
        "div"
      );

    block.className =
      "message-block";


    const role =
      document.createElement(
        "div"
      );

    role.className =
      "message-role";

    role.textContent =
      message.role === "user"
        ? "You"
        : "Rwanda AI";


    if (
      message.role === "assistant"
    ) {

      role.style.cssText =
        "font-weight:900;" +
        "color:#000000;";

    }


    const content =
      document.createElement(
        "div"
      );

    content.className =
      "message-content";


    if (
      message.role === "assistant"
    ) {

      content.style.cssText =
        "font-weight:700;" +
        "color:#000000;" +
        "line-height:1.65;" +
        "word-wrap:break-word;";

    }


    const cleaned =
      cleanAIAnswer(
        message.content
      );


    content.innerHTML =
      escapeHTML(
        cleaned
      )
      .replace(
        /\*\*(.*?)\*\*/g,
        "<strong>$1</strong>"
      )
      .replace(
        /\n/g,
        "<br>"
      );


    block.appendChild(
      role
    );

    block.appendChild(
      content
    );


    /*
    Copy button only for AI answers
    */

    if (
      message.role ===
      "assistant"
    ) {

      block.appendChild(
        createCopyButton(
          cleaned
        )
      );
    }


    conversationModalContent.appendChild(
      block
    );
  });


  const modalTitle =
    conversationModal.querySelector(
      ".modal-header h3"
    );


  if (modalTitle) {

    modalTitle.textContent =
      title || "Conversation";
  }


  conversationModal.classList.add(
    "open"
  );

  conversationModal.setAttribute(
    "aria-hidden",
    "false"
  );
}


/*
==========================================================
CLOSE MODAL
==========================================================
*/

if (closeConversationModal) {

  closeConversationModal.addEventListener(
    "click",
    closeModal
  );
}


if (conversationModal) {

  conversationModal.addEventListener(
    "click",
    event => {

      if (
        event.target ===
        conversationModal
      ) {
        closeModal();
      }
    }
  );
}


function closeModal() {

  if (!conversationModal) return;

  conversationModal.classList.remove(
    "open"
  );

  conversationModal.setAttribute(
    "aria-hidden",
    "true"
  );
}


/*
==========================================================
MEMORIES
==========================================================
*/

async function loadUserMemories() {

  if (!currentUser) return;

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


    userMemories = [];


    snapshot.forEach(item => {

      const data =
        item.data() || {};

      const memory =
        data.memory ||
        data.text ||
        data.content ||
        data.fact;


      if (memory) {

        userMemories.push(
          String(memory)
        );
      }
    });


    userMemories =
      userMemories.slice(0, 50);

  } catch (error) {

    console.error(
      "Load memories error:",
      error
    );

    userMemories = [];
  }
}


/*
==========================================================
SAVE MEMORIES
==========================================================
*/

async function extractAndSaveMemories(
  question,
  answer
) {

  if (!currentUser) return;

  if (
    conversationMessages.length < 2
  ) {
    return;
  }


  const response =
    await callRwandaAI({

      action:
        "memory",

      userId:
        currentUser.uid,

      question:
        question,

      answer:
        answer,

      memories:
        userMemories
    });


  if (
    !response ||
    response.success === false
  ) {
    return;
  }


  let memories =
    response.memories ||
    response.memory ||
    [];


  if (
    typeof memories === "string"
  ) {
    memories = [memories];
  }


  if (!Array.isArray(memories)) {
    return;
  }


  for (const memory of memories) {

    const cleanMemory =
      String(memory || "").trim();

    if (!cleanMemory) continue;


    const duplicate =
      userMemories.some(
        existing =>
          existing.toLowerCase() ===
          cleanMemory.toLowerCase()
      );


    if (duplicate) continue;


    await addDoc(
      collection(
        db,
        "memories"
      ),
      {
        userId:
          currentUser.uid,

        memory:
          cleanMemory,

        createdAt:
          serverTimestamp()
      }
    );


    userMemories.push(
      cleanMemory
    );
  }


  userMemories =
    userMemories.slice(0, 50);
}


/*
==========================================================
STICKERS
==========================================================
*/

if (stickerBtn) {

  stickerBtn.addEventListener(
    "click",
    async () => {

      if (!stickerPicker) return;


      const opening =
        !stickerPicker.classList.contains(
          "open"
        );


      if (opening) {

        try {

          const response =
            await callRwandaAI({
              action: "stickers"
            });


          if (
            response &&
            Array.isArray(
              response.stickers
            )
          ) {

            renderStickers(
              response.stickers
            );
          }

        } catch (error) {

          console.warn(
            "Sticker backend unavailable:",
            error
          );
        }
      }


      stickerPicker.classList.toggle(
        "open"
      );
    }
  );
}


/*
==========================================================
STICKER BUTTONS
==========================================================
*/

function initializeStickerButtons() {

  if (!stickerPicker) return;

  const buttons =
    stickerPicker.querySelectorAll(
      ".sticker"
    );


  buttons.forEach(button => {

    button.addEventListener(
      "click",
      () => {

        insertSticker(
          button.textContent.trim()
        );
      }
    );
  });
}


/*
==========================================================
RENDER STICKERS
==========================================================
*/

function renderStickers(stickers) {

  if (!stickerPicker) return;

  stickerPicker.innerHTML = "";


  stickers.forEach(sticker => {

    const button =
      document.createElement(
        "button"
      );

    button.type =
      "button";

    button.className =
      "sticker";

    button.textContent =
      sticker;


    button.addEventListener(
      "click",
      () =>
        insertSticker(sticker)
    );


    stickerPicker.appendChild(
      button
    );
  });
}


/*
==========================================================
INSERT STICKER
==========================================================
*/

function insertSticker(sticker) {

  if (!questionInput) return;

  questionInput.value +=
    sticker;

  questionInput.focus();
}


/*
==========================================================
VOICE AI
==========================================================
*/

function initializeVoiceAI() {

  if (!voiceBtn) return;


  const SpeechRecognition =
    window.SpeechRecognition ||
    window.webkitSpeechRecognition;


  if (!SpeechRecognition) {

    voiceBtn.disabled = true;

    setVoiceStatus(
      "Voice AI is not supported by this browser."
    );

    return;
  }


  recognition =
    new SpeechRecognition();


  recognition.continuous =
    false;

  recognition.interimResults =
    true;

  recognition.lang =
    "en-US";


  recognition.onstart =
    () => {

      isListening = true;

      voiceBtn.classList.add(
        "voice-active"
      );

      voiceBtn.classList.add(
        "listening"
      );

      voiceBtn.textContent =
        "🛑 Stop Voice";

      setVoiceStatus(
        "Listening..."
      );
    };


  recognition.onresult =
    event => {

      let finalText = "";
      let interimText = "";


      for (
        let i = event.resultIndex;
        i < event.results.length;
        i++
      ) {

        const transcript =
          event.results[i][0]
            .transcript;


        if (
          event.results[i].isFinal
        ) {

          finalText +=
            transcript;

        } else {

          interimText +=
            transcript;
        }
      }


      if (questionInput) {

        questionInput.value =
          (
            finalText ||
            interimText
          ).trim();
      }
    };


  recognition.onerror =
    event => {

      console.error(
        "Voice error:",
        event.error
      );

      setVoiceStatus(
        "Voice error: " +
        event.error
      );
    };


  recognition.onend =
    () => {

      isListening = false;

      voiceBtn.classList.remove(
        "voice-active"
      );

      voiceBtn.classList.remove(
        "listening"
      );

      voiceBtn.textContent =
        "🎤 Voice AI";


      if (
        questionInput &&
        questionInput.value.trim()
      ) {

        setVoiceStatus(
          "Voice input ready."
        );

      } else {

        setVoiceStatus("");
      }
    };


  voiceBtn.addEventListener(
    "click",
    () => {

      if (!recognition) return;


      if (isListening) {

        recognition.stop();

        return;
      }


      try {

        recognition.start();

      } catch (error) {

        console.warn(
          "Voice start error:",
          error
        );
      }
    }
  );
}


/*
==========================================================
TEXT TO SPEECH
==========================================================
*/

function speakText(text) {

  if (
    !("speechSynthesis" in window)
  ) {
    return;
  }

  if (!text) return;


  window.speechSynthesis.cancel();


  const utterance =
    new SpeechSynthesisUtterance(
      cleanAIAnswer(text)
    );


  utterance.lang =
    detectLanguage(text);

  utterance.rate =
    0.95;

  utterance.pitch =
    1;


  window.speechSynthesis.speak(
    utterance
  );
}


/*
==========================================================
LANGUAGE
==========================================================
*/

function detectLanguage(text) {

  const value =
    String(text || "")
      .toLowerCase();


  const words = [

    "muraho",
    "amakuru",
    "ndashaka",
    "ni gute",
    "ese",
    "kuki",
    "mbwira",
    "rwanda",
    "urakoze",
    "murakoze",
    "umuntu",
    "abantu",
    "igihugu",
    "iki",
    "ndabaza"

  ];


  let matches = 0;


  words.forEach(word => {

    if (
      value.includes(word)
    ) {
      matches++;
    }
  });


  return matches >= 1
    ? "rw-RW"
    : "en-US";
}


/*
==========================================================
BACKEND HEALTH
==========================================================
*/

async function checkBackendHealth() {

  try {

    return await callRwandaAI({
      action: "health"
    });

  } catch (error) {

    console.error(
      "Backend health error:",
      error
    );

    return {
      success: false,
      error: error.message
    };
  }
}


/*
==========================================================
MODELS
==========================================================
*/

async function getBackendModels() {

  try {

    return await callRwandaAI({
      action: "models"
    });

  } catch (error) {

    console.error(
      "Models error:",
      error
    );

    return {
      success: false,
      error: error.message
    };
  }
}


/*
==========================================================
IMAGE ANALYSIS
==========================================================
*/

async function analyzeImage(
  imageFile,
  question = "Analyze this image."
) {

  if (!currentUser) {

    throw new Error(
      "Please login first."
    );
  }


  if (!imageFile) {

    throw new Error(
      "No image selected."
    );
  }


  const base64 =
    await fileToBase64(
      imageFile
    );


  const response =
    await callRwandaAI({

      action:
        "vision",

      userId:
        currentUser.uid,

      question:
        question,

      image:
        base64,

      conversationId:
        currentConversationId,

      conversationMessages:
        conversationMessages,

      memories:
        userMemories
    });


  if (
    response &&
    response.success === false
  ) {

    throw new Error(
      response.error ||
      "Image analysis failed."
    );
  }


  const answer =
    response.answer ||
    response.message ||
    response.text ||
    "No image analysis result.";


  return cleanAIAnswer(
    answer
  );
}


/*
==========================================================
FILE TO BASE64
==========================================================
*/

function fileToBase64(file) {

  return new Promise(
    (resolve, reject) => {

      const reader =
        new FileReader();


      reader.onload =
        () =>
          resolve(
            reader.result
          );


      reader.onerror =
        () =>
          reject(
            new Error(
              "Could not read image."
            )
          );


      reader.readAsDataURL(
        file
      );
    }
  );
}


/*
==========================================================
PWA INSTALL NOTIFICATION
==========================================================
*/

window.addEventListener(
  "beforeinstallprompt",
  event => {

    event.preventDefault();

    deferredInstallPrompt =
      event;

    showInstallNotification();
  }
);


function showInstallNotification() {

  if (!installNotification) return;

  installNotification.style.display =
    "";

  installNotification.classList.add(
    "show"
  );
}


function hideInstallNotification() {

  if (!installNotification) return;

  installNotification.classList.remove(
    "show"
  );

  setTimeout(
    () => {

      if (
        !installNotification.classList.contains(
          "show"
        )
      ) {

        installNotification.style.display =
          "none";
      }

    },
    400
  );
}


if (installNotification) {

  installNotification.addEventListener(
    "click",
    async () => {

      if (!deferredInstallPrompt) {
        return;
      }


      try {

        deferredInstallPrompt.prompt();

        await deferredInstallPrompt.userChoice;

        deferredInstallPrompt =
          null;

        hideInstallNotification();

      } catch (error) {

        console.warn(
          "Install prompt error:",
          error
        );
      }
    }
  );
}


if (installNotificationClose) {

  installNotificationClose.addEventListener(
    "click",
    event => {

      event.stopPropagation();

      hideInstallNotification();
    }
  );
}


/*
==========================================================
TIMESTAMPS
==========================================================
*/

function getTimestampMillis(timestamp) {

  if (!timestamp) return 0;


  if (
    typeof timestamp.toMillis ===
    "function"
  ) {

    return timestamp.toMillis();
  }


  if (
    timestamp instanceof Date
  ) {

    return timestamp.getTime();
  }


  if (
    timestamp.seconds !== undefined
  ) {

    return Number(
      timestamp.seconds
    ) * 1000;
  }


  if (
    typeof timestamp === "number"
  ) {

    return timestamp;
  }


  const parsed =
    Date.parse(
      String(timestamp)
    );


  return isNaN(parsed)
    ? 0
    : parsed;
}


function formatDate(timestamp) {

  const milliseconds =
    getTimestampMillis(
      timestamp
    );


  if (!milliseconds) {
    return "Date unavailable";
  }


  try {

    return new Date(
      milliseconds
    ).toLocaleString();

  } catch (error) {

    return "Date unavailable";
  }
}


/*
==========================================================
ERRORS
==========================================================
*/

function getFriendlyError(error) {

  const message =
    error && error.message
      ? String(error.message)
      : "Unknown error";


  console.error(
    "Original error:",
    message
  );


  if (
    message.includes(
      "Failed to fetch"
    )
  ) {

    return (
      "Rwanda AI backend cannot be reached. " +
      "Check the Apps Script Web App deployment and internet connection."
    );
  }


  if (
    message.includes(
      "Backend returned invalid JSON"
    )
  ) {

    return (
      "The Rwanda AI backend returned an invalid response. " +
      "Check the Apps Script deployment."
    );
  }


  if (
    message.includes(
      "HTTP 401"
    )
  ) {

    return (
      "Rwanda AI backend authentication failed. " +
      "Check the Groq API key in Apps Script."
    );
  }


  if (
    message.includes(
      "HTTP 403"
    )
  ) {

    return (
      "Rwanda AI backend access was denied. " +
      "Check the Web App deployment permissions."
    );
  }


  if (
    message.includes(
      "HTTP 429"
    )
  ) {

    return (
      "Rwanda AI is temporarily rate-limited. " +
      "Please try again shortly."
    );
  }


  if (
    message.includes(
      "permission-denied"
    ) ||
    message.includes(
      "Missing or insufficient permissions"
    )
  ) {

    return (
      "Firebase permission denied. " +
      "Check your Firestore security rules."
    );
  }


  return (
    "Rwanda AI could not complete the request. " +
    "Please try again."
  );
}


/*
==========================================================
GLOBAL API
==========================================================
*/

window.RwandaAI = {

  sendMessage,

  newChat: () => {

    if (newChatBtn) {
      newChatBtn.click();
    }
  },

  loadPastConversations,

  openConversation,

  analyzeImage,

  speakText,

  checkBackendHealth,

  getBackendModels,

  cleanAIAnswer,

  cleanMathematics,

  copyAnswerText,

  detectConversationCategory,

  openGoogleImagesImmediately,

  shouldSearchImages,

  buildImageSearchQuery,

  getCurrentUser: () =>
    currentUser,

  getConversation: () => ({

    id:
      currentConversationId,

    title:
      currentConversationTitle,

    messages:
      conversationMessages
  })
};


/*
==========================================================
INITIALIZATION
==========================================================
*/

initializeStickerButtons();

initializeVoiceAI();


console.log(
  "🇷🇼 Rwanda AI Assistant loaded successfully."
);

console.log(
  "Direct Google Images Search: ENABLED"
);

console.log(
  "Clean mathematical answers: ENABLED"
);

console.log(
  "No raw LaTeX calculation output: ENABLED"
);

console.log(
  "Past conversation categories: ENABLED"
);

console.log(
  "Answer copy shortcut: ENABLED"
);

console.log(
  "Deep black bold answers: ENABLED"
);

console.log(
  "Backend:",
  BACKEND_URL
);