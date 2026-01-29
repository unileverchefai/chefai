const { createElement: h } = window.React;

export default function LoadingState({ businessData }) {
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
            [
              h('div', { key: 'step1', className: 'ph-loading-step' }, 'Analizing your menu'),
              h('div', { key: 'step2', className: 'ph-loading-step' }, 'Reading customer reviews'),
              h('div', { key: 'step3', className: 'ph-loading-step' }, 'Checking competitors in the area'),
            ],
          ),
        ],
      ),
    ],
  );
}
