/**
 * TextPreprocessor.ts
 * Logic for cleaning, chunking, and summarizing PDF text before sending to AI.
 */

export class TextPreprocessor {
  /**
   * Cleans raw extracted PDF text.
   */
  static sanitize(text: string): string {
    if (!text) return "";
    return text
      .replace(/\s+/g, " ")        // Normalize whitespace
      .replace(/[\x00-\x1F\x7F]/g, "") // Remove non-printable control characters
      .trim();
  }

  /**
   * Estimates if the text is too large for a single prompt.
   * Max recommended input for fast generation is ~15,000 characters.
   */
  static isTooLarge(text: string): boolean {
    return text.length > 15000;
  }

  /**
   * Splits text into manageable chunks of ~12,000 characters.
   */
  static chunkText(text: string, chunkSize: number = 12000): string[] {
    const chunks: string[] = [];
    let processed = 0;
    
    while (processed < text.length) {
      chunks.push(text.substring(processed, processed + chunkSize));
      processed += chunkSize;
    }
    
    return chunks;
  }

  /**
   * Creates a prompt for the AI to summarize a chunk.
   */
  static getSummarizationPrompt(text: string): string {
    return `You are a study assistant. Carefully summarize the following educational material into a dense, structured, and factual "Study Guide". 
    Focus on key concepts, dates, formulas, and definitions that are likely to appear in an exam.
    
    MATERIAL:
    ${text}
    
    OUTPUT:
    Provide a concise summary suitable for generating multiple-choice questions.`;
  }
}
