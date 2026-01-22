const { createElement: h } = window.React;

export default function BusinessConfirmation({
  businessData,
  onConfirm,
  onReject,
  onClose,
}) {
  const businessName = businessData?.business_name ?? 'Unknown Business';
  const address = businessData?.address ?? '';
  const imageUrl = businessData?.image_url ?? '';
  const logoUrl = businessData?.logo_url ?? '';

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
              'Thanks! I\'ve found this business based on the business name ',
              h('strong', { key: 'name' }, businessName),
              '. Could you please confirm this is correct?',
            ],
          ),
          h(
            'div',
            { key: 'business-card', className: 'ph-business-card' },
            [
              imageUrl && h(
                'div',
                { key: 'image-container', className: 'ph-business-image-container' },
                h('img', {
                  src: imageUrl,
                  alt: businessName,
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
                    alt: `${businessName} logo`,
                    className: 'ph-business-logo',
                  }),
                  h(
                    'div',
                    { key: 'details', className: 'ph-business-details' },
                    [
                      h(
                        'div',
                        { key: 'name', className: 'ph-business-name' },
                        businessName,
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
