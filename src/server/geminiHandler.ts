import { GoogleGenAI } from '@google/genai';

export async function processGeminiRequest(body: {
  diaryText?: string;
  imageBase64?: string;
  mood?: string;
}): Promise<{ success: boolean; letter?: string; error?: string }> {
  const { diaryText, imageBase64, mood } = body;

  if (!diaryText && !imageBase64) {
    return {
      success: false,
      error: '일기 내용을 입력해 주세요.',
    };
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return {
      success: false,
      error: 'GEMINI_API_KEY가 설정되어 있지 않습니다. Settings > Secrets에서 GEMINI_API_KEY를 등록해 주세요.',
    };
  }

  const ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });

  const parts: any[] = [];

  // Handle image base64 parsing safely if provided
  if (imageBase64 && typeof imageBase64 === 'string' && imageBase64.trim() !== '') {
    const matches = imageBase64.match(/^data:(image\/[a-zA-Z]+);base64,(.+)$/);
    let mimeType = 'image/png';
    let rawBase64 = imageBase64;

    if (matches && matches.length === 3) {
      mimeType = matches[1];
      rawBase64 = matches[2];
    } else {
      rawBase64 = imageBase64.replace(/^data:image\/[a-zA-Z]+;base64,/, '');
    }

    parts.push({
      inlineData: {
        mimeType,
        data: rawBase64,
      },
    });
  }

  const moodText = mood ? `[오늘의 기분 표식: ${mood}]\n` : '';
  const promptText = `너는 학생들의 마음을 어루만져 주는 다정하고 따뜻한 초등학교/중학교 심리 상담 교사야.
학생이 쓴 마음 일기와 기분을 꼼꼼히 읽고, 학생의 마음에 온전히 공감하고 따뜻한 위로와 조언, 응원을 전하는 편지(답장)를 작성해 줘.

${moodText}[학생이 쓴 일기 내용]
${diaryText || ''}

[작성 지침]
1. 따뜻하고 친근하며 다정한 어조('~했구나', '~란다', '소중한 친구야')로 써줘.
2. 학생의 일기 속 상황과 감정에 깊이 경청하고 진심 어린 공감과 용기를 북돋워 줘.
3. 분량은 가독성 높게 3~4문단으로 정성스럽게 나누어 적어줘.`;

  parts.push({ text: promptText });

  let response;
  // Try models in order: gemini-2.5-flash -> gemini-2.0-flash -> gemini-1.5-flash
  const modelsToTry = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'];
  let lastError: any = null;

  for (const modelName of modelsToTry) {
    try {
      response = await ai.models.generateContent({
        model: modelName,
        contents: { parts },
      });
      if (response && response.text) {
        break;
      }
    } catch (err: any) {
      console.warn(`[Gemini Model ${modelName} failed]:`, err?.message || err);
      lastError = err;
    }
  }

  const letterText = response?.text;

  if (!letterText) {
    return {
      success: false,
      error: `Gemini API 호출 실패: ${lastError?.message || '응답을 생성할 수 없습니다.'}`,
    };
  }

  return {
    success: true,
    letter: letterText,
  };
}
