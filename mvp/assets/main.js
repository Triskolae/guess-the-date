const form = document.getElementById("answer-form");
const feedback = document.getElementById("feedback");

form.addEventListener("submit", (event) => {
  event.preventDefault();
  feedback.innerHTML = '';
  
  const formData = new FormData(form);
  console.log('formData', formData.get('user-answer'));
  const userAnswer = +formData.get('user-answer');
  const answer = 1887;

  if (userAnswer === answer) {
    feedback.innerHTML = '&#x1F973; C\'est gagnééé ! <a href="https://fr.wikipedia.org/wiki/Gramophone" target="_blank">Découvrir cette invention</a>';
    return;
  }

  switch (true) {
    case Math.abs(answer - userAnswer) < 25:
      feedback.innerHTML = '&#x1F525;';
      break;
    case Math.abs(answer - userAnswer) < 50:
      feedback.innerHTML = '&#x1F975;';
      break;
    case Math.abs(answer - userAnswer) < 75:
      feedback.innerHTML = '&#x1F60E;';
      break;
    case Math.abs(answer - userAnswer) < 100:
      feedback.innerHTML = '&#x1F976;';
      break;
    default:
      feedback.innerHTML = '&#x1F9CA; Houlà t\'es loiiiiiin...';
      break;
  }
});
