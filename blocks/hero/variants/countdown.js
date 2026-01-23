import { getMetadata } from '@scripts/aem.js';
import { getPlaceholderText, createElement, getBEMTemplateName } from '@scripts/common.js';

let intervalId = null;

function validateTimeDates(targetDate) {
  if (!targetDate) {
    console.warn('Countdown %cstart%c or %cend%c date is not defined.', 'color: red;', '', 'color: red;', '');
    return false;
  }

  const testDate = new Date(targetDate);

  if (Number.isNaN(testDate.getTime())) {
    console.warn('Countdown %cstart%c or %cend%c date is invalid.', 'color: red;', '', 'color: red;', '');
    return false;
  }

  return true;
}

function isCountdownFinished(targetDate) {
  const now = new Date();
  const diff = targetDate - now;
  return diff <= 0;
}

function updateCountdown({
  countdownArea, isFinished, startDate, endDate,
}) {
  const daysEl = countdownArea.querySelector('#days');
  const hoursEl = countdownArea.querySelector('#hours');
  const minutesEl = countdownArea.querySelector('#minutes');
  const secondsEl = countdownArea.querySelector('#seconds');
  const diffStartToEnd = (startDate && endDate) ? startDate - endDate : 0;

  if (isFinished || diffStartToEnd >= 0) {
    // countdown finished
    daysEl.textContent = '00';
    hoursEl.textContent = '00';
    minutesEl.textContent = '00';
    secondsEl.textContent = '00';
    clearInterval(intervalId);
    return;
  }

  const now = new Date();
  const diff = endDate - now;

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const seconds = Math.floor((diff / 1000) % 60);

  daysEl.textContent = days.toString().padStart(2, '0');
  hoursEl.textContent = hours.toString().padStart(2, '0');
  minutesEl.textContent = minutes.toString().padStart(2, '0');
  secondsEl.textContent = seconds.toString().padStart(2, '0');
}

export default function setCountdownToHero({ countdownArea, countdownClass }) {
  // Placeholder function for countdown hero decoration
  const labelText = getPlaceholderText({ key: 'countdown_label-text' });
  const daysText = getPlaceholderText({ key: 'countdown_days' });
  const hoursText = getPlaceholderText({ key: 'countdown_hours' });
  const minutesText = getPlaceholderText({ key: 'countdown_minutes' });
  const secondsText = getPlaceholderText({ key: 'countdown_seconds' });
  const startDateISO = getMetadata('countdown-start-date');
  const endDateISO = getMetadata('countdown-end-date');

  // validate dates
  if (!validateTimeDates(startDateISO) || !validateTimeDates(endDateISO)) {
    console.warn(
      'a Countdown date, or both, are invalid or not defined. %cCountdown will not be displayed.',
      'color: red;',
    );
    return;
  }

  const startDate = new Date(startDateISO);
  const endDate = new Date(endDateISO);
  const difference = endDate - startDate;

  if (difference < 0) {
    console.warn(
      'Countdown %cend%c date must be later than %cstart%c date. %cCountdown will not be displayed.',
      'color: red;',
      '',
      'color: red;',
      '',
      'color: red;',
    );
    return;
  }

  // create the countdown template
  const countdownTemplate = `
    <div class="${countdownClass}--label-title">${labelText}</div>
    <div class="${countdownClass}--segments">
      <div class="${countdownClass}--number-segment">
        <span id="days" class="${countdownClass}--number-value">99</span>
        <span class="${countdownClass}--number-label">${daysText}</span>
      </div>
      <div class="${countdownClass}--number-segment">
        <span id="hours" class="${countdownClass}--number-value">99</span>
        <span class="${countdownClass}--number-label">${hoursText}</span>
      </div>
      <div class="${countdownClass}--number-segment">
        <span id="minutes" class="${countdownClass}--number-value">99</span>
        <span class="${countdownClass}--number-label">${minutesText}</span>
      </div>
      <div class="${countdownClass}--number-segment">
        <span id="seconds" class="${countdownClass}--number-value">99</span>
        <span class="${countdownClass}--number-label">${secondsText}</span>
      </div>
    </div>
  `;

  const countdownFragment = createElement('div', {
    className: getBEMTemplateName({ variantClass: countdownClass, modifierName: 'container' }),
    fragment: countdownTemplate,
  });

  countdownArea.textContent = '';
  // countdownArea.appendChild(countdownFragment);
  const finishedStatus = isCountdownFinished(endDate);
  updateCountdown({
    countdownArea: countdownFragment, isFinished: finishedStatus, startDate, endDate,
  });
  countdownArea.appendChild(countdownFragment);
  intervalId = setInterval(() => {
    const isFinished = isCountdownFinished(endDate);
    updateCountdown({
      countdownArea: countdownFragment, isFinished, startDate, endDate,
    });
  }, 1000);
}
