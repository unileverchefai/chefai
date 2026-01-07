/**
 * Simplified Chat Widget for Testing
 */

import chefAiService from './services/chefAiService.js';

export default function ChatWidget() {
  const { React } = window;
  const { useState } = React;
  const [messages, setMessages] = useState([{
    _id: '1',
    text: '👋 Hello! I\'m your Chef AI assistant. Ask me anything about recipes, menu planning, or culinary trends!',
    createdAt: new Date(),
    user: { _id: 2, name: 'Chef AI' },
  }]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!inputValue.trim() || isLoading) return;

    const userMsg = {
      _id: Date.now().toString(),
      text: inputValue,
      createdAt: new Date(),
      user: { _id: 1, name: 'You' },
    };

    setMessages([...messages, userMsg]);
    const savedInput = inputValue;
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await chefAiService.sendMessage(savedInput);
      setMessages((prev) => [...prev, response]);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('API error:', err);
      setMessages((prev) => [...prev, {
        _id: Date.now().toString(),
        text: '❌ Sorry, something went wrong. Please try again.',
        createdAt: new Date(),
        user: { _id: 2, name: 'Chef AI' },
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return React.createElement(
    'div',
    { className: 'chat-widget' },
    // Header
    React.createElement(
      'div',
      { className: 'chat-header' },
      React.createElement('h3', null, '🧑‍🍳 Chef AI Assistant'),
      React.createElement('p', { className: 'chat-subtitle' }, 'Your culinary companion'),
    ),
    // Messages
    React.createElement(
      'div',
      { className: 'chat-messages' },
      messages.map((msg) => React.createElement(
        'div',
        {
          key: msg._id,
          className: `chat-message ${msg.user._id === 1 ? 'user-message' : 'bot-message'}`,
        },
        React.createElement(
          'div',
          { className: 'message-content' },
          React.createElement('strong', { className: 'message-sender' }, msg.user.name),
          React.createElement('p', { className: 'message-text' }, msg.text),
          msg.metadata?.mock && React.createElement('span', { className: 'mock-badge' }, '🔄 Mock Mode'),
        ),
      )),
    ),
    // Input form
    React.createElement(
      'form',
      {
        onSubmit: handleSubmit,
        className: 'chat-input-form',
      },
      React.createElement('input', {
        type: 'text',
        value: inputValue,
        onChange: (e) => setInputValue(e.target.value),
        placeholder: 'Ask Chef AI anything...',
        className: 'chat-input',
        disabled: isLoading,
      }),
      React.createElement('button', {
        type: 'submit',
        className: 'chat-submit',
        disabled: isLoading || !inputValue.trim(),
      }, isLoading ? '⏳' : '📤'),
    ),
  );
}
