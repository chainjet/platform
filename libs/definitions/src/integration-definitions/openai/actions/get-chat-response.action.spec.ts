import { GetChatResponseAction } from './get-chat-response.action'

describe('GetChatResponse', () => {
  describe('extractConversationMessages', () => {
    it('should transform previous messages into the OpenAI format', () => {
      const action = new GetChatResponseAction()
      expect(action.extractConversationMessages(`assistant: Hello`)).toEqual([{ role: 'assistant', content: 'Hello' }])
      expect(
        action.extractConversationMessages(`
          user: Hi there!
          assistant: Hello
        `),
      ).toEqual([
        { role: 'user', content: 'Hi there!' },
        { role: 'assistant', content: 'Hello' },
      ])

      // multiple lines
      expect(
        action.extractConversationMessages(`
          user: Hi there!
          It's a beautiful day!
          assistant: Hello.
          It is, isn't it?
        `),
      ).toEqual([
        { role: 'user', content: "Hi there!\nIt's a beautiful day!" },
        { role: 'assistant', content: "Hello.\nIt is, isn't it?" },
      ])

      // line with a colon
      expect(
        action.extractConversationMessages(`
          user: These are the things I have to do today: 1. Buy milk. 2. Buy eggs.
          assistant: I see, you have a busy day ahead of you.
        `),
      ).toEqual([
        { role: 'user', content: 'These are the things I have to do today: 1. Buy milk. 2. Buy eggs.' },
        { role: 'assistant', content: 'I see, you have a busy day ahead of you.' },
      ])
    })
  })
})
