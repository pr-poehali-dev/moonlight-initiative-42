import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Icon from "@/components/ui/icon";

const CHAT_URL = "https://functions.poehali.dev/aa4fa1c9-7478-4d03-95e7-ac00d6be4e6e";

interface Message {
  id: number;
  nickname: string;
  message: string;
  image_url: string | null;
  created_at: string;
}

export default function Chat() {
  const navigate = useNavigate();
  const [nickname, setNickname] = useState(() => localStorage.getItem("rp_nick") || "");
  const [nickInput, setNickInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [online, setOnline] = useState<string[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const fetchMessages = async () => {
    const res = await fetch(`${CHAT_URL}?action=messages`);
    const data = await res.json();
    setMessages(data.messages || []);
  };

  const fetchOnline = async () => {
    const res = await fetch(`${CHAT_URL}?action=online`);
    const data = await res.json();
    setOnline(data.online || []);
  };

  useEffect(() => {
    if (!nickname) return;
    fetchMessages();
    fetchOnline();
    const interval = setInterval(() => {
      fetchMessages();
      fetchOnline();
    }, 5000);
    return () => clearInterval(interval);
  }, [nickname]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const enterChat = () => {
    const nick = nickInput.trim();
    if (!nick) return;
    localStorage.setItem("rp_nick", nick);
    setNickname(nick);
  };

  const sendMessage = async () => {
    if (!text.trim() || sending) return;
    setSending(true);
    await fetch(CHAT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nickname, message: text.trim() }),
    });
    setText("");
    await fetchMessages();
    await fetchOnline();
    setSending(false);
  };

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
  };

  if (!nickname) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
        <div className="bg-gray-900 border border-gray-700 rounded-2xl p-8 w-full max-w-sm text-center">
          <h1 className="text-2xl font-bold mb-2">
            <span className="text-red-500">РП</span> <span className="text-blue-500">СТРАН</span>{" "}
            <span className="text-white">ЧАТ</span>
          </h1>
          <p className="text-gray-400 mb-6 text-sm">Введи свой никнейм чтобы войти</p>
          <input
            className="w-full bg-gray-800 border border-gray-600 text-white rounded-lg px-4 py-3 mb-4 outline-none focus:border-blue-500"
            placeholder="Твой ник..."
            value={nickInput}
            onChange={(e) => setNickInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && enterChat()}
          />
          <button
            onClick={enterChat}
            className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-3 rounded-lg transition-colors"
          >
            Войти в чат
          </button>
          <button
            onClick={() => navigate("/")}
            className="mt-3 text-gray-500 hover:text-gray-300 text-sm transition-colors"
          >
            ← На главную
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      {/* Header */}
      <div className="bg-gray-900 border-b border-gray-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/")} className="text-gray-400 hover:text-white transition-colors">
            <Icon name="ArrowLeft" size={20} />
          </button>
          <h1 className="text-lg font-bold">
            <span className="text-red-500">РП</span> <span className="text-blue-500">СТРАН</span>{" "}
            <span className="text-white">ЧАТ</span>
          </h1>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <span className="w-2 h-2 rounded-full bg-green-400 inline-block"></span>
          {online.length} в сети
          <span className="text-gray-600 ml-2">| {nickname}</span>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Messages */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
            {messages.length === 0 && (
              <div className="text-center text-gray-600 mt-10">
                Пока тихо... Напиши первым!
              </div>
            )}
            {messages.map((msg) => {
              const isMe = msg.nickname === nickname;
              return (
                <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-xs lg:max-w-md ${isMe ? "items-end" : "items-start"} flex flex-col`}>
                    {!isMe && (
                      <span className="text-xs text-blue-400 mb-1 ml-1">{msg.nickname}</span>
                    )}
                    <div
                      className={`px-4 py-2 rounded-2xl text-sm break-words ${
                        isMe
                          ? "bg-red-500 text-white rounded-tr-sm"
                          : "bg-gray-800 text-gray-100 rounded-tl-sm"
                      }`}
                    >
                      {msg.message}
                    </div>
                    <span className="text-xs text-gray-600 mt-1 mx-1">
                      {formatTime(msg.created_at)}
                    </span>
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="bg-gray-900 border-t border-gray-800 px-4 py-3 flex gap-2">
            <input
              className="flex-1 bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-2 outline-none focus:border-blue-500 text-sm"
              placeholder="Написать сообщение..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            />
            <button
              onClick={sendMessage}
              disabled={sending || !text.trim()}
              className="bg-red-500 hover:bg-red-600 disabled:opacity-40 text-white rounded-xl px-4 py-2 transition-colors"
            >
              <Icon name="Send" size={18} />
            </button>
          </div>
        </div>

        {/* Online sidebar */}
        <div className="hidden md:flex w-48 bg-gray-900 border-l border-gray-800 flex-col p-3">
          <h3 className="text-xs uppercase text-gray-500 tracking-wide mb-3">В сети</h3>
          <div className="space-y-2">
            {online.map((u) => (
              <div key={u} className="flex items-center gap-2 text-sm text-gray-300">
                <span className="w-2 h-2 rounded-full bg-green-400 flex-shrink-0"></span>
                {u}
              </div>
            ))}
            {online.length === 0 && (
              <p className="text-xs text-gray-600">Никого нет</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
