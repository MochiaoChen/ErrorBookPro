import React from 'react';
import type { KnowledgePoint, Question } from '../types';
import ContentRenderer from './ContentRenderer';
import { Zap } from './Icons';

interface AnalysisDisplayProps {
  analysis: KnowledgePoint[];
  questions: Question[];
}

const AnalysisDisplay: React.FC<AnalysisDisplayProps> = ({ analysis, questions }) => {
  const getQuestionById = (id: string) => questions.find(q => q.id === id);

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6 text-gray-800">知识点分析报告</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {analysis.map((point, index) => (
          <div key={index} className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm hover:shadow-lg hover:border-indigo-300 transition-all duration-300">
            <h3 className="text-lg font-bold text-indigo-700 mb-2 flex items-center gap-2">
              <Zap className="w-5 h-5 text-indigo-500"/>
              {point.title}
            </h3>
            <div className="text-gray-600 mb-4 text-sm">
              <ContentRenderer content={point.description} />
            </div>
            
            {point.relevantQuestionIds.length > 0 && (
              <div>
                <h4 className="font-semibold text-gray-700 mb-2 text-sm">相关错题：</h4>
                <div className="space-y-2">
                  {point.relevantQuestionIds.map(qId => {
                    const question = getQuestionById(qId);
                    return question ? (
                      <div key={qId} className="text-xs p-2 bg-gray-50 rounded-md border text-gray-500 truncate">
                         <strong>[{question.subject}]</strong> {question.questionText.substring(0, 50)}...
                      </div>
                    ) : null;
                  })}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default AnalysisDisplay;
