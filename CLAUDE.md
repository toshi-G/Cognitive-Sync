# CLAUDE.md - AI アシスタント開発ガイド

## プロジェクト概要

**Cognitive Sync**（コードネーム：命令くん）は、上司（指示者）と部下（受領者）の間に発生する「認知のズレ」を解消するAI駆動型コミュニケーション・オーケストレーションツールです。Google Geminiのロングコンテキスト機能を活用し、曖昧で断片的な指示を、構造化された実行可能な仕様書に変換します。

### コアバリュー

1. **Context-Aware（文脈認識）**: アップロードされたドキュメント（PDF、テキストファイル）を分析し、背景文脈を理解
2. **Socratic Clarification（ソクラテス式問答）**: AI駆動の質問によって不足情報を引き出す
3. **Structured Output（構造化出力）**: 雑な入力を完全で曖昧さのない指示書に変換

## 技術スタック

### フロントエンド
- **フレームワーク**: Next.js 16.0.5 (App Router)
- **言語**: TypeScript 5.x（厳格モード有効）
- **スタイリング**: Tailwind CSS 4.x
- **UIコンポーネント**: shadcn/ui（Radix UIプリミティブ）
- **アイコン**: Lucide React
- **状態管理**:
  - React Hooks（ローカル状態）
  - Nuqs（URL状態管理）
  - Vercel AI SDKの`useChat`フック（チャット用）

### バックエンド/API
- **アーキテクチャ**: Next.js Server Actions & API Routes（独立したバックエンドなし）
- **ランタイム**: Edge Runtime（AIルートのmaxDuration: 30秒）
- **データベース**: Supabase（pgvector拡張付きPostgreSQL）
- **認証**: Supabase Auth（予定：Google & Emailプロバイダー）

### AI/ML
- **主要モデル**: Google Gemini 1.5 Pro (`gemini-1.5-pro-latest`)
  - 用途：複雑な推論、文脈分析、指示の構造化
- **高速モデル**: Google Gemini 1.5 Flash（予定：高速インタラクション用）
- **SDK**: Vercel AI SDK (`ai`パッケージ) + `@ai-sdk/google`
- **パターン**: ストリーミングテキストレスポンス + 構造化JSON抽出

## プロジェクト構造

```
Cognitive-Sync/
├── app/                          # Next.js App Router
│   ├── api/
│   │   └── chat/
│   │       └── route.ts         # AIチャットエンドポイント（Geminiストリーミング）
│   ├── dashboard/
│   │   └── page.tsx             # メインダッシュボード（指示一覧）
│   ├── studio/
│   │   └── [id]/
│   │       └── page.tsx         # コア3パネルワークスペース
│   ├── settings/
│   │   └── page.tsx             # ユーザー設定（予定）
│   ├── layout.tsx               # ルートレイアウト（メタデータ付き）
│   ├── page.tsx                 # ルート（ダッシュボードへリダイレクト）
│   └── globals.css              # Tailwindグローバルスタイル
├── components/
│   └── ui/                      # shadcn/uiコンポーネント
│       ├── button.tsx
│       ├── card.tsx
│       ├── resizable.tsx        # Studio 3パネルレイアウトで使用
│       ├── scroll-area.tsx
│       └── ...                  # その他のUIプリミティブ
├── lib/
│   ├── supabase.ts              # Supabaseクライアント設定
│   └── utils.ts                 # ユーティリティ関数（cnヘルパー）
├── public/                      # 静的アセット
├── .gitignore
├── components.json              # shadcn/ui設定
├── package.json
├── tsconfig.json
├── next.config.ts
├── Meirei-kun_PRD.md           # 詳細な製品要求仕様書（日本語）
└── README.md                    # クイックスタートガイド
```

## 主要ファイルの責務

