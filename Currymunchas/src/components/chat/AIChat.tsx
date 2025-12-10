import { useState, useRef, useEffect} from 'react';
import { Send, MessageCircle, ThumbsUp, ThumbsDown, Flag } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { ScrollArea } from '../ui/scroll-area';
import { ChatMessage } from '../../types';
import { searchKnowledgeBaseInFirestore, getGeminiResponse, flagKnowledgeBaseEntry } from '../../userService';
import { ElevenLabsClient, play } from '@elevenlabs/elevenlabs-js';
import { audio } from '@elevenlabs/elevenlabs-js/api/resources/dubbing';
import { FaCircleStop, FaMicrophone } from 'react-icons/fa6';

const API_KEY = import.meta.env.VITE_ELEVENLABS_API_KEY;

interface AIChatProps {
  userId?: string;
}

export function AIChat({ userId }: AIChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedURL, setRecordedURL] = useState<string | null>(null);
  const mediaStream = useRef<MediaStream | null>(null); // Media stream for recording
  const mediaRecorder = useRef<MediaRecorder | null>(null); // MediaRecorder instance
  const chunks = useRef<Blob[]>([]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const textToSpeech = async (text: string) => {
    try{
      const elevenlabs = new ElevenLabsClient({ apiKey: API_KEY });
      const audioStream = await elevenlabs.textToSpeech.convert(
        'gZL79pBTvaNfNPOCXh6n', // voice_id
        {
          text: text,
          modelId: 'eleven_multilingual_v2',
          outputFormat: 'mp3_44100_128', // output_format
        }
      );
      // Convert ReadableStream to ArrayBuffer
      const arrayBuffer = await new Response(audioStream).arrayBuffer();
      // Create Blob from ArrayBuffer
      const audioBlob = new Blob([arrayBuffer], { type: 'audio/mpeg' });
      // Create URL and play
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      // Clean up after playing
      audio.onended = () => {
        URL.revokeObjectURL(audioUrl);
      };
      
      await audio.play();
    } catch (error) {
      console.error('TTS Error:', error);
    }
  }

  const speechToText = async (audioUrl?: string) => {
    // Placeholder for future STT implementation
    try{
      const url = audioUrl || recordedURL;
      if (!url){
        throw new Error("Bro theres no recorded URL")
      }
      
      const elevenlabs = new ElevenLabsClient({ apiKey: API_KEY });
      const response = await fetch(url) //Getting that recording
      const audioBlob = new Blob([await response.arrayBuffer()], { type: 'audio/mp3' }); // Make recording into some file thingy 
      const transcription = await elevenlabs.speechToText.convert({
        file: audioBlob,
        modelId: "scribe_v1", // Model to use
        tagAudioEvents: true, // Tag audio events like laughter, applause, etc.
        languageCode: "eng", // Language of the audio file. If set to null, the model will detect the language automatically.
        diarize: true, // Whether to annotate who is speaking
      });
      
      console.log(transcription)
      setInputValue(transcription.text) 
      // NEED TO set transcription to current chat 

    } catch (error) {
      console.error('STT Error:', error);
    }
  }

  const startRecording = async () => {
    setIsRecording(true);
    // Placeholder for starting recording logic
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true }); // Request microphone access
      mediaStream.current = stream; // Store the media stream
      mediaRecorder.current = new MediaRecorder(stream); // Create MediaRecorder instance
      mediaRecorder.current.ondataavailable = (event) => {
        if (event.data.size > 0){
          chunks.current.push(event.data)
        }
      };
      mediaRecorder.current.onstop = () => {
        const recordedBlob = new Blob(chunks.current, {type: 'audio/mp3'})
        const url = URL.createObjectURL(recordedBlob)
        setRecordedURL(url)

        chunks.current = []
        
        // Call speechToText with the URL once it's ready
        speechToText(url);
      }
      mediaRecorder.current.start()

    } catch(error) {
      console.error('Recording Error:', error);
    }
  }

  const stopRecording = async () => {
    setIsRecording(false);
    // Placeholder for stopping recording logic
    try{
      if(mediaRecorder.current) {
        mediaRecorder.current.stop();
        if (mediaStream.current){
          mediaStream.current.getTracks().forEach( (track) => track.stop() )
        }
        // speechToText will be called in the onstop handler once the URL is ready

      } else {
        console.log("No mediaRecorder.current found")
      }
    } catch (error) {
      console.log("Error stopping recording:", error)
    }
  }

  const handleSend = async () => {
    if (!inputValue.trim()) return;

    const userMessage = inputValue;
    setInputValue('');
    setIsLoading(true);

    try {
      // Search knowledge base first
      const kbEntry = await searchKnowledgeBaseInFirestore(userMessage);
      
      let response: string;
      let source: 'knowledge_base' | 'llm';
      let kbEntryId: string | undefined;

      if (kbEntry) {
        response = kbEntry.answer;
        source = 'knowledge_base';
        kbEntryId = kbEntry.id;
      } else {
        // Fallback to Gemini LLM
        response = await getGeminiResponse(userMessage);
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
    } catch (error: any) {
      console.error('Error sending message:', error);
      const errorMessage: ChatMessage = {
        id: `msg_${Date.now()}`,
        userId,
        message: userMessage,
        response: 'Sorry, I encountered an error. Please try again.',
        source: 'llm',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRating = async (messageId: string, rating: number) => {
    setMessages(prev => prev.map(msg => 
      msg.id === messageId ? { ...msg, userRating: rating } : msg
    ));

    // If rating is 0 (outrageous), flag for manager review
    // Only allow flagging if user is logged in (visitors can't flag)
    const message = messages.find(m => m.id === messageId);
    if (rating === 0 && message?.source === 'knowledge_base' && message.knowledgeBaseEntryId && userId) {
      try {
        await flagKnowledgeBaseEntry(message.knowledgeBaseEntryId);
        console.log('Flagged knowledge base entry for manager review:', message.knowledgeBaseEntryId);
      } catch (error: any) {
        // Handle permission errors gracefully - visitors can't flag entries
        if (error.message?.includes('permission') || error.message?.includes('Permission') || 
            error.code === 'permission-denied' || error.code === 'PERMISSION_DENIED') {
          console.log('Cannot flag entry (likely visitor or insufficient permissions):', error.message);
        } else {
          console.error('Error flagging knowledge base entry:', error);
        }
      }
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
                    <br></br>
                    <button onClick={() => textToSpeech(msg.response)} className="text-xs text-blue-500 hover:underline cursor-pointer mt-2 right-0">
                      Play TTS
                    </button>
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
            {isRecording ? (
              <Button onClick={stopRecording} disabled={isLoading} className="cursor-pointer">
                <FaCircleStop className="w-4 h-4" />
              </Button>
            ) : (
              <Button onClick={startRecording} disabled={isLoading} className="cursor-pointer">
                <FaMicrophone className="w-4 h-4" />
              </Button>
            )}
            <Button onClick={handleSend} disabled={isLoading || !inputValue.trim()}>
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
