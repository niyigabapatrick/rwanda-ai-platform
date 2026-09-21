import {
  db
} from "./firebase.js";


import {
  collection,
  getDocs
} from "https://www.gstatic.com/firebasejs/12.17.0/firebase-firestore.js";


const questionInput =
  document.getElementById(
    "questionInput"
  );


const searchButton =
  document.getElementById(
    "searchButton"
  );


const status =
  document.getElementById(
    "status"
  );


const result =
  document.getElementById(
    "result"
  );


const resultQuestion =
  document.getElementById(
    "resultQuestion"
  );


const resultAnswer =
  document.getElementById(
    "resultAnswer"
  );


let knowledgeData = [];


/* ==================================================
   STOP WORDS
================================================== */

const stopWords = new Set([

  "a",
  "an",
  "and",
  "are",
  "as",
  "at",
  "be",
  "by",
  "can",
  "could",
  "do",
  "does",
  "for",
  "from",
  "how",
  "i",
  "in",
  "is",
  "it",
  "of",
  "on",
  "or",
  "that",
  "the",
  "this",
  "to",
  "was",
  "what",
  "when",
  "where",
  "which",
  "who",
  "why",
  "with",
  "would",
  "you",
  "your",
  "tell",
  "me",
  "about",
  "please",
  "give",
  "information",
  "know",

  /*
  Kinyarwanda common words
  */

  "ni",
  "iki",
  "ikihe",
  "iyi",
  "izi",
  "mu",
  "muri",
  "ku",
  "kuri",
  "rya",
  "ya",
  "za",
  "y'u",
  "u",
  "na",
  "n'iki",
  "ese",
  "mbwira",
  "mpa",
  "amakuru",
  "hehe",
  "he",
  "iki"
]);


/* ==================================================
   NORMALIZE TEXT
================================================== */

