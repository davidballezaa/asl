export type RecognitionResult = {
  success: boolean;
  confidence: number;
  predictedSign?: string | null;
  error?: string | null;
};
