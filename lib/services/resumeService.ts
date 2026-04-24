import { getResumeSuggestions } from './groqService';

export async function generateResumeSuggestions(
  resumeContent: string,
  jobDescription: string
) {
  try {
    const suggestions = await getResumeSuggestions(resumeContent, jobDescription);
    return suggestions;
  } catch (error) {
    console.error('Error in resume service:', error);
    // Return sensible defaults on error
    return {
      keySkills: [],
      recommendedChanges: [
        'Review the job description carefully',
        'Highlight relevant experience and skills',
        'Use keywords from the job posting',
      ],
      strengthAreas: [],
    };
  }
}
