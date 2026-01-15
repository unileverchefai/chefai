const { createElement: h } = window.React;

export default function ChatInput({
  value,
  onChange,
  onSubmit,
  placeholder = 'Type your message here...',
  disabled = false,
  submitDisabled = false,
}) {
  const handleSubmit = (e) => {
    e.preventDefault();
    if (onSubmit && !submitDisabled) {
      onSubmit();
    }
  };

  return h(
    'form',
    {
      className: 'chat-input-form',
      onSubmit: handleSubmit,
    },
    h(
      'div',
      { className: 'chat-input-wrapper' },
      [
        h('input', {
          key: 'input',
          type: 'text',
          value,
          onChange: (e) => onChange(e.target.value),
          placeholder,
          className: 'chat-input',
          disabled,
        }),
        h(
          'button',
          {
            key: 'submit',
            type: 'submit',
            className: 'chat-submit-btn',
            disabled: submitDisabled,
            'aria-label': 'Submit',
          },
          h('img', {
            src: '/icons/arrow_right.svg',
            alt: 'Submit',
            className: 'chat-submit-icon',
          }),
        ),
      ],
    ),
  );
}
