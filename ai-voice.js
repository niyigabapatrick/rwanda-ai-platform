/*
========================================
RWANDA AI PLATFORM
VOICE AI
========================================
*/

const startVoice =
  document.getElementById("startVoice");

const voiceQuestion =
  document.getElementById("voiceQuestion");

const voiceStatus =
  document.getElementById("voiceStatus");

const sendButton =
  document.getElementById("sendVoiceQuestion");

const answerBox =
  document.getElementById("voiceAnswer");


/*
========================================
CHECK ELEMENTS
========================================
*/

if (
  !startVoice ||
  !voiceQuestion ||
  !voiceStatus ||
  !sendButton ||
  !answerBox
) {

  console.error(
    "Voice AI elements are missing from HTML."
  );

}


/*
========================================
BROWSER SUPPORT
========================================
*/

const SpeechRecognition =
  window.SpeechRecognition ||
  window.webkitSpeechRecognition;


let recognition = null;

let isListening = false;


if (!SpeechRecognition) {

  voiceStatus.innerHTML =
    "❌ Voice recognition is not supported by this browser.";

  startVoice.disabled = true;

  console.error(
    "Speech Recognition API is not supported."
  );

}


/*
========================================
CREATE RECOGNITION
========================================
*/

if (SpeechRecognition) {

  recognition =
    new SpeechRecognition();


  /*
  LANGUAGE
  */

  recognition.lang =
    "en-US";


  /*
  ONLY FINAL RESULT
  */

  recognition.interimResults =
    false;


  /*
  ONE QUESTION AT A TIME
  */

  recognition.continuous =
    false;


  /*
  MAX ALTERNATIVES
  */

  recognition.maxAlternatives =
    1;


  /*
  ========================================
  RECOGNITION START
  ========================================
  */

  recognition.onstart =
    function() {

      isListening =
        true;


      startVoice.disabled =
        true;


      startVoice.innerHTML =
        "🛑 Listening...";


      voiceStatus.innerHTML =
        "🎙️ Listening... Speak now.";

    };


  /*
  ========================================
  VOICE RESULT
  ========================================
  */

  recognition.onresult =
    function(event) {

      const transcript =
        event
          .results[0][0]
          .transcript
          .trim();


      console.log(
        "Voice transcript:",
        transcript
      );


      voiceQuestion.value =
        transcript;


      voiceStatus.innerHTML =
        "✅ Voice captured successfully.";

    };


  /*
  ========================================
  RECOGNITION ERROR
  ========================================
  */

  recognition.onerror =
    function(event) {

      console.error(
        "Voice recognition error:",
        event.error
      );


      isListening =
        false;


      startVoice.disabled =
        false;


      startVoice.innerHTML =
        "🎙️ Start Speaking";


      if (
        event.error ===
        "not-allowed"
      ) {

        voiceStatus.innerHTML =
          "❌ Microphone permission was denied. Allow microphone access and try again.";

        return;

      }


      if (
        event.error ===
        "service-not-allowed"
      ) {

        voiceStatus.innerHTML =
          "❌ Voice recognition service is not allowed in this browser.";

        return;

      }


      if (
        event.error ===
        "no-speech"
      ) {

        voiceStatus.innerHTML =
          "⚠️ No speech detected. Tap Start Speaking and try again.";

        return;

      }


      if (
        event.error ===
        "audio-capture"
      ) {

        voiceStatus.innerHTML =
          "❌ Microphone could not be accessed.";

        return;

      }


      voiceStatus.innerHTML =
        "❌ Voice recognition error: " +
        event.error;

    };


  /*
  ========================================
  RECOGNITION END
  ========================================
  */

  recognition.onend =
    function() {

      isListening =
        false;


      startVoice.disabled =
        false;


      startVoice.innerHTML =
        "🎙️ Start Speaking";


      if (
        voiceStatus.innerHTML ===
        "🎙️ Listening... Speak now."
      ) {

        voiceStatus.innerHTML =
          "Voice recognition finished.";

      }

    };

}


/*
========================================
START VOICE
========================================
*/

if (startVoice) {

  startVoice.addEventListener(
    "click",
    function() {

      console.log(
        "Start Speaking clicked."
      );


      /*
      CHECK SUPPORT
      */

      if (!recognition) {

        voiceStatus.innerHTML =
          "❌ This browser does not support voice recognition.";

        return;

      }


      /*
      PREVENT DOUBLE START
      */

      if (isListening) {

        console.log(
          "Voice recognition is already running."
        );

        return;

      }


      /*
      CLEAR OLD QUESTION
      */

      voiceQuestion.value =
        "";


      voiceStatus.innerHTML =
        "🎙️ Starting microphone...";


      /*
      START RECOGNITION
      */

      try {

        recognition.start();

      } catch (error) {

        console.error(
          "Could not start voice recognition:",
          error
        );


        voiceStatus.innerHTML =
          "❌ Could not start voice recognition. Try again.";

      }

    }
  );

}


/*
========================================
SEND QUESTION TO AI
========================================
*/

if (sendButton) {

  sendButton.addEventListener(
    "click",
    function() {

      const question =
        voiceQuestion.value.trim();


      /*
      EMPTY QUESTION
      */

      if (!question) {

        answerBox.innerHTML =
          "<p>Please speak or type a question.</p>";

        return;

      }


      console.log(
        "Sending voice question:",
        question
      );


      /*
      SEND TO AI ASSISTANT
      */

      window.location.href =
        "ai.html?question=" +
        encodeURIComponent(
          question
        );

    }
  );

}


/*
========================================
PAGE READY
========================================
*/

console.log(
  "Rwanda Voice AI loaded successfully."
);