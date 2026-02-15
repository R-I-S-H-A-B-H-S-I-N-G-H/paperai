// import { GoogleGenAI, Type } from "@google/genai";
import { FileData, PaperConfig, QuestionPaper, QuestionType } from "../types";

// export const generateQuestionPaper = async (
//   files: FileData[],
//   config: PaperConfig
// ): Promise<QuestionPaper> => {
//   const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

//   const fileParts = files.map(file => ({
//     inlineData: {
//       data: file.base64,
//       mimeType: file.type
//     }
//   }));

//   const prompt = `
//     As an expert academic examiner, create a professional question paper based ON ONLY the provided source materials.

//     Target Grade: ${config.grade}
//     Subject: ${config.subject}
//     Difficulty: ${config.difficulty}
//     Target Language: ${config.language}

//     CRITICAL REQUIREMENT: The entire output (Title, Instructions, Questions, Options, Answers, and Explanations) MUST be written in ${config.language}.

//     Structure the paper into distinct sections:
//     1. Section A: Multiple Choice Questions (${config.numMcq} questions)
//     2. Section B: True/False Questions (${config.numTf} questions)
//     3. Section C: Short Answer Questions (${config.numShort} questions)
//     4. Section D: Long Answer Questions (${config.numLong} questions)

//     Guidelines:
//     - Distribute marks logically: MCQ (1 mark), T/F (1 mark), Short (3-5 marks), Long (8-10 marks).
//     - Ensure questions range from factual recall to critical thinking according to the "${config.difficulty}" difficulty.
//     - Include clear instructions and a professional academic title.
//     - Ensure the output is strictly based on the provided source material.
//   `;

//   const response = await ai.models.generateContent({
//     model: "gemini-3-pro-preview",
//     contents: {
//       parts: [
//         ...fileParts,
//         { text: prompt }
//       ]
//     },
//     config: {
//       responseMimeType: "application/json",
//       responseSchema: {
//         type: Type.OBJECT,
//         properties: {
//           title: { type: Type.STRING },
//           grade: { type: Type.STRING },
//           subject: { type: Type.STRING },
//           language: { type: Type.STRING },
//           durationMinutes: { type: Type.NUMBER },
//           totalMarks: { type: Type.NUMBER },
//           instructions: {
//             type: Type.ARRAY,
//             items: { type: Type.STRING }
//           },
//           questions: {
//             type: Type.ARRAY,
//             items: {
//               type: Type.OBJECT,
//               properties: {
//                 id: { type: Type.STRING },
//                 type: {
//                   type: Type.STRING,
//                   description: "One of: MCQ, TRUE_FALSE, SHORT_ANSWER, LONG_ANSWER"
//                 },
//                 text: { type: Type.STRING },
//                 options: {
//                   type: Type.ARRAY,
//                   items: { type: Type.STRING },
//                   description: "Required for MCQ only"
//                 },
//                 correctAnswer: { type: Type.STRING },
//                 explanation: { type: Type.STRING },
//                 marks: { type: Type.NUMBER }
//               },
//               required: ["id", "type", "text", "correctAnswer", "marks"]
//             }
//           }
//         },
//         required: ["title", "grade", "subject", "questions", "totalMarks", "language"]
//       }
//     }
//   });

//   try {
//     const jsonStr = response.text.trim();
//     return JSON.parse(jsonStr) as QuestionPaper;
//   } catch (error) {
//     console.error("Failed to parse Gemini response:", error);
//     throw new Error("Failed to generate a valid question paper structure. Please try again.");
//   }
// };

export const generateQuestionPaper = async (
  files: FileData[],
  config: PaperConfig,
): Promise<QuestionPaper> => {
  const response = await fetch(
    "http://localhost:8787/generate-paper",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ files, config }),
    },
  );

  if (!response.ok) {
    throw new Error("Worker failed to generate paper");
  }

  return await response.json();
};