### `/app/api/chat/route.ts`
- **目的**: 指示の洗練のためのAIチャットエンドポイント
- **モデル**: Gemini 1.5 Pro
- **システムプロンプト**: 「ソクラテス式PM」ペルソナを実装
- **レスポンス形式**: 埋め込みJSONブロック付きストリーミングテキスト
- **主要パターン**:
  ```typescript
  streamText({
    model: google('gemini-1.5-pro-latest'),
    system: SYSTEM_PROMPT,
    messages: convertToCoreMessages(messages)
  })
  ```

### `/app/studio/[id]/page.tsx`
- **アーキテクチャ**: 3パネルのリサイズ可能レイアウト
  - **左パネル**: コンテキストアセット（ファイルアップロード、ターゲット読者入力）
  - **中央パネル**: Gemini AIとのチャットインターフェース
  - **右パネル**: 構造化された指示書のライブプレビュー
- **状態管理**:
  - Vercel AI SDKの`useChat()`
  - プレビューデータ抽出用のローカル状態
- **主要パターン**: AIレスポンス内のマークダウンコードブロックからJSONを抽出
  ```typescript
  const jsonMatch = message.content.match(/```json\n([\s\S]*?)\n```/)
  ```

### `/lib/supabase.ts`
- **目的**: Supabaseクライアントシングルトン
- **パターン**: 環境変数を使用した設定
- **必要な環境変数**:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## データベーススキーマ（予定）

以下のスキーマはPRDで定義されていますが、まだ完全には実装されていません：

### テーブル一覧

#### `profiles`
- Supabase Authに連携されたユーザー情報
- フィールド: `id`, `email`, `display_name`, `role`, `tone_preference`

#### `workspaces`
- チーム/プロジェクトの組織単位（将来のマルチチームサポート用）
- フィールド: `id`, `name`, `owner_id`

#### `context_assets`
- アップロードされたドキュメント（PDF、テキストファイル、URL）
- フィールド: `id`, `workspace_id`, `user_id`, `file_name`, `file_type`, `content_text`, `summary_embedding`
- **注記**: `summary_embedding`は将来のRAG実装のためpgvectorを使用

#### `instructions`
- コアエンティティ：生成された指示書ドキュメント
- フィールド: `id`, `user_id`, `workspace_id`, `original_input`, `clarified_context`, `structured_output` (JSONB), `final_text`, `status`

#### `instruction_versions`
- 学習と反復のためのバージョン履歴
- フィールド: `id`, `instruction_id`, `content` (JSONB), `feedback_score`

## AIシステムプロンプトアーキテクチャ

`/app/api/chat/route.ts`に配置されており、AIの振る舞いを定義します：

### ロール定義
- **ペルソナ**: 世界最高峰のプロジェクトマネージャー兼エディター
- **目標**: 曖昧な入力を完璧な仕様書に変換

### コア行動ルール

1. **Context First（コンテキスト優先）**: アップロードされたドキュメントを真実の情報源として優先
2. **Socratic Questioning（ソクラテス式問答）**: 不足要素について明確化する質問を行う：
   - 具体的な期限（When）
   - 完了基準（Quality）
   - ターゲット読者（Who for）
   - 理由（Why/Intent）
3. **Structure（構造化）**: 常にMarkdown形式で出力

### 出力スキーマ

AIはレスポンス内にJSONブロックを埋め込むよう指示されています：

```json
{
  "title": "タスクのタイトル",
  "summary": "1行要約",
  "sections": [
    { "heading": "背景・目的", "content": "..." },
    { "heading": "具体的タスク", "content": "..." },
    { "heading": "完了要件", "content": "..." }
  ],
  "missing_info": ["期限", "ターゲット読者"]
}
```

## 開発ワークフロー

### 開発環境のセットアップ

```bash
# 依存関係のインストール
npm install

# 環境変数の設定
# .env.localを作成し、以下を記述：
# - NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
# - NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
# - GOOGLE_GENERATIVE_AI_API_KEY=your_gemini_key

# 開発サーバーの起動
npm run dev
```

### 新しいUIコンポーネントの追加

このプロジェクトはshadcn/uiを使用しています。コンポーネント追加方法：

