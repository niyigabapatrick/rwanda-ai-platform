import { db } from "./firebase.js";

import {

collection,
getDocs,
orderBy,
query

} from "https://www.gstatic.com/firebasejs/12.17.0/firebase-firestore.js";

console.log(
"AI history started"
);

const historyBox =
document.getElementById(
"history"
);

/*

ESCAPE HTML

*/

function escapeHTML(value) {

return String(value || "")
.replace(/[&<>"']/g, function(character) {

  const entities = {

    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"

  };

  return entities[character];

});

}

/*

LOAD KNOWLEDGE

*/

async function loadHistory() {

try {

const knowledgeQuery =
  query(

    collection(
      db,
      "knowledge"
    ),

    orderBy(
      "createdAt",
      "desc"
    )

  );


const snapshot =
  await getDocs(
    knowledgeQuery
  );


if(snapshot.empty) {

  historyBox.innerHTML =
    "<p>No AI knowledge available yet.</p>";

  return;

}


historyBox.innerHTML =
  snapshot.docs
    .map(function(document) {

      const data =
        document.data();


      let dateText = "";


      if(
        data.createdAt &&
        data.createdAt.toDate
      ) {

        dateText =
          data.createdAt
            .toDate()
            .toLocaleString();

      }


      return `

      <article
      class="history-card">

        <div
        class="history-question">

          ❓
          ${escapeHTML(
            data.question
          )}

        </div>


        <div
        class="history-answer">

          🤖
          ${escapeHTML(
            data.answer
          )}

        </div>


        ${
          dateText

          ?

          `<div class="history-date">
          ${escapeHTML(dateText)}
          </div>`

          :

          ""

        }

      </article>

      `;

    })
    .join("");

} catch(error) {

console.log(
  "AI history error:",
  error
);


historyBox.innerHTML =
  "<p>Could not load AI knowledge.</p>";

}

}

loadHistory();