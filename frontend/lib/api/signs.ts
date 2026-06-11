import { apiMultipart } from '@/lib/api/client';
import { Platform } from 'react-native';

import type { RecognitionResult } from '@/lib/api/types';

type RecognizeSignParams = {
  imageUri: string;
  expectedSign: string;
  lessonId: string;
  exerciseId: string;
};

export async function recognizeSign(
  params: RecognizeSignParams,
): Promise<RecognitionResult> {
  const formData = new FormData();
  formData.append('expected_sign', params.expectedSign);
  formData.append('lesson_id', params.lessonId);
  formData.append('exercise_id', params.exerciseId);

  if (Platform.OS === 'web') {
    const response = await fetch(params.imageUri);
    const imageBlob = await response.blob();
    formData.append('image', imageBlob, 'capture.jpg');
  } else {
    formData.append('image', {
      uri: params.imageUri,
      name: 'capture.jpg',
      type: 'image/jpeg',
    } as unknown as Blob);
  }

  return apiMultipart<RecognitionResult>('/signs/recognize', formData);
}
