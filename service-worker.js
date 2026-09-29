/*
==========================================================
RWANDA AI PLATFORM
FAST PWA SERVICE WORKER
CACHE FIRST FOR LOCAL FILES
NETWORK FALLBACK
==========================================================
*/

const CACHE_NAME = "rwanda-ai-v3";


/*
==========================================================
FILES NEEDED FOR BASIC OFFLINE STARTUP
==========================================================
*/

const FILES_TO_CACHE = [
  "./",
  "./index.html",
  "./manifest.json",
  "./file_00000000b77c820898e00d1280791658.png"
];


/*
==========================================================
INSTALL
==========================================================
*/

self.addEventListener("install", event => {

  event.waitUntil(

    caches.open(CACHE_NAME)

      .then(cache => {

        return cache.addAll(FILES_TO_CACHE);

      })

      .then(() => {

        return self.skipWaiting();

      })

  );

});


/*
==========================================================
ACTIVATE
REMOVE OLD CACHES
==========================================================
*/

self.addEventListener("activate", event => {

  event.waitUntil(

    caches.keys()

      .then(cacheNames => {

        return Promise.all(

          cacheNames

            .filter(name => {

              return name !== CACHE_NAME;

            })

            .map(name => {

              return caches.delete(name);

            })

        );

      })

      .then(() => {

        return self.clients.claim();

      })

  );

});


/*
==========================================================
FETCH
CACHE FIRST FOR LOCAL STATIC FILES
==========================================================
*/

self.addEventListener("fetch", event => {

  const request = event.request;


  /*
  Only GET requests
  */

  if (request.method !== "GET") {
    return;
  }


  const url = new URL(request.url);


  /*
  Ignore external websites/APIs.

  This means Firebase, Google, Groq,
  and other external services are not
  controlled by this service worker.
  */

  if (url.origin !== self.location.origin) {
    return;
  }


  /*
  Only handle normal HTTP/HTTPS requests.
  */

  if (
    url.protocol !== "http:" &&
    url.protocol !== "https:"
  ) {
    return;
  }


  event.respondWith(

    caches.match(request)

      .then(cachedResponse => {

        /*
        If the file already exists in cache,
        return it immediately.

        This makes repeated page loading
        extremely fast.
        */

        if (cachedResponse) {

          return cachedResponse;

        }


        /*
        File is not cached.
        Get it from the network.
        */

        return fetch(request)

          .then(response => {

            /*
            Only cache successful local responses.
            */

            if (
              response &&
              response.status === 200 &&
              response.type === "basic"
            ) {

              const responseClone =
                response.clone();


              caches.open(CACHE_NAME)

                .then(cache => {

                  cache.put(
                    request,
                    responseClone
                  );

                });

            }


            return response;

          })

          .catch(() => {

            /*
            If there is no internet and the
            requested file is not cached,
            return a normal error response.
            */

            return new Response(
              "Rwanda AI Platform is temporarily unavailable.",
              {
                status: 503,
                statusText: "Service Unavailable",
                headers: {
                  "Content-Type": "text/plain; charset=UTF-8"
                }
              }
            );

          });

      })

  );

});
