const { createElement: h } = window.React;

export default function CookieAgreementModal({ onAgree, onClose }) {
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
