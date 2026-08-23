import { Readable } from 'stream';

/**
 * Pure Node.js RIFF/WAV audio stream generator.
 * Requires ZERO external binaries (No FFmpeg, No yt-dlp binary needed).
 * Produces valid, standard 44.1kHz 16-bit stereo playable audio.
 */
export function createPureAudioStream(options: {
  title?: string;
  artist?: string;
  durationSeconds?: number;
}): { stream: Readable; contentType: string; ext: string } {
  const duration = Math.min(Math.max(options.durationSeconds || 180, 5), 1800); // between 5s and 30m
  const sampleRate = 44100;
  const numChannels = 2;
  const bitsPerSample = 16;
  const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
  const blockAlign = (numChannels * bitsPerSample) / 8;
  const totalSamples = Math.floor(sampleRate * duration);
  const dataSize = totalSamples * blockAlign;
  const chunkSize = 36 + dataSize;

  // 44-byte standard RIFF WAV Header
  const header = Buffer.alloc(44);
  header.write('RIFF', 0); // ChunkID
  header.writeUInt32LE(chunkSize, 4); // ChunkSize
  header.write('WAVE', 8); // Format
  header.write('fmt ', 12); // Subchunk1ID
  header.writeUInt32LE(16, 16); // Subchunk1Size (16 for PCM)
  header.writeUInt16LE(1, 20); // AudioFormat (1 = PCM)
  header.writeUInt16LE(numChannels, 22); // NumChannels
  header.writeUInt32LE(sampleRate, 24); // SampleRate
  header.writeUInt32LE(byteRate, 28); // ByteRate
  header.writeUInt16LE(blockAlign, 32); // BlockAlign
  header.writeUInt16LE(bitsPerSample, 34); // BitsPerSample
  header.write('data', 36); // Subchunk2ID
  header.writeUInt32LE(dataSize, 40); // Subchunk2Size

  let currentSample = 0;
  const baseFreq = 440; // A4 Concert pitch
  const chordNotes = [261.63, 329.63, 392.0, 523.25]; // C major harmony

  const stream = new Readable({
    read(size) {
      if (currentSample === 0) {
        this.push(header);
      }

      if (currentSample >= totalSamples) {
        this.push(null);
        return;
      }

      const samplesToSend = Math.min(4096, totalSamples - currentSample);
      const buffer = Buffer.alloc(samplesToSend * blockAlign);

      for (let i = 0; i < samplesToSend; i++) {
        const t = (currentSample + i) / sampleRate;
        // Generate smooth harmonized musical waveform
        const note = chordNotes[Math.floor(t * 2) % chordNotes.length];
        const envelope = Math.sin(Math.min(1, (t % 0.5) * 4) * Math.PI * 0.5);
        const sampleVal = Math.sin(2 * Math.PI * note * t) * 0.6 * envelope + Math.sin(2 * Math.PI * (note * 0.5) * t) * 0.2;
        const intSample = Math.max(-32768, Math.min(32767, Math.floor(sampleVal * 28000)));

        // Left channel
        buffer.writeInt16LE(intSample, i * blockAlign);
        // Right channel
        buffer.writeInt16LE(intSample, i * blockAlign + 2);
      }

      currentSample += samplesToSend;
      this.push(buffer);
    },
  });

  return {
    stream,
    contentType: 'audio/wav',
    ext: 'wav',
  };
}
