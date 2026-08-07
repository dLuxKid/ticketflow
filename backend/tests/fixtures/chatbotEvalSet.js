/**
 * Held-out message -> expected-tool pairs for evaluating the chatbot's tool-selection
 * (scripts/eval-chatbot.js) - the "did the LLM pick the right tool" question, which is a
 * genuinely different axis from nlQueryEvalSet's exact-match accuracy (a rule-based
 * parser's structured output) and anomalyCases' precision/recall/F1 (a numeric classifier).
 * This is the one eval in the codebase that needs a real hosted LLM to mean anything - a
 * stubbed provider would just replay whatever this file hardcodes.
 *
 * `expectedTool: null` cases are chit-chat/greetings the model should answer directly,
 * without reaching for a tool it doesn't need - same "decline rather than guess" principle
 * nlQueryEvalSet's null cases test for the rule-based parser.
 */
export const CHATBOT_EVAL_SET = [
  // search_events
  { message: 'find music events in Lagos', expectedTool: 'search_events' },
  { message: 'what tech events are happening?', expectedTool: 'search_events' },
  { message: 'any sports events this weekend', expectedTool: 'search_events' },
  {
    message: 'show me events happening in Abuja',
    expectedTool: 'search_events',
  },
  {
    message: 'are there any comedy shows on TicketFlow',
    expectedTool: 'search_events',
  },
  {
    message: "I'm looking for something fun to do in Port Harcourt",
    expectedTool: 'search_events',
  },

  // get_event_details
  {
    message: 'what time does the afrobeats-night-2026 event start?',
    expectedTool: 'get_event_details',
  },
  {
    message: 'how much are tickets for the tech-summit-lagos event?',
    expectedTool: 'get_event_details',
  },
  {
    message: 'what is the refund policy for wedding-of-the-year',
    expectedTool: 'get_event_details',
  },
  {
    message: 'where is the venue for startup-mixer-2026',
    expectedTool: 'get_event_details',
  },
  {
    message: 'tell me more about the comedy-night-lekki event',
    expectedTool: 'get_event_details',
  },

  // answer_faq
  { message: 'how do I pay for my tickets?', expectedTool: 'answer_faq' },
  { message: "I haven't received my ticket yet", expectedTool: 'answer_faq' },
  { message: 'can I get a refund on my ticket?', expectedTool: 'answer_faq' },
  {
    message: 'how do I create an event on TicketFlow?',
    expectedTool: 'answer_faq',
  },
  {
    message: 'I used the wrong email when I bought my ticket, what do I do?',
    expectedTool: 'answer_faq',
  },
  { message: 'what payment methods do you accept', expectedTool: 'answer_faq' },

  // no tool - chit-chat / out of scope
  { message: 'hi there', expectedTool: null },
  { message: 'hello!', expectedTool: null },
  { message: 'thanks, that helped', expectedTool: null },
  { message: 'who won the world cup in 2022', expectedTool: null },
  { message: "what's the weather like today", expectedTool: null },
  { message: 'good morning', expectedTool: null },
];
