const { createElement: h } = window.React;

export default function WelcomeScreen({ onGotIt }) {
  return h(
    'div',
    { className: 'ph-chat-container' },
    [
      h(
        'div',
        { key: 'content', className: 'ph-welcome-container' },
        [
          h(
            'h1',
            { key: 'title', className: 'ph-welcome-title' },
            'Welcome to your personalised hub!',
          ),
          h(
            'p',
            { key: 'paragraph1', className: 'ph-welcome-text' },
            [
              'Transform ',
              h('span', { key: 'highlight', className: 'ph-welcome-highlight' }, 'Global Future Trends'),
              ' into actions that boost profits, refresh menus and delight customers.',
            ],
          ),
          h(
            'p',
            { key: 'paragraph2', className: 'ph-welcome-text' },
            [
              'Select any of the ',
              h('strong', { key: 'insights' }, 'insights'),
              ' to get details or start a ',
              h('strong', { key: 'conversation' }, 'conversation'),
              ' with your assistant at the bottom of the screen.',
            ],
          ),
          h(
            'button',
            {
              key: 'got-it',
              className: 'ph-welcome-button',
              onClick: onGotIt,
            },
            'Okay, got it',
          ),
        ],
      ),
    ],
  );
}
