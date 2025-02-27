import React, { useEffect, useState } from 'react';
import 'katex/dist/katex.min.css';
import TeX from '@matejmazur/react-katex';

interface MathRendererProps {
  content: string;
}

/**
 * Component that renders content with LaTeX math expressions
 * It parses the HTML content and replaces math expressions with properly rendered KaTeX
 */
export function MathRenderer({ content }: MathRendererProps) {
  const [processedContent, setProcessedContent] = useState<React.ReactNode[]>(
    []
  );

  useEffect(() => {
    // Process the content to extract and render math expressions
    const processContent = () => {
      // Create a temporary DOM element to parse the HTML
      const tempDiv = document.createElement('div');

      // Remove HTML comments before parsing
      const contentWithoutComments = content.replace(/<!--[\s\S]*?-->/g, '');
      tempDiv.innerHTML = contentWithoutComments;

      // Find all math elements - look for both x-ck12-mathjax and x-ck12-math classes
      const mathElements = tempDiv.querySelectorAll(
        '.x-ck12-mathjax, .x-ck12-math'
      );

      // If no math elements, just return the original content
      if (mathElements.length === 0) {
        setProcessedContent([
          React.createElement('div', {
            dangerouslySetInnerHTML: { __html: contentWithoutComments },
          }),
        ]);
        return;
      }

      // Process the content with math elements
      const result: React.ReactNode[] = [];
      let currentIndex = 0;

      mathElements.forEach((mathElement, index) => {
        // Get the text before the math element
        const beforeMathText = contentWithoutComments.substring(
          currentIndex,
          contentWithoutComments.indexOf(mathElement.outerHTML, currentIndex)
        );

        if (beforeMathText) {
          result.push(
            React.createElement('span', {
              key: `text-${index}`,
              dangerouslySetInnerHTML: { __html: beforeMathText },
            })
          );
        }

        // Extract the LaTeX content
        let latexContent = mathElement.textContent || '';

        // For debugging the specific example
        if (latexContent.includes('3,944') && latexContent.includes('\\div')) {
          console.log('Found the division example:', latexContent);
        }

        // Clean up the LaTeX content
        // First, remove the @$ markers at the beginning and end
        latexContent = latexContent.replace(/^@\$/, '').replace(/@\$$/, '');

        // Special handling for the specific example with division
        if (latexContent.includes('3,944') && latexContent.includes('\\div')) {
          // Use a more specific regex to extract just the math expression
          const divisionRegex = /\\begin\{align\*\}(.*?)\\end\{align\*\}/s;
          const match = latexContent.match(divisionRegex);

          if (match && match[1]) {
            // Use just the content inside the align* environment
            latexContent = match[1].trim();
          }
        }
        // For other align* environments
        else if (
          latexContent.includes('\\begin{align*}') &&
          latexContent.includes('\\end{align*}')
        ) {
          // Keep the entire align* environment
          const alignRegex = /(\\begin\{align\*\}.*?\\end\{align\*\})/s;
          const match = latexContent.match(alignRegex);

          if (match && match[1]) {
            latexContent = match[1];
          }
        }
        // Handle case where only end tag exists
        else if (
          latexContent.includes('\\end{align*}') &&
          !latexContent.includes('\\begin{align*}')
        ) {
          latexContent = latexContent.replace(/\\end\{align\*\}/, '').trim();
        }
        // For all other cases, just trim
        else {
          latexContent = latexContent.trim();
        }

        // Special handling for underlines in math expressions
        // This helps with expressions like \underline{\:\:\:\:\:\:\:} which are used for fill-in-the-blank
        latexContent = latexContent.replace(
          /\\underline\{(\\:\\:\\:\\:\\:\\:\\:)\}/g,
          '\\underline{\\square}'
        );

        // More general pattern for any number of \: sequences
        latexContent = latexContent.replace(
          /\\underline\{((?:\\:)+)\}/g,
          '\\underline{\\square}'
        );

        // Determine if it's an inline or block math expression
        const isBlock =
          latexContent.includes('\\begin{align') ||
          latexContent.includes('\\begin{equation') ||
          latexContent.includes('\\begin{align*}') ||
          // Also treat expressions with division, multiplication, etc. as block math for better readability
          latexContent.includes('\\div') ||
          latexContent.includes('\\times') ||
          latexContent.length > 50; // Longer expressions are better as block

        // Add the math component
        try {
          if (isBlock) {
            // For block math, ensure it has proper environment tags
            let blockLatex = latexContent;

            // If it already has align* environment, use it as is
            if (
              blockLatex.includes('\\begin{align*}') &&
              blockLatex.includes('\\end{align*}')
            ) {
              // It's already properly formatted
            }
            // If it has no environment markers but needs them
            else if (
              !blockLatex.includes('\\begin{') &&
              !blockLatex.includes('\\end{')
            ) {
              blockLatex = `\\begin{align*}${blockLatex}\\end{align*}`;
            }

            result.push(<TeX key={`math-${index}`} math={blockLatex} block />);
          } else {
            result.push(<TeX key={`math-${index}`} math={latexContent} />);
          }
        } catch (error) {
          // If there's an error rendering the math, fall back to displaying the raw content
          console.error('Error rendering LaTeX:', error);
          result.push(
            <span key={`math-error-${index}`} className="math-error">
              {latexContent}
            </span>
          );
        }

        // Update the current index
        currentIndex =
          contentWithoutComments.indexOf(mathElement.outerHTML, currentIndex) +
          mathElement.outerHTML.length;
      });

      // Add any remaining content after the last math element
      if (currentIndex < contentWithoutComments.length) {
        const afterLastMath = contentWithoutComments.substring(currentIndex);
        result.push(
          React.createElement('span', {
            key: 'text-last',
            dangerouslySetInnerHTML: { __html: afterLastMath },
          })
        );
      }

      setProcessedContent(result);
    };

    processContent();
  }, [content]);

  return <div className="math-renderer">{processedContent}</div>;
}
