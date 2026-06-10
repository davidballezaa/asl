import { createAudioPlayer, setAudioModeAsync } from 'expo-audio';
import type { AudioPlayer } from 'expo-audio/build/AudioModule.types';
import * as Haptics from 'expo-haptics';

const correctSource = require('@/assets/sounds/correct.wav');
const wrongSource = require('@/assets/sounds/wrong.wav');

let audioReady = false;
let correctPlayer: AudioPlayer | null = null;
let wrongPlayer: AudioPlayer | null = null;

async function ensureAudio(): Promise<void> {
  if (audioReady) return;

  await setAudioModeAsync({
    playsInSilentMode: true,
    interruptionMode: 'mixWithOthers',
    interruptionModeAndroid: 'duckOthers',
  });

  correctPlayer = createAudioPlayer(correctSource);
  wrongPlayer = createAudioPlayer(wrongSource);
  audioReady = true;
}

async function playSound(type: 'correct' | 'wrong'): Promise<void> {
  try {
    await ensureAudio();
    const player = type === 'correct' ? correctPlayer : wrongPlayer;
    if (!player) return;
    await player.seekTo(0);
    player.play();
  } catch {
    // Audio is best-effort; haptics still provide feedback.
  }
}

export async function playCorrectFeedback(): Promise<void> {
  await Promise.all([
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success),
    playSound('correct'),
  ]);
}

export async function playWrongFeedback(): Promise<void> {
  await Promise.all([
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error),
    playSound('wrong'),
  ]);
}

export async function playTapFeedback(): Promise<void> {
  await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
}