```bash
npx shadcn@latest add [component-name]
```

`components.json`の設定：
- スタイル: "new-york"
- RSC: 有効
- ベースカラー: Neutral
- アイコンライブラリ: Lucide

### コーディング規約

#### TypeScript
- **厳格モード**: 有効
- **ターゲット**: ES2017
- **モジュール解決**: Bundler
- **パスエイリアス**: `@/*`がプロジェクトルートにマッピング

#### インポートパターン
```typescript
// UIコンポーネント
import { Button } from "@/components/ui/button"

// ライブラリユーティリティ
import { supabase } from "@/lib/supabase"
import { cn } from "@/lib/utils"

// 外部パッケージ
import { useChat } from "ai/react"
```

#### コンポーネント構造
- インタラクティブなコンポーネントには`"use client"`ディレクティブを使用
- TypeScriptインターフェースを持つ関数コンポーネントを優先
- shadcn/uiラッパーを通じてRadix UIプリミティブを使用

#### スタイリング
- Tailwindユーティリティクラス
- 条件付きクラスには`@/lib/utils`の`cn()`ヘルパーを使用
- shadcn/uiのカラーシステムに従う（muted、primaryなど）

## AIアシスタントガイドライン

### コードベース変更時の注意点

1. **技術スタックの尊重**: 指定されたスタック外の技術を導入しない
2. **ファイル構造の維持**: 確立されたディレクトリ構成を保つ
3. **命名規則に従う**:
   - ファイル: ページはkebab-case、コンポーネントはPascalCase
   - コンポーネント: PascalCase
   - 関数: camelCase
   - データベース: snake_case

### 主要なアーキテクチャ決定

1. **外部バックエンドなし**: すべてNext.js上で動作（App Router + Server Actions）
2. **ストリーミング優先**: レスポンシブなUXのためVercel AI SDKのストリーミング機能を使用
3. **クライアントサイド抽出**: AIレスポンスからのJSON抽出はReactコンポーネント内で実行
4. **リサイズ可能パネル**: Studioは柔軟なワークスペースのため`react-resizable-panels`を使用

### 共通パターン

#### 新しいページの作成
```typescript
// app/new-page/page.tsx
export default function NewPage() {
  return (
    <div className="container mx-auto py-10">
      {/* コンテンツ */}
    </div>
  )
}
```

#### Server Actionsの追加
```typescript
// app/actions.ts
'use server'

export async function saveInstruction(data: InstructionData) {
  // Supabaseを使用したサーバーサイドロジック
}
```

#### AIストリーミングの統合
```typescript
'use client'
import { useChat } from 'ai/react'

export default function ChatComponent() {
  const { messages, input, handleInputChange, handleSubmit } = useChat()
  // UIで使用
}
```

### 機能追加時の注意点

1. **PRDを確認**: `Meirei-kun_PRD.md`で意図された機能を参照
2. **データベース優先**: 機能実装前にデータベース変更を計画
3. **UIコンポーネント**: カスタムコンポーネント作成前に既存のshadcn/uiコンポーネントを再利用
4. **AIプロンプト**: デプロイ前にプロンプト変更を単体でテスト

### テストの考慮事項

- **手動テスト**: 現在、自動テストスイートなし
- **テストフロー**:
  1. Dashboard → New Instruction → Studio
  2. AIとのチャットインタラクション
  3. JSON抽出とプレビューレンダリング
  4. リサイズ可能パネルの動作

## 環境変数

ローカル開発とデプロイに必要：

```bash
# Supabase設定
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Google Gemini API
GOOGLE_GENERATIVE_AI_API_KEY=your-gemini-api-key
```

## 将来のロードマップ（PRDより）

### 予定されている機能

1. **ファイルアップロード実装**
   - PDF、TXT、MDファイルのサポート
   - テキスト抽出とGeminiプロンプトへのコンテキスト注入

2. **Slack Bot統合**
   - `/api/chat`エンドポイントの再利用
   - Slack Event API統合
   - フロー: Slackメンション → DM問答 → チャンネル投稿

