import React, { useEffect, useRef } from 'react';

declare global {
  interface Window {
    renderMathInElement?: (element: HTMLElement, options: any) => void;
  }
}

interface ContentRendererProps {
  content: string;
}

const ContentRenderer: React.FC<ContentRendererProps> = ({ content }) => {
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (contentRef.current && window.renderMathInElement) {
      window.renderMathInElement(contentRef.current, {
        delimiters: [
          { left: '$$', right: '$$', display: true },
          { left: '$', right: '$', display: false },
        ],
        throwOnError: false,
      });
    }
  }, [content]);

  return <div ref={contentRef} className="whitespace-pre-wrap leading-relaxed">{content}</div>;
};

export default ContentRenderer;
