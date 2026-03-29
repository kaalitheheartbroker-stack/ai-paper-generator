// ===============================================================
// AIService.ts — Indestructible AI Question Paper Generator
// ===============================================================
import { TextPreprocessor } from './TextPreprocessor';
import { auth } from '../firebase';
const TIMEOUT_MS = 45000; 

export interface Question {
  id: string;
  text: string;
  options: string[];
  correctAnswer: number;
  topic: string;
}

// --- BUILT-IN FALLBACK PAPER (Always available, no network needed) ---
const FALLBACK_QUESTIONS: Question[] = [
  { id: "fb-1", text: "Which article of the Indian Constitution deals with the Right to Equality?", options: ["Article 12", "Article 14", "Article 19", "Article 21"], correctAnswer: 1, topic: "Polity" },
  { id: "fb-2", text: "Who is known as the Father of the Indian Constitution?", options: ["Mahatma Gandhi", "Jawaharlal Nehru", "B.R. Ambedkar", "Sardar Patel"], correctAnswer: 2, topic: "History" },
  { id: "fb-3", text: "What is the SI unit of electric current?", options: ["Volt", "Ohm", "Ampere", "Watt"], correctAnswer: 2, topic: "Physics" },
  { id: "fb-4", text: "Which planet is known as the Red Planet?", options: ["Venus", "Saturn", "Jupiter", "Mars"], correctAnswer: 3, topic: "Science" },
  { id: "fb-5", text: "The first Prime Minister of India was?", options: ["Sardar Patel", "Jawaharlal Nehru", "Rajendra Prasad", "Lal Bahadur Shastri"], correctAnswer: 1, topic: "History" },
  { id: "fb-6", text: "Photosynthesis occurs in which part of a plant?", options: ["Root", "Stem", "Chloroplast", "Mitochondria"], correctAnswer: 2, topic: "Biology" },
  { id: "fb-7", text: "What does CPU stand for?", options: ["Central Processing Unit", "Central Program Unit", "Computer Processing Unit", "Core Processing Utility"], correctAnswer: 0, topic: "Computer" },
  { id: "fb-8", text: "Which gas is most abundant in Earth's atmosphere?", options: ["Oxygen", "Carbon Dioxide", "Nitrogen", "Argon"], correctAnswer: 2, topic: "Science" },
  { id: "fb-9", text: "The Great Wall of China was built during which dynasty?", options: ["Ming Dynasty", "Tang Dynasty", "Qin Dynasty", "Han Dynasty"], correctAnswer: 0, topic: "History" },
  { id: "fb-10", text: "What is 15% of 200?", options: ["20", "25", "30", "35"], correctAnswer: 2, topic: "Mathematics" },
  { id: "fb-11", text: "Which is the largest ocean on Earth?", options: ["Atlantic", "Indian", "Arctic", "Pacific"], correctAnswer: 3, topic: "Geography" },
  { id: "fb-12", text: "Who wrote the national anthem of India?", options: ["Bankim Chandra Chatterjee", "Rabindranath Tagore", "Sarojini Naidu", "Mahatma Gandhi"], correctAnswer: 1, topic: "Culture" },
  { id: "fb-13", text: "What is the chemical symbol for Gold?", options: ["Gd", "Go", "Au", "Ag"], correctAnswer: 2, topic: "Chemistry" },
  { id: "fb-14", text: "The Battle of Plassey was fought in which year?", options: ["1757", "1857", "1780", "1742"], correctAnswer: 0, topic: "History" },
  { id: "fb-15", text: "Which is the smallest prime number?", options: ["0", "1", "2", "3"], correctAnswer: 2, topic: "Mathematics" },
  { id: "fb-16", text: "Ctrl + Z shortcut is used for?", options: ["Cut", "Copy", "Undo", "Redo"], correctAnswer: 2, topic: "Computer" },
  { id: "fb-17", text: "Which vitamin is produced by the human body when exposed to sunlight?", options: ["Vitamin A", "Vitamin B12", "Vitamin C", "Vitamin D"], correctAnswer: 3, topic: "Biology" },
  { id: "fb-18", text: "River Ganga originates from?", options: ["Mansarovar Lake", "Gangotri Glacier", "Yamunotri Glacier", "Siachen Glacier"], correctAnswer: 1, topic: "Geography" },
  { id: "fb-19", text: "Who invented the telephone?", options: ["Thomas Edison", "Alexander Graham Bell", "Nikola Tesla", "Guglielmo Marconi"], correctAnswer: 1, topic: "Science" },
  { id: "fb-20", text: "The Rajya Sabha is also known as?", options: ["House of the People", "Council of States", "Upper House of Lords", "Federal Assembly"], correctAnswer: 1, topic: "Polity" },
];

