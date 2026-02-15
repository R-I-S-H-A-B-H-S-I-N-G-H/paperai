import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";

type Bindings = {
  GEMINI_API_KEY: string;
};

const app = new Hono<{ Bindings: Bindings }>();

app.use(
  "/generate-paper/*",
  cors({
    origin: "*", // In production, replace '*' with your actual UI URL
    allowMethods: ["POST", "GET", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

app.onError((err, c) => {

  return c.json(
    {
      message: err.message,
      stack: err.stack,
    },
    500,
  );
});

const paperSchema = {
  description: "A professional academic question paper",
  type: SchemaType.OBJECT,
  properties: {
    title: { type: SchemaType.STRING },
    grade: { type: SchemaType.STRING },
    subject: { type: SchemaType.STRING },
    language: { type: SchemaType.STRING },
    durationMinutes: { type: SchemaType.NUMBER },
    totalMarks: { type: SchemaType.NUMBER },
    instructions: { 
      type: SchemaType.ARRAY, 
      items: { type: SchemaType.STRING } 
    },
    questions: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          id: { type: SchemaType.STRING },
          type: { 
            type: SchemaType.STRING, 
            enum: ["MCQ", "TRUE_FALSE", "SHORT_ANSWER", "LONG_ANSWER"] 
          },
          text: { type: SchemaType.STRING },
          options: { 
            type: SchemaType.ARRAY, 
            items: { type: SchemaType.STRING },
            description: "Required only if type is MCQ"
          },
          correctAnswer: { type: SchemaType.STRING },
          explanation: { type: SchemaType.STRING },
          marks: { type: SchemaType.NUMBER }
        },
        required: ["id", "type", "text", "correctAnswer", "marks"]
      }
    }
  },
  required: ["title", "grade", "subject", "language", "durationMinutes", "totalMarks", "instructions", "questions"]
};

app.post('/generate-paper', async (c) => {
  try {
    const { files, config } = await c.req.json();
    const genAI = new GoogleGenerativeAI(c.env.GEMINI_API_KEY);
    
    // Using the 2026 frontier model
    const model = genAI.getGenerativeModel({ 
      model: "gemini-3-pro-preview",
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: paperSchema,
      }
    });

    const fileParts = files.map((file: any) => ({
      inlineData: {
        // Clean base64 strings if they contain the data-URI prefix
        data: file.base64.split(',')[1] || file.base64,
        mimeType: file.type
      }
    }));

    const prompt = `Generate a ${config.difficulty} difficulty ${config.subject} exam for grade ${config.grade}. 
                    Ensure there are ${config.numMcq} MCQs, ${config.numTf} T/F, ${config.numShort} short, and ${config.numLong} long answers.`;

    const result = await model.generateContent([prompt, ...fileParts]);
    const responseText = result.response.text();
    
    return c.json(JSON.parse(responseText));

  } catch (err: any) {
    // Printing the full stack for your terminal debugging
    // console.error("DEBUG ERROR STACK:", err.stack);
    
    return c.json({ 
      error: "Generation failed", 
      message: err.message,
      stack: err.stack // Sending to UI for easier dev-time debugging
    }, 500);
  }
})

export default app;