3. **パーソナライズド学習**
   - `instruction_versions`にユーザー編集を保存
   - プロンプト内のFew-shot例として使用
   - 個人の文体を学習

4. **チームナレッジベース**
   - pgvectorによるRAG実装
   - `context_assets`全体の検索
   - 「社内規定に基づいて」というクエリ対応

5. **認証**
   - Supabase Auth統合
   - Google OAuthプロバイダー
   - Email/パスワード認証

6. **指示書の永続化**
   - Supabaseへの下書き保存
   - 公開とアーカイブ機能
   - バージョン履歴追跡

## よくある問題と解決策

### 問題: Gemini APIエラー
- **解決策**: 環境変数の`GOOGLE_GENERATIVE_AI_API_KEY`を確認
- **レート制限**: Gemini 1.5 ProはFlashよりもレート制限が低い

### 問題: JSON抽出の失敗
- **原因**: AIがマークダウンブロック内に有効なJSONを出力していない
- **解決策**: システムプロンプトを改良するか、パース処理にエラーハンドリングを追加

### 問題: Supabase接続の失敗
- **解決策**: 環境変数とSupabaseプロジェクトのステータスを確認
- **確認事項**: ブラウザコンソールでCORS問題をチェック

## パフォーマンスの考慮事項

1. **Edge Runtime**: チャットAPIは低レイテンシーのためEdgeを使用
2. **ストリーミング**: クライアントへのストリーミングレスポンスで体感パフォーマンスを向上
3. **クライアントサイドレンダリング**: Studioページはインタラクティビティのため`"use client"`を使用
4. **バンドルサイズ**: Tailwind CSSは本番環境向けに最適化

## セキュリティノート

1. **APIキー**: `.env.local`をバージョン管理にコミットしない
2. **Supabase RLS**: 本番環境では行レベルセキュリティポリシーを実装すべき
3. **入力検証**: データベース操作前にユーザー入力をサニタイズ
4. **CORS**: Next.jsを通じてAPIルート向けに設定

## デプロイ

**対象プラットフォーム**: Vercel

### デプロイチェックリスト
1. Vercelダッシュボードで環境変数を設定
2. GitHubリポジトリを接続
3. 本番環境用にSupabaseプロジェクトを設定
4. Vercel AI SDK機能を有効化
5. 本番環境でストリーミング機能をテスト

## コントリビューションガイドライン

### AIアシスタント向け

1. **書く前に読む**: 変更前に必ず既存ファイルを読む
2. **構造を保つ**: Studio 3パネルレイアウトパターンを維持
3. **ローカルテスト**: `npm run dev`で変更を検証
4. **変更を文書化**: 主要機能追加時はこのCLAUDE.mdを更新
5. **PRDに従う**: 機能要件は`Meirei-kun_PRD.md`を参照

### コード品質

- 適切な型を持つTypeScriptを記述（`any`を避ける）
- 可能な限りReact Server Componentsを使用（App Routerのデフォルト）
- 巧妙さより可読性を最適化
- 複雑なAIプロンプトロジックにはコメントを付ける

## リソース

- **Next.js ドキュメント**: https://nextjs.org/docs
- **Vercel AI SDK**: https://sdk.vercel.ai/docs
- **shadcn/ui**: https://ui.shadcn.com
- **Supabase ドキュメント**: https://supabase.com/docs
- **Gemini API**: https://ai.google.dev/docs

## 質問とサポート

このコードベースに関する質問：
1. 製品コンテキストについてはPRD（`Meirei-kun_PRD.md`）を確認
2. アーキテクチャガイダンスについてはこのCLAUDE.mdを確認
3. 類似機能の既存コードパターンを調査
4. 開発サーバーで段階的に変更をテスト

---

**最終更新日**: 2025-11-30
**プロジェクトバージョン**: 0.1.0（初期開発段階）
**ステータス**: 開発中 - コア機能実装済み、データベース統合は保留中
