import { google } from '@ai-sdk/google';
import { streamText, convertToCoreMessages } from 'ai';

export const maxDuration = 30;

const SYSTEM_PROMPT = `
Role:
あなたは、曖昧な指示を「誰もが誤解なく実行可能な完璧な仕様書」に変換する、世界最高峰のプロジェクトマネージャー兼エディターです。

Objective:
ユーザー（指示者）は、多忙で言葉足らずな状態です。彼らの断片的な入力と、提供された添付資料（Context Assets）を分析し、受信者が一切の疑問を持たずに作業に着手できる「構造化された指示書」を作成してください。

Core Behavior Rules:
1. **Context First:** 添付されたドキュメントがある場合、それを最優先の「前提知識」として扱ってください。ユーザーが説明していないことも、ドキュメントに書いてあればそこから補完してください。
2. **Socratic Questioning:** 以下の要素が欠けている場合、ユーザーに短く質問してください。
   - 具体的な期限 (When)
   - 完了の定義/合否基準 (Quality Criteria)
   - ターゲット読者/利用者 (Who for)
   - "なぜ"やるのか (Why/Intent)
3. **Structure:** 最終出力は常にMarkdown形式で、可読性を最大化してください。

Tone:
ユーザーとの対話は「頼れるパートナー」のように。
生成する指示書は「論理的・明快・丁寧」に。

Output Schema (JSON Mode for Draft Preview):
あなたが生成する回答の中に、以下のJSONブロックを含めることで、右側のプレビュー画面を更新できます。
\`\`\`json
{
  "title": "タスクのタイトル",
  "summary": "1行要約",
  "sections": [
    { "heading": "背景・目的", "content": "..." },
    { "heading": "具体的タスク", "content": "..." },
    { "heading": "完了要件", "content": "..." }
  ],
  "missing_info": ["期限", "ターゲット"]
}
\`\`\`
会話の中で不足情報を確認する際は、通常のテキストで質問してください。
情報が揃ってきたら、またはユーザーが「生成して」と言ったら、上記のJSON形式で指示書案を出力してください。
`;

export async function POST(req: Request) {
    try {
        // Parse and validate request body
        let body;
        try {
            body = await req.json();
        } catch (error) {
            console.error('Failed to parse request body:', error);
            return new Response(
                JSON.stringify({ error: 'Invalid JSON in request body' }),
                { status: 400, headers: { 'Content-Type': 'application/json' } }
            );
        }

        const { messages } = body;

        // Validate messages array
        if (!messages || !Array.isArray(messages) || messages.length === 0) {
            return new Response(
                JSON.stringify({ error: 'Messages array is required and must not be empty' }),
                { status: 400, headers: { 'Content-Type': 'application/json' } }
            );
        }

        // Check for API key
        if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
            console.error('GOOGLE_GENERATIVE_AI_API_KEY is not configured');
            return new Response(
                JSON.stringify({ error: 'API configuration error. Please contact support.' }),
                { status: 500, headers: { 'Content-Type': 'application/json' } }
            );
        }

        // Call Gemini API with streaming
        const result = await streamText({
            model: google('gemini-1.5-pro-latest'),
            system: SYSTEM_PROMPT,
            messages: convertToCoreMessages(messages),
        });

        return result.toDataStreamResponse();
    } catch (error) {
        console.error('Chat API error:', error);

        // Handle specific error types
        if (error instanceof Error) {
            // API rate limit or quota errors
            if (error.message.includes('quota') || error.message.includes('rate limit')) {
                return new Response(
                    JSON.stringify({ error: 'API rate limit exceeded. Please try again later.' }),
                    { status: 429, headers: { 'Content-Type': 'application/json' } }
                );
            }

            // API authentication errors
            if (error.message.includes('API key') || error.message.includes('authentication')) {
                return new Response(
                    JSON.stringify({ error: 'API authentication failed. Please check configuration.' }),
                    { status: 401, headers: { 'Content-Type': 'application/json' } }
                );
            }
        }

        // Generic error response
        return new Response(
            JSON.stringify({
                error: 'An unexpected error occurred. Please try again.',
                details: process.env.NODE_ENV === 'development' ? error instanceof Error ? error.message : String(error) : undefined
            }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
    }
}
