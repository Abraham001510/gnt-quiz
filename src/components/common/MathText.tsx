import React from 'react';
import katex from 'katex';
// @ts-ignore -- KaTeX CSS is handled by the app's bundler.
import 'katex/dist/katex.min.css';

interface MathTextProps {
  text: string;
  className?: string;
}

export const MathText: React.FC<MathTextProps> = ({ text, className = '' }) => {
  if (!text) return null;

  // Split text by LaTeX delimiters \( ... \) or $ ... $
  const regex = /(\\\([\s\S]*?\\\)|\\\[[\s\S]*?\\\]|\$[\s\S]*?\$)/g;
  const parts = text.split(regex);

  return (
    <span className={className}>
      {parts.map((part, index) => {
        if (!part) return null;

        const isInline = part.startsWith('\\(') || (part.startsWith('$') && !part.startsWith('$$'));
        const isBlock = part.startsWith('\\[') || part.startsWith('$$');

        if (isInline || isBlock) {
          let math = part;
          if (part.startsWith('\\(')) math = part.slice(2, -2);
          else if (part.startsWith('\\[')) math = part.slice(2, -2);
          else if (part.startsWith('$$')) math = part.slice(2, -2);
          else if (part.startsWith('$')) math = part.slice(1, -1);

          try {
            const html = katex.renderToString(math.trim(), {
              displayMode: isBlock,
              throwOnError: false,
            });

            return (
              <span
                key={index}
                dangerouslySetInnerHTML={{ __html: html }}
                className="inline-block mx-0.5 align-middle text-emerald-300 font-semibold"
              />
            );
          } catch (e) {
            return <span key={index}>{part}</span>;
          }
        }

        return <span key={index}>{part}</span>;
      })}
    </span>
  );
};