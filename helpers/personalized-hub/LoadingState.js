const SENTENCE_BOUNDARY = /\.\s+|\n+/;

function splitSentences(text) {
  if (typeof text !== 'string' || !text.trim()) return [];
  return text.split(SENTENCE_BOUNDARY).map((s) => s.trim()).filter(Boolean);
}

export default function LoadingState({
  businessData,
  activeStep = 0,
  steps = [],
}) {
  const { createElement: h } = window.React;
  const logoUrl = businessData?.logo_url ?? businessData?.image_url ?? '';

  return h(
    'div',
    { className: 'ph-chat-container' },
    [
      h(
        'div',
        { key: 'content', className: 'ph-loading-container' },
        [
          h(
            'div',
            { key: 'rings', className: 'ph-loading-rings' },
            [
              h('div', { key: 'ring1', className: 'ph-loading-ring ph-loading-ring-1' }),
              h('div', { key: 'ring2', className: 'ph-loading-ring ph-loading-ring-2' }),
              h(
                'div',
                { key: 'logo', className: 'ph-loading-logo' },
                logoUrl ? h('img', {
                  src: logoUrl,
                  alt: businessData?.business_name ?? 'Business logo',
                  className: 'ph-loading-logo-img',
                }) : h(
                  'div',
                  {
                    className: 'ph-loading-logo-placeholder',
                  },
                  [
                    h('div', {
                      className: 'ph-loading-logo-text',
                    }, businessData?.business_name ?? 'Business'),
                  ],
                ),
              ),
            ],
          ),
          h(
            'div',
            { key: 'title', className: 'ph-loading-title' },
            'Creating your personalised insights',
          ),
          h(
            'div',
            { key: 'steps', className: 'ph-loading-steps' },
            steps.map((label, index) => {
              const stepNumber = index + 1;
              const isCompleted = activeStep >= stepNumber;
              const lines = splitSentences(label);

              return h(
                'div',
                {
                  key: `step-${stepNumber}`,
                  className: `ph-loading-step${isCompleted ? ' ph-loading-step--completed' : ' ph-loading-step--inactive'}`,
                },
                [
                  isCompleted && h(
                    'span',
                    {
                      key: 'icon',
                      className: 'ph-loading-step-icon',
                      'aria-hidden': 'true',
                    },
                    '✓',
                  ),
                  lines.length > 0
                    ? h(
                      'span',
                      { key: 'label', className: 'ph-loading-step-label' },
                      lines.length === 1
                        ? lines[0]
                        : lines.map((line, i) => h('span', { key: `l-${i}`, className: 'ph-loading-step-line' }, line)),
                    )
                    : h('span', { key: 'label', className: 'ph-loading-step-label' }, label),
                ],
              );
            }),
          ),
        ],
      ),
    ],
  );
}
