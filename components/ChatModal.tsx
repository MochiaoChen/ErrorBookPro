import React, { useState, useRef, useEffect } from 'react';
import type { Question, ChatMessage } from '../types';
import ContentRenderer from './ContentRenderer';
import { X, Send } from './Icons';

interface ChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  question: Question | null;
  chatHistory: ChatMessage[];
  onSendMessage: (message: string) => void;
  isLoading: boolean;
}

const ChatModal: React.FC<ChatModalProps> = ({ isOpen, onClose, question, chatHistory, onSendMessage, isLoading }) => {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if(isOpen) {
        setTimeout(scrollToBottom, 100);
    }
  }, [chatHistory, isOpen]);

  const handleSend = () => {
    if (input.trim()) {
      onSendMessage(input.trim());
      setInput('');
    }
  };

  if (!isOpen || !question) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4 transition-opacity duration-300">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b flex justify-between items-start gap-4">
          <div className="flex-grow">
            <h2 className="text-lg font-bold text-gray-800">错题精讲</h2>
            <div className="text-sm text-gray-600 mt-1 p-2 bg-slate-50 rounded-md max-h-28 overflow-y-auto">
              <ContentRenderer content={question.questionText} />
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-full shrink-0">
            <X />
          </button>
        </div>

        {/* Chat History */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {chatHistory.map((msg, index) => (
            <div key={index} className={`flex items-end gap-2 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-xl p-3 rounded-xl ${msg.sender === 'user' ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-800'}`}>
                <ContentRenderer content={msg.text} />
              </div>
            </div>
          ))}
          {isLoading && chatHistory.length > 0 && chatHistory[chatHistory.length - 1].sender === 'user' && (
            <div className="flex justify-start">
              <div className="max-w-md p-3 rounded-xl bg-gray-200 text-gray-800">
                <div className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-pulse delay-75"></span>
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-pulse delay-150"></span>
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-pulse delay-300"></span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t bg-slate-50 rounded-b-2xl">
          <div className="flex items-center gap-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="在这里输入你的问题..."
              className="flex-1 p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none resize-none"
              rows={2}
              disabled={isLoading}
            />
            <button onClick={handleSend} disabled={isLoading} className="p-3 bg-indigo-600 text-white rounded-lg disabled:bg-indigo-300 hover:bg-indigo-700 transition self-stretch flex items-center">
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatModal;
