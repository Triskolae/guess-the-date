// Requêtes HTTP REST
fetch(`${window.API_URL}/api/health`)
  .then((response) => {
    if (!response.ok) {
      console.error("API health check failed");
    }
  })
  .catch((error) => {
    console.error("API unavailable:", error);
  });

// Connexion WebSockets (Socket.IO)
// Only initialise Socket.IO when the client library is available.
if (typeof io !== "undefined") {
  const socket = io(window.API_URL);
}

const form = document.getElementById("answer-form");
const feedback = document.getElementById("feedback");
const hints = document.getElementById("hints");
const userAnswerInput = document.getElementById("user-answer");

const objectImage = document.getElementById("object-image");
const objectName = document.getElementById("object-name");
const objectQuestion = document.getElementById("object-question");
const nextObjectButton = document.getElementById("next-object");

const timelineCursor = document.getElementById("timeline-cursor");
const timelineTicks = document.getElementById("timeline-ticks");

const objectImageFallback = document.getElementById("object-image-fallback");

const DEFAULT_TIMELINE_MIN_YEAR = -3000;
const DEFAULT_TIMELINE_MAX_YEAR = new Date().getFullYear();

// What the player has discovered about the possible answer.
let searchMinYear = DEFAULT_TIMELINE_MIN_YEAR;
let searchMaxYear = DEFAULT_TIMELINE_MAX_YEAR;

// What is currently displayed on the timeline.
let timelineMinYear = DEFAULT_TIMELINE_MIN_YEAR;
let timelineMaxYear = DEFAULT_TIMELINE_MAX_YEAR;

// Temporary data used to test the game loop.
// This will later be replaced by data coming from the API/database.
const objects = [
  {
    id: "gramophone",
    name: "Gramophone",
    year: 1887,
    image: "assets/img/gramophone.png",
    rarity: "common",
    themes: ["art-culture", "technology"],
    sourceUrl: "https://en.wikipedia.org/wiki/Gramophone",
  },
  {
  id: "uranium",
  name: "Uranium",
  year: 1789,
  image: "assets/img/uranium.jpg",
  rarity: "uncommon",
  themes: ["science"],
  sourceUrl: "https://en.wikipedia.org/wiki/Uranium",
  },
];

let currentObjectIndex = 0;
let userTries = 0;
let roundFinished = false;

function getCurrentObject() {
  return objects[currentObjectIndex];
}

function getHistoricalPeriod(year) {
  if (year < -3000) {
    return "Prehistory";
  }

  if (year <= 476) {
    return "Antiquity";
  }

  if (year <= 1492) {
    return "Middle Ages";
  }

  if (year <= 1789) {
    return "Modern Era";
  }

  return "Contemporary Era";
}

function validateGameObject(object) {
  if (!object) {
    console.error("No game object received.");
    return false;
  }

  if (!object.id) {
    console.error("Game object is missing an id.", object);
    return false;
  }

  if (!Number.isInteger(object.year)) {
    console.error(
      `Object "${object.id}": missing or invalid reference year.`,
      object,
    );
    return false;
  }

  return true;
}

