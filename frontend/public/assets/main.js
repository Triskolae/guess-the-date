const form = document.getElementById("answer-form");
const feedback = document.getElementById("feedback");
const hints = document.getElementById("hints");
const userAnswerInput = document.getElementById("user-answer");

const objectImage = document.getElementById("object-image");
const objectName = document.getElementById("object-name");
const objectQuestion = document.getElementById("object-question");
const nextObjectButton = document.getElementById("next-object");

// Temporary data used to test the game loop.
// This will later be replaced by data coming from the API/database.
const objects = [
  {
    name: "Gramophone",
    year: 1887,
    image: "assets/img/gramophone.png",
    link: "https://en.wikipedia.org/wiki/Gramophone",
  },
  {
    name: "Uranium",
    year: 1789,
    image: "assets/img/uranium.jpg",
    link: "https://en.wikipedia.org/wiki/Uranium",
  },
];

let currentObjectIndex = 0;
let userTries = 0;
let roundFinished = false;

function getCurrentObject() {
  return objects[currentObjectIndex];
}

function getCentury(year) {
  const century = Math.ceil(year / 100);

  if (century % 100 >= 11 && century % 100 <= 13) {
    return `${century}th century`;
  }

  switch (century % 10) {
    case 1:
      return `${century}st century`;
    case 2:
      return `${century}nd century`;
    case 3:
      return `${century}rd century`;
    default:
      return `${century}th century`;
  }
}

function getPartialYear(year) {
  const yearAsString = String(year);

  return `${yearAsString.slice(0, -1)}_`;
}

function displayObject() {
  const currentObject = getCurrentObject();

  objectImage.src = currentObject.image;
  objectImage.alt = currentObject.name;

  objectName.innerText = currentObject.name;

  objectQuestion.innerHTML =
    `When was the <strong>${currentObject.name}</strong> created?`;
}

function resetRound() {
  userTries = 0;
  roundFinished = false;

  form.reset();

  feedback.innerHTML = "";
  hints.innerText = "";

  userAnswerInput.disabled = false;

  const submitButton = form.querySelector('button[type="submit"]');
  submitButton.disabled = false;

  nextObjectButton.hidden = true;

  displayObject();
}

function displayHints(answer) {
  const hintsList = [];

  if (userTries >= 3) {
    hintsList.push(getCentury(answer));
  }

  if (userTries >= 5) {
    hintsList.push(getPartialYear(answer));
  }

  hints.innerText = hintsList.join("\n");
}

function displayTemperatureFeedback(difference) {
  switch (true) {
    case difference <= 24:
      feedback.innerHTML = "🔥 Burning!";
      break;

    case difference <= 49:
      feedback.innerHTML = "🥵 Hot!";
      break;

    case difference <= 79:
      feedback.innerHTML = "😎 Warm!";
      break;

    case difference <= 99:
      feedback.innerHTML = "🥶 Cold!";
      break;

    default:
      feedback.innerHTML = "🧊 Freezing!";
      break;
  }
}

function winRound(currentObject) {
  roundFinished = true;

  feedback.innerHTML =
    `🥳 You got it! ` +
    `<a href="${currentObject.link}" target="_blank" rel="noopener noreferrer">` +
    `Learn more about this object</a>`;

  userAnswerInput.disabled = true;

  const submitButton = form.querySelector('button[type="submit"]');
  submitButton.disabled = true;

  nextObjectButton.hidden = false;
}

form.addEventListener("submit", (event) => {
  event.preventDefault();

  if (roundFinished) {
    return;
  }

  const currentObject = getCurrentObject();
  const formData = new FormData(form);
  const userAnswer = Number(formData.get("user-answer"));

  feedback.innerHTML = "";

  if (userAnswer === currentObject.year) {
    winRound(currentObject);
    return;
  }

  userTries++;

  const difference = Math.abs(currentObject.year - userAnswer);

  displayTemperatureFeedback(difference);
  displayHints(currentObject.year);
});

nextObjectButton.addEventListener("click", () => {
  currentObjectIndex = (currentObjectIndex + 1) % objects.length;

  resetRound();
});

resetRound();
