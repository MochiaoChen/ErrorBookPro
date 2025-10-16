import React, { useState } from 'react';
import type { PracticeQuestion } from '../types';
import { Eye, EyeOff } from './Icons';
import ContentRenderer from './ContentRenderer';

interface PracticeTestProps {
  questions: PracticeQuestion[];
}

const PracticeTest: React.FC<PracticeTestProps> = ({ questions }) => {
  const [visibleAnswers, setVisibleAnswers] = useState<Record<string, boolean>>({});

  const toggleAnswer = (id: string) => {
    setVisibleAnswers(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6 text-gray-800">巩固练习</h2>
      <div className="space-y-6">
        {questions.map((q, index) => (
          <div key={q.id} className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
            <p className="font-semibold text-gray-600 mb-3">第 {index + 1} 题</p>
            <div className="text-gray-800">
                <ContentRenderer content={q.questionText} />
            </div>
            
            <div className="mt-4">
              <button onClick={() => toggleAnswer(q.id)} className="flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-800 transition">
                {visibleAnswers[q.id] ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
                {visibleAnswers[q.id] ? '隐藏答案' : '查看详解'}
              </button>
            </div>
            
            {visibleAnswers[q.id] && (
              <div className="mt-4 p-4 bg-green-50 border-l-4 border-green-500 rounded-r-lg">
                <p className="font-semibold text-green-800 mb-2">详解：</p>
                <div className="text-green-900">
                    <ContentRenderer content={q.answerText} />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default PracticeTest;
