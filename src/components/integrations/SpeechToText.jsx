import { InvokeLLM } from '@/api/integrations';

/**
 * Transcribe audio file to text
 * @param {Object} params Parameters for transcription
 * @param {string} params.audioUrl URL of the audio file
 * @param {string} params.language Language code (default: 'en')
 * @returns {Promise<string>} Transcribed text
 */
export async function transcribeAudio({ audioUrl, language = 'en' }) {
  try {
    const transcriptionPrompt = `
      Transcribe this audio file accurately in ${language}.
      Include speaker identification if possible.
    `;

    const result = await InvokeLLM({
      prompt: transcriptionPrompt,
      input_type: 'audio',
      audio_url: audioUrl,
      language: language
    });

    return result;
  } catch (error) {
    console.error('Transcription error:', error);
    throw error;
  }
}

/**
 * Extract audio from video file
 * @param {Object} params Parameters for extraction
 * @param {string} params.videoUrl URL of the video file
 * @returns {Promise<string>} URL of the extracted audio
 */
export async function extractAudioFromVideo({ videoUrl }) {
  try {
    const result = await InvokeLLM({
      prompt: "Extract audio from this video file",
      input_type: 'video',
      video_url: videoUrl
    });
    
    return result.audio_url;
  } catch (error) {
    console.error('Video audio extraction error:', error);
    throw error;
  }
}