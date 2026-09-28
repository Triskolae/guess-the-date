const categories = [
  "chair",
  "lamp",
  "clock",
  "camera",
  "radio",
  "computer",
  "calculator",
  "typewriter"
];

console.log(categories);

const API_URL = "https://api.cooperhewitt.org/";

const query = `
{
  object(
    hasImages: true
    general: "${categories[0]}"
    size: 50
  ) {
    id
    title
    date
    description
    multimedia
    maker {
      name
    }
  }
}
`;



async function fetchObjects() {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      query: query
    })
  });

  const data = await response.json();

const objects = data.data.object;

let cc0Count = 0;

objects.forEach((object) => {
  object.multimedia.forEach((media) => {
    if (media.cc0 === true) {
      cc0Count++;
    }
  });
});

const validObjects = objects.filter((object) => {
  const hasCC0Image = object.multimedia.some((media) => media.cc0 === true);
  const hasExactYear = object.date?.some((date) => date.from === date.to);

  return hasCC0Image && hasExactYear;
});

validObjects.forEach((object) => {
  console.log(object.title, object.date);
});
console.log("Nombre d'objets avec une image CC0 :", validObjects.length);
}

    fetchObjects();
