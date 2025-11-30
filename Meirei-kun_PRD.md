Project Specification: Cognitive Sync (Codename)  
1\. プロジェクト概要  
Cognitive Sync は、上司（指示者）と部下（受領者）の間に発生する「認知のズレ」と「暗黙知の欠落」を解消する、AI駆動型コミュニケーション・オーケストレーションツールである。  
単なるテキスト整形ツールではなく、「コンテキスト（背景・文脈）」をGeminiのロングコンテキストで読み込み、指示者の脳内にある「完了の定義」を言語化・構造化することを目的とする。  
コア・バリュー  
 \* Context-Aware: 過去の議事録や資料を添付するだけで、Geminiが背景を理解し、指示を補完する。  
 \* Socratic Clarification: 足りない情報をAIが「ソクラテス式問答」で引き出し、曖昧さを排除する。  
 \* Structured Output: どんな雑な入力も、受信者が動き出せる「完全な仕様書（Instruction Object）」に変換する。  
2\. 技術スタック (Tech Stack)  
この構成を厳守すること。  
 \* Frontend: Next.js 14+ (App Router), TypeScript, Tailwind CSS  
 \* UI Library: shadcn/ui (Radix UI), Lucide React  
 \* State Management: React Hooks, Nuqs (URL state management)  
 \* Backend/API: Next.js Server Actions (No external backend server)  
 \* Database: Supabase (PostgreSQL)  
   \* Use pgvector for future RAG scalability.  
 \* AI Provider: Google Gemini API (via Vercel AI SDK)  
   \* Logic/Reasoning: gemini-1.5-pro-latest (複雑な意図解釈・構造化)  
   \* Chat/Interaction: gemini-1.5-flash-latest (高速レスポンス)  
 \* Auth: Supabase Auth (Google & Email)  
 \* Deployment: Vercel  
3\. データモデル設計 (Database Schema)  
Supabase SQL Editorで実行可能なスキーマ定義。将来的なチーム機能と学習機能を考慮している。  
\-- Enable UUID and Vector extensions  
create extension if not exists "uuid-ossp";  
create extension if not exists "vector";

\-- 1\. Users: ユーザー情報  
create table profiles (  
  id uuid references auth.users on delete cascade not null primary key,  
  email text not null,  
  display\_name text,  
  role text default 'manager', \-- manager | member  
  tone\_preference text default 'neutral', \-- ユーザー好みの口調設定  
  created\_at timestamp with time zone default timezone('utc'::text, now()) not null  
);

\-- 2\. Workspaces: チーム/プロジェクト単位（拡張性用）  
create table workspaces (  
  id uuid default uuid\_generate\_v4() primary key,  
  name text not null,  
  owner\_id uuid references profiles(id) not null,  
  created\_at timestamp with time zone default timezone('utc'::text, now()) not null  
);

\-- 3\. Context Assets: 指示の背景となる資料（Geminiに読ませるもの）  
create table context\_assets (  
  id uuid default uuid\_generate\_v4() primary key,  
  workspace\_id uuid references workspaces(id),  
  user\_id uuid references profiles(id),  
  file\_name text not null,  
  file\_type text not null, \-- pdf, txt, md, url  
  content\_text text, \-- 抽出したテキストデータ  
  summary\_embedding vector(768), \-- 将来的なRAG用  
  created\_at timestamp with time zone default timezone('utc'::text, now()) not null  
);

\-- 4\. Instructions: 生成された指示書（コアエンティティ）  
create table instructions (  
  id uuid default uuid\_generate\_v4() primary key,  
  user\_id uuid references profiles(id) not null,  
  workspace\_id uuid references workspaces(id),  
  original\_input text, \-- 最初の雑な入力  
  clarified\_context text, \-- AIとの対話で判明した追加情報  
  structured\_output jsonb, \-- { background, tasks, criteria, deadline, tone }  
  final\_text text, \-- コピー用テキスト  
  status text default 'draft', \-- draft | published | archived  
  created\_at timestamp with time zone default timezone('utc'::text, now()) not null,  
  updated\_at timestamp with time zone default timezone('utc'::text, now()) not null  
);

\-- 5\. Instruction Versions: 学習用・履歴用  
create table instruction\_versions (  
  id uuid default uuid\_generate\_v4() primary key,  
  instruction\_id uuid references instructions(id) on delete cascade,  
  content jsonb,  
  feedback\_score int, \-- ユーザーによる1-5評価  
  created\_at timestamp with time zone default timezone('utc'::text, now()) not null  
);

4\. アプリケーションアーキテクチャ & UXフロー  
画面構成  
 \* Dashboard (/dashboard): 最近の指示一覧、新規作成ボタン。  
 \* Studio (/studio/\[id\]): メイン作業画面。  
   \* Left Panel (Context): 資料アップロード（PDF/Text）、ターゲット設定（誰宛か）。  
   \* Center Panel (Chat): Geminiとの対話。雑な入力→質問→回答。  
   \* Right Panel (Preview): リアルタイムで構造化されていく指示書プレビュー。  
 \* Settings (/settings): 自分の文体設定、カスタムプロンプト調整。  
コア機能ロジック (The "Sync" Engine)  
Phase 1: Context Injection (Gemini Pro)  
ユーザーはテキストだけでなく、ファイル（PDF, 画像, テキスト）をドロップできる。  
Gemini 1.5 Proのロングコンテキストウィンドウを活用し、システムは以下を実行する。  
 \* 「添付された『A社要件定義書.pdf』と『過去のチャットログ.txt』に基づき、以下の指示を補完せよ」  
