const SENTENCE_BOUNDARY = /\.\s+|\n+/;
const PHRASE_BOUNDARY = /\s+(?=[A-Z])/;
const BUSINESS_NAME_PLACEHOLDER = '\u200B\u200B\u200B';

function escapeForRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function splitIntoLines(text, businessName) {
  if (typeof text !== 'string' || !text.trim()) return [];
  let normalized = text;
  if (typeof businessName === 'string' && businessName.trim()) {
    const nameRegex = new RegExp(escapeForRegex(businessName.trim()), 'gi');
    normalized = text.replace(nameRegex, BUSINESS_NAME_PLACEHOLDER);
  }
  const beforePlaceholder = `\\s+(?=${escapeForRegex(BUSINESS_NAME_PLACEHOLDER)})`;
  const splitPattern = new RegExp(`(${PHRASE_BOUNDARY.source})|(${beforePlaceholder})`);
  const bySentence = normalized.split(SENTENCE_BOUNDARY).map((s) => (s ?? '').trim()).filter(Boolean);
  const lines = bySentence.flatMap((s) => (s ?? '').split(splitPattern).map((p) => (p ?? '').trim()).filter(Boolean));
  return lines;
}

function renderLine(line, businessName) {
  const safeLine = typeof line === 'string' ? line : '';
  const display = typeof businessName === 'string' && businessName.trim()
    ? safeLine.replace(BUSINESS_NAME_PLACEHOLDER, businessName.trim())
    : safeLine;
  return display;
}

export default function LoadingState({
  businessData,
  activeStep = 0,
  steps = [],
}) {
  const { createElement: h } = window.React;
  const logoUrl = businessData?.logo_url ?? businessData?.image_url ?? '';
  const businessName = businessData?.business_name ?? '';

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
              const stepLabel = label ?? '';
              const lines = splitIntoLines(stepLabel, businessName);

              return h(
                'div',
                {
                  key: `step-${stepNumber}`,
                  className: `ph-loading-step${isCompleted ? ' ph-loading-step--completed' : ' ph-loading-step--inactive'}`,
                },
                lines.length > 0
                  ? h(
                    'span',
                    { key: 'label', className: 'ph-loading-step-label' },
                    lines.length === 1
                      ? renderLine(lines[0], businessName)
                      : lines.map((line, i) => h('span', { key: `l-${i}`, className: 'ph-loading-step-line' }, renderLine(line, businessName))),
                  )
                  : h('span', { key: 'label', className: 'ph-loading-step-label' }, stepLabel),
              );
            }),
          ),
        ],
      ),
    ],
  );
}
