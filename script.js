'use strict';

class Workout {
  date = new Date();
  id = (Date.now() + '').slice(-10);
  constructor(coords, distance, duration) {
    this.coords = coords;
    this.distance = distance;
    this.duration = duration;
  }

  _setDescription() {
    // prettier-ignore
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    const month = months[this.date.getMonth()];
    const day = this.date.getDay();
    this.description = `${
      this.type[0].toUpperCase() + this.type.substring(1)
    }  on ${month} ${day}`;
  }
}

class Running extends Workout {
  type = 'running';
  constructor(coords, distance, duration, cadence) {
    super(coords, distance, duration);
    this.cadence = cadence;
    this.calcPace();
    this._setDescription();
  }

  calcPace() {
    this.pace = this.duration / this.distance;
    return this.pace;
  }
}

class Cycling extends Workout {
  type = 'cycling';

  constructor(coords, distance, duration, elevationGain) {
    super(coords, distance, duration);
    this.elevationGain = elevationGain;
    this.calcSpeed();
    this._setDescription();
  }

  calcSpeed() {
    this.speed = this.distance / (this.duration / 60);
    return this.speed;
  }
}

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');
const delAllBtn = document.querySelector('.del_all_btn');
let delBtn;

class App {
  #workouts = [];
  #map;
  #mapEvent;

  constructor() {
    this._getPosition();

    this._getLocalStorage();

    form.addEventListener('submit', this._newWorkout.bind(this));

    inputType.addEventListener('change', function () {
      inputElevation
        .closest('.form__row')
        .classList.toggle('form__row--hidden');
      inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
    });

    containerWorkouts.addEventListener(
      'click',
      this._moveToPopupPos.bind(this)
    );

    containerWorkouts.addEventListener(
      'dblclick',
      this._editWorkout.bind(this)
    );

    containerWorkouts.addEventListener(
      'click',
      this._removeWorkoutFromLocalStorage.bind(this)
    );
  }

  _removeWorkoutFromLocalStorage(e) {
    e.stopPropagation();
    const workoutEl = e.target.closest('.workout'); //the pick workout
    const data = JSON.parse(localStorage.getItem('workouts')); // the local storage
    this.#workouts = data.find(work => work.id === workoutEl.dataset.id); // find the pick workout
    console.log(pickWorkout);

    //const data = this.#workouts.filter()

    //const data = JSON.parse(localStorage.getItem('workouts'));
    // data = data.filter(work => work.id!=)
  }

