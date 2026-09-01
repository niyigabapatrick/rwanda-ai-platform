const startVoice =
document.getElementById(
"startVoice"
);

const voiceQuestion =
document.getElementById(
"voiceQuestion"
);

const voiceStatus =
document.getElementById(
"voiceStatus"
);

const sendButton =
document.getElementById(
"sendVoiceQuestion"
);

const answerBox =
document.getElementById(
"voiceAnswer"
);

/*

BROWSER SUPPORT

*/

const SpeechRecognition =
window.SpeechRecognition ||
window.webkitSpeechRecognition;

let recognition = null;

if(SpeechRecognition) {

recognition =
new SpeechRecognition();

recognition.lang =
"en-US";

recognition.interimResults =
false;

recognition.continuous =
false;

} else {

voiceStatus.innerHTML =
"Voice recognition is not supported by this browser.";

}

/*

START VOICE

*/

if(startVoice) {

startVoice.addEventListener(
"click",
function() {

  if(!recognition) {

    return;

  }


  voiceStatus.innerHTML =
    "🎙️ Listening...";


  recognition.start();

}

);

}

/*

VOICE RESULT

*/

if(recognition) {

recognition.addEventListener(
"result",
function(event) {

  const transcript =
    event.results[0][0]
      .transcript;


  voiceQuestion.value =
    transcript;


  voiceStatus.innerHTML =
    "Voice captured successfully.";

}

);

recognition.addEventListener(
"error",
function(event) {

  console.log(
    "Voice error:",
    event
  );


  voiceStatus.innerHTML =
    "Voice recognition error.";

}

);

recognition.addEventListener(
"end",
function() {

  if(
    voiceStatus.innerHTML ===
    "🎙️ Listening..."
  ) {

    voiceStatus.innerHTML =
      "Voice recognition finished.";

  }

}

);

}

/*

SEND TO CURRENT AI

*/

sendButton.addEventListener(
"click",
function() {

const question =
  voiceQuestion.value.trim();


if(!question) {

  answerBox.innerHTML =
    "<p>Please speak or type a question.</p>";

  return;

}


/*
The existing AI Assistant remains
the actual AI knowledge system.

We send the user to ai.html
with the question.
*/


window.location.href =
  "ai.html?question=" +
  encodeURIComponent(
    question
  );

}
);