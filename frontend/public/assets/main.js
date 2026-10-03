const form = document.getElementById("answer-form");
const feedback = document.getElementById("feedback");
const hints = document.getElementById("hints");

let userTries = 0;

form.addEventListener("submit", (event) => {
  event.preventDefault();
  userTries++;
  feedback.innerHTML = "";
  hints.innerText = "";

  const formData = new FormData(form);
  const userAnswer = +formData.get("user-answer");
  const answer = 1887;

  if (userAnswer === answer) {
    feedback.innerHTML = `&#x1F973; You got it! <a href="https://en.wikipedia.org/wiki/Gramophone"
      target="_blank">Learn more about this invention</a>`;
    return;
  }

  if (userTries >= 5) {
    hints.innerText = "188_\n";
  }

  if (userTries >= 3) {
    hints.innerText += "19th century\n";
  }

  switch (true) {
    case Math.abs(answer - userAnswer) < 25:
      feedback.innerHTML = "&#x1F525;";
      break;
    case Math.abs(answer - userAnswer) < 50:
      feedback.innerHTML = "&#x1F975;";
      break;
    case Math.abs(answer - userAnswer) < 75:
      feedback.innerHTML = "&#x1F60E;";
      break;
    case Math.abs(answer - userAnswer) < 100:
      feedback.innerHTML = "&#x1F976;";
      break;
    default:
      feedback.innerHTML = "&#x1F9CA; You're way off!";
      break;
  }
});
