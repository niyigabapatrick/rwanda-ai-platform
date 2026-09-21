const CACHE_NAME = "rwanda-ai-v2";

const FILES_TO_CACHE = [
  "./",
  "./index.html",
  "./ai.html",
  "./manifest.json",
  "./style.css",
  "./script.js",
  "./firebase.js",
  "./file_00000000b77c820898e00d1280791658.png"
];


self.addEventListener(
  "install",
  event => {

    event.waitUntil(

      caches.open(
        CACHE_NAME
      ).then(
        cache => {

          return cache.addAll(
            FILES_TO_CACHE
          );

        }
      ).then(
        () => {

          return self.skipWaiting();

        }
      )

    );

  }
);


self.addEventListener(
  "activate",
  event => {

    event.waitUntil(

      caches.keys().then(
        cacheNames => {

          return Promise.all(

            cacheNames
              .filter(
                name =>
                  name !== CACHE_NAME
              )
              .map(
                name =>
                  caches.delete(name)
              )

          );

        }

      ).then(
        () => {

          return self.clients.claim();

        }
      )

    );

  }
);


self.addEventListener(
  "fetch",
  event => {

    const request =
      event.request;


    if (
      request.method !== "GET"
    ) {

      return;

    }


    const url =
      new URL(
        request.url
      );


    /*
    Do not intercept external
    Firebase / Google / Groq requests.
    */

    if (
      url.origin !==
      self.location.origin
    ) {

      return;

    }


    event.respondWith(

      fetch(request)

        .then(
          response => {

            if (
              response &&
              response.status === 200 &&
              response.type === "basic"
            ) {

              const responseClone =
                response.clone();


              caches.open(
                CACHE_NAME
              ).then(
                cache => {

                  cache.put(
                    request,
                    responseClone
                  );

                }
              );

            }


            return response;

          }
        )

        .catch(
          () => {

            return caches.match(
              request
            ).then(
              cachedResponse => {

                return (
                  cachedResponse ||
                  Response.error()
                );

              }
            );

          }
        )

    );

  }
);
