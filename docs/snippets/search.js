import {
  OpenStreetMapProvider,
} from 'leaflet-geosearch';

const provider = new OpenStreetMapProvider();

const form = document.querySelector('form');
const input = form.querySelector('input[type="text"]');

form.addEventListener('submit', (event) => {
  event.preventDefault();

  provider.search({ query: input.value }).then((results) => {
    console.log(results);
  });
});
