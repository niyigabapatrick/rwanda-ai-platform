/*
========================================
RWANDA AI PLATFORM
ADMIN SYSTEM
========================================

FEATURES

1. Admin Login
2. Create Admin Account
3. Admin Email Restriction
4. Admin Authentication Guard
5. Knowledge Topic Management
6. Existing Topic Search
7. New Topic Creation
8. Add Question & Answer
9. Question Keywords / Variations
10. Question Duplicate Protection
11. Question Analysis
12. Popular Knowledge
13. Logout

========================================
*/


/*
========================================
FIREBASE
========================================
*/

import {
  db,
  auth
} from "./firebase.js";


/*
========================================
FIRESTORE IMPORTS
========================================
*/

import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  serverTimestamp
} from
"https://www.gstatic.com/firebasejs/12.17.0/firebase-firestore.js";


/*
========================================
AUTH IMPORTS
========================================
*/

import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut
} from
"https://www.gstatic.com/firebasejs/12.17.0/firebase-auth.js";


/*
========================================
AUTHORIZED ADMIN EMAIL
========================================
*/

const ADMIN_EMAIL =
  "jescagihozo9@gmail.com";


/*
========================================
PAGE ELEMENTS
========================================
*/

const loginBtn =
  document.getElementById("loginBtn");

const createAccountBtn =
  document.getElementById(
    "createAccountBtn"
  );

const logoutBtn =
  document.getElementById("logoutBtn");

const addKnowledgeBtn =
  document.getElementById(
    "addKnowledgeBtn"
  );

const topicSearch =
  document.getElementById(
    "topicSearch"
  );

const topicSelect =
  document.getElementById(
    "topicSelect"
  );

const useSelectedTopicBtn =
  document.getElementById(
    "useSelectedTopicBtn"
  );

const createTopicModeBtn =
  document.getElementById(
    "createTopicModeBtn"
  );

const loadAnalyticsBtn =
  document.getElementById(
    "loadAnalyticsBtn"
  );


/*
========================================
LOGIN PAGE ELEMENTS
========================================
*/

const emailInput =
  document.getElementById("email");

const passwordInput =
  document.getElementById("password");

const loginMessage =
  document.getElementById(
    "loginMessage"
  );


/*
========================================
KNOWLEDGE ELEMENTS
========================================
*/

const newTopicInput =
  document.getElementById("newTopic");

const questionInput =
  document.getElementById("question");

const answerInput =
  document.getElementById("answer");

const allKeywordsInput =
  document.getElementById(
    "allKeywords"
  );

const currentTopicLabel =
  document.getElementById(
    "currentTopicLabel"
  );

const messageBox =
  document.getElementById("message");

const analyticsBox =
  document.getElementById("analytics");


/*
========================================
STATE
========================================
*/

let allTopics = [];

let currentTopic = null;


/*
========================================
PAGE DETECTION
========================================
*/

const isLoginPage =
  !!loginBtn;

const isAdminPage =
  !!addKnowledgeBtn;


/*
========================================
HELPER
========================================
*/

function normalizeText(value) {

  return String(value || "")
    .trim()
    .toLowerCase();

}


/*
========================================
ESCAPE HTML
========================================
*/

