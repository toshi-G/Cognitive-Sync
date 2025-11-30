"use client"

import * as React from "react"
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Paperclip, Send, FileText, Settings, ArrowRight } from "lucide-react"
import { useChat, Message } from "ai/react"
import ReactMarkdown from 'react-markdown'

interface InstructionData {
  title: string;
  summary: string;
  sections: { heading: string; content: string }[];
  missing_info?: string[];
}

export default function StudioPage({ params }: { params: { id: string } }) {
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat()
  const [previewData, setPreviewData] = React.useState<InstructionData | null>(null)

  // Extract JSON from the last assistant message
  React.useEffect(() => {
    const lastMessage = messages[messages.length - 1]
    if (lastMessage?.role === 'assistant') {
      const jsonMatch = lastMessage.content.match(/```json\n([\s\S]*?)\n```/)
      if (jsonMatch && jsonMatch[1]) {
        try {
          const data = JSON.parse(jsonMatch[1])
          setPreviewData(data)
        } catch (e) {
          console.error("Failed to parse JSON", e)
        }
      }
    }
  }, [messages])

  return (
    <div className="h-screen flex flex-col">
      <header className="h-14 border-b flex items-center px-4 justify-between">
        <div className="font-semibold">Cognitive Sync Studio</div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">Save Draft</Button>
          <Button size="sm">Publish</Button>
        </div>
      </header>
      <div className="flex-1 overflow-hidden">
        <ResizablePanelGroup direction="horizontal">
          {/* Left Panel: Context */}
          <ResizablePanel defaultSize={20} minSize={15} maxSize={30}>
            <div className="h-full flex flex-col p-4 gap-4">
              <div>
                <h3 className="font-semibold mb-2">Context Assets</h3>
                <Card className="border-dashed">
                  <CardContent className="flex flex-col items-center justify-center py-8 text-center text-sm text-muted-foreground">
                    <Paperclip className="h-8 w-8 mb-2" />
                    <p>Drag & drop files here</p>
                    <p className="text-xs">PDF, TXT, MD</p>
                  </CardContent>
                </Card>
              </div>
              <Separator />
              <div>
                <h3 className="font-semibold mb-2">Target Audience</h3>
                <Input placeholder="e.g. Junior Developer" />
              </div>
            </div>
          </ResizablePanel>

          <ResizableHandle />

          {/* Center Panel: Chat */}
          <ResizablePanel defaultSize={40} minSize={30}>
            <div className="h-full flex flex-col">
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  {messages.map((m: Message) => (
                    <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[80%] rounded-lg p-3 ${m.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                        <div className="whitespace-pre-wrap">{m.content.replace(/```json[\s\S]*?```/g, '')}</div>
                      </div>
                    </div>
                  ))}
                  {messages.length === 0 && (
                    <div className="text-center text-muted-foreground mt-20">
                      <h3 className="text-lg font-semibold">Start the Sync</h3>
                      <p>Describe your task or instruction roughly.</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
              <div className="p-4 border-t">
                <form onSubmit={handleSubmit} className="flex gap-2">
                  <Textarea
                    value={input}
                    onChange={handleInputChange}
                    placeholder="Type your instruction here..."
                    className="min-h-[80px]"
                  />
                  <Button type="submit" size="icon" disabled={isLoading}>
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              </div>
            </div>
          </ResizablePanel>

          <ResizableHandle />

          {/* Right Panel: Preview */}
          <ResizablePanel defaultSize={40} minSize={30}>
            <div className="h-full flex flex-col bg-muted/20">
              <div className="p-4 border-b bg-background flex items-center justify-between">
                <h3 className="font-semibold flex items-center">
                  <FileText className="mr-2 h-4 w-4" />
                  Live Preview
                </h3>
              </div>
              <ScrollArea className="flex-1 p-8">
                <div className="prose dark:prose-invert max-w-none">
                  {previewData ? (
                    <>
                      <h1>{previewData.title}</h1>
                      <p className="lead">{previewData.summary}</p>
                      {previewData.sections.map((section, idx) => (
                        <div key={idx}>
                          <h2>{section.heading}</h2>
                          <ReactMarkdown>{section.content}</ReactMarkdown>
                        </div>
                      ))}
                      {previewData.missing_info && previewData.missing_info.length > 0 && (
                        <div className="mt-8 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-900 rounded-md">
                          <h3 className="text-yellow-800 dark:text-yellow-200 mt-0">Missing Information</h3>
                          <ul>
                            {previewData.missing_info.map((info, i) => (
                              <li key={i} className="text-yellow-700 dark:text-yellow-300">{info}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-muted-foreground text-center mt-20">
                      <p>Preview will appear here...</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  )
}