function normalizeText(text) {

  return String(text || "")
    .toLowerCase()

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


/* ==================================================
   GET IMPORTANT WORDS
================================================== */

function getImportantWords(text) {

  const normalized =
    normalizeText(text);


  if (!normalized) {

    return [];

  }


  const words =
    normalized.split(" ");


  return words.filter(
    word => {

      if (!word) {

        return false;

      }


      if (
        stopWords.has(word)
      ) {

        return false;

      }


      if (
        word.length < 3
      ) {

        return false;

      }


      return true;

    }
  );

}


/* ==================================================
   SIMPLE WORD NORMALIZATION
================================================== */

function simplifyWord(word) {

  let w =
    word.toLowerCase();


  if (
    w.length > 5 &&
    w.endsWith("ies")
  ) {

    w =
      w.slice(0, -3) +
      "y";

  }

  else if (
    w.length > 5 &&
    w.endsWith("es")
  ) {

    w =
      w.slice(0, -2);

  }

  else if (
    w.length > 4 &&
    w.endsWith("s")
  ) {

    w =
      w.slice(0, -1);

  }


  return w;

}


/* ==================================================
   PREPARE WORDS
================================================== */

function prepareWords(text) {

  return getImportantWords(text)
    .map(
      simplifyWord
    );

}


/* ==================================================
   WORD SIMILARITY
================================================== */

function wordsAreSimilar(
  word1,
  word2
) {

  if (
    !word1 ||
    !word2
  ) {

    return false;

  }


  if (
    word1 === word2
  ) {

    return true;

  }


  if (
    word1.length >= 5 &&
    word2.length >= 5
  ) {

    if (
      word1.startsWith(word2) ||
      word2.startsWith(word1)
    ) {

      return true;

    }

  }


  return false;

}


/* ==================================================
   CALCULATE WORD MATCH
================================================== */

function calculateWordMatch(
  userWords,
  databaseWords
) {

  if (
    userWords.length === 0 ||
    databaseWords.length === 0
  ) {

    return 0;

  }


  let matched = 0;


  userWords.forEach(
    userWord => {

      const found =
        databaseWords.some(
          databaseWord =>
            wordsAreSimilar(
              userWord,
              databaseWord
            )
        );


      if (found) {

        matched++;

      }

    }
  );


  return (
    matched /
    userWords.length
  );

}


/* ==================================================
   KEYWORD MATCH
================================================== */

function calculateKeywordScore(
  userWords,
  keywords
) {

  if (!keywords) {

    return 0;

  }


  let keywordText = "";


  if (
    Array.isArray(keywords)
  ) {

    keywordText =
      keywords.join(" ");

  }

  else {

    keywordText =
      String(keywords);

  }


  const keywordWords =
    prepareWords(
      keywordText
    );


  return calculateWordMatch(
    userWords,
    keywordWords
  );

}


/* ==================================================
   ALL POSSIBLE KEYWORDS SCORE
================================================== */

function calculateAllKeywordsScore(
  userQuestion,
  allKeywords
) {

  if (
    !allKeywords
  ) {

    return 0;

  }


  let phrases = [];


  /*
  Firestore stores allKeywords
  as an array.
  */

  if (
    Array.isArray(allKeywords)
  ) {

    phrases =
      allKeywords;

  }

  else {

    phrases = [
      String(allKeywords)
    ];

  }


  if (
    phrases.length === 0
  ) {

    return 0;

  }


  let highestScore = 0;


  const userWords =
    prepareWords(
      userQuestion
    );


  /*
  Compare the user's question
  with every possible question
  variation.
  */

  phrases.forEach(
    phrase => {

      const phraseWords =
        prepareWords(
          phrase
        );


      const score =
        calculateWordMatch(
          userWords,
          phraseWords
        );


      if (
        score >
        highestScore
      ) {

        highestScore =
          score;

      }

    }
  );


  return highestScore;

}


/* ==================================================
   QUESTION SCORE
================================================== */

function calculateQuestionScore(
  userQuestion,
  databaseQuestion
) {

  const userWords =
    prepareWords(
      userQuestion
    );


  const databaseWords =
    prepareWords(
      databaseQuestion
    );


  return calculateWordMatch(
    userWords,
    databaseWords
  );

}


/* ==================================================
   EXACT MATCH
================================================== */

function isExactMatch(
  userQuestion,
  databaseQuestion
) {

  return normalizeText(
    userQuestion
  ) ===
  normalizeText(
    databaseQuestion
  );

}


/* ==================================================
   SEARCH SCORE
================================================== */

function calculateTotalScore(
  userQuestion,
  item
) {

  const databaseQuestion =
    item.question || "";


  const keywords =
    item.keywords || "";


  const allKeywords =
    item.allKeywords || [];


  /*
  EXACT QUESTION
  */

  if (
    isExactMatch(
      userQuestion,
      databaseQuestion
    )
  ) {

    return 1.5;

  }


  /*
  QUESTION SIMILARITY
  */

  const questionScore =
    calculateQuestionScore(
      userQuestion,
      databaseQuestion
    );


  /*
  OLD KEYWORDS
  */

  const userWords =
    prepareWords(
      userQuestion
    );


  const keywordScore =
    calculateKeywordScore(
      userWords,
      keywords
    );


  /*
  ALL POSSIBLE KEYWORDS
  */

  const allKeywordsScore =
    calculateAllKeywordsScore(
      userQuestion,
      allKeywords
    );


  /*
  WEIGHTED SEARCH

  Question:
  40%

  Old keywords:
  20%

  All possible keywords:
  40%
  */

  const totalScore =
    (
      questionScore * 0.40
    ) +
    (
      keywordScore * 0.20
    ) +
    (
      allKeywordsScore * 0.40
    );


  return totalScore;

}


/* ==================================================
   FIND BEST ANSWER
================================================== */

function searchKnowledge(
  question
) {

  if (
    !question ||
    knowledgeData.length === 0
  ) {

    return null;

  }


  const results =
    knowledgeData.map(
      item => {

        return {

          item: item,

          score:
            calculateTotalScore(
              question,
              item
            )

        };

      }
    );


  /*
  HIGHEST SCORE FIRST
  */

  results.sort(
    (a, b) =>
      b.score - a.score
  );


  console.log(
    "Knowledge search results:",
    results
  );


  const best =
    results[0];


  if (!best) {

    return null;

  }


  /*
  Minimum confidence
  */

  if (
    best.score < 0.30
  ) {

    return null;

  }


  return best.item;

}


/* ==================================================
   SHOW RESULT
================================================== */

function showResult(
  item,
  originalQuestion
) {

  if (!item) {

    result.classList.add(
      "hidden"
    );


    status.textContent =
      "No matching answer was found in the private Rwanda AI database.";

    return;

  }


  resultQuestion.textContent =
    originalQuestion;


  resultAnswer.textContent =
    item.answer ||
    "No answer available.";


  result.classList.remove(
    "hidden"
  );


  status.textContent =
    "Answer found in Rwanda AI private database.";

}


/* ==================================================
   LOAD KNOWLEDGE DATABASE
================================================== */

async function loadKnowledge() {

  try {

    status.textContent =
      "Loading Rwanda AI Knowledge...";


    const snapshot =
      await getDocs(
        collection(
          db,
          "knowledge"
        )
      );


    knowledgeData = [];


    snapshot.forEach(
      doc => {

        const data =
          doc.data();


        knowledgeData.push({

          id:
            doc.id,

          ...data

        });

      }
    );


    status.textContent =
      knowledgeData.length +
      " knowledge records loaded.";


    console.log(
      "Rwanda AI Knowledge:",
      knowledgeData
    );


  }

  catch (error) {

    console.error(
      "Knowledge loading error:",
      error
    );


    status.textContent =
      "Failed to load the private knowledge database.";

  }

}


/* ==================================================
   SEARCH BUTTON
================================================== */

searchButton.addEventListener(
  "click",
  () => {

    const question =
      questionInput.value.trim();


    if (!question) {

      status.textContent =
        "Please enter a question.";


      result.classList.add(
        "hidden"
      );


      return;

    }


    const answer =
      searchKnowledge(
        question
      );


    showResult(
      answer,
      question
    );


    /*
    CLEAR INPUT
    */

    questionInput.value = "";


    /*
    RETURN CURSOR
    */

    questionInput.focus();

  }
);


/* ==================================================
   ENTER KEY
================================================== */

questionInput.addEventListener(
  "keydown",
  event => {

    if (
      event.key === "Enter"
    ) {

      searchButton.click();

    }

  }
);


/* ==================================================
   START
================================================== */

loadKnowledge();
