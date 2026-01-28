import openPersonalizedHub from '@components/personalized-hub/personalized-hub.js';

export default function linkPersonalizedHubCTA(ctaButton) {
  if (!ctaButton) return;

  ctaButton.addEventListener('click', (e) => {
    e.preventDefault();
    openPersonalizedHub();
  });
}