export type AIServiceError = 'TIMEOUT' | 'NETWORK' | 'INVALID_JSON' | 'EMPTY_RESPONSE' | 'API_ERROR' | 'UNKNOWN';

export interface GenerationResult {
  questions: Question[];
  fromFallback: boolean;
  error?: AIServiceError;
  errorMessage?: string;
}

/**
 * Simple helper for non-JSON AI calls (like summarization)
 */
async function callGeminiSimple(prompt: string, modelName: string, apiVer: string): Promise<string | null> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 20000); // 20s for summary
  
  try {
    const idToken = auth.currentUser ? await auth.currentUser.getIdToken() : '';
    const response = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        signal: controller.signal,
        body: JSON.stringify({
          action: 'generateContent',
          prompt,
          modelName,
          apiVer
        })
      });
    clearTimeout(timeoutId);
    if (!response.ok) return null;
    const data = await response.json();
    return data?.candidates?.[0]?.content?.parts?.[0]?.text || null;
  } catch (e) {
    clearTimeout(timeoutId);
    return null;
  }
}

/**
 * Core function: Generate questions with full error handling.
 * GUARANTEES: Always returns questions (from AI or fallback). NEVER hangs.
 */
export async function generateQuestionsFromText(
  pdfText: string,
  numQuestions: number,
  type: string = 'MCQ',
  category: string = 'General',
  language: string = 'English'
): Promise<{ questions: any[]; fromFallback: boolean; error?: string; errorMessage?: string }> {
  
  // 1. SANITIZE & CLEAN
  const cleanPdfText = TextPreprocessor.sanitize(pdfText);
  if (!cleanPdfText || cleanPdfText.length < 50) {
    console.log("[AIService] No valid PDF text. Using fallback.");
    return {
      questions: getFallbackQuestions(numQuestions),
      fromFallback: true,
      error: 'EMPTY_RESPONSE',
      errorMessage: 'Minimal text extracted from PDF. Using preset questions.'
    };
  }

  let finalContext = cleanPdfText;

  // 2. LARGE PDF PIPELINE (PRE-SUMMARIZATION)
  if (TextPreprocessor.isTooLarge(cleanPdfText)) {
    console.log(`[AIService] 📦 PDF too large (${cleanPdfText.length} chars). Summarizing first...`);
    try {
      const summaryContext = cleanPdfText.substring(0, 15000); // Take a large chunk for context
      const summaryPrompt = TextPreprocessor.getSummarizationPrompt(summaryContext);
      
      const summaryResult = await callGeminiSimple(summaryPrompt, "gemini-1.5-flash", "v1");
      if (summaryResult) {
        console.log(`[AIService] ✨ Summary generated (${summaryResult.length} chars). Using as context.`);
        finalContext = summaryResult;
      }
    } catch (e) {
      console.warn("[AIService] ⚠️ Summarization failed, falling back to truncated raw text.", e);
      finalContext = cleanPdfText.substring(0, 12000);
    }
  } else {
    finalContext = cleanPdfText.substring(0, 12000);
  }

  const prompt = `You are an expert exam question generator. Create exactly ${numQuestions} ${type} questions in ${language} language based on the following study material.
  
  The questions should be relevant to ${category} exams.
  ${language === 'Hindi' ? 'The output MUST be in Hindi.' : language === 'Bilingual' ? 'Provide questions in both English and Hindi.' : 'The output MUST be in English.'}

  STUDY MATERIAL:
  ${finalContext}

  STRICT OUTPUT RULES:
  - Return ONLY a valid JSON object, nothing else
  - No markdown, no code blocks, no explanations
  - Each question MUST have exactly 4 options
  - Correct answer index is 0-based (0=A, 1=B, 2=C, 3=D)
  - Make questions challenging but fair
  - Topics should be from the provided text

  REQUIRED JSON FORMAT:
  {
    "questions": [
      { "text": "...", "options": ["...", "...", "...", "..."], "correctAnswer": 0, "topic": "..." }
    ]
  }`;

  let finalError: any = null;
  
  // --- Dynamic Model Discovery ---
  console.log("[AIService] 🔍 Discovering available models...");
  let discoveredModels: { name: string, version: string }[] = [];
  
  try {
    const idToken = auth.currentUser ? await auth.currentUser.getIdToken() : '';
    const listResponse = await fetch('/api/gemini', { 
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${idToken}`
      },
      body: JSON.stringify({ action: 'listModels' })
    });
    
    if (listResponse.ok) {
      const listData = await listResponse.json();
      discoveredModels = (listData.models || [])
        .filter((m: any) => m.supportedGenerationMethods?.includes("generateContent"))
        .map((m: any) => ({
          name: m.name.split('/').pop() || m.name,
          version: m.name.includes('v1beta') ? 'v1beta' : 'v1'
        }));
      
      console.log(`[AIService] ✨ Discovered ${discoveredModels.length} compatible models.`);
    }
  } catch (e) {
    console.warn("[AIService] ⚠️ Model discovery failed, using hardcoded defaults.", e);
  }

  // Final prioritized list: Discovered models + stable fallbacks
  const priorityOrder = ["gemini-2.0-flash-exp", "gemini-2.5-flash", "gemini-1.5-flash", "gemini-1.5-pro"];
  const modelsToTry = discoveredModels.length > 0 
    ? discoveredModels.sort((a, b) => {
        const idxA = priorityOrder.indexOf(a.name);
        const idxB = priorityOrder.indexOf(b.name);
        return (idxA === -1 ? 99 : idxA) - (idxB === -1 ? 99 : idxB);
      })
    : [
      { name: "gemini-2.0-flash-exp", version: "v1beta" },
      { name: "gemini-1.5-flash", version: "v1" },
      { name: "gemini-1.5-pro", version: "v1" }
    ];
  
  const MAX_RETRIES_PER_MODEL = 2; 

  for (const modelConfig of modelsToTry) {
    const { name: modelName, version: apiVer } = modelConfig;
    console.log(`[AIService] 🤖 Trying Model: ${modelName} (${apiVer})...`);

    for (let retryCount = 0; retryCount < MAX_RETRIES_PER_MODEL; retryCount++) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
          controller.abort();
          console.warn(`[AIService] ⏳ ${modelName} call timed out after ${TIMEOUT_MS/1000}s`);
      }, TIMEOUT_MS);

      try {
        if (retryCount > 0) {
          const delay = retryCount * 3000; 
          console.log(`[AIService] 🔄 Retry ${retryCount} for ${modelName} after ${delay}ms...`);
          await new Promise(r => setTimeout(r, delay));
        }

        const idToken = auth.currentUser ? await auth.currentUser.getIdToken() : '';
        const response = await fetch('/api/gemini', {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${idToken}`
            },
            signal: controller.signal,
            body: JSON.stringify({
              action: 'generateContent',
              prompt,
              modelName,
              apiVer
            })
        });

        clearTimeout(timeoutId);
        const data = await response.json().catch(() => ({ error: { message: "Invalid JSON response" } }));

        if (!response.ok) {
          const errMsg = data?.error?.message || "Unknown error";
          console.error(`[AIService] ❌ API ${response.status} (${modelName}):`, errMsg);
          
          if (response.status === 503 || response.status === 429) {
            finalError = { type: 'API_ERROR', message: `Server busy (${response.status})` };
            continue; 
          }
          
          if (response.status === 404) {
             console.log(`[AIService] ⏭️ Model ${modelName} 404 in ${apiVer}. Skipping...`);
             break; 
          }

          throw { type: 'API_ERROR' as AIServiceError, message: `API Error ${response.status}: ${errMsg}` };
        }

        console.log(`[AIService] ✅ Raw Response (${modelName}) received.`);
        
        const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!rawText) throw { type: 'EMPTY_RESPONSE', message: 'No content parts in response' };

        // --- Safe JSON Parsing ---
        let parsed: any = null;
        let cleanText = rawText.trim();
        if (cleanText.includes("```")) {
            const matches = cleanText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
            if (matches) cleanText = matches[1];
        }
        
        try {
          parsed = JSON.parse(cleanText);
        } catch (_) {
          const matches = cleanText.match(/\{[\s\S]*\}/);
          if (matches) {
            try { parsed = JSON.parse(matches[0]); } catch (e) { /* fail */ }
          }
        }

        if (!parsed || !parsed.questions || !Array.isArray(parsed.questions)) {
          console.error(`[AIService] ⚠️ Bad JSON structure from ${modelName}:`, cleanText);
          throw { type: 'INVALID_JSON', message: 'Model returned malformed JSON' };
        }

        const validQuestions: Question[] = parsed.questions
          .filter((q: any) => q && q.text && Array.isArray(q.options))
          .map((q: any, idx: number) => ({
            id: `ai-${idx + 1}`,
            text: String(q.text),
            options: (q.options || []).slice(0, 4).map(String),
            correctAnswer: typeof q.correctAnswer === 'number' ? Math.max(0, Math.min(3, q.correctAnswer)) : 0,
            topic: String(q.topic || category || 'General')
          }));

        if (validQuestions.length === 0) throw { type: 'INVALID_JSON', message: 'No valid questions generated' };

        console.log(`[AIService] 🏆 Success using ${modelName}!`);
        return { questions: validQuestions, fromFallback: false };

      } catch (err: any) {
        clearTimeout(timeoutId);
        finalError = err;
        
        if (err.name === 'AbortError') {
            console.warn(`[AIService] ⚠️ Model ${modelName} aborted (Timeout).`);
            finalError = { type: 'TIMEOUT', message: `${TIMEOUT_MS/1000}s Timeout hit` };
            continue; 
        }
        
        console.warn(`[AIService] ⚠️ Model ${modelName} error:`, err?.message || err);
        break; // Switch model for hard errors
      }
    }
  }

  console.error("[AIService] 🚨 ALL MODELS FAILED. Returning fallback questions.");
  return {
    questions: getFallbackQuestions(numQuestions),
    fromFallback: true,
    error: finalError?.type || 'UNKNOWN',
    errorMessage: finalError?.message || 'AI is busy, check connection.'
  };
}

function getFallbackQuestions(count: number): Question[] {
  const shuffled = [...FALLBACK_QUESTIONS].sort(() => Math.random() - 0.5);
  const selected = shuffled.slice(0, Math.min(count, shuffled.length));
  
  // Pad with repeats if needed
  while (selected.length < count) {
    const extra = shuffled[selected.length % shuffled.length];
    selected.push({ ...extra, id: `fb-pad-${selected.length}` });
  }
  
  console.log(`[AIService] Returning ${selected.length} fallback questions.`);
  return selected;
}
