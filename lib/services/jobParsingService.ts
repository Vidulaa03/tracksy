import { parseJobDescription } from './groqService';

export async function parseAndStoreJobData(jobDescription: string) {
  try {
    const parsedData = await parseJobDescription(jobDescription);
    return parsedData;
  } catch (error) {
    console.error('Error in job parsing service:', error);
    // Return sensible defaults on error
    return {
      keyRequirements: [],
      skills: [],
      experience: 'Not specified',
      salaryRange: 'Not specified',
    };
  }
}