function getObjectDisplayData(object) {
  return {
    name: object.name || "Unknown object",
    image: object.image || null,
    sourceUrl: object.sourceUrl || null,
    rarity: object.rarity || null,
    themes: Array.isArray(object.themes) ? object.themes : [],
  };
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

function getTimelinePosition(year) {
  const range = timelineMaxYear - timelineMinYear;

  if (range <= 0) {
    return 50;
  }

  const position =
    ((year - timelineMinYear) / range) * 100;

  return Math.min(100, Math.max(0, position));
}

function updateTimelineCursor(year) {
  const position = getTimelinePosition(year);

  timelineCursor.style.left = `${position}%`;
}

function updateSearchBounds(userAnswer, answer) {
  if (userAnswer < answer) {
    searchMinYear = Math.max(searchMinYear, userAnswer);
  }

  if (userAnswer > answer) {
    searchMaxYear = Math.min(searchMaxYear, userAnswer);
  }
}

function getZoomStep(range) {
  if (range <= 50) {
    return 50;
  }

  if (range <= 100) {
    return 100;
  }

  if (range <= 200) {
    return 200;
  }

  if (range <= 500) {
    return 500;
  }

  if (range <= 1000) {
    return 1000;
  }

  return null;
}

function getRoundingStep(zoomStep) {
  switch (zoomStep) {
    case 1000:
      return 1000;

    case 500:
      return 500;

    case 200:
      return 100;

    case 100:
      return 50;

    case 50:
      return 50;

    default:
      return 100;
  }
}

function updateTimelineRange() {
  const searchRange = searchMaxYear - searchMinYear;
  const zoomStep = getZoomStep(searchRange);

  // Keep the full historical view while the possible
  // answer range is still greater than 1000 years.
  if (zoomStep === null) {
    timelineMinYear = DEFAULT_TIMELINE_MIN_YEAR;
    timelineMaxYear = DEFAULT_TIMELINE_MAX_YEAR;
    return;
  }

  const roundingStep = getRoundingStep(zoomStep);

  let minYear =
    Math.floor(searchMinYear / roundingStep) * roundingStep;

  let maxYear =
    Math.ceil(searchMaxYear / roundingStep) * roundingStep;

  // The displayed timeline must be at least as wide
  // as the current zoom level.
  if (maxYear - minYear < zoomStep) {
    maxYear = minYear + zoomStep;
  }

  // Ensure the known search area remains inside the timeline.
  if (maxYear < searchMaxYear) {
    maxYear =
      Math.ceil(searchMaxYear / roundingStep) * roundingStep;

    minYear = maxYear - zoomStep;
  }

  timelineMinYear = minYear;
  timelineMaxYear = maxYear;
}

function ensureGuessIsVisible(userAnswer) {
  // Nothing to do if the guess is already visible.
  if (
    userAnswer >= timelineMinYear &&
    userAnswer <= timelineMaxYear
  ) {
    return;
  }

  const currentRange =
    timelineMaxYear - timelineMinYear;

  const expandedMin =
    Math.min(userAnswer, timelineMinYear);

  const expandedMax =
    Math.max(userAnswer, timelineMaxYear);

  const requiredRange =
    expandedMax - expandedMin;

  let newRange;

  if (requiredRange <= 100) {
    newRange = 100;
  } else if (requiredRange <= 200) {
    newRange = 200;
  } else if (requiredRange <= 500) {
    newRange = 500;
  } else if (requiredRange <= 1000) {
    newRange = 1000;
  } else if (requiredRange <= 2000) {
    newRange = 2000;
  } else {
    newRange =
      Math.ceil(requiredRange / 1000) * 1000;
  }

  // Never make the timeline smaller while trying
  // to display an out-of-range guess.
  newRange = Math.max(newRange, currentRange);

  let roundingStep;

  if (newRange <= 200) {
    roundingStep = 50;
  } else if (newRange <= 500) {
    roundingStep = 100;
  } else if (newRange <= 1000) {
    roundingStep = 200;
  } else {
    roundingStep = 500;
  }

  let minYear =
    Math.floor(expandedMin / roundingStep) *
    roundingStep;

  let maxYear = minYear + newRange;

  // If the right side is still not large enough,
  // shift the whole displayed window.
  if (maxYear < expandedMax) {
    maxYear =
      Math.ceil(expandedMax / roundingStep) *
      roundingStep;

    minYear = maxYear - newRange;
  }

  timelineMinYear = minYear;
  timelineMaxYear = maxYear;
}

function formatTimelineYear(year) {
  if (year < 0) {
    return `${Math.abs(year)} BC`;
  }

  if (
    timelineMinYear === DEFAULT_TIMELINE_MIN_YEAR &&
    timelineMaxYear === DEFAULT_TIMELINE_MAX_YEAR &&
    year === DEFAULT_TIMELINE_MAX_YEAR
  ) {
    return "Present";
  }

  return year;
}

function updateTimelineTicks() {
  timelineTicks.innerHTML = "";

  const range =
    timelineMaxYear - timelineMinYear;

  let tickStep;

  if (range <= 50) {
    tickStep = 10;
  } else if (range <= 100) {
    tickStep = 25;
  } else if (range <= 200) {
    tickStep = 50;
  } else if (range <= 500) {
    tickStep = 100;
  } else if (range <= 1000) {
    tickStep = 200;
  } else {
    tickStep = 1000;
  }

  const firstTick =
    Math.ceil(timelineMinYear / tickStep) *
    tickStep;

  for (
    let year = firstTick;
    year <= timelineMaxYear;
    year += tickStep
  ) {
    const position =
      ((year - timelineMinYear) /
        (timelineMaxYear - timelineMinYear)) *
      100;

    const tick =
      document.createElement("div");

    tick.className = "timeline-tick";
    tick.style.left = `${position}%`;

    const mark =
      document.createElement("div");

    mark.className = "timeline-tick-mark";

    const label =
      document.createElement("span");

    label.className = "timeline-tick-label";
    label.innerText = formatTimelineYear(year);

    tick.appendChild(mark);
    tick.appendChild(label);

    timelineTicks.appendChild(tick);
  }
}

function updateTimeline(userAnswer, answer) {
  // First update what the player has logically discovered.
  updateSearchBounds(userAnswer, answer);

  // Calculate the normal zoom based on the remaining
  // possible answer range.
  updateTimelineRange();

  // If the latest guess falls outside that zoom,
  // temporarily expand the displayed timeline.
  ensureGuessIsVisible(userAnswer);

  updateTimelineTicks();

  // The cursor always represents the player's latest guess.
  updateTimelineCursor(userAnswer);
}

function getDirectionHint(userAnswer, answer) {
  if (userAnswer < answer) {
    return "Try a more recent date.";
  }

  if (userAnswer > answer) {
    return "Try an older date.";
  }

  return "";
}

function displayObject() {
  const currentObject = getCurrentObject();

  if (!validateGameObject(currentObject)) {
    objectImage.removeAttribute("src");
    objectImage.alt = "";
    objectImage.hidden = true;

    objectImageFallback.hidden = true;

    objectName.innerText = "Unable to load object";
    objectQuestion.innerText = "";

    feedback.innerText = "This object cannot be played.";

    return false;
  }

  const displayData = getObjectDisplayData(currentObject);

  objectName.innerText = displayData.name;

  objectQuestion.innerHTML =
    `When was the <strong>${displayData.name}</strong> created?`;

  if (displayData.image) {
    objectImage.src = displayData.image;
    objectImage.alt = displayData.name;
    objectImage.hidden = false;

    objectImageFallback.hidden = true;
  } else {
    objectImage.removeAttribute("src");
    objectImage.alt = "";
    objectImage.hidden = true;

    objectImageFallback.hidden = false;

    console.warn(
      `Object "${currentObject.id}": missing image. Image unavailable message displayed.`,
    );
  }

  return true;
}

function resetRound() {
  userTries = 0;
  roundFinished = false;

  searchMinYear = DEFAULT_TIMELINE_MIN_YEAR;
  searchMaxYear = DEFAULT_TIMELINE_MAX_YEAR;

  timelineMinYear = DEFAULT_TIMELINE_MIN_YEAR;
  timelineMaxYear = DEFAULT_TIMELINE_MAX_YEAR;

  form.reset();

  feedback.innerHTML = "";
  hints.innerText = "";

  timelineCursor.style.left = "0%";

  updateTimelineTicks();

  userAnswerInput.disabled = false;

  const submitButton =
    form.querySelector('button[type="submit"]');

  submitButton.disabled = false;

  nextObjectButton.hidden = true;

  const objectLoaded = displayObject();

  if (!objectLoaded) {
    userAnswerInput.disabled = true;
    submitButton.disabled = true;
    nextObjectButton.hidden = false;
  }
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

function displayTemperatureFeedback(
  difference,
  directionHint
) {
  switch (true) {
    case difference <= 24:
      feedback.innerHTML =
        `🔥 Burning! ${directionHint}`;
      break;

    case difference <= 49:
      feedback.innerHTML =
        `🥵 Hot! ${directionHint}`;
      break;

    case difference <= 79:
      feedback.innerHTML =
        `😎 Warm! ${directionHint}`;
      break;

    case difference <= 99:
      feedback.innerHTML =
        `🥶 Cold! ${directionHint}`;
      break;

    default:
      feedback.innerHTML =
        `🧊 Freezing! ${directionHint}`;
      break;
  }
}

function winRound(currentObject) {
  roundFinished = true;

  const displayData = getObjectDisplayData(currentObject);

  if (displayData.sourceUrl) {
    feedback.innerHTML =
      `🥳 You got it! ` +
      `<a href="${displayData.sourceUrl}" ` +
      `target="_blank" ` +
      `rel="noopener noreferrer">` +
      `Learn more about this object</a>`;
  } else {
    feedback.innerText = "🥳 You got it!";

    console.warn(
      `Object "${currentObject.id}": missing documentary source.`,
    );
  }

  userAnswerInput.disabled = true;

  const submitButton =
    form.querySelector('button[type="submit"]');

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

  const userAnswer =
    Number(formData.get("user-answer"));

  feedback.innerHTML = "";

  if (userAnswer === currentObject.year) {
    updateTimelineCursor(userAnswer);
    winRound(currentObject);
    return;
  }

  userTries++;

  const difference =
    Math.abs(currentObject.year - userAnswer);

  const directionHint =
    getDirectionHint(
      userAnswer,
      currentObject.year
    );

  displayTemperatureFeedback(
    difference,
    directionHint
  );

  displayHints(currentObject.year);

  updateTimeline(
    userAnswer,
    currentObject.year
  );
});

nextObjectButton.addEventListener("click", () => {
  currentObjectIndex =
    (currentObjectIndex + 1) % objects.length;

  resetRound();
});

resetRound();
