import { useState, useRef, useEffect } from 'react';
import { Send, MessageCircle, ThumbsUp, ThumbsDown, Flag } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { ScrollArea } from '../ui/scroll-area';
import { ChatMessage } from '../../types';
import { searchKnowledgeBase, getMockLLMResponse } from '../../lib/utils';
import { mockKnowledgeBase } from '../../lib/mockData';

interface AIChatProps {
  userId?: string;
}

export function AIChat({ userId }: AIChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!inputValue.trim()) return;

    const userMessage = inputValue;
    setInputValue('');
    setIsLoading(true);

    // Search knowledge base first
    const kbEntry = searchKnowledgeBase(userMessage, mockKnowledgeBase);
    
    let response: string;
    let source: 'knowledge_base' | 'llm';
    let kbEntryId: string | undefined;

    if (kbEntry) {
      response = kbEntry.answer;
      source = 'knowledge_base';
      kbEntryId = kbEntry.id;
    } else {
      // Fallback to mock LLM
      response = getMockLLMResponse(userMessage);
      source = 'llm';
    }

    const newMessage: ChatMessage = {
      id: `msg_${Date.now()}`,
      userId,
      message: userMessage,
      response,
      source,
      knowledgeBaseEntryId: kbEntryId,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, newMessage]);
    setIsLoading(false);
  };

  const handleRating = (messageId: string, rating: number) => {
    setMessages(prev => prev.map(msg => 
      msg.id === messageId ? { ...msg, userRating: rating } : msg
    ));

    // If rating is 0 (outrageous), flag for manager review
    const message = messages.find(m => m.id === messageId);
    if (rating === 0 && message?.source === 'knowledge_base') {
      // In production, this would flag the KB entry in the database
      console.log('Flagged for manager review:', message.knowledgeBaseEntryId);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Card className="h-[600px] flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="w-5 h-5" />
          AI Assistant
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col p-0">
        <ScrollArea className="flex-1 px-4" ref={scrollRef}>
          <div className="space-y-4 pb-4">
            {messages.length === 0 && (
              <div className="text-center text-muted-foreground py-8">
                <MessageCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Ask me anything about our restaurant!</p>
                <p className="text-sm mt-2">I can help with menu questions, hours, policies, and more.</p>
              </div>
            )}

            {messages.map((msg) => (
              <div key={msg.id} className="space-y-2">
                {/* User message */}
                <div className="flex justify-end">
                  <div className="bg-primary text-primary-foreground rounded-lg px-4 py-2 max-w-[80%]">
                    {msg.message}
                  </div>
                </div>

                {/* AI response */}
                <div className="flex flex-col items-start gap-2">
                  <div className="bg-muted rounded-lg px-4 py-2 max-w-[80%]">
                    {msg.response}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Badge variant={msg.source === 'knowledge_base' ? 'default' : 'secondary'} className="text-xs">
                      {msg.source === 'knowledge_base' ? 'Knowledge Base' : 'AI Generated'}
                    </Badge>

                    {msg.source === 'knowledge_base' && msg.userRating === undefined && (
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-muted-foreground">Rate:</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={() => handleRating(msg.id, 1)}
                        >
                          <ThumbsUp className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={() => handleRating(msg.id, 0)}
                        >
                          <Flag className="w-3 h-3" />
                        </Button>
                      </div>
                    )}

                    {msg.userRating !== undefined && (
                      <Badge variant="outline" className="text-xs">
                        {msg.userRating === 1 ? 'Helpful' : 'Flagged'}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-lg px-4 py-2">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 rounded-full bg-foreground/50 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 rounded-full bg-foreground/50 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 rounded-full bg-foreground/50 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="border-t p-4">
          <div className="flex gap-2">
            <Input
              placeholder="Type your question..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isLoading}
            />
            <Button onClick={handleSend} disabled={isLoading || !inputValue.trim()}>
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
