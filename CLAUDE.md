# CLAUDE.md - AI Assistant Development Guide

## Project Overview

**Cognitive Sync** (Codename: Meirei-kun) is an AI-driven communication orchestration tool designed to bridge the "cognitive gap" between managers (instructors) and team members (recipients). It transforms ambiguous, fragmented instructions into structured, executable specifications using Google Gemini's long-context capabilities.

### Core Value Proposition

1. **Context-Aware**: Analyzes uploaded documents (PDFs, text files) to understand background context
2. **Socratic Clarification**: Uses AI-driven questioning to extract missing information
3. **Structured Output**: Converts rough input into complete, unambiguous instruction documents

## Technology Stack

### Frontend
- **Framework**: Next.js 16.0.5 (App Router)
- **Language**: TypeScript 5.x with strict mode enabled
- **Styling**: Tailwind CSS 4.x
- **UI Components**: shadcn/ui (Radix UI primitives)
- **Icons**: Lucide React
- **State Management**:
  - React Hooks (local state)
  - Nuqs (URL state management)
  - Vercel AI SDK's `useChat` hook for chat interactions

### Backend/API
- **Architecture**: Next.js Server Actions & API Routes (no separate backend)
- **Runtime**: Edge Runtime (maxDuration: 30s for AI routes)
- **Database**: Supabase (PostgreSQL with pgvector extension)
- **Authentication**: Supabase Auth (planned: Google & Email providers)

### AI/ML
- **Primary Model**: Google Gemini 1.5 Pro (`gemini-1.5-pro-latest`)
  - Used for: Complex reasoning, context analysis, instruction structuring
- **Fast Model**: Google Gemini 1.5 Flash (planned for quick interactions)
- **SDK**: Vercel AI SDK (`ai` package) with `@ai-sdk/google`
- **Pattern**: Streaming text responses with structured JSON extraction

## Project Structure

```
Cognitive-Sync/
├── app/                          # Next.js App Router
│   ├── api/
│   │   └── chat/
│   │       └── route.ts         # AI chat endpoint (Gemini streaming)
│   ├── dashboard/
│   │   └── page.tsx             # Main dashboard (instruction list)
│   ├── studio/
│   │   └── [id]/
│   │       └── page.tsx         # Core 3-panel workspace
│   ├── settings/
│   │   └── page.tsx             # User preferences (planned)
│   ├── layout.tsx               # Root layout with metadata
│   ├── page.tsx                 # Root redirect to dashboard
│   └── globals.css              # Tailwind global styles
├── components/
│   └── ui/                      # shadcn/ui components
│       ├── button.tsx
│       ├── card.tsx
│       ├── resizable.tsx        # Used in Studio 3-panel layout
│       ├── scroll-area.tsx
│       └── ...                  # Other UI primitives
├── lib/
│   ├── supabase.ts              # Supabase client configuration
│   └── utils.ts                 # Utility functions (cn helper)
├── public/                      # Static assets
├── .gitignore
├── components.json              # shadcn/ui configuration
├── package.json
├── tsconfig.json
├── next.config.ts
├── Meirei-kun_PRD.md           # Detailed Product Requirements (Japanese)
└── README.md                    # Quick start guide
```

## Key File Responsibilities

### `/app/api/chat/route.ts`
- **Purpose**: AI chat endpoint for instruction refinement
- **Model**: Gemini 1.5 Pro
- **System Prompt**: Implements the "Socratic PM" persona
- **Response Format**: Streaming text with embedded JSON blocks
- **Key Pattern**:
  ```typescript
  streamText({
    model: google('gemini-1.5-pro-latest'),
    system: SYSTEM_PROMPT,
    messages: convertToCoreMessages(messages)
  })
  ```

### `/app/studio/[id]/page.tsx`
- **Architecture**: 3-panel resizable layout
  - **Left Panel**: Context assets (file upload, target audience input)
  - **Center Panel**: Chat interface with Gemini AI
  - **Right Panel**: Live preview of structured instruction
- **State Management**:
  - `useChat()` from Vercel AI SDK
  - Local state for preview data extraction
- **Key Pattern**: Extracts JSON from markdown code blocks in AI responses
  ```typescript
  const jsonMatch = message.content.match(/```json\n([\s\S]*?)\n```/)
  ```

### `/lib/supabase.ts`
- **Purpose**: Supabase client singleton
- **Pattern**: Uses environment variables for configuration
- **Required ENV**:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Database Schema (Planned)

