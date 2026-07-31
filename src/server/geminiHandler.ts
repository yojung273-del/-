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
      error: '일기 내용이나 그림 중 최소 하나 이상을 제공해 주세요.',
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

  // Handle image base64 parsing safely
  if (imageBase64 && typeof imageBase64 === 'string') {
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
학생이 쓴 마음 일기와 함께 그린 그림을 꼼꼼히 살피고, 그림의 색상, 선의 느낌, 형태나 분위기도 자연스럽게 언급하며 학생의 마음에 공감하고 따뜻한 위로와 응원을 전하는 편지(답장)를 작성해 줘.

${moodText}[학생이 쓴 일기 내용]
${diaryText || '(그림으로만 표현함)'}

[작성 지침]
1. 따뜻하고 친근한 어조('~했구나', '~란다', '소중한 친구야')로 써줘.
2. 그림에서 느껴지는 색감이나 분위기(예: 코랄 빨강, 노랑, 초록, 거친 선 등)를 언급하여 학생이 그림을 통한 표현이 전달되었음을 느끼게 해줘.
3. 학생의 일기 속 상황과 감정에 온전히 공감하고 깊은 경청과 따뜻한 조언, 응원을 보내줘.
4. 분량은 가독성 높게 3~4문단으로 정성스럽게 나누어 적어줘.`;

  parts.push({ text: promptText });

  let response;
  try {
    response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: { parts },
    });
  } catch (geminiErr: any) {
    console.warn('gemini-2.5-flash call failed, trying gemini-3.6-flash fallback:', geminiErr?.message);
    response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: { parts },
    });
  }

  const letterText = response.text || '선생님이 마음을 담아 답장을 작성하는 중 오류가 발생했습니다. 다시 시도해 주세요.';

  return {
    success: true,
    letter: letterText,
  };
}
