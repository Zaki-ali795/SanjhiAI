import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../../components/Icon';
import aiLogo from '../../assets/sanjhi-ai-logo.png';
import whatsappIcon from '../../assets/whatsapp-icon.svg';
import chatbotIcon from '../../assets/chatbot-icon.svg';
import { assistantService } from '../../services';
import { SUPPORT_WHATSAPP_NUMBER } from '../../utils/constants';

const WHATSAPP_NUMBER = SUPPORT_WHATSAPP_NUMBER;

/* ── How-to-use guide steps ── */
const HOW_TO_USE_STEPS = [
  {
    icon: 'chat',
    title: 'Type or Tap a Prompt',
    description: 'Ask a question in the text box below or tap one of the suggested topic cards to get instant answers about committees, payments, and more.',
  },
  {
    icon: 'mic',
    title: 'Use Voice Input',
    description: 'Tap the microphone icon to speak your question instead of typing. Sanjhi AI converts your voice to text automatically.',
  },
  {
    icon: 'volume_up',
    title: 'Listen to Responses',
    description: 'Tap the "Listen" button on any AI response to hear it read aloud. Tap again to stop the voice playback.',
  },
  {
    icon: 'smart_display',
    title: 'Explore Suggested Topics',
    description: 'When you start a new chat, topic cards appear covering the most common questions — creating committees, trust scores, payments, and payout schedules.',
  },
];

/* ── Dynamic topic card visuals (topics come from the knowledge base) ── */
const TOPIC_COLORS = [
  'bg-[#006972]/10 text-[#006972] border-[#006972]/20',
  'bg-emerald-500/10 text-emerald-700 border-emerald-500/20',
  'bg-amber-500/10 text-amber-800 border-amber-500/20',
  'bg-purple-500/10 text-purple-700 border-purple-500/20',
];

const CATEGORY_ICONS = {
  committees: 'groups',
  payments: 'payments',
  trust_score: 'shield_with_heart',
  payouts: 'event_available',
  complaints: 'report',
  account: 'person',
  general: 'lightbulb',
};

