
import React from 'react';
import type { Question } from '../types';
import { Trash2 } from './Icons';

interface QuestionListProps {
  questions: Question[];
  onDelete?: (id: string) => void;
}

const QuestionList: React.FC<QuestionListProps> = ({ questions, onDelete }) => {
  return (
    <div className="space-y-4">
      {questions.map((q, index) => (
        <div key={q.id} className="bg-slate-50 border border-slate-200 rounded-lg p-4 shadow-sm transition-shadow hover:shadow-md">
          <div className="flex justify-between items-start">
            <div className="flex-grow">
                <div className="flex items-center mb-2">
                    <span className="text-sm font-semibold bg-indigo-100 text-indigo-800 py-1 px-3 rounded-full mr-3">{q.subject}</span>
                    <p className="text-gray-500 font-medium">题目 {index + 1}</p>
                </div>
                <p className="text-gray-800 whitespace-pre-wrap">{q.questionText}</p>
            </div>
            {onDelete && (
              <button 
                onClick={() => onDelete(q.id)} 
                className="ml-4 p-2 text-gray-400 hover:text-red-600 hover:bg-red-100 rounded-full transition-colors duration-200"
                aria-label="删除题目"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default QuestionList;
