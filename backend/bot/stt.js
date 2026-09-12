import { downloadMediaMessage } from '@whiskeysockets/baileys';
import Groq from 'groq-sdk';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { randomUUID } from 'crypto';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';

ffmpeg.setFfmpegPath(ffmpegInstaller.path);

/**
 * Transcribe a WhatsApp voice note using Groq Whisper.
 * @param {object} msg - Baileys message object (audioMessage type)
 * @returns {Promise<string>} transcribed text
 */
export async function transcribeVoiceNote(msg) {
  let oggPath = null;
  let mp3Path = null;

  try {
    const buffer = await downloadMediaMessage(msg, 'buffer', {});
    const id = randomUUID();
    oggPath = path.join(os.tmpdir(), `${id}.ogg`);
    mp3Path = path.join(os.tmpdir(), `${id}.mp3`);

    fs.writeFileSync(oggPath, buffer);

    await new Promise((resolve, reject) => {
      ffmpeg(oggPath)
        .toFormat('mp3')
        .on('end', resolve)
        .on('error', reject)
        .save(mp3Path);
    });

    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    const transcription = await groq.audio.transcriptions.create({
      file: fs.createReadStream(mp3Path),
      model: 'whisper-large-v3',
      response_format: 'text',
    });

    return transcription;
  } finally {
    if (oggPath && fs.existsSync(oggPath)) fs.unlinkSync(oggPath);
    if (mp3Path && fs.existsSync(mp3Path)) fs.unlinkSync(mp3Path);
  }
}