function nowTime() {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function welcomeMessage(text) {
  return { id: `welcome-${Date.now()}`, sender: 'ai', text, time: nowTime() };
}

export default function Assistant() {
  const navigate = useNavigate();

  const [messages, setMessages] = useState([
    welcomeMessage("Hello! I'm **Sanjhi AI**, your personal savings & committee assistant. How can I help you manage your pools or payments today?"),
  ]);

  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [speakingMessageId, setSpeakingMessageId] = useState(null);
  const [showGuide, setShowGuide] = useState(false);
  const [topics, setTopics] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [showHistory, setShowHistory] = useState(false);

  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  useEffect(() => {
    assistantService.getTopics()
      .then((data) => setTopics(data.topics || []))
      .catch(() => {});
    refreshConversations();
  }, []);

  async function refreshConversations() {
    try {
      const data = await assistantService.getConversations();
      setConversations(data.conversations || []);
    } catch { /* history panel simply stays empty */ }
  }

  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  async function toggleVoiceRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (isListening) {
      try {
        recognitionRef.current?.stop();
      } catch (_) {}
      setIsListening(false);
      return;
    }

    // Explicitly request microphone stream first (necessary for Android Capacitor WebView)
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        // Release the test stream so SpeechRecognition can bind cleanly
        stream.getTracks().forEach((track) => track.stop());
      } catch (err) {
        console.warn('Microphone permission not granted:', err);
        alert('Microphone access is required for voice typing. Please allow microphone permission in your device settings.');
        return;
      }
    }

    if (!SpeechRecognition) {
      alert('Voice recognition service is not available on this device. Please type your message.');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map((result) => result[0])
          .map((result) => result.transcript)
          .join('');
        if (transcript) {
          setInputText(transcript);
        }
      };

      recognition.onerror = (event) => {
        console.warn('Speech recognition warning:', event.error);
        setIsListening(false);
        if (event.error === 'not-allowed') {
          alert('Microphone permission was denied. Please allow microphone access to use voice typing.');
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error('Speech recognition start error:', err);
      setIsListening(false);
    }
  }

  function handleSpeak(messageId, text) {
    if (!('speechSynthesis' in window)) {
      alert('Text-to-speech is not supported in your browser.');
      return;
    }

    if (speakingMessageId === messageId) {
      window.speechSynthesis.cancel();
      setSpeakingMessageId(null);
      return;
    }

    window.speechSynthesis.cancel();
    const cleanText = text.replace(/[*#_`]/g, '');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    utterance.onend = () => setSpeakingMessageId(null);
    utterance.onerror = () => setSpeakingMessageId(null);

    setSpeakingMessageId(messageId);
    window.speechSynthesis.speak(utterance);
  }

  async function handleSendMessage(textToSend) {
    const query = (textToSend || inputText).trim();
    if (!query || isTyping) return;

    const userMsg = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: query,
      time: nowTime(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsTyping(true);

    try {
      const data = await assistantService.sendChatMessage({
        prompt: query,
        conversation_id: activeConversationId || undefined,
      });

      if (!activeConversationId && data.conversation_id) {
        setActiveConversationId(data.conversation_id);
      }

      setMessages((prev) => [
        ...prev,
        {
          id: data.message_id || `ai-${Date.now()}`,
          sender: 'ai',
          text: data.reply,
          time: nowTime(),
          sources: data.sources || [],
          feedback: null,
        },
      ]);
      refreshConversations();
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: `ai-err-${Date.now()}`,
          sender: 'ai',
          text:
            err?.status === 429
              ? 'Slow down! Please wait a moment before sending more messages.'
              : 'Sorry, something went wrong. Please try again, or reach out on WhatsApp.',
          time: nowTime(),
          sources: [],
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  }

  function handleNewChat() {
    setActiveConversationId(null);
    setShowHistory(false);
    setMessages([welcomeMessage('Chat cleared! How can **Sanjhi AI** assist you now?')]);
  }

  async function handleSelectConversation(conv) {
    try {
      const data = await assistantService.getConversationMessages(conv.id);
      setActiveConversationId(conv.id);
      setShowHistory(false);
      setMessages(
        (data.messages || []).map((m) => ({
          id: m.id,
          sender: m.role === 'user' ? 'user' : 'ai',
          text: m.content,
          time: new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          sources: m.sources || [],
          feedback: m.role === 'assistant' ? m.feedback ?? null : undefined,
        }))
      );
    } catch { /* keep current view on failure */ }
  }

  async function handleDeleteConversation(convId) {
    try {
      await assistantService.deleteConversation(convId);
      if (convId === activeConversationId) handleNewChat();
      refreshConversations();
    } catch { /* ignore */ }
  }

  async function handleFeedback(msgId, value) {
    setMessages((prev) => prev.map((m) => (m.id === msgId ? { ...m, feedback: value } : m)));
    try {
      await assistantService.sendFeedback(msgId, value);
    } catch { /* optimistic UI already applied */ }
  }

  function openWhatsApp() {
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent('Hi! I need help with my Sanjhi account.')}`, '_blank');
  }

  return (
    <div className="min-h-screen bg-white text-deep-navy font-body antialiased flex flex-col relative overflow-x-hidden">

      {/* ══════════════════════════════════════════════════ */}
      {/*  AMBIENT BACKGROUND LAYER                         */}
      {/* ══════════════════════════════════════════════════ */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute inset-0 opacity-[0.35]"
          style={{ backgroundImage: 'radial-gradient(circle at 1.5px 1.5px, #006972 1px, transparent 1px)', backgroundSize: '28px 28px' }} />

        <div className="absolute w-[500px] h-[500px] rounded-full bg-[#006972]/6 blur-3xl top-[-100px] left-[-100px] animate-float-y-slow" />
        <div className="absolute w-[360px] h-[360px] rounded-full bg-amber-400/6 blur-3xl bottom-[15%] right-[-60px]"
          style={{ animation: 'float-y 8s ease-in-out infinite 2s' }} />

        <img src={aiLogo} alt="" aria-hidden
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] sm:w-[650px] opacity-[0.04] select-none pointer-events-none rounded-full" />
      </div>

      {/* ══════════════════════════════════════════════════ */}
      {/*  TOP APP BAR HEADER (Responsive Mobile / Desktop)  */}
      {/* ══════════════════════════════════════════════════ */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#006972]/12 shadow-sm shrink-0">
        <div className="max-w-4xl mx-auto px-3 sm:px-6 h-14 sm:h-18 flex items-center justify-between gap-2 sm:gap-3">

          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <button
              onClick={() => navigate('/dashboard')}
              aria-label="Back to dashboard"
              className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center rounded-full bg-[#006972]/8 hover:bg-[#006972]/15 border border-[#006972]/15 text-[#006972] transition-colors cursor-pointer active:scale-95 shrink-0"
            >
              <Icon name="arrow_back" size={18} />
            </button>

            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <div className="relative shrink-0">
                <img
                  src={aiLogo}
                  alt="Sanjhi AI"
                  className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl object-cover shadow-sm border border-emerald-500/20"
                />
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 sm:w-3 sm:h-3 bg-emerald-500 rounded-full border-2 border-white">
                  <span className="absolute inset-0 rounded-full bg-emerald-500 animate-ping-slow" />
                </span>
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h1 className="font-headline text-[15px] sm:text-[19px] font-bold text-deep-navy truncate leading-tight">
                    Sanjhi AI
                  </h1>
                  <span className="px-1.5 py-0.2 rounded-full bg-[#006972]/10 text-[#006972] font-label text-[9px] sm:text-[10px] font-bold uppercase tracking-wider hidden md:inline">
                    Smart Assistant
                  </span>
                </div>
                <p className="font-body text-[11px] sm:text-[12px] text-emerald-700 font-semibold flex items-center gap-1 leading-tight">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block shrink-0" />
                  <span className="truncate">Online • AI Assistant</span>
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            <button
              onClick={() => setShowHistory((prev) => !prev)}
              className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center transition-all active:scale-95 cursor-pointer border-none ${
                showHistory ? 'bg-[#006972] text-white shadow-sm' : 'bg-[#006972]/8 hover:bg-[#006972]/15 text-[#006972]'
              }`}
              title="Chat history"
            >
              <Icon name="forum" size={17} />
            </button>
            <button
              onClick={() => setShowGuide((prev) => !prev)}
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#006972]/8 hover:bg-[#006972]/15 text-[#006972] flex items-center justify-center transition-all active:scale-95 cursor-pointer border-none"
              title="How to use Sanjhi AI"
            >
              <Icon name="help" size={17} />
            </button>
            <button
              onClick={openWhatsApp}
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#25D366]/10 hover:bg-[#25D366]/20 flex items-center justify-center transition-all active:scale-95 cursor-pointer border-none"
              title="Chat on WhatsApp"
            >
              <img src={whatsappIcon} alt="WhatsApp" className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
            </button>
            <button
              onClick={handleNewChat}
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#006972] hover:bg-[#005259] text-white flex items-center justify-center transition-all active:scale-95 cursor-pointer border-none shadow-sm shadow-[#006972]/25"
              title="New Chat"
            >
              <Icon name="add_comment" size={17} />
            </button>
          </div>
        </div>
      </header>

      {/* ══════════════════════════════════════════════════ */}
      {/*  HOW-TO-USE GUIDE PANEL (collapsible)             */}
      {/* ══════════════════════════════════════════════════ */}
      {showGuide && (
        <section className="relative z-30 max-w-4xl w-full mx-auto px-4 sm:px-6 pt-4 animate-fade-in">
          <div className="bg-gradient-to-br from-[#006972]/5 to-amber-50/50 rounded-3xl border-2 border-[#006972]/15 p-5 sm:p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <img src={chatbotIcon} alt="" className="w-8 h-8" />
                <h2 className="font-headline text-[18px] font-bold text-deep-navy">How to Use Sanjhi AI</h2>
              </div>
              <button
                onClick={() => setShowGuide(false)}
                className="w-8 h-8 rounded-full bg-white hover:bg-slate-100 flex items-center justify-center text-deep-navy/60 transition-colors cursor-pointer border border-[#006972]/15"
              >
                <Icon name="close" size={18} />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {HOW_TO_USE_STEPS.map((step, idx) => (
                <div key={idx} className="flex items-start gap-3 bg-white/80 backdrop-blur-sm rounded-2xl p-4 border border-[#006972]/10">
                  <div className="w-9 h-9 rounded-xl bg-[#006972] text-white flex items-center justify-center shrink-0 shadow-sm">
                    <span className="font-headline text-[14px] font-bold">{idx + 1}</span>
                  </div>
                  <div>
                    <h3 className="font-headline text-[13px] font-bold text-deep-navy mb-0.5 flex items-center gap-1.5">
                      <Icon name={step.icon} size={16} className="text-[#006972]" />
                      {step.title}
                    </h3>
                    <p className="font-body text-[12px] text-on-surface-variant leading-relaxed">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-3 p-4 bg-white/60 rounded-2xl border border-[#25D366]/20">
              <img src={whatsappIcon} alt="WhatsApp" className="w-7 h-7 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-headline text-[13px] font-bold text-deep-navy">Need human help? Chat on WhatsApp</p>
                <p className="font-body text-[12px] text-on-surface-variant">
                  Message us at <span className="font-bold text-[#006972]">+92 341 1713517</span> for instant support from our team.
                </p>
              </div>
              <button
                onClick={openWhatsApp}
                className="px-4 py-2 rounded-full bg-[#25D366] hover:bg-[#1da851] text-white font-label text-[12px] font-bold transition-colors cursor-pointer border-none shadow-sm flex items-center gap-1.5 shrink-0 active:scale-95"
              >
                <img src={whatsappIcon} alt="" className="w-4 h-4 brightness-0 invert" />
                Open WhatsApp
              </button>
            </div>
          </div>
        </section>
      )}

      {/* ══════════════════════════════════════════════════ */}
      {/*  CHAT MESSAGES CONTAINER                          */}
      {/* ══════════════════════════════════════════════════ */}
      {showHistory && (
        <section className="relative z-30 max-w-4xl w-full mx-auto px-4 sm:px-6 pt-4 animate-fade-in">
          <div className="bg-white rounded-3xl border-2 border-[#006972]/15 p-5 sm:p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-headline text-[18px] font-bold text-deep-navy flex items-center gap-2">
                <Icon name="forum" size={22} className="text-[#006972]" />
                Chat History
              </h2>
              <button
                onClick={() => setShowHistory(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-deep-navy/60 transition-colors cursor-pointer border-none"
              >
                <Icon name="close" size={18} />
              </button>
            </div>

            <button
              onClick={handleNewChat}
              className="w-full mb-4 px-4 py-2.5 rounded-2xl bg-[#006972] hover:bg-[#00575f] text-white font-label text-[13px] font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer border-none shadow-sm active:scale-[0.99]"
            >
              <Icon name="add" size={18} />
              Start a New Chat
            </button>

            {conversations.length === 0 ? (
              <p className="font-body text-[13px] text-on-surface-variant text-center py-4">
                No conversations yet — ask me anything to get started!
              </p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {conversations.map((conv) => (
                  <div
                    key={conv.id}
                    className={`flex items-center gap-2 p-3 rounded-2xl border transition-colors ${
                      conv.id === activeConversationId
                        ? 'border-[#006972] bg-[#006972]/5'
                        : 'border-[#006972]/10 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <button
                      onClick={() => handleSelectConversation(conv)}
                      className="flex-1 text-left bg-transparent border-none cursor-pointer min-w-0 p-0"
                    >
                      <p className="font-headline text-[13px] font-bold text-deep-navy truncate">
                        {conv.title || 'Untitled chat'}
                      </p>
                      <p className="font-label text-[10px] text-on-surface-variant">
                        {new Date(conv.last_message_at).toLocaleString()}
                      </p>
                    </button>
                    <button
                      onClick={() => handleDeleteConversation(conv.id)}
                      className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 transition-colors cursor-pointer border-none bg-transparent shrink-0"
                      title="Delete chat"
                    >
                      <Icon name="delete" size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6 relative z-10 pb-36">

        {/* SUGGESTED PROMPTS HERO CARDS (Shown on initial state) */}
        {messages.length <= 1 && (
          <section className="space-y-4 my-2 animate-fade-in">
            <div className="text-center space-y-1">
              <img src={aiLogo} alt="Sanjhi AI" className="w-16 h-16 rounded-2xl mx-auto mb-2 object-cover shadow-md shadow-[#006972]/15 border-2 border-[#006972]/20" />
              <h2 className="font-headline text-[22px] font-bold text-deep-navy">How can Sanjhi AI help you today?</h2>
              <p className="font-body text-[13px] text-on-surface-variant max-w-md mx-auto">
                Ask anything using voice or text about your savings pools, payments, or trust score.
              </p>
              <button
                onClick={() => setShowGuide(true)}
                className="mt-2 inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-[#006972]/8 hover:bg-[#006972]/15 text-[#006972] font-label text-[12px] font-bold transition-colors cursor-pointer border border-[#006972]/20"
              >
                <Icon name="menu_book" size={16} />
                How to use Sanjhi AI
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              {topics.map((topic, idx) => (
                <button
                  key={topic.id}
                  onClick={() => handleSendMessage(topic.title)}
                  className={`p-4 rounded-2xl text-left border transition-all duration-200 hover:-translate-y-1 hover:shadow-md cursor-pointer flex items-start gap-3 bg-white/90 backdrop-blur-md ${TOPIC_COLORS[idx % TOPIC_COLORS.length]}`}
                >
                  <div className="p-2 rounded-xl bg-white shadow-sm shrink-0">
                    <Icon name={CATEGORY_ICONS[topic.category] || 'lightbulb'} size={20} />
                  </div>
                  <div>
                    <h3 className="font-headline text-[14px] font-bold text-deep-navy mb-0.5">{topic.title}</h3>
                    <p className="font-body text-[12px] text-on-surface-variant line-clamp-2">Tap to ask Sanjhi AI about this topic</p>
                  </div>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* MESSAGE BUBBLES */}
        {messages.map((msg) => {
          const isAI = msg.sender === 'ai';
          const isSpeaking = speakingMessageId === msg.id;

          return (
            <div
              key={msg.id}
              className={`flex items-end gap-3 ${isAI ? 'justify-start' : 'justify-end'} animate-scale-up`}
            >
              {isAI && (
                <img
                  src={aiLogo}
                  alt="Sanjhi AI"
                  className="w-8 h-8 rounded-xl object-cover shrink-0 shadow-sm border border-white mb-1"
                />
              )}

              <div className={`relative max-w-[85%] sm:max-w-[75%] rounded-3xl p-4 sm:p-5 shadow-sm space-y-2 ${
                isAI
                  ? 'bg-white border-2 border-[#006972]/15 text-deep-navy rounded-bl-sm'
                  : 'bg-[#006972] text-white rounded-br-sm shadow-[#006972]/20'
              }`}>

                {isAI && (
                  <div className="flex items-center justify-between pb-2 border-b border-[#006972]/10 text-[11px] font-label text-[#006972] font-bold">
                    <span className="flex items-center gap-1">
                      <img src={chatbotIcon} alt="" className="w-3.5 h-3.5" /> Sanjhi AI
                    </span>
                    <button
                      type="button"
                      onClick={() => handleSpeak(msg.id, msg.text)}
                      className={`p-1.5 rounded-lg flex items-center gap-1 text-[11px] transition-colors cursor-pointer border-none ${
                        isSpeaking ? 'bg-amber-500 text-white animate-pulse' : 'bg-[#006972]/10 hover:bg-[#006972]/20 text-[#006972]'
                      }`}
                      title={isSpeaking ? 'Stop Voice' : 'Listen with Voice'}
                    >
                      <Icon name={isSpeaking ? 'volume_off' : 'volume_up'} size={14} />
                      <span>{isSpeaking ? 'Stop' : 'Listen'}</span>
                    </button>
                  </div>
                )}

                <div className="font-body text-[14px] leading-relaxed whitespace-pre-line">
                  {msg.text}
                </div>

                {isAI && msg.sources?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-2 border-t border-[#006972]/10">
                    <span className="font-label text-[10px] font-bold text-on-surface-variant/70 w-full">Sources</span>
                    {msg.sources.map((src, i) => (
                      <span
                        key={src.id || i}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#006972]/8 text-[#006972] font-label text-[10px] font-bold"
                      >
                        <Icon name="menu_book" size={12} />
                        {src.title}
                      </span>
                    ))}
                  </div>
                )}

                {isAI && 'feedback' in msg && (
                  <div className="flex items-center gap-1 pt-1">
                    <span className="font-label text-[10px] text-on-surface-variant/70 mr-1">Was this helpful?</span>
                    <button
                      type="button"
                      onClick={() => handleFeedback(msg.id, 1)}
                      className={`p-1 rounded-lg transition-colors cursor-pointer border-none ${
                        msg.feedback === 1
                          ? 'bg-emerald-500 text-white'
                          : 'bg-[#006972]/8 hover:bg-[#006972]/15 text-[#006972]'
                      }`}
                      title="Helpful"
                    >
                      <Icon name="thumb_up" size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleFeedback(msg.id, -1)}
                      className={`p-1 rounded-lg transition-colors cursor-pointer border-none ${
                        msg.feedback === -1
                          ? 'bg-rose-500 text-white'
                          : 'bg-[#006972]/8 hover:bg-[#006972]/15 text-[#006972]'
                      }`}
                      title="Not helpful"
                    >
                      <Icon name="thumb_down" size={14} />
                    </button>
                  </div>
                )}

                <div className={`text-[10px] font-label text-right font-medium ${isAI ? 'text-on-surface-variant/70' : 'text-white/70'}`}>
                  {msg.time}
                </div>
              </div>

            </div>
          );
        })}

        {/* TYPING INDICATOR */}
        {isTyping && (
          <div className="flex items-end gap-3 justify-start animate-fade-in">
            <img
              src={aiLogo}
              alt="Sanjhi AI"
              className="w-8 h-8 rounded-xl object-cover shrink-0 shadow-sm border border-white"
            />
            <div className="bg-white border-2 border-[#006972]/15 text-[#006972] rounded-3xl rounded-bl-sm px-5 py-3 shadow-sm flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#006972] animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-2 h-2 rounded-full bg-[#006972] animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-2 h-2 rounded-full bg-[#006972] animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </main>

      {/* ══════════════════════════════════════════════════ */}
      {/*  BOTTOM CHAT INPUT & VOICE CONTROL BAR            */}
      {/* ══════════════════════════════════════════════════ */}
      <footer className="fixed bottom-[max(4.25rem,env(safe-area-inset-bottom))] md:bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#006972]/15 p-2.5 sm:p-4 shadow-[0_-6px_24px_rgba(0,105,114,0.12)]">
        <div className="max-w-4xl mx-auto space-y-1.5">

          {isListening && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 px-3.5 py-1.5 rounded-2xl text-[12px] font-label font-bold flex items-center justify-between animate-bounce-short shadow-sm">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-ping" />
                <span>Listening... Speak into your microphone now</span>
              </div>
              <button
                onClick={toggleVoiceRecognition}
                className="text-rose-700 underline font-bold bg-transparent border-none cursor-pointer"
              >
                Stop
              </button>
            </div>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-1.5 bg-slate-50 border-2 border-[#006972]/20 focus-within:border-[#006972] focus-within:ring-4 focus-within:ring-[#006972]/10 rounded-3xl p-1 transition-all shadow-sm"
          >
            <button
              type="button"
              onClick={openWhatsApp}
              className="w-10 h-10 rounded-2xl flex items-center justify-center transition-all cursor-pointer border-none shrink-0 bg-[#25D366]/10 hover:bg-[#25D366]/20"
              title="Send message on WhatsApp"
            >
              <img src={whatsappIcon} alt="WhatsApp" className="w-4.5 h-4.5" />
            </button>

            <button
              type="button"
              onClick={toggleVoiceRecognition}
              className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all cursor-pointer border-none shrink-0 ${
                isListening
                  ? 'bg-rose-600 text-white animate-pulse shadow-md'
                  : 'bg-[#006972]/10 text-[#006972] hover:bg-[#006972]/20'
              }`}
              title={isListening ? 'Stop Recording' : 'Voice Input (Speech-to-Text)'}
            >
              <Icon name={isListening ? 'mic_off' : 'mic'} size={20} />
            </button>

            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={isListening ? 'Listening to voice...' : 'Ask Sanjhi AI anything...'}
              className="flex-1 bg-transparent px-2.5 py-1.5 font-body text-[14px] text-deep-navy outline-none placeholder:text-on-surface-variant/50 min-w-0"
            />

            <button
              type="submit"
              disabled={!inputText.trim()}
              className="w-10 h-10 rounded-2xl bg-[#006972] hover:bg-[#00575f] text-white flex items-center justify-center transition-all cursor-pointer border-none shrink-0 shadow-md active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
              title="Send Message"
            >
              <Icon name="send" size={18} />
            </button>
          </form>

          <p className="text-[10px] font-label text-center text-on-surface-variant/60 hidden xs:block">
            Sanjhi AI provides automated guidance. For urgent help, tap the WhatsApp button.
          </p>
        </div>
      </footer>

    </div>
  );
}
