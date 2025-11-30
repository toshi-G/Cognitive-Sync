-- Enable UUID and Vector extensions
create extension if not exists "uuid-ossp";
create extension if not exists "vector";

-- 1. Users: ユーザー情報
create table profiles (
  id uuid references auth.users on delete cascade not null primary key,
  email text not null,
  display_name text,
  role text default 'manager', -- manager | member
  tone_preference text default 'neutral', -- ユーザー好みの口調設定
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Workspaces: チーム/プロジェクト単位（拡張性用）
create table workspaces (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  owner_id uuid references profiles(id) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Context Assets: 指示の背景となる資料（Geminiに読ませるもの）
create table context_assets (
  id uuid default uuid_generate_v4() primary key,
  workspace_id uuid references workspaces(id),
  user_id uuid references profiles(id),
  file_name text not null,
  file_type text not null, -- pdf, txt, md, url
  content_text text, -- 抽出したテキストデータ
  summary_embedding vector(768), -- 将来的なRAG用
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. Instructions: 生成された指示書（コアエンティティ）
create table instructions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id) not null,
  workspace_id uuid references workspaces(id),
  original_input text, -- 最初の雑な入力
  clarified_context text, -- AIとの対話で判明した追加情報
  structured_output jsonb, -- { background, tasks, criteria, deadline, tone }
  final_text text, -- コピー用テキスト
  status text default 'draft', -- draft | published | archived
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. Instruction Versions: 学習用・履歴用
create table instruction_versions (
  id uuid default uuid_generate_v4() primary key,
  instruction_id uuid references instructions(id) on delete cascade,
  content jsonb,
  feedback_score int, -- ユーザーによる1-5評価
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
