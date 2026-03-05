export default function SuggestedPrompts({ prompts, onPromptClick, disabled = false }) {
  const { createElement: h } = window.React;
  if (!prompts || !Array.isArray(prompts) || prompts.length === 0) {
    return null;
  }

  return h(
    'div',
    {
      className: 'ph-predefined-questions',
      style: {
        marginTop: '12px',
      },
    },
    prompts.map((prompt, idx) => h(
      'button',
      {
        key: `prompt-${idx}`,
        className: 'chatbot-question-btn',
        onClick: () => {
          if (onPromptClick && !disabled) {
            onPromptClick(prompt);
          }
        },
        disabled,
        type: 'button',
      },
      prompt,
    )),
  );
}