The following schema is defined in the PRD but not yet fully implemented:

### Tables

#### `profiles`
- User information linked to Supabase Auth
- Fields: `id`, `email`, `display_name`, `role`, `tone_preference`

#### `workspaces`
- Team/project organization unit (for future multi-team support)
- Fields: `id`, `name`, `owner_id`

#### `context_assets`
- Uploaded documents (PDFs, text files, URLs)
- Fields: `id`, `workspace_id`, `user_id`, `file_name`, `file_type`, `content_text`, `summary_embedding`
- **Note**: `summary_embedding` uses pgvector for future RAG implementation

#### `instructions`
- Core entity: generated instruction documents
- Fields: `id`, `user_id`, `workspace_id`, `original_input`, `clarified_context`, `structured_output` (JSONB), `final_text`, `status`

#### `instruction_versions`
- Version history for learning and iteration
- Fields: `id`, `instruction_id`, `content` (JSONB), `feedback_score`

## AI System Prompt Architecture

Located in `/app/api/chat/route.ts`, the system prompt defines the AI's behavior:

### Role Definition
- **Persona**: World-class project manager and editor
- **Goal**: Convert ambiguous input into perfect specifications

### Core Behavior Rules

1. **Context First**: Prioritize uploaded documents as source of truth
2. **Socratic Questioning**: Ask clarifying questions for missing elements:
   - Specific deadlines (When)
   - Completion criteria (Quality)
   - Target audience (Who for)
   - Rationale (Why/Intent)
3. **Structure**: Always output in Markdown format

### Output Schema

The AI is instructed to embed JSON blocks in its responses:

```json
{
  "title": "Task title",
  "summary": "One-line summary",
  "sections": [
    { "heading": "Background & Purpose", "content": "..." },
    { "heading": "Specific Tasks", "content": "..." },
    { "heading": "Completion Requirements", "content": "..." }
  ],
  "missing_info": ["deadline", "target audience"]
}
```

## Development Workflows

### Setting Up the Development Environment

```bash
# Install dependencies
npm install

# Set up environment variables
# Create .env.local with:
# - NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
# - NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
# - GOOGLE_GENERATIVE_AI_API_KEY=your_gemini_key

# Run development server
npm run dev
```

### Adding New UI Components

This project uses shadcn/ui. To add components:

```bash
npx shadcn@latest add [component-name]
```

Configuration is in `components.json`:
- Style: "new-york"
- RSC: Enabled
- Base color: Neutral
- Icon library: Lucide

### Code Conventions

#### TypeScript
- **Strict mode**: Enabled
- **Target**: ES2017
- **Module resolution**: Bundler
- **Path aliases**: `@/*` maps to project root

#### Import Patterns
```typescript
// UI components
import { Button } from "@/components/ui/button"

// Lib utilities
import { supabase } from "@/lib/supabase"
import { cn } from "@/lib/utils"

// External packages
import { useChat } from "ai/react"
```

#### Component Structure
- Use `"use client"` directive for interactive components
- Prefer functional components with TypeScript interfaces
- Use Radix UI primitives through shadcn/ui wrappers

#### Styling
- Tailwind utility classes
- Use `cn()` helper from `@/lib/utils` for conditional classes
- Follow shadcn/ui color system (muted, primary, etc.)

## AI Assistant Guidelines

### When Modifying the Codebase

1. **Respect the Tech Stack**: Do not introduce technologies outside the specified stack
2. **Maintain File Structure**: Keep the established directory organization
3. **Follow Naming Conventions**:
   - Files: kebab-case for pages, PascalCase for components
   - Components: PascalCase
   - Functions: camelCase
   - Database: snake_case

### Key Architectural Decisions

1. **No External Backend**: Everything runs on Next.js (App Router + Server Actions)
2. **Streaming First**: Use Vercel AI SDK's streaming capabilities for responsive UX
3. **Client-Side Extraction**: JSON extraction from AI responses happens in React components
4. **Resizable Panels**: The Studio uses `react-resizable-panels` for flexible workspace

### Common Patterns

#### Creating a New Page
```typescript
// app/new-page/page.tsx
export default function NewPage() {
  return (
    <div className="container mx-auto py-10">
      {/* Content */}
    </div>
  )
}
```

#### Adding Server Actions
```typescript
// app/actions.ts
'use server'

export async function saveInstruction(data: InstructionData) {
  // Server-side logic with Supabase
}
```