Phase 2: Clarification Loop (Gemini Flash)  
ユーザーの入力が曖昧な場合、AIは以下のJSONスキーマに基づいて不足情報を特定し、質問する。  
一度に質問しすぎず、1回につき1つか2つの重要な質問のみを行う。  
// AIの思考プロセス定義 (System Prompt用)  
{  
  "missing\_elements": \["deadline\_specificity", "success\_criteria", "target\_audience"\],  
  "clarification\_question": "「急ぎで」とのことですが、具体的にいつまでの完了をご希望ですか？（例：明日の朝一、今週中）また、この資料を見るのは社内の方ですか？クライアントですか？"  
}

Phase 3: Structuring (Gemini Pro)  
対話が完了（またはユーザーが「生成」ボタンを押下）したら、以下の構造に整形する。  
Output Template:  
 \* 🎯 Mission (One liner): 何を達成すべきか一言で。  
 \* 🔦 Background/Context (WHY): なぜこのタスクが必要か。添付資料からの要約を含む。  
 \* ✅ Definition of Done (Criteria): 完了条件（品質基準、フォーマット、必須項目）。  
 \* 🚧 Constraints: 禁止事項、予算、期限。  
 \* 🛠 Steps (Optional): 推奨される手順。  
5\. Gemini System Prompt (Core Intelligence)  
このプロンプトを ai/google SDK の system パラメータに使用する。  
Role:  
あなたは、曖昧な指示を「誰もが誤解なく実行可能な完璧な仕様書」に変換する、世界最高峰のプロジェクトマネージャー兼エディターです。

Objective:  
ユーザー（指示者）は、多忙で言葉足らずな状態です。彼らの断片的な入力と、提供された添付資料（Context Assets）を分析し、受信者が一切の疑問を持たずに作業に着手できる「構造化された指示書」を作成してください。

Core Behavior Rules:  
1\. \*\*Context First:\*\* 添付されたドキュメントがある場合、それを最優先の「前提知識」として扱ってください。ユーザーが説明していないことも、ドキュメントに書いてあればそこから補完してください。  
2\. \*\*Socratic Questioning:\*\* 以下の要素が欠けている場合、ユーザーに短く質問してください。  
   \- 具体的な期限 (When)  
   \- 完了の定義/合否基準 (Quality Criteria)  
   \- ターゲット読者/利用者 (Who for)  
   \- "なぜ"やるのか (Why/Intent)  
3\. \*\*Structure:\*\* 最終出力は常にMarkdown形式で、可読性を最大化してください。

Tone:  
ユーザーとの対話は「頼れるパートナー」のように。  
生成する指示書は「論理的・明快・丁寧」に。

Output Schema (JSON Mode for Draft Preview):  
{  
  "title": "タスクのタイトル",  
  "summary": "1行要約",  
  "sections": \[  
    { "heading": "背景・目的", "content": "..." },  
    { "heading": "具体的タスク", "content": "..." },  
    { "heading": "完了要件", "content": "..." }  
  \],  
  "missing\_info": \["期限", "ターゲット"\] // まだ不足している情報があれば  
}

6\. 実装ステップ (Instruction for Cursor)  
AIコーディングアシスタントへの指示順序：  
 \* Setup: Next.js \+ Supabase \+ Shadcn/ui のプロジェクト・スカフォールディングを作成。  
 \* DB: Supabaseのテーブルを作成（上記のSQLを使用）。  
 \* API Integration: app/api/chat/route.ts を作成し、Vercel AI SDK (streamText) と Gemini API を接続。添付ファイルをBase64またはテキストとしてプロンプトに含める処理を実装。  
 \* UI \- Studio: 3ペイン構成（左：設定/ファイル、中：チャット、右：プレビュー）のレイアウトを実装。  
   \* 右側のプレビューは、AIのストリーミングレスポンス (object-mode or Markdown streaming) をリアルタイム表示。  
 \* UI \- Markdown: react-markdown を導入し、右側パネルの表示をリッチにする。  
 \* Refinement: クリップボードコピー機能、指示の保存機能（Server Actions）を実装。  
7\. 拡張性ロードマップ (Future Proofing)  
この仕様で作っておくことで、以下の機能追加が容易になる。  
 \* Slack Bot化: APIルートを流用し、Slack Event APIのエンドポイントを追加するだけで、「Slackで雑にメンション→DMで構造化質問→チャンネルに正式投稿」の流れが作れる。  
 \* Personalized Learning: Instruction Versions テーブルにユーザーの修正履歴が溜まるため、これをFew-shotプロンプトの例としてGeminiに渡すことで、「いつものあの人の書き方」を学習・再現できる。  
 \* Team Knowledge Base: Context Assets を pgvector で検索可能にすることで、「社内規定に基づいて」という指示が可能になる。  
開発者（あなた）へのメッセージ  
このPRDは、Gemini 1.5 Flash/Proの特性（安価、高速、大容量コンテキスト）を前提に設計されています。  
まずは Step 1〜4 までを一気にCursorで生成し、ローカルで「ファイル添付 → 雑な指示 → 構造化」の魔法を体験してください。そこがPMF（Product Market Fit）の核心です。  
