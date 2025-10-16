
import React from 'react';

// A simple markdown-to-HTML parser for this specific use case.
const SimpleMarkdown: React.FC<{ text: string }> = ({ text }) => {
  const lines = text.split('\n');
  const elements = lines.map((line, index) => {
    if (line.startsWith('### ')) {
      return <h3 key={index} className="text-lg font-semibold mt-4 mb-2 text-gray-700">{line.substring(4)}</h3>;
    }
    if (line.startsWith('## ')) {
      return <h2 key={index} className="text-xl font-bold mt-6 mb-3 text-gray-800 border-b pb-1">{line.substring(3)}</h2>;
    }
    if (line.startsWith('# ')) {
      return <h1 key={index} className="text-2xl font-bold mt-8 mb-4 text-indigo-700">{line.substring(2)}</h1>;
    }
    if (line.startsWith('* ') || line.startsWith('- ')) {
      const formattedLine = line.substring(2).replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-gray-900">$1</strong>');
      return <li key={index} className="ml-5 list-disc" dangerouslySetInnerHTML={{ __html: formattedLine }} />;
    }
    if (line.trim() === '') {
        return <br key={index} />;
    }
    const formattedLine = line.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-gray-900">$1</strong>');
    return <p key={index} className="mb-2 text-gray-600 leading-relaxed" dangerouslySetInnerHTML={{ __html: formattedLine }} />;
  });

  return <>{elements}</>;
};

interface AnalysisDisplayProps {
  analysis: string;
}

const AnalysisDisplay: React.FC<AnalysisDisplayProps> = ({ analysis }) => {
  return (
    <div className="bg-white p-6 rounded-lg border">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">知识点分析与复习提纲</h2>
      <div className="prose max-w-none text-gray-700">
          <SimpleMarkdown text={analysis} />
      </div>
    </div>
  );
};

export default AnalysisDisplay;
