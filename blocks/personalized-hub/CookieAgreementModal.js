const { createElement: h } = window.React;

export default function CookieAgreementModal({ onAgree, onClose }) {
  const isMobile = window.innerWidth < 900;

  const handleAgree = () => {
    sessionStorage.setItem('personalized-hub-consent', 'true');
    onAgree();
  };

  const handleClose = () => {
    if (onClose) onClose();
  };

  return h(
    'div',
    null,
    h(
      'div',
      { className: 'ph-cookie-modal' },
      [
        isMobile && h('div', { key: 'handle', className: 'ph-cookie-modal-handle' }),
        !isMobile && h(
          'button',
          {
            key: 'close',
            className: 'ph-cookie-modal-close',
            onClick: handleClose,
            'aria-label': 'Close',
          },
          h('img', {
            src: '/icons/arrow-down.svg',
            alt: 'Close',
            width: '15',
            height: '9',
          }),
        ),
        h(
          'div',
          { key: 'content', className: 'ph-cookie-content' },
          h(
            'div',
            { className: 'ph-cookie-text' },
            [
              h(
                'p',
                { key: 'p1' },
                [
                  'Before proceeding further, please read our ',
                  h(
                    'a',
                    {
                      key: 'terms',
                      href: '#',
                      onClick: (e) => e.preventDefault(),
                    },
                    'AI Terms & Conditions',
                  ),
                  ', ',
                  h(
                    'a',
                    {
                      key: 'privacy',
                      href: '#',
                      onClick: (e) => e.preventDefault(),
                    },
                    'Privacy Notice',
                  ),
                  ', and ',
                  h(
                    'a',
                    {
                      key: 'cookie',
                      href: '#',
                      onClick: (e) => e.preventDefault(),
                    },
                    'Cookie Statement',
                  ),
                  ' to better understand how we use your data.',
                ],
              ),
              h(
                'p',
                { key: 'p2' },
                'I have read and agree to the terms and conditions and I am over 16 years old.',
              ),
            ],
          ),
        ),
        h(
          'div',
          { key: 'buttons', className: 'ph-cookie-buttons' },
          h(
            'button',
            {
              className: 'ph-btn-agree',
              onClick: handleAgree,
            },
            'I agree',
          ),
        ),
      ],
    ),
  );
}
