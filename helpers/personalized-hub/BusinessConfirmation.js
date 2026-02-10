import { initCarouselCards } from '../../blocks/carousel-cards/carousel-cards.js';

const {
  createElement: h,
  useEffect,
  useRef,
} = window.React;

export default function BusinessConfirmation({
  businessData,
  businesses,
  onSelectBusiness,
  onConfirm,
  onReject,
}) {
  let candidates = [];
  if (Array.isArray(businesses) && businesses.length > 0) {
    candidates = businesses;
  } else if (businessData) {
    candidates = [businessData];
  }

  const selectedName = businessData?.business_name ?? 'Unknown Business';

  const carouselBlockRef = useRef(null);
  const carouselContainerRef = useRef(null);

  useEffect(() => {
    const blockEl = carouselBlockRef.current;
    const containerEl = carouselContainerRef.current;

    if (!blockEl || !containerEl || !Array.isArray(candidates) || candidates.length === 0) {
      return undefined;
    }

    let carouselInstance;

    try {
      carouselInstance = initCarouselCards(blockEl, containerEl, candidates.length, {
        disableDesktopCarousel: false,
        swipeOnDesktop: true,
        hideArrows: false,
        disableSnap: true,
      });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to initialize business carousel:', error);
    }

    return () => {
      if (carouselInstance && typeof carouselInstance.destroy === 'function') {
        carouselInstance.destroy();
      }
    };
  }, [candidates.length]);

  const renderCard = (business, idx) => {
    const name = business.business_name ?? 'Unknown Business';
    const address = business.address ?? '';
    const imageUrl = business.image_url ?? '';
    const logoUrl = business.logo_url ?? '';
    const placeId = business.place_id ?? '';
    const isSelected = name === selectedName;

    return h(
      'li',
      {
        key: `business-${idx}`,
        className: `card chatbot-carousel-card${isSelected ? ' ph-business-card--selected' : ''}`,
        'data-place-id': placeId,
        onClick: () => {
          if (onSelectBusiness) {
            onSelectBusiness(business);
          }
        },
      },
      [
        imageUrl && h(
          'div',
          { key: 'image-container', className: 'ph-business-image-container' },
          h('img', {
            src: imageUrl,
            alt: name,
            className: 'ph-business-image',
          }),
        ),
        h(
          'div',
          { key: 'info', className: 'ph-business-info' },
          [
            logoUrl && h('img', {
              key: 'logo',
              src: logoUrl,
              alt: `${name} logo`,
              className: 'ph-business-logo',
            }),
            h(
              'div',
              { key: 'details', className: 'ph-business-details' },
              [
                h(
                  'div',
                  { key: 'name', className: 'ph-business-name' },
                  name,
                ),
                address && h(
                  'div',
                  { key: 'address', className: 'ph-business-address' },
                  address,
                ),
              ],
            ),
          ],
        ),
      ],
    );
  };

  return h(
    'div',
    { className: 'ph-chat-container' },
    [
      h(
        'div',
        { key: 'messages', className: 'ph-chat-messages' },
        [
          h(
            'div',
            { key: 'confirmation-text', className: 'ph-system-message' },
            [
              'Thanks! I\'ve found these businesses based on the business name you entered. ',
              'Could you please confirm which one is correct?',
            ],
          ),
          h(
            'div',
            {
              key: 'carousel',
              className: 'carousel-cards chatbot-carousel',
              ref: carouselBlockRef,
            },
            [
              h(
                'ul',
                {
                  className: 'carousel-cards-container',
                  ref: carouselContainerRef,
                },
                candidates.map(renderCard),
              ),
            ],
          ),
        ],
      ),
      h(
        'div',
        { key: 'buttons', className: 'ph-confirmation-buttons' },
        [
          h(
            'button',
            {
              key: 'confirm',
              className: 'ph-btn-primary',
              onClick: onConfirm,
              disabled: !businessData,
            },
            'Yes, it\'s correct',
          ),
          h(
            'button',
            {
              key: 'reject',
              className: 'ph-btn-secondary',
              onClick: onReject,
            },
            'No, it\'s wrong',
          ),
        ],
      ),
    ],
  );
}
