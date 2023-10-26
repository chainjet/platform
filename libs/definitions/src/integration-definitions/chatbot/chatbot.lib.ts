export const ChatbotLib = {
  getStaticUserIntent(message: string, intents: string[]): string | null {
    let intent = intents.find((intent) => intent === message)
    if (!intent) {
      const greetingIntent = intents.find((intent) => ['greeting', 'general greeting'].includes(intent))
      if (greetingIntent) {
        const greeting = [
          'hi',
          'hello',
          'hey',
          'howdy',
          'greetings',
          'good morning',
          'good afternoon',
          'good evening',
          'gm',
          '👋',
        ]
        if (greeting.includes(message.replace(/!/, '').trim())) {
          intent = greetingIntent
        }
      }
    }
    return intent ?? null
  },
}
