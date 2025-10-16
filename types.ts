export interface Question {
  id: string;
  subject: string;
  questionText: string;
}

export interface PracticeQuestion {
  id: string;
  questionText: string;
  answerText: string;
}

export interface KnowledgePoint {
  title: string;
  description: string;
  relevantQuestionIds: string[];
}

export interface ChatMessage {
  sender: 'user' | 'ai';
  text: string;
}
