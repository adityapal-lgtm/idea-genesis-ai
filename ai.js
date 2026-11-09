import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY;
const model = process.env.GEMINI_MODEL || "gemini-3.8-flash";

export async function generateInventions({
  idea,
  category = "Any",
  complexity = "Practical",
  language = "English"
}) {
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is missing.");
  }

  const ai = new GoogleGenAI({ apiKey });

  const prompt = `
You are IDEA GENESIS AI, an invention and innovation assistant.

User idea:
${idea}

Category: ${category}
Complexity: ${complexity}
Language: ${language}

Generate exactly 3 different invention concepts.

For each concept provide:
1. name
2. problem
3. solution
4. components
5. noveltyAngle
6. prototype
7. limitations

Return only valid JSON in this format:
{
  "inventions": [
    {
      "name": "Invention name",
      "problem": "Problem description",
      "solution": "Solution description",
      "components": ["Part 1", "Part 2"],
      "noveltyAngle": "Unique idea",
      "prototype": "Prototype explanation",
      "limitations": "Possible limitations"
    }
  ]
}

Use the requested language.
Do not claim guaranteed originality or patentability.
`;

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      temperature: 0.8,
      maxOutputTokens: 4000
    }
  });

  const output = response.text;

  if (!output) {
    throw new Error("Gemini returned an empty response.");
  }

  let result;

  try {
    result = JSON.parse(output);
  } catch {
    throw new Error("Gemini returned invalid JSON.");
  }

  if (!Array.isArray(result.inventions)) {
    throw new Error("Invalid inventions response.");
  }

  return result.inventions;
}