#### Integrating AI Streaming
```typescript
'use client'
import { useChat } from 'ai/react'

export default function ChatComponent() {
  const { messages, input, handleInputChange, handleSubmit } = useChat()
  // Use in your UI
}
```

### When Adding Features

1. **Check the PRD**: Reference `Meirei-kun_PRD.md` for intended functionality
2. **Database First**: Plan database changes before implementing features
3. **UI Components**: Reuse existing shadcn/ui components before creating custom ones
4. **AI Prompts**: Test prompt changes in isolation before deploying

### Testing Considerations

- **Manual Testing**: Currently no automated test suite
- **Test Flows**:
  1. Dashboard → New Instruction → Studio
  2. Chat interaction with AI
  3. JSON extraction and preview rendering
  4. Resizable panel behavior

## Environment Variables

Required for local development and deployment:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Google Gemini API
GOOGLE_GENERATIVE_AI_API_KEY=your-gemini-api-key
```

## Future Roadmap (Per PRD)

### Planned Features

1. **File Upload Implementation**
   - Support for PDF, TXT, MD files
   - Text extraction and context injection into Gemini prompts

2. **Slack Bot Integration**
   - Reuse `/api/chat` endpoint
   - Slack Event API integration
   - Flow: Slack mention → DM clarification → Channel post

3. **Personalized Learning**
   - Store user edits in `instruction_versions`
   - Use as few-shot examples in prompts
   - Learn individual writing styles

4. **Team Knowledge Base**
   - RAG implementation with pgvector
   - Search across `context_assets`
   - "Based on company guidelines" queries

5. **Authentication**
   - Supabase Auth integration
   - Google OAuth provider
   - Email/password authentication

6. **Instruction Persistence**
   - Save drafts to Supabase
   - Publish and archive functionality
   - Version history tracking

## Common Issues & Solutions

### Issue: Gemini API Errors
- **Solution**: Check `GOOGLE_GENERATIVE_AI_API_KEY` in environment
- **Rate Limits**: Gemini 1.5 Pro has lower rate limits than Flash

### Issue: JSON Extraction Fails
- **Cause**: AI didn't output valid JSON in markdown block
- **Solution**: Refine system prompt or add error handling in parsing logic

### Issue: Supabase Connection Fails
- **Solution**: Verify environment variables and Supabase project status
- **Check**: Browser console for CORS issues

## Performance Considerations

1. **Edge Runtime**: Chat API uses Edge for low latency
2. **Streaming**: Responses stream to client, improving perceived performance
3. **Client-Side Rendering**: Studio page uses `"use client"` for interactivity
4. **Bundle Size**: Tailwind CSS is optimized for production

## Security Notes

1. **API Keys**: Never commit `.env.local` to version control
2. **Supabase RLS**: Row-Level Security policies should be implemented in production
3. **Input Validation**: Sanitize user inputs before database operations
4. **CORS**: Configured through Next.js for API routes

## Deployment

**Target Platform**: Vercel

### Deployment Checklist
1. Set environment variables in Vercel dashboard
2. Connect GitHub repository
3. Configure Supabase project for production
4. Enable Vercel AI SDK features
5. Test streaming functionality in production

## Contributing Guidelines

### For AI Assistants

1. **Read Before Writing**: Always read existing files before modifying
2. **Preserve Structure**: Maintain the 3-panel Studio layout pattern
3. **Test Locally**: Verify changes with `npm run dev`
4. **Document Changes**: Update this CLAUDE.md if adding major features
5. **Follow PRD**: Reference `Meirei-kun_PRD.md` for feature requirements

### Code Quality

- Write TypeScript with proper types (avoid `any`)
- Use React Server Components where possible (default in App Router)
- Optimize for readability over cleverness
- Comment complex AI prompt logic

## Resources

- **Next.js Docs**: https://nextjs.org/docs
- **Vercel AI SDK**: https://sdk.vercel.ai/docs
- **shadcn/ui**: https://ui.shadcn.com
- **Supabase Docs**: https://supabase.com/docs
- **Gemini API**: https://ai.google.dev/docs

## Questions & Support

For questions about this codebase:
1. Review the PRD (`Meirei-kun_PRD.md`) for product context
2. Check this CLAUDE.md for architectural guidance
3. Examine existing code patterns in similar features
4. Test changes incrementally with the development server

---

**Last Updated**: 2025-11-30
**Project Version**: 0.1.0 (Early Development)
**Status**: Active Development - Core features implemented, database integration pending