function escapeHTML(value) {

  return String(value || "")
    .replace(
      /[&<>"']/g,
      function(character) {

        const entities = {

          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#039;"

        };

        return entities[character];

      }
    );

}


/*
========================================
SHOW LOGIN MESSAGE
========================================
*/

function showLoginMessage(
  text
) {

  if (!loginMessage) {
    return;
  }

  loginMessage.textContent =
    text;

}


/*
========================================
SHOW ADMIN MESSAGE
========================================
*/

function showMessage(
  text
) {

  if (!messageBox) {
    return;
  }

  messageBox.textContent =
    text;

}


/*
========================================
CHECK ADMIN EMAIL
========================================
*/

function isAuthorizedAdmin(
  user
) {

  if (!user) {
    return false;
  }

  return (
    String(
      user.email || ""
    ).toLowerCase() ===
    ADMIN_EMAIL.toLowerCase()
  );

}


/*
========================================
LOGIN
========================================
*/

if (loginBtn) {

  loginBtn.addEventListener(
    "click",
    async function() {

      const email =
        emailInput
        ?
        emailInput.value.trim()
        :
        "";

      const password =
        passwordInput
        ?
        passwordInput.value
        :
        "";


      if (!email) {

        showLoginMessage(
          "Please enter your email."
        );

        return;

      }


      if (!password) {

        showLoginMessage(
          "Please enter your password."
        );

        return;

      }


      /*
      ========================================
      ONLY AUTHORIZED EMAIL
      ========================================
      */

      if (
        email.toLowerCase() !==
        ADMIN_EMAIL.toLowerCase()
      ) {

        showLoginMessage(
          "This email is not authorized to access Rwanda AI Platform Admin."
        );

        return;

      }


      loginBtn.disabled =
        true;

      showLoginMessage(
        "Logging in..."
      );


      try {

        const result =
          await signInWithEmailAndPassword(
            auth,
            ADMIN_EMAIL,
            password
          );


        const user =
          result.user;


        if (
          !isAuthorizedAdmin(user)
        ) {

          await signOut(auth);

          showLoginMessage(
            "Access denied."
          );

          loginBtn.disabled =
            false;

          return;

        }


        showLoginMessage(
          "Login successful."
        );


        window.location.href =
          "admin.html";

      }

      catch(error) {

        console.error(
          "Login error:",
          error
        );


        let message =
          "Login failed.";


        if (
          error.code ===
          "auth/invalid-credential"
        ) {

          message =
            "Invalid email or password.";

        }

        else if (
          error.code ===
          "auth/user-not-found"
        ) {

          message =
            "Admin account does not exist. Create the account first.";

        }

        else if (
          error.code ===
          "auth/wrong-password"
        ) {

          message =
            "Incorrect password.";

        }

        else if (
          error.code ===
          "auth/too-many-requests"
        ) {

          message =
            "Too many attempts. Please try again later.";

        }


        showLoginMessage(
          message
        );


        loginBtn.disabled =
          false;

      }

    }
  );

}


/*
========================================
CREATE ADMIN ACCOUNT
========================================
*/

if (createAccountBtn) {

  createAccountBtn.addEventListener(
    "click",
    async function() {

      const email =
        emailInput
        ?
        emailInput.value.trim()
        :
        "";

      const password =
        passwordInput
        ?
        passwordInput.value
        :
        "";


      if (!email) {

        showLoginMessage(
          "Please enter the admin email."
        );

        return;

      }


      if (
        email.toLowerCase() !==
        ADMIN_EMAIL.toLowerCase()
      ) {

        showLoginMessage(
          "Only the authorized admin email can create the account."
        );

        return;

      }


      if (!password) {

        showLoginMessage(
          "Please enter a password."
        );

        return;

      }


      if (password.length < 6) {

        showLoginMessage(
          "Password must contain at least 6 characters."
        );

        return;

      }


      createAccountBtn.disabled =
        true;

      showLoginMessage(
        "Creating admin account..."
      );


      try {

        const result =
          await createUserWithEmailAndPassword(
            auth,
            ADMIN_EMAIL,
            password
          );


        const user =
          result.user;


        if (
          !isAuthorizedAdmin(user)
        ) {

          await signOut(auth);

          showLoginMessage(
            "Account created but access was denied."
          );

          createAccountBtn.disabled =
            false;

          return;

        }


        await signOut(auth);


        if (passwordInput) {

          passwordInput.value =
            "";

        }


        showLoginMessage(
          "Admin account created successfully. You can now login."
        );


        createAccountBtn.disabled =
          false;

      }

      catch(error) {

        console.error(
          "Create account error:",
          error
        );


        let message =
          "Could not create admin account.";


        if (
          error.code ===
          "auth/email-already-in-use"
        ) {

          message =
            "This admin account already exists. Use Login.";

        }

        else if (
          error.code ===
          "auth/weak-password"
        ) {

          message =
            "Password is too weak. Use at least 6 characters.";

        }

        else if (
          error.code ===
          "auth/invalid-email"
        ) {

          message =
            "Invalid email address.";

        }


        showLoginMessage(
          message
        );


        createAccountBtn.disabled =
          false;

      }

    }
  );

}


/*
========================================
LOAD KNOWLEDGE TOPICS
========================================
*/

async function loadTopics() {

  if (!isAdminPage) {
    return;
  }


  try {

    const snapshot =
      await getDocs(
        collection(
          db,
          "knowledge"
        )
      );


    const topicMap =
      new Map();


    snapshot.docs.forEach(
      function(document) {

        const data =
          document.data();


        const topic =
          String(
            data.topic ||
            data.title ||
            "General"
          ).trim();


        if (!topic) {
          return;
        }


        const topicKey =
          normalizeText(topic);


        if (
          !topicMap.has(topicKey)
        ) {

          topicMap.set(
            topicKey,
            {

              topic:
                topic,

              docId:
                document.id,

              questions:
                []

            }
          );

        }


        /*
        ========================================
        NEW FORMAT
        ========================================
        */

        if (
          Array.isArray(
            data.questions
          )
        ) {

          data.questions.forEach(
            function(item) {

              if (!item) {
                return;
              }


              const question =
                String(
                  item.question || ""
                ).trim();


              const answer =
                String(
                  item.answer || ""
                ).trim();


              const keywords =
                Array.isArray(
                  item.allKeywords
                )
                ?
                item.allKeywords
                :
                [];


              if (
                question &&
                answer
              ) {

                topicMap
                  .get(topicKey)
                  .questions
                  .push({

                    question:
                      question,

                    answer:
                      answer,

                    allKeywords:
                      keywords

                  });

              }

            }
          );

        }

        else {

          /*
          ========================================
          OLD FORMAT
          ========================================
          */

          const question =
            String(
              data.question || ""
            ).trim();


          const answer =
            String(
              data.answer || ""
            ).trim();


          const keywords =
            Array.isArray(
              data.allKeywords
            )
            ?
            data.allKeywords
            :
            [];


          if (
            question &&
            answer
          ) {

            topicMap
              .get(topicKey)
              .questions
              .push({

                question:
                  question,

                answer:
                  answer,

                allKeywords:
                  keywords

              });

          }

        }

      }
    );


    /*
    ========================================
    REMOVE DUPLICATE QUESTIONS
    ========================================
    */

    allTopics =
      Array.from(
        topicMap.values()
      );


    allTopics.forEach(
      function(topic) {

        const unique =
          new Map();


        topic.questions.forEach(
          function(item) {

            const key =
              normalizeText(
                item.question
              );


            if (
              !unique.has(key)
            ) {

              unique.set(
                key,
                item
              );

            }

          }
        );


        topic.questions =
          Array.from(
            unique.values()
          );

      }
    );


    populateTopicSelect(
      allTopics
    );


    console.log(
      "Knowledge topics loaded:",
      allTopics.length
    );

  }

  catch(error) {

    console.error(
      "Knowledge loading error:",
      error
    );


    showMessage(
      "Unable to load knowledge topics."
    );

  }

}


/*
========================================
POPULATE TOPIC SELECT
========================================
*/

function populateTopicSelect(
  topics
) {

  if (!topicSelect) {
    return;
  }


  topicSelect.innerHTML = `
    <option value="">
      Select an existing topic
    </option>
  `;


  topics.forEach(
    function(topic) {

      const option =
        document.createElement(
          "option"
        );


      option.value =
        topic.topic;


      option.textContent =
        topic.topic +
        " (" +
        topic.questions.length +
        " questions)";


      topicSelect.appendChild(
        option
      );

    }
  );

}


/*
========================================
SEARCH TOPICS
========================================
*/

function filterTopics(
  value
) {

  const search =
    normalizeText(value);


  if (!search) {

    populateTopicSelect(
      allTopics
    );

    return;

  }


  const results =
    allTopics.filter(
      function(topic) {

        return normalizeText(
          topic.topic
        ).includes(search);

      }
    );


  populateTopicSelect(
    results
  );

}


if (topicSearch) {

  topicSearch.addEventListener(
    "input",
    function() {

      filterTopics(
        topicSearch.value
      );

    }
  );

}


/*
========================================
USE SELECTED TOPIC
========================================
*/

if (useSelectedTopicBtn) {

  useSelectedTopicBtn.addEventListener(
    "click",
    function() {

      if (!topicSelect) {
        return;
      }


      const selected =
        topicSelect.value.trim();


      if (!selected) {

        showMessage(
          "Please select an existing topic."
        );

        return;

      }


      const topic =
        allTopics.find(
          function(item) {

            return normalizeText(
              item.topic
            ) ===
            normalizeText(
              selected
            );

          }
        );


      if (!topic) {

        showMessage(
          "Topic not found."
        );

        return;

      }


      currentTopic =
        topic.topic;


      if (currentTopicLabel) {

        currentTopicLabel.textContent =
          currentTopic;

      }


      if (newTopicInput) {

        newTopicInput.value =
          "";

      }


      showMessage(
        "Topic selected: " +
        currentTopic
      );

    }
  );

}


/*
========================================
CREATE NEW TOPIC MODE
========================================
*/

if (createTopicModeBtn) {

  createTopicModeBtn.addEventListener(
    "click",
    function() {

      const newTopic =
        newTopicInput
        ?
        newTopicInput.value.trim()
        :
        "";


      if (!newTopic) {

        showMessage(
          "Please enter a new topic name."
        );

        return;

      }


      const existingTopic =
        allTopics.find(
          function(item) {

            return normalizeText(
              item.topic
            ) ===
            normalizeText(
              newTopic
            );

          }
        );


      if (existingTopic) {

        currentTopic =
          existingTopic.topic;


        if (currentTopicLabel) {

          currentTopicLabel.textContent =
            currentTopic;

        }


        showMessage(
          "This topic already exists. It has been selected instead of creating a duplicate."
        );


        return;

      }


      currentTopic =
        newTopic;


      if (currentTopicLabel) {

        currentTopicLabel.textContent =
          currentTopic;

      }


      showMessage(
        "New topic selected: " +
        currentTopic +
        ". Add the first question and answer."
      );

    }
  );

}


/*
========================================
ADD QUESTION & ANSWER
========================================
*/

if (addKnowledgeBtn) {

  addKnowledgeBtn.addEventListener(
    "click",
    async function() {

      if (!currentTopic) {

        showMessage(
          "Please select an existing topic or create a new topic first."
        );

        return;

      }


      const question =
        questionInput
        ?
        questionInput.value.trim()
        :
        "";


      const answer =
        answerInput
        ?
        answerInput.value.trim()
        :
        "";


      if (!question) {

        showMessage(
          "Please enter a question."
        );

        return;

      }


      if (!answer) {

        showMessage(
          "Please enter an answer."
        );

        return;

      }


      let keywords = [];


      if (
        allKeywordsInput &&
        allKeywordsInput.value.trim()
      ) {

        keywords =
          allKeywordsInput.value
            .split("\n")
            .map(
              function(item) {

                return item.trim();

              }
            )
            .filter(
              function(item) {

                return item.length > 0;

              }
            );

      }


      addKnowledgeBtn.disabled =
        true;


      showMessage(
        "Saving question..."
      );


      try {

        const snapshot =
          await getDocs(
            collection(
              db,
              "knowledge"
            )
          );


        let existingDocument =
          null;


        let existingData =
          null;


        snapshot.docs.forEach(
          function(document) {

            const data =
              document.data();


            const topic =
              String(
                data.topic ||
                data.title ||
                ""
              ).trim();


            if (
              normalizeText(topic) ===
              normalizeText(currentTopic)
            ) {

              existingDocument =
                document;

              existingData =
                data;

            }

          }
        );


        /*
        ========================================
        EXISTING TOPIC
        ========================================
        */

        if (existingDocument) {

          let existingQuestions =
            [];


          if (
            Array.isArray(
              existingData.questions
            )
          ) {

            existingQuestions =
              existingData.questions.slice();

          }

          else if (
            existingData.question
          ) {

            existingQuestions = [

              {

                question:
                  existingData.question,

                answer:
                  existingData.answer || "",

                allKeywords:
                  Array.isArray(
                    existingData.allKeywords
                  )
                  ?
                  existingData.allKeywords
                  :
                  []

              }

            ];

          }


          const duplicate =
            existingQuestions.some(
              function(item) {

                return normalizeText(
                  item.question
                ) ===
                normalizeText(
                  question
                );

              }
            );


          if (duplicate) {

            showMessage(
              "This question already exists in this topic."
            );


            addKnowledgeBtn.disabled =
              false;

            return;

          }


          existingQuestions.push({

            question:
              question,

            answer:
              answer,

            allKeywords:
              keywords

          });


          await updateDoc(
            doc(
              db,
              "knowledge",
              existingDocument.id
            ),
            {

              topic:
                currentTopic,

              questions:
                existingQuestions,

              updatedAt:
                serverTimestamp()

            }
          );


          /*
          ========================================
          HISTORY
          ========================================
          */

          try {

            await addDoc(
              collection(
                db,
                "knowledgeHistory"
              ),
              {

                action:
                  "question_added",

                topic:
                  currentTopic,

                question:
                  question,

                createdAt:
                  serverTimestamp()

              }
            );

          }

          catch(historyError) {

            console.log(
              "History record skipped:",
              historyError
            );

          }


          showMessage(
            "Question & Answer added successfully."
          );

        }

        else {

          /*
          ========================================
          CREATE NEW TOPIC
          ========================================
          */

          await addDoc(
            collection(
              db,
              "knowledge"
            ),
            {

              topic:
                currentTopic,

              questions: [

                {

                  question:
                    question,

                  answer:
                    answer,

                  allKeywords:
                    keywords

                }

              ],

              createdAt:
                serverTimestamp(),

              updatedAt:
                serverTimestamp()

            }
          );


          /*
          ========================================
          HISTORY
          ========================================
          */

          try {

            await addDoc(
              collection(
                db,
                "knowledgeHistory"
              ),
              {

                action:
                  "topic_created",

                topic:
                  currentTopic,

                question:
                  question,

                createdAt:
                  serverTimestamp()

              }
            );

          }

          catch(historyError) {

            console.log(
              "History record skipped:",
              historyError
            );

          }


          showMessage(
            "New topic and Question & Answer added successfully."
          );

        }


        /*
        ========================================
        CLEAR FORM
        ========================================
        */

        if (questionInput) {
          questionInput.value = "";
        }

        if (answerInput) {
          answerInput.value = "";
        }

        if (allKeywordsInput) {
          allKeywordsInput.value = "";
        }


        await loadTopics();


        const refreshedTopic =
          allTopics.find(
            function(item) {

              return normalizeText(
                item.topic
              ) ===
              normalizeText(
                currentTopic
              );

            }
          );


        if (refreshedTopic) {

          currentTopic =
            refreshedTopic.topic;


          if (currentTopicLabel) {

            currentTopicLabel.textContent =
              currentTopic;

          }

        }

      }

      catch(error) {

        console.error(
          "Add knowledge error:",
          error
        );


        showMessage(
          "Unable to save Question & Answer. Check Firebase permissions."
        );

      }


      addKnowledgeBtn.disabled =
        false;

    }
  );

}


/*
========================================
LOAD QUESTION ANALYSIS
========================================
*/

async function loadAnalytics() {

  if (!analyticsBox) {
    return;
  }


  analyticsBox.innerHTML = `
    <p>
      Loading popular knowledge...
    </p>
  `;


  try {

    console.log(
      "Starting Question Analysis..."
    );


    /*
    ========================================
    READ ANALYTICS COLLECTION
    ========================================
    */

    const analyticsCollection =
      collection(
        db,
        "knowledgeAnalytics"
      );


    const snapshot =
      await getDocs(
        analyticsCollection
      );


    console.log(
      "Analytics documents:",
      snapshot.size
    );


    /*
    ========================================
    EMPTY COLLECTION
    ========================================
    */

    if (snapshot.empty) {

      analyticsBox.innerHTML = `
        <p class="analytics-empty">

          No question views recorded yet.

        </p>

        <p class="small-text">

          Open questions from the Knowledge Hub
          first, then return here and load the analysis.

        </p>
      `;

      return;

    }


    /*
    ========================================
    GROUP QUESTIONS
    ========================================
    */

    const questionStats =
      new Map();


    snapshot.forEach(
      function(document) {

        const data =
          document.data();


        const topic =
          String(
            data.topic ||
            "General"
          ).trim();


        const question =
          String(
            data.question ||
            ""
          ).trim();


        if (!question) {
          return;
        }


        const key =
          normalizeText(topic) +
          "||" +
          normalizeText(question);


        if (
          !questionStats.has(key)
        ) {

          questionStats.set(
            key,
            {

              topic:
                topic,

              question:
                question,

              views:
                0

            }
          );

        }


        const current =
          questionStats.get(
            key
          );


        current.views =
          current.views + 1;

      }
    );


    /*
    ========================================
    RESULTS
    ========================================
    */

    const results =
      Array.from(
        questionStats.values()
      );


    results.sort(
      function(a, b) {

        if (
          b.views !==
          a.views
        ) {

          return (
            b.views -
            a.views
          );

        }


        return a.question.localeCompare(
          b.question
        );

      }
    );


    /*
    ========================================
    DISPLAY
    ========================================
    */

    analyticsBox.innerHTML =
      "";


    results.forEach(
      function(item, index) {

        const card =
          document.createElement(
            "div"
          );


        card.className =
          "analytics-card";


        card.innerHTML = `

          <div
            class="analytics-rank"
          >

            #${index + 1}

          </div>


          <div
            class="analytics-question"
          >

            ❓
            ${escapeHTML(
              item.question
            )}

          </div>


          <div
            class="analytics-topic"
          >

            📚
            ${escapeHTML(
              item.topic
            )}

          </div>


          <div
            class="analytics-views"
          >

            👁️
            ${item.views}
            views

          </div>

        `;


        analyticsBox.appendChild(
          card
        );

      }
    );


    /*
    ========================================
    NO VALID RESULTS
    ========================================
    */

    if (
      results.length === 0
    ) {

      analyticsBox.innerHTML = `
        <p class="analytics-empty">

          No valid question analytics found.

        </p>
      `;

    }

  }

  catch(error) {

    /*
    ========================================
    IMPORTANT ERROR DETAILS
    ========================================
    */

    console.error(
      "================================"
    );

    console.error(
      "QUESTION ANALYSIS ERROR"
    );

    console.error(
      "Error code:",
      error.code
    );

    console.error(
      "Error message:",
      error.message
    );

    console.error(
      "Full error:",
      error
    );

    console.error(
      "================================"
    );


    let errorText =
      "Unable to load question analysis.";


    if (
      error.code ===
      "permission-denied"
    ) {

      errorText =
        "Permission denied. Firebase Rules are blocking knowledgeAnalytics.";

    }

    else if (
      error.code ===
      "failed-precondition"
    ) {

      errorText =
        "Firebase failed precondition while loading analytics.";

    }

    else if (
      error.code ===
      "unavailable"
    ) {

      errorText =
        "Firebase is temporarily unavailable. Check your internet connection.";

    }

    else if (
      error.code
    ) {

      errorText =
        "Analytics error: " +
        error.code;

    }


    analyticsBox.innerHTML = `

      <p class="analytics-empty">

        ${escapeHTML(
          errorText
        )}

      </p>

    `;

  }

}


/*
========================================
ANALYTICS BUTTON
========================================
*/

if (loadAnalyticsBtn) {

  loadAnalyticsBtn.addEventListener(
    "click",
    function() {

      loadAnalytics();

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
    async function() {

      try {

        await signOut(
          auth
        );


        window.location.href =
          "admin-login.html";

      }

      catch(error) {

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
AUTH STATE
========================================
*/

onAuthStateChanged(
  auth,
  async function(user) {

    /*
    ========================================
    LOGIN PAGE
    ========================================
    */

    if (isLoginPage) {

      if (user) {

        if (
          isAuthorizedAdmin(user)
        ) {

          window.location.href =
            "admin.html";

        }

        else {

          await signOut(
            auth
          );


          showLoginMessage(
            "Only the authorized admin account can access this page."
          );

        }

      }

      return;

    }


    /*
    ========================================
    ADMIN PAGE
    ========================================
    */

    if (isAdminPage) {

      /*
      ========================================
      NO USER
      ========================================
      */

      if (!user) {

        window.location.href =
          "admin-login.html";

        return;

      }


      /*
      ========================================
      WRONG USER
      ========================================
      */

      if (
        !isAuthorizedAdmin(user)
      ) {

        await signOut(
          auth
        );


        window.location.href =
          "admin-login.html";

        return;

      }


      /*
      ========================================
      AUTHORIZED ADMIN
      ========================================
      */

      console.log(
        "Authorized admin:",
        user.email
      );


      await loadTopics();

    }

  }
);
