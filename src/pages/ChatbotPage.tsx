import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, Send, User, Languages, Sparkles, ShieldCheck, Phone } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { chatbotService } from "@/services/chatbot";
import { dataService } from "@/services/data";
import { cn } from "@/lib/utils";
import type { ChatMessage, Language } from "@/types";

const LANGS: { id: Language; label: string; native: string; flag: string }[] = [
  { id: "en", label: "English", native: "English", flag: "EN" },
  { id: "te", label: "Telugu", native: "తెలుగు", flag: "TE" },
  { id: "hi", label: "Hindi", native: "हिन्दी", flag: "HI" },
];

const SUGGESTIONS: Record<Language, string[]> = {
  en: ["Should I trust this call?", "They want my OTP", "CBI officer threatening arrest"],
  te: ["Ee call nijamena?", "OTP adugutunnaru", "Police arrest antunnaru"],
  hi: ["Kya yeh fraud hai?", "OTP maang rahe hain", "CBI arrest karayenge"],
};

const SESSION_ID = `session_${Date.now()}`;

interface DisplayMessage extends ChatMessage {
  intent?: string;
}

export function ChatbotPage() {
  const [lang, setLang] = useState<Language>("en");
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<DisplayMessage[]>([
    {
      sessionId: SESSION_ID,
      role: "assistant",
      language: "en",
      content: "I'm your Citizen Fraud Shield. Tell me about the call, SMS, or message you received, and I'll tell you if it's safe.",
    },
  ]);
  const [typing, setTyping] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing]);

  const send = async (text: string) => {
    if (!text.trim()) return;
    const userMsg: DisplayMessage = { sessionId: SESSION_ID, role: "user", language: lang, content: text };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setTyping(true);

    await new Promise((r) => setTimeout(r, 600 + Math.random() * 500));
    const result = chatbotService.respond(text, lang);
    setTyping(false);
    const botMsg: DisplayMessage = { sessionId: SESSION_ID, role: "assistant", language: result.language, content: result.reply, intent: result.intent };
    setMessages((m) => [...m, botMsg]);

    dataService.saveChatMessages([userMsg, botMsg]).catch(() => {});
  };

  return (
    <div className="mx-auto max-w-[1400px] space-y-6 px-6 py-8">
      <PageHeader
        title="Citizen Fraud Shield Chatbot"
        description="Multilingual AI assistant — ask in English, Telugu, or Hindi whether a call, message, or demand is safe."
        icon={<Bot size={22} />}
        actions={
          <div className="flex items-center gap-1.5 rounded-lg border border-success/30 bg-success/10 px-3 py-1.5">
            <ShieldCheck size={15} className="text-success" />
            <span className="text-xs font-medium text-success">3 languages</span>
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card className="flex h-[600px] flex-col border-border/60">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 border-b border-border/60">
              <div className="flex items-center gap-2">
                <div className="grid h-9 w-9 place-items-center rounded-lg bg-gradient-to-br from-primary to-accent text-primary-foreground">
                  <Bot size={18} />
                </div>
                <div>
                  <CardTitle className="text-sm">Fraud Shield Assistant</CardTitle>
                  <p className="text-xs text-success">Online · responds instantly</p>
                </div>
              </div>
              <Languages size={16} className="text-muted-foreground" />
            </CardHeader>

            <div className="flex-1 space-y-4 overflow-y-auto p-4">
              {messages.map((m, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn("flex gap-3", m.role === "user" ? "flex-row-reverse" : "")}
                >
                  <div className={cn(
                    "grid h-8 w-8 shrink-0 place-items-center rounded-full",
                    m.role === "user" ? "bg-secondary text-secondary-foreground" : "bg-gradient-to-br from-primary to-accent text-primary-foreground"
                  )}>
                    {m.role === "user" ? <User size={15} /> : <Bot size={15} />}
                  </div>
                  <div className={cn("max-w-[78%] rounded-2xl px-4 py-2.5", m.role === "user" ? "bg-primary text-primary-foreground rounded-tr-sm" : "bg-card border border-border/60 rounded-tl-sm")}>
                    <p className="text-sm leading-relaxed">{m.content}</p>
                    {m.intent && m.intent !== "fallback" && (
                      <Badge variant="outline" className="mt-2 text-[9px] capitalize opacity-70">{m.intent.replace("_", " ")}</Badge>
                    )}
                  </div>
                </motion.div>
              ))}

              <AnimatePresence>
                {typing && (
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex gap-3">
                    <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-gradient-to-br from-primary to-accent text-primary-foreground">
                      <Bot size={15} />
                    </div>
                    <div className="flex items-center gap-1 rounded-2xl rounded-tl-sm border border-border/60 bg-card px-4 py-3">
                      {[0, 1, 2].map((d) => (
                        <motion.span key={d} className="h-1.5 w-1.5 rounded-full bg-primary" animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1, delay: d * 0.2, repeat: Infinity }} />
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              <div ref={endRef} />
            </div>

            <div className="border-t border-border/60 p-3">
              <div className="flex gap-2">
                <Textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input); } }}
                  placeholder={`Ask in ${LANGS.find((l) => l.id === lang)?.native}...`}
                  className="min-h-[44px] max-h-24 resize-none bg-muted/20"
                  rows={1}
                />
                <Button onClick={() => send(input)} disabled={!input.trim() || typing} size="icon" className="h-11 w-11 shrink-0">
                  <Send size={17} />
                </Button>
              </div>
            </div>
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="border-border/60">
            <CardHeader>
              <CardTitle className="text-base">Language</CardTitle>
              <p className="text-xs text-muted-foreground">Choose your preferred language</p>
            </CardHeader>
            <CardContent className="space-y-2">
              {LANGS.map((l) => (
                <button
                  key={l.id}
                  onClick={() => setLang(l.id)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors",
                    lang === l.id ? "border-primary/40 bg-primary/5" : "border-border/40 hover:border-border"
                  )}
                >
                  <span className="grid h-8 w-8 place-items-center rounded-md bg-muted text-xs font-bold">{l.flag}</span>
                  <div>
                    <p className="text-sm font-medium">{l.native}</p>
                    <p className="text-[11px] text-muted-foreground">{l.label}</p>
                  </div>
                  {lang === l.id && <ShieldCheck size={15} className="ml-auto text-primary" />}
                </button>
              ))}
            </CardContent>
          </Card>

          <Card className="border-border/60">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2"><Sparkles size={15} className="text-primary" /> Try asking</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {SUGGESTIONS[lang].map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="w-full rounded-lg border border-border/40 bg-card/30 p-2.5 text-left text-sm transition-colors hover:border-primary/40 hover:bg-primary/5"
                >
                  "{s}"
                </button>
              ))}
            </CardContent>
          </Card>

          <Card className="border-destructive/30 bg-destructive/5">
            <CardContent className="flex items-center gap-3 p-4">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-destructive/15 text-destructive">
                <Phone size={18} />
              </div>
              <div>
                <p className="text-sm font-semibold">Cyber Crime Helpline</p>
                <p className="text-xs text-muted-foreground">Call 1930 to report fraud immediately</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
