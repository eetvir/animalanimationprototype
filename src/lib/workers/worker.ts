// src/workers/worker.ts
import * as tts from '@mintplex-labs/piper-tts-web';

let session: tts.TtsSession | null = null;

async function main(event: MessageEvent<{
  type: 'init' | 'voices' | 'stored' | 'flush';
  text?: string;
  voiceId?: string;
}>) {
  if (event.data.type === 'voices') {
    self.postMessage({ type: 'voices', voices: await tts.voices() });
    return;
  }

  if (event.data.type === 'stored') {
    self.postMessage({ type: 'stored', voiceIds: await tts.stored() });
    return;
  }

  if (event.data.type === 'flush') {
    await tts.flush();
    return;
  }

  if (event.data?.type !== 'init') return;

  if (!session) {
    session = new tts.TtsSession({
      voiceId: event.data.voiceId,
      progress: (e) => self.postMessage({ type: 'progress', progress: e }),
      logger: (msg: string) => self.postMessage({ type: 'log', message: msg }),
    });
  }

  if (session.voiceId !== event.data.voiceId) {
    session.voiceId = event.data.voiceId;
    await session.init();
  }

  try {
    const audioBlob = await session.predict(event.data.text || "");
    self.postMessage({ type: 'result', audio: audioBlob });
  } catch (error) {
    self.postMessage({ type: 'error', message: error.message });
  }
}

self.addEventListener('message', main);
