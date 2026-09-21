/*
========================================
RWANDA AI PLATFORM
PRIVATE KNOWLEDGE DATABASE
STRICT TOPIC SEARCH
RESULTS LIST
BACK TO RESULTS
========================================
*/


import {
  db
} from "./firebase.js";


import {
  collection,
  getDocs
} from "https://www.gstatic.com/firebasejs/12.17.0/firebase-firestore.js";


const questionInput =
  document.getElementById("questionInput");

const searchButton =
  document.getElementById("searchButton");

const status =
  document.getElementById("status");

const result =
  document.getElementById("result");

const resultQuestion =
  document.getElementById("resultQuestion");

const resultAnswer =
  document.getElementById("resultAnswer");


let knowledgeData = [];


/*
========================================
STORE LAST SEARCH RESULTS
========================================
*/

let lastSearchResults = [];

let lastSearchQuestion = "";


/*
========================================
STOP WORDS
========================================
*/

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
  "na",
  "ese",
  "mbwira",
  "mpa",
  "amakuru",
  "he",
  "hehe",
  "nde",
  "igihe"

]);


/*
========================================
TOPIC GROUPS
========================================
*/

const topicGroups = {

  mountain: [

    "mountain",
    "mountains",
    "mount",
    "misozi",
    "umusozi",
    "imisozi",
    "highest mountain",
    "major mountain",
    "major mountains",
    "mountainous"

  ],


  lake: [

    "lake",
    "lakes",
    "ikiyaga",
    "ibiyaga"

  ],


  river: [

    "river",
    "rivers",
    "uruzi",
    "umugezi",
    "imigezi"

  ],


  capital: [

    "capital",
    "capital city",
    "umurwa mukuru",
    "umurwa"

  ],


  founder: [

    "founder",
    "founders",
    "founded",
    "founding",
    "uwashinze",
    "washinze",
    "uwatangije"

  ],


  language: [

    "language",
    "languages",
    "official language",
    "official languages",
    "ururimi",
    "indimi",
    "ururimi rwemewe",
    "indimi zemewe"

  ],


  independence: [

    "independence",
    "independent",
    "ubwigenge",
    "kwigenga"

  ],


  animal: [

    "animal",
    "animals",
    "national animal",
    "inyamaswa",
    "inyamaswa y'igihugu",
    "inyamaswa z'igihugu"

  ]

};


/*
========================================
NORMALIZE TEXT
========================================
*/

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


/*
========================================
GET WORDS
========================================
*/

function getWords(text) {

  const normalized =
    normalizeText(text);


  if (!normalized) {

    return [];

  }


  return normalized

    .split(" ")

    .filter(word => {

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

    });

}


/*
========================================
SIMPLIFY WORD
========================================
*/

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


/*
========================================
GET RECORD TEXT
========================================
*/

function getRecordText(item) {

  let text = "";


  if (item.question) {

    text +=
      " " +
      item.question;

  }


  if (item.keywords) {

    if (
      Array.isArray(item.keywords)
    ) {

      text +=
        " " +
        item.keywords.join(" ");

    }

    else {

      text +=
        " " +
        String(item.keywords);

    }

  }


  if (item.allKeywords) {

    if (
      Array.isArray(item.allKeywords)
    ) {

      text +=
        " " +
        item.allKeywords.join(" ");

    }

    else {

      text +=
        " " +
        String(item.allKeywords);

    }

  }


  return normalizeText(text);

}


/*
========================================
DETECT USER TOPIC
========================================
*/

function detectUserTopic(question) {

  const normalized =
    normalizeText(question);


  const topicNames =
    Object.keys(topicGroups);


  /*
  Check all topic groups.
  */

  for (
    const topic of topicNames
  ) {

    const phrases =
      topicGroups[topic];


    for (
      const phrase of phrases
    ) {

      const normalizedPhrase =
        normalizeText(phrase);


      if (
        normalized.includes(
          normalizedPhrase
        )
      ) {

        return topic;

      }

    }

  }


  return null;

}


/*
========================================
CHECK RECORD TOPIC
========================================
*/

function recordBelongsToTopic(
  item,
  topic
) {

  if (!topic) {

    return false;

  }


  const recordText =
    getRecordText(item);


  const phrases =
    topicGroups[topic];


  if (!phrases) {

    return false;

  }


  for (
    const phrase of phrases
  ) {

    const normalizedPhrase =
      normalizeText(phrase);


    if (
      recordText.includes(
        normalizedPhrase
      )
    ) {

      return true;

    }

  }


  return false;

}


/*
========================================
GET USER SEARCH WORDS
========================================
*/

function getUserSearchWords(
  question
) {

  return getWords(question)

    .map(
      simplifyWord
    );

}


/*
========================================
CALCULATE TOPIC SCORE
========================================
*/

function calculateTopicScore(
  question,
  item,
  topic
) {

  if (
    !recordBelongsToTopic(
      item,
      topic
    )
  ) {

    return 0;

  }


  const userWords =
    getUserSearchWords(
      question
    );


  const recordWords =
    getWords(
      getRecordText(item)
    ).map(
      simplifyWord
    );


  let matched = 0;


  userWords.forEach(
    userWord => {

      const found =
        recordWords.some(
          recordWord => {

            return (

              recordWord ===
              userWord

              ||

              (

                userWord.length >= 5 &&

                recordWord.length >= 5 &&

                (

                  recordWord.startsWith(
                    userWord
                  )

                  ||

                  userWord.startsWith(
                    recordWord
                  )

                )

              )

            );

          }
        );


      if (found) {

        matched++;

      }

    }
  );


  let score = 1;


  if (
    matched > 0
  ) {

    score +=
      matched /
      Math.max(
        userWords.length,
        1
      );

  }


  /*
  Exact question gets priority.
  */

  if (
    normalizeText(question) ===
    normalizeText(
      item.question || ""
    )
  ) {

    score += 10;

  }


  return score;

}


