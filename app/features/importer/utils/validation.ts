import type { Question } from '@/features/questions/types';

/**
 * Validates if a question meets the requirements for import
 * @param question The question to validate
 * @returns Object containing validation result and reason if invalid
 */
export const validateQuestion = (
    question: Question
): { isValid: boolean; reason?: string } => {
    // Check if question has exactly 4 answers
    if (!question.answers || question.answers.length !== 4) {
        return { isValid: false, reason: 'Question must have exactly 4 answers' };
    }

    // Check if question has exactly one correct answer
    const correctAnswers = question.answers.filter((answer) => answer.isCorrect);
    if (correctAnswers.length !== 1) {
        return {
            isValid: false,
            reason: 'Question must have exactly one correct answer',
        };
    }

    // Check if any answer label contains "x-ck12-mathEditor"
    if (
        question.answers.some((answer) =>
            answer.label.includes('x-ck12-mathEditor')
        )
    ) {
        return {
            isValid: false,
            reason: 'Answer label contains "x-ck12-mathEditor"',
        };
    }

    // Check if any answer label contains "x-ck12-mathjax"
    if (
        question.answers.some((answer) => answer.label.includes('x-ck12-mathjax'))
    ) {
        return {
            isValid: false,
            reason: 'Answer label contains "x-ck12-mathjax"',
        };
    }

    if (question.answers.some((answer) => answer.label.includes('{'))) {
        return {
            isValid: false,
            reason: 'Answer label contains "{"',
        };
    }

    if (question.answers.some((answer) => answer.label.includes('}'))) {
        return {
            isValid: false,
            reason: 'Answer label contains "}"',
        };
    }
    // Check if question contains "@@@"
    if (question.question.includes('@@@')) {
        return { isValid: false, reason: 'Question contains "@@@"' };
    }

    if (question.question.includes('{')) {
        return { isValid: false, reason: 'Question contains "{" ' };
    }

    if (question.question.includes('}')) {
        return { isValid: false, reason: 'Question contains "}" ' };
    }

    // Check if question contains "}@$"
    if (question.question.includes('}@$')) {
        return { isValid: false, reason: 'Question contains "}@$"' };
    }

    return { isValid: true };
}; 