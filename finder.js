import { db } from "./firebase.js";

import {
collection,
getDocs
} from "https://www.gstatic.com/firebasejs/12.17.0/firebase-firestore.js";

console.log("Rwanda AI Finder started");

const searchInput =
document.getElementById("finderSearch");

const categoryFilter =
document.getElementById("categoryFilter");

const locationFilter =
document.getElementById("locationFilter");

const priceFilter =
document.getElementById("priceFilter");

const resultsBox =
document.getElementById("finderResults");

const statusBox =
document.getElementById("finderStatus");

let providers = [];

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

NORMALIZE

*/

function normalize(value) {

return String(value || "")
.toLowerCase()
.trim();

}

/*

LOAD PROVIDERS

*/

async function loadProviders() {

try {

const snapshot =
  await getDocs(
    collection(db, "providers")
  );


providers =
  snapshot.docs.map(function(doc) {

    return {

      id: doc.id,

      ...doc.data()

    };

  });


console.log(
  "Finder providers:",
  providers
);


loadCategories();


statusBox.innerHTML =
  providers.length +
  " provider(s) available";


renderProviders(providers);

} catch(error) {

console.log(
  "Finder loading error:",
  error
);


statusBox.innerHTML =
  "Could not load providers.";

}

}

/*

LOAD CATEGORIES

*/

function loadCategories() {

const categories =
[...new Set(

  providers
    .map(function(item) {

      return String(
        item.category || ""
      ).trim();

    })
    .filter(Boolean)

)].sort();

categoryFilter.innerHTML =
'<option value="">All Categories</option>';

categories.forEach(function(category) {

const option =
  document.createElement("option");


option.value = category;

option.textContent = category;


categoryFilter.appendChild(
  option
);

});

}

/*

RENDER PROVIDERS

*/

function renderProviders(list) {

if(list.length === 0) {

resultsBox.innerHTML =
  "<p>No provider or supplier found.</p>";

return;

}

resultsBox.innerHTML =
list.map(function(item) {

  return `

  <article class="provider-card">

    <h3>
      ${escapeHTML(
        item.name ||
        "Unnamed Provider"
      )}
    </h3>


    <p>
      <strong>
      Service/Product:
      </strong>

      ${escapeHTML(
        item.service
      )}
    </p>


    <p>
      <strong>
      Category:
      </strong>

      ${escapeHTML(
        item.category
      )}
    </p>


    <p>
      <strong>
      Location:
      </strong>

      ${escapeHTML(
        item.location
      )}
    </p>


    <p>
      <strong>
      Price:
      </strong>

      ${escapeHTML(
        item.price
      )}
    </p>


    <p>
      <strong>
      Phone:
      </strong>

      ${escapeHTML(
        item.phone
      )}
    </p>


    <a
    href="provider.html?id=${encodeURIComponent(item.id)}">

    <button>
    View Profile
    </button>

    </a>


  </article>

  `;

}).join("");

}

/*

SEARCH

*/

function searchProviders() {

const searchValue =
normalize(
searchInput.value
);

const categoryValue =
normalize(
categoryFilter.value
);

const locationValue =
normalize(
locationFilter.value
);

const priceValue =
normalize(
priceFilter.value
);

const filtered =
providers.filter(function(item) {

  const searchableText = [

    item.name,

    item.service,

    item.category,

    item.location,

    item.price,

    item.phone

  ]
  .map(normalize)
  .join(" ");


  const matchesSearch =
    !searchValue ||
    searchableText.includes(
      searchValue
    );


  const matchesCategory =
    !categoryValue ||
    normalize(
      item.category
    ) === categoryValue;


  const matchesLocation =
    !locationValue ||
    normalize(
      item.location
    ).includes(
      locationValue
    );


  const matchesPrice =
    !priceValue ||
    normalize(
      item.price
    ).includes(
      priceValue
    );


  return (

    matchesSearch &&

    matchesCategory &&

    matchesLocation &&

    matchesPrice

  );

});

statusBox.innerHTML =
filtered.length +
" result(s) found";

renderProviders(
filtered
);

}

/*

CLEAR SEARCH

*/

function clearSearch() {

searchInput.value = "";

categoryFilter.value = "";

locationFilter.value = "";

priceFilter.value = "";

statusBox.innerHTML =
providers.length +
" provider(s) available";

renderProviders(
providers
);

}

/*

EVENTS

*/

document
.getElementById("finderSearchBtn")
.addEventListener(
"click",
searchProviders
);

document
.getElementById("clearFinderBtn")
.addEventListener(
"click",
clearSearch
);

searchInput.addEventListener(
"keydown",
function(event) {

if(event.key === "Enter") {

  searchProviders();

}

}
);

/*

CATEGORY URL

*/

const urlParams =
new URLSearchParams(
window.location.search
);

const urlCategory =
urlParams.get("category");

/*

START

*/

loadProviders()
.then(function() {

if(urlCategory) {

categoryFilter.value =
  urlCategory;

searchProviders();

}

});