/*
========================================
SEARCH KNOWLEDGE
========================================
*/

function searchKnowledge(
  question
) {

  const topic =
    detectUserTopic(
      question
    );


  console.log(
    "User question:",
    question
  );


  console.log(
    "Detected topic:",
    topic
  );


  /*
  ========================================
  STRICT TOPIC SEARCH
  ========================================
  */

  if (topic) {

    const results =
      knowledgeData

        .map(item => {

          return {

            item: item,

            score:
              calculateTopicScore(
                question,
                item,
                topic
              )

          };

        })

        .filter(
          result =>
            result.score > 0
        );


    results.sort(
      (a, b) =>
        b.score -
        a.score
    );


    console.log(
      "Strict topic results:",
      results
    );


    return results;

  }


  /*
  ========================================
  FALLBACK SEARCH
  ========================================
  */

  const userWords =
    getUserSearchWords(
      question
    );


  if (
    userWords.length === 0
  ) {

    return [];

  }


  const results =
    knowledgeData

      .map(item => {

        const recordWords =
          getWords(
            getRecordText(item)
          ).map(
            simplifyWord
          );


        let matched = 0;


        userWords.forEach(
          userWord => {

            const found =
              recordWords.some(
                recordWord => {

                  return (

                    recordWord ===
                    userWord

                    ||

                    (

                      userWord.length >= 5 &&

                      recordWord.length >= 5 &&

                      (

                        recordWord.startsWith(
                          userWord
                        )

                        ||

                        userWord.startsWith(
                          recordWord
                        )

                      )

                    )

                  );

                }
              );


            if (found) {

              matched++;

            }

          }
        );


        return {

          item: item,

          score:
            matched /
            userWords.length

        };

      })


      .filter(
        result =>
          result.score > 0
      );


  results.sort(
    (a, b) =>
      b.score -
      a.score
  );


  return results;

}


/*
========================================
SHOW POSSIBLE RESULTS
========================================
*/

function showPossibleResults(
  results
) {

  result.classList.add(
    "hidden"
  );


  const oldList =
    document.getElementById(
      "knowledgeResults"
    );


  if (oldList) {

    oldList.remove();

  }


  /*
  Save results so that the user
  can come back to them.
  */

  lastSearchResults =
    results;


  if (
    results.length === 0
  ) {

    status.textContent =
      "No matching knowledge was found in the private Rwanda AI database.";

    return;

  }


  status.textContent =
    results.length +
    " relevant knowledge records found.";


  const container =
    document.createElement(
      "div"
    );


  container.id =
    "knowledgeResults";


  container.style.marginTop =
    "20px";


  const title =
    document.createElement(
      "h3"
    );


  title.textContent =
    "Knowledge found";


  container.appendChild(
    title
  );


  const explanation =
    document.createElement(
      "p"
    );


  explanation.textContent =
    "Select the topic you want to view:";


  container.appendChild(
    explanation
  );


  results.forEach(
    (resultData, index) => {

      const button =
        document.createElement(
          "button"
        );


      button.type =
        "button";


      button.textContent =
        (index + 1) +
        ". " +
        (
          resultData.item.question ||
          "Untitled knowledge"
        );


      button.style.display =
        "block";


      button.style.width =
        "100%";


      button.style.textAlign =
        "left";


      button.style.marginBottom =
        "10px";


      button.style.padding =
        "12px";


      button.style.cursor =
        "pointer";


      button.addEventListener(
        "click",
        () => {

          showSelectedAnswer(
            resultData.item
          );

        }
      );


      container.appendChild(
        button
      );

    }
  );


  result.parentNode.insertBefore(
    container,
    result
  );

}


/*
========================================
SHOW SELECTED ANSWER
========================================
*/

function showSelectedAnswer(
  item
) {

  const list =
    document.getElementById(
      "knowledgeResults"
    );


  if (list) {

    list.remove();

  }


  resultQuestion.textContent =
    item.question ||
    "Knowledge";


  resultAnswer.textContent =
    item.answer ||
    "No answer available.";


  result.classList.remove(
    "hidden"
  );


  status.textContent =
    "Answer found in Rwanda AI private database.";


  /*
  ========================================
  BACK TO RESULTS BUTTON
  ========================================
  */

  let backButton =
    document.getElementById(
      "backToKnowledgeResults"
    );


  if (backButton) {

    backButton.remove();

  }


  backButton =
    document.createElement(
      "button"
    );


  backButton.id =
    "backToKnowledgeResults";


  backButton.type =
    "button";


  backButton.textContent =
    "← Back to results";


  backButton.style.display =
    "block";


  backButton.style.marginTop =
    "20px";


  backButton.style.padding =
    "12px 16px";


  backButton.style.cursor =
    "pointer";


  backButton.addEventListener(
    "click",
    () => {

      showPossibleResults(
        lastSearchResults
      );

    }
  );


  result.appendChild(
    backButton
  );

}


/*
========================================
LOAD KNOWLEDGE
========================================
*/

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

        knowledgeData.push({

          id: doc.id,

          ...doc.data()

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


/*
========================================
SEARCH BUTTON
========================================
*/

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


    /*
    Save the original search.
    */

    lastSearchQuestion =
      question;


    /*
    Search private database.
    */

    const results =
      searchKnowledge(
        question
      );


    /*
    Show list.
    */

    showPossibleResults(
      results
    );


    questionInput.value =
      "";


    questionInput.focus();

  }
);


/*
========================================
ENTER KEY
========================================
*/

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


/*
========================================
START
========================================
*/

loadKnowledge();