  _getPosition() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        this._loadMap.bind(this),
        function () {
          alert('cant get your location');
        }
      );
    }
  }

  _loadMap(position) {
    const { latitude } = position.coords;
    const { longitude } = position.coords;

    const coords = [latitude, longitude];

    this.#map = L.map('map').setView(coords, 13);
    L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    L.marker(coords)
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxWidth: 250,
          minWidth: 100,
          autoClose: false,
          closeOnClick: false,
          className: `running-popup`,
        })
      )
      .setPopupContent(`you are here`)
      .openPopup();

    this.#workouts.forEach(work => {
      this._rennderWorkoutMarker(work);
    });

    this.#map.on('click', this._showForm.bind(this));
  }

  _showForm(mapE) {
    this.#mapEvent = mapE;
    form.classList.remove('hidden');
    inputDistance.focus();
  }

  _hideForm() {
    inputDistance.value = '';
    inputDuration.value = '';
    inputCadence.value = '';
    setTimeout(() => (form.style.display = 'none'), 1000);
    form.classList.add('hidden');
    setTimeout(() => (form.style.display = 'grid'), 1000);
  }

  _newWorkout(e) {
    const validInputs = (...inputs) =>
      inputs.every(inp => Number.isFinite(inp));

    const ispositive = (...inputs) => inputs.every(inp => inp > 0);
    e.preventDefault();
    const type = inputType.value;
    const distance = +inputDistance.value;
    const duration = +inputDuration.value;
    const { lat, lng } = this.#mapEvent.latlng;
    let workout;

    if (type === 'running') {
      const cadence = +inputCadence.value;
      if (
        !validInputs(distance, duration, cadence) ||
        !ispositive(distance, duration, cadence)
      )
        return alert('input have to be positive numbers!');

      workout = new Running([lat, lng], distance, duration, cadence);
    }

    if (type === 'cycling') {
      const evaluation = +inputElevation.value;

      if (
        !validInputs(distance, duration, evaluation) ||
        !ispositive(distance, duration)
      )
        return alert('input have to be positive numbers!');

      workout = new Cycling([lat, lng], distance, duration, evaluation);
    }
    //push workout to workouts
    this.#workouts.push(workout);
    //render map for marker
    this._rennderWorkoutMarker(workout);
    //render workout list
    this._renderWorkout(workout);
    //hide form and clear inputs
    this._hideForm();
    //add workout to local storage
    this._addWorkoutToLocalStorage();
  }

  _rennderWorkoutMarker(workout) {
    this.#map.setView(workout.coords, 13);
    L.marker(workout.coords)
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxWidth: 250,
          minWidth: 100,
          autoClose: false,
          closeOnClick: false,
          className: `${workout.type}-popup`,
        })
      )
      .setPopupContent(`${workout.type}`)
      .openPopup();
  }

  _renderWorkout(workout) {
    let html = `
    <li class="workout workout--${workout.type}" data-id="${workout.id}"> 
    <h2 class="workout__title">${
      workout.description
    }<div class="del_btn">❌</div></h2>         

    <div class="workout__details">
      <span class="workout__icon">${
        workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'
      }</span>
      <span class="workout__value">${workout.distance}</span>
      <span class="workout__unit">km</span>
    </div>
    <div class="workout__details">
      <span class="workout__icon">⏱</span>
      <span class="workout__value">${workout.duration}</span>
      <span class="workout__unit">min</span>
    </div>`;

    if (workout.type === 'running') {
      html += `<div class="workout__details">
        <span class="workout__icon">⚡️</span>
        <span class="workout__value">${workout.pace.toFixed(1)}</span>
        <span class="workout__unit">min/km</span>
      </div>
      <div class="workout__details">
        <span class="workout__icon">🦶🏼</span>
        <span class="workout__value">${workout.cadence}</span>
        <span class="workout__unit">spm</span>
      </div>
    </li>`;
    }

    if (workout.type === 'cycling') {
      html += `<div class="workout__details">
        <span class="workout__icon">⚡️</span>
        <span class="workout__value">${workout.speed.toFixed(1)}</span>
        <span class="workout__unit">km/h</span>
      </div>
      <div class="workout__details">
        <span class="workout__icon">⛰</span>
        <span class="workout__value">${workout.elevationGain}</span>
        <span class="workout__unit">m</span>
      </div>
    </li> `;
    }

    form.insertAdjacentHTML('afterEnd', html);
    delBtn = document.querySelector('.del_btn');
    console.log(delBtn);
  }

  _moveToPopupPos(e) {
    console.log(delBtn);

    const workoutEl = e.target.closest('.workout');
    if (workoutEl) {
      const pickWorkout = this.#workouts.find(
        work => work.id === workoutEl.dataset.id
      );
      this.#map.setView(pickWorkout.coords, 13);
    }
  }

  _editWorkout(e) {
    const workoutEl = e.target.closest('.workout'); //the pick workout
    const data = JSON.parse(localStorage.getItem('workouts')); // the local storage
    const pickWorkout = data.find(work => work.id === workoutEl.dataset.id); // find the pick workout

    pickWorkout.distance = Number(window.prompt('new distance:', ''));
    pickWorkout.duration = Number(window.prompt('new duration:', ''));

    const dataNew = data.map(work =>
      work.id === pickWorkout.id ? pickWorkout : work
    );
    localStorage.clear();
    localStorage.setItem('workouts', JSON.stringify(dataNew));
    dataNew.forEach(work => {
      this._renderWorkout(work);
    });
    console.log(form);
    form.innerHTML = '';
    console.log(form);
  }

  _addWorkoutToLocalStorage() {
    localStorage.setItem('workouts', JSON.stringify(this.#workouts));
  }

  _getLocalStorage() {
    const data = JSON.parse(localStorage.getItem('workouts'));
    if (!data) return;
    this.#workouts = data;
    this.#workouts.forEach(work => {
      this._renderWorkout(work);
    });
  }
}

const app = new App();
