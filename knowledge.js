/*
====================================================
RWANDA AI PLATFORM
KNOWLEDGE HUB
FIRESTORE KNOWLEDGE SEARCH
OLD + NEW DATA STRUCTURE
====================================================
*/

import { db } from "./firebase.js";

import {
  collection,
  getDocs,
  addDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.17.0/firebase-firestore.js";


/*
====================================================
DOM ELEMENTS
====================================================
*/

const questionInput =
  document.getElementById("questionInput");

const searchButton =
  document.getElementById("searchButton");

const status =
  document.getElementById("status");

const knowledgeResults =
  document.getElementById("knowledgeResults");

const topicQuestions =
  document.getElementById("topicQuestions");

const result =
  document.getElementById("result");

const resultQuestion =
  document.getElementById("resultQuestion");

const resultAnswer =
  document.getElementById("resultAnswer");

const backToQuestions =
  document.getElementById("backToQuestions");

const backToTopics =
  document.getElementById("backToTopics");


/*
====================================================
GLOBAL DATA
====================================================
*/

let knowledgeRecords = [];

let topics = [];

let currentTopic = null;

let currentQuestions = [];

let lastSearchResults = [];


/*
====================================================
STOP WORDS
====================================================
*/

const stopWords = new Set([

  "the",
  "is",
  "a",
  "an",
  "and",
  "or",
  "of",
  "in",
  "on",
  "to",
  "for",
  "what",
  "who",
  "where",
  "when",
  "why",
  "how",
  "which",
  "tell",
  "me",
  "about",

  "iki",
  "ni",
  "mu",
  "ku",
  "kuri",
  "za",
  "rya",
  "ya",
  "ye",
  "iki",
  "nde",
  "iki",
  "ute",
  "hehe",
  "ryari",
  "kubera",
  "ninde",
  "mbwira",
  "sobanura",
  "amakuru",
  "ikihe",
  "aba",
  "bangahe"

]);


/*
====================================================
NORMALIZE TEXT
====================================================
*/

function normalizeText(text) {

  if (
    text === null ||
    text === undefined
  ) {
    return "";
  }

  return String(text)

    .toLowerCase()

    .normalize("NFD")

    .replace(
      /[\u0300-\u036f]/g,
      ""
    )

    .replace(
      /[^a-z0-9\u00C0-\uFFFF\s]/gi,
      " "
    )

    .replace(
      /\s+/g,
      " "
    )

    .trim();
}


/*
====================================================
GET WORDS
====================================================
*/

function getWords(text) {

  const normalized =
    normalizeText(text);

  if (!normalized) {
    return [];
  }

  return normalized
    .split(/\s+/)
    .filter(Boolean)
    .filter(word =>
      !stopWords.has(word)
    );
}


/*
====================================================
SIMPLIFY WORD
====================================================
*/

function simplifyWord(word) {

  return normalizeText(word)

    .replace(
      /(ing|ed|ly|es|s)$/i,
      ""
    )

    .trim();
}


/*
====================================================
GET TOPIC
====================================================
*/

function getTopic(item) {

  if (
    item &&
    typeof item.topic === "string" &&
    item.topic.trim()
  ) {
    return item.topic.trim();
  }

  if (
    item &&
    typeof item.title === "string" &&
    item.title.trim()
  ) {
    return item.title.trim();
  }

  if (
    item &&
    typeof item.question === "string" &&
    item.question.trim()
  ) {
    return item.question.trim();
  }

  return "Untitled Topic";
}


/*
====================================================
GET QUESTIONS
====================================================
*/

function getQuestions(item) {

  const questions = [];


  /*
  -----------------------------------------------
  NEW STRUCTURE
  -----------------------------------------------
  */

  if (
    Array.isArray(item.questions)
  ) {

    item.questions.forEach(q => {

      if (!q) {
        return;
      }

      const question =
        typeof q.question === "string"
          ? q.question.trim()
          : "";

      const answer =
        typeof q.answer === "string"
          ? q.answer.trim()
          : "";

      const keywords =
        Array.isArray(q.allKeywords)
          ? q.allKeywords
          : Array.isArray(q.keywords)
            ? q.keywords
            : [];

      if (question) {

        questions.push({

          question,

          answer,

          allKeywords: keywords

        });

      }

    });

  }


  /*
  -----------------------------------------------
  OLD STRUCTURE
  -----------------------------------------------
  */

  else if (
    typeof item.question === "string" &&
    item.question.trim()
  ) {

    questions.push({

      question:
        item.question.trim(),

      answer:
        typeof item.answer === "string"
          ? item.answer.trim()
          : "",

      allKeywords:
        Array.isArray(item.allKeywords)
          ? item.allKeywords
          : Array.isArray(item.keywords)
            ? item.keywords
            : []

    });

  }


  return questions;
}


/*
====================================================
BUILD TOPICS
====================================================
*/

function buildTopics(records) {

  const topicMap = new Map();


  records.forEach(record => {

    const topicName =
      getTopic(record);

    const topicKey =
      normalizeText(topicName);


    if (!topicKey) {
      return;
    }


    if (!topicMap.has(topicKey)) {

      topicMap.set(
        topicKey,
        {
          name: topicName,
          questions: [],
          recordIds: []
        }
      );

    }


    const topic =
      topicMap.get(topicKey);


    if (
      record.id &&
      !topic.recordIds.includes(record.id)
    ) {

      topic.recordIds.push(
        record.id
      );

    }


    const questions =
      getQuestions(record);


    questions.forEach(q => {

      const questionKey =
        normalizeText(
          q.question
        );


      if (!questionKey) {
        return;
      }


      const alreadyExists =
        topic.questions.some(
          existing =>
            normalizeText(
              existing.question
            ) === questionKey
        );


      if (!alreadyExists) {

        topic.questions.push(q);

      }

    });

  });


  return Array.from(
    topicMap.values()
  );

}


/*
====================================================
GET TOPIC SEARCH TEXT
====================================================
*/

function getTopicSearchText(topic) {

  let text =
    topic.name || "";


  topic.questions.forEach(q => {

    text += " ";
    text += q.question || "";

    text += " ";
    text += q.answer || "";


    if (
      Array.isArray(
        q.allKeywords
      )
    ) {

      text += " ";
      text += q.allKeywords.join(" ");

    }

  });


  return normalizeText(text);

}


/*
====================================================
SCORE TOPIC
====================================================
*/

function scoreTopic(
  topic,
  searchText
) {

  const query =
    normalizeText(searchText);

  if (!query) {
    return 0;
  }


  const queryWords =
    getWords(query);


  if (
    queryWords.length === 0
  ) {

    return 0;

  }


  const topicName =
    normalizeText(
      topic.name
    );


  const searchContent =
    getTopicSearchText(
      topic
    );


  let score = 0;


  /*
  -----------------------------------------------
  EXACT FULL MATCH
  -----------------------------------------------
  */

  if (
    topicName === query
  ) {

    score += 100;

  }


  if (
    searchContent === query
  ) {

    score += 80;

  }


  /*
  -----------------------------------------------
  WORD MATCHING
  -----------------------------------------------
  */

  queryWords.forEach(word => {

    const simpleWord =
      simplifyWord(word);


    if (
      topicName.includes(word)
    ) {

      score += 30;

    }
    else if (
      simpleWord &&
      topicName.includes(simpleWord)
    ) {

      score += 20;

    }


    if (
      searchContent.includes(word)
    ) {

      score += 15;

    }
    else if (
      simpleWord &&
      searchContent.includes(simpleWord)
    ) {

      score += 10;

    }


    /*
    -------------------------------------------
    EXACT QUESTION MATCH
    -------------------------------------------
    */

    topic.questions.forEach(q => {

      const questionText =
        normalizeText(
          q.question
        );


      if (
        questionText === query
      ) {

        score += 100;

      }


      if (
        questionText.includes(word)
      ) {

        score += 25;

      }


      if (
        simpleWord &&
        questionText.includes(
          simpleWord
        )
      ) {

        score += 10;

      }

    });

  });


  /*
  -----------------------------------------------
  QUERY PHRASE MATCH
  -----------------------------------------------
  */

  if (
    searchContent.includes(query)
  ) {

    score += 50;

  }


  return score;

}


/*
====================================================
SEARCH TOPICS
====================================================
*/

function searchTopics(searchText) {

  const query =
    normalizeText(searchText);


  if (!query) {

    return [];

  }


  const scored = [];


  topics.forEach(topic => {

    const score =
      scoreTopic(
        topic,
        query
      );


    if (score > 0) {

      scored.push({

        topic,

        score

      });

    }

  });


  scored.sort(
    (a, b) =>
      b.score - a.score
  );


  return scored.map(
    item => item.topic
  );

}


/*
====================================================
SHOW TOPICS
====================================================
*/

function showTopics(results) {

  knowledgeResults.innerHTML = "";

  topicQuestions.innerHTML = "";

  result.classList.add("hidden");

  topicQuestions.classList.add(
    "hidden"
  );


  if (
    !results ||
    results.length === 0
  ) {

    knowledgeResults.innerHTML = `

      <div
        style="
          text-align:center;
          padding:20px;
          color:#777;
        "
      >

        No matching knowledge found.

      </div>

    `;


    knowledgeResults.style.display =
      "block";

    return;

  }


  results.forEach(topic => {

    const button =
      document.createElement(
        "button"
      );


    button.className =
      "topic-card";


    const title =
      document.createElement(
        "span"
      );


    title.className =
      "topic-title";


    title.textContent =
      topic.name;


    const count =
      document.createElement(
        "span"
      );


    count.className =
      "topic-count";


    count.textContent =

      `${topic.questions.length} question` +

      (
        topic.questions.length === 1
          ? ""
          : "s"
      );


    button.appendChild(title);

    button.appendChild(count);


    button.addEventListener(
      "click",
      () => {

        showTopicQuestions(
          topic
        );

      }
    );


    knowledgeResults.appendChild(
      button
    );

  });


  knowledgeResults.style.display =
    "block";

}


/*
====================================================
SHOW QUESTIONS INSIDE TOPIC
====================================================
*/

function showTopicQuestions(
  topic
) {

  currentTopic =
    topic;

  currentQuestions =
    topic.questions;


  knowledgeResults.style.display =
    "none";


  result.classList.add(
    "hidden"
  );


  topicQuestions.innerHTML = "";


  const heading =
    document.createElement(
      "h3"
    );


  heading.textContent =
    topic.name;


  heading.style.color =
    "#20603d";


  topicQuestions.appendChild(
    heading
  );


  const info =
    document.createElement(
      "p"
    );


  info.textContent =

    `${topic.questions.length} question` +

    (
      topic.questions.length === 1
        ? ""
        : "s"
    );


  info.style.color =
    "#777";


  topicQuestions.appendChild(
    info
  );


  topic.questions.forEach(
    (question, index) => {

      const button =
        document.createElement(
          "button"
        );


      button.className =
        "question-card";


      button.textContent =
        `${index + 1}. ${question.question}`;


      button.addEventListener(
        "click",
        () => {

          showAnswer(
            question,
            topic
          );

        }
      );


      topicQuestions.appendChild(
        button
      );

    }
  );


  const backButton =
    document.createElement(
      "button"
    );


  backButton.className =
    "action-button";


  backButton.textContent =
    "← Back to topics";


  backButton.addEventListener(
    "click",
    () => {

      topicQuestions.style.display =
        "none";

      showTopics(
        lastSearchResults
      );

    }
  );


  topicQuestions.appendChild(
    backButton
  );


  topicQuestions.style.display =
    "block";

}


/*
====================================================
SHOW ANSWER
====================================================
*/

function showAnswer(
  question,
  topic
) {

  currentTopic =
    topic;


  resultQuestion.textContent =
    question.question;


  resultAnswer.innerHTML =
    formatAnswer(
      question.answer
    );


  knowledgeResults.style.display =
    "none";


  topicQuestions.style.display =
    "none";


  result.classList.remove(
    "hidden"
  );


  result.style.display =
    "block";


  recordAnalytics(
    topic
  );

}


/*
====================================================
FORMAT ANSWER
====================================================
*/

function formatAnswer(
  text
) {

  if (
    text === null ||
    text === undefined
  ) {

    return "";

  }


  let safe =
    escapeHTML(
      String(text)
    );


  /*
  -----------------------------------------------
  BOLD
  -----------------------------------------------
  */

  safe =
    safe.replace(
      /\*\*(.*?)\*\*/g,
      "<strong>$1</strong>"
    );


  safe =
    safe.replace(
      /__(.*?)__/g,
      "<strong>$1</strong>"
    );


  /*
  -----------------------------------------------
  NEW LINES
  -----------------------------------------------
  */

  safe =
    safe.replace(
      /\r?\n/g,
      "<br>"
    );


  return safe;

}


/*
====================================================
ESCAPE HTML
====================================================
*/

function escapeHTML(
  text
) {

  return text

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


/*
====================================================
ANALYTICS
====================================================
*/

async function recordAnalytics(
  topic
) {

  try {

    await addDoc(
      collection(
        db,
        "knowledgeAnalytics"
      ),
      {

        topic:
          topic.name,

        viewedAt:
          serverTimestamp()

      }
    );

  }

  catch (error) {

    console.error(
      "Analytics error:",
      error
    );

  }

}


/*
====================================================
PERFORM SEARCH
====================================================
*/

function performSearch() {

  const searchText =
    questionInput.value.trim();


  /*
  -----------------------------------------------
  EMPTY SEARCH
  -----------------------------------------------
  */

  if (!searchText) {

    status.textContent =
      `${topics.length} topics available.`;

    knowledgeResults.style.display =
      "none";

    topicQuestions.style.display =
      "none";

    result.classList.add(
      "hidden"
    );

    return;

  }


  status.textContent =
    "Searching knowledge...";


  const results =
    searchTopics(
      searchText
    );


  lastSearchResults =
    results;


  if (
    results.length > 0
  ) {

    status.textContent =

      `${results.length} matching topic` +

      (
        results.length === 1
          ? ""
          : "s"
      ) +

      " found.";

  }

  else {

    status.textContent =
      "No matching knowledge found.";

  }


  showTopics(
    results
  );

}


/*
====================================================
LOAD KNOWLEDGE
====================================================
*/

async function loadKnowledge() {

  try {

    status.textContent =
      "Loading knowledge...";


    const snapshot =
      await getDocs(
        collection(
          db,
          "knowledge"
        )
      );


    /*
    -----------------------------------------------
    LOAD ALL FIRESTORE RECORDS
    -----------------------------------------------
    */

    knowledgeRecords =
      snapshot.docs.map(
        doc => ({

          id:
            doc.id,

          ...doc.data()

        })
      );


    /*
    -----------------------------------------------
    BUILD TOPICS FROM ALL RECORDS
    -----------------------------------------------
    */

    topics =
      buildTopics(
        knowledgeRecords
      );


    /*
    -----------------------------------------------
    STATUS
    -----------------------------------------------
    */

    status.textContent =

      `${topics.length} topics available.`;


    console.log(
      "===================================="
    );

    console.log(
      "RWANDA AI KNOWLEDGE HUB"
    );

    console.log(
      "Firestore records:",
      knowledgeRecords.length
    );

    console.log(
      "Topics:",
      topics.length
    );

    console.log(
      "Knowledge data:",
      knowledgeRecords
    );

    console.log(
      "Built topics:",
      topics
    );

    console.log(
      "===================================="
    );

  }

  catch (error) {

    console.error(
      "Knowledge loading error:",
      error
    );


    status.textContent =
      "Failed to load knowledge.";


    knowledgeResults.innerHTML = `

      <div
        style="
          padding:20px;
          text-align:center;
          color:#b00020;
        "
      >

        Failed to load knowledge.

      </div>

    `;


    knowledgeResults.style.display =
      "block";

  }

}


/*
====================================================
SEARCH BUTTON
====================================================
*/

searchButton.addEventListener(
  "click",
  performSearch
);


/*
====================================================
ENTER KEY
====================================================
*/

questionInput.addEventListener(
  "keydown",
  event => {

    if (
      event.key === "Enter"
    ) {

      event.preventDefault();

      performSearch();

    }

  }
);


/*
====================================================
BACK TO QUESTIONS
====================================================
*/

backToQuestions.addEventListener(
  "click",
  () => {

    result.classList.add(
      "hidden"
    );


    result.style.display =
      "none";


    if (
      currentTopic
    ) {

      showTopicQuestions(
        currentTopic
      );

    }

  }
);


/*
====================================================
BACK TO TOPICS
====================================================
*/

backToTopics.addEventListener(
  "click",
  () => {

    result.classList.add(
      "hidden"
    );


    result.style.display =
      "none";


    topicQuestions.style.display =
      "none";


    showTopics(
      lastSearchResults
    );

  }
);


/*
====================================================
START
====================================================
*/

loadKnowledge();