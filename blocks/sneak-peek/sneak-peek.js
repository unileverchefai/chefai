import { fetchBusinessInfo, fetchSneakPeek } from './fetchSneakPeek.js';
import openSignInModal from '@components/signin/index.js';
import { createElement } from '@scripts/common.js';

// create customHeader for sneak peek page. This should be a variant of the main header (future improvements)
const decorateCustomHeader = (navbar) => {
    const logo = createElement('div', {
        className: 'sneakpeek--logo-wrapper',
        innerContent: `
            <div class="sneakpeek--logo-text"></div>
            <div class="sneakpeek--logo-number"></div>
        `,
    });

    const signInButton = createElement('button', {
        className: 'nav-signin-button',
        attributes: {
        type: 'button',
        'aria-label': 'Sign in',
        },
    });

    signInButton.textContent = 'Sign in';

    signInButton.addEventListener('click', () => {
        openSignInModal();
    });

    navbar.appendChild(logo);
    navbar.appendChild(signInButton);
}

export default async function decorate(block) {
    const root = block.querySelector(':scope > div');

    const recommendationP = root.querySelector('div > p:first-of-type');

    //Fetch sneak peek insightData api
    const insightData = await fetchSneakPeek();
    console.log(insightData);

    const businessInfo = await fetchBusinessInfo();
    console.log(businessInfo);

    // Navbar
    const navbar = createElement('nav', { className: 'navbar' });
    decorateCustomHeader(navbar)
    //block.appendChild(navbar);

    // upper block containing business info and recommendation
    const upperBlock = createElement('div', { className: 'upper-block' });
    const businessBlock = createElement('div', { className: 'business-block' });
    upperBlock.appendChild(navbar);
    upperBlock.appendChild(businessBlock);

    // lower block containing insight preview
    const lowerBlock = createElement('div', { className: 'lower-block' });
    const insightBlock = createElement('div', { className: 'insight-block' });
    lowerBlock.appendChild(insightBlock);

    // TODO: Create three cards for the sneak peek insights
    for (let i = 0; i < 3; i++) {
        const card = createElement('div', { className: `insight-card fp-card--${i === 0 ? 'left' : i === 1 ? 'center' : 'right'}` });
        card.innerHTML = `
            <div class="insight-card-content">
                <h3>Title</h3>
                <p>Lorum ipsum dolor sit amet, consectetur adipiscing elit.</p>
            </div>
        `;
        insightBlock.appendChild(card);
    }

    // CTA
    const ctaBlock = createElement('div', { className: 'cta-block' });
    root.querySelector('div').querySelectorAll('p').forEach((el, index) => {
        if(index !== 0){
            ctaBlock.appendChild(el);
        }
    });

    const logo = createElement('img');
    logo.src = businessInfo.image_url;
    logo.alt = businessInfo.name;
    businessBlock.appendChild(logo);

    const title = createElement('h2');
    title.textContent = businessInfo.name;
    businessBlock.appendChild(title);

    const arrowLogo = createElement('img', { className: 'sneak-peek-arrow-logo' });
    arrowLogo.src = "/blocks/sneak-peek/mock-images/arrows.svg";
    businessBlock.appendChild(arrowLogo);
    businessBlock.appendChild(recommendationP);

    // Replace block content
    block.replaceChildren(upperBlock, lowerBlock, ctaBlock);

    //Remove footer
    const footer = document.getElementsByTagName('footer')[0];
    footer.remove();

    //Remove footer
    const header = document.getElementsByTagName('header')[0];
    header.remove();
}