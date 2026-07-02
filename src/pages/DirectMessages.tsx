import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Icon from "@/components/ui/icon";
import { useImageUpload } from "@/hooks/useImageUpload";

const DM_URL = "https://functions.poehali.dev/bf4e81af-42f6-423a-a7df-1b7378f32d5b";

interface Chat { nick: string; last_time: string; }
interface Message { id: number; sender: string; recipient: string; message: string; image_url: string | null; created_at: string; }

function NickGate({ onEnter }: { onEnter: (nick: string) => void }) {
  const [input, setInput] = useState("");
  const saved = localStorage.getItem("rp_nick") || "";
  useEffect(() => { if (saved) onEnter(saved); }, []);
  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl p-8 w-full max-w-sm text-center">
        <h1 className="text-2xl font-bold mb-2 text-white">Личные сообщения</h1>
        <p className="text-gray-400 mb-6 text-sm">Введи свой никнейм</p>
        <input className="w-full bg-gray-800 border border-gray-600 text-white rounded-lg px-4 py-3 mb-4 outline-none focus:border-blue-500"
          placeholder="Твой ник..." value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && input.trim() && onEnter(input.trim())} />
        <button onClick={() => { if (input.trim()) { localStorage.setItem("rp_nick", input.trim()); onEnter(input.trim()); }}}
          className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 rounded-lg transition-colors">
          Войти
        </button>
      </div>
    </div>
  );
}

function ChatView({ myNick, other, onBack }: { myNick: string; other: string; onBack: () => void }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [lightbox, setLightbox] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const { uploading, preview, fileRef, pickFile, onFileChange, uploadImage, clearPreview } = useImageUpload();

  const fetchMsgs = async () => {
    const res = await fetch(`${DM_URL}?action=messages&nick=${encodeURIComponent(myNick)}&other=${encodeURIComponent(other)}`);
    const data = await res.json();
    setMessages(data.messages || []);
  };

  useEffect(() => { fetchMsgs(); const t = setInterval(fetchMsgs, 4000); return () => clearInterval(t); }, [other]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const send = async () => {
    if ((!text.trim() && !preview) || sending) return;
    setSending(true);
    let imageUrl: string | null = null;
    if (preview) imageUrl = await uploadImage();
    await fetch(DM_URL, { method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sender: myNick, recipient: other, message: text.trim(), image_url: imageUrl }) });
    setText("");
    clearPreview();
    await fetchMsgs();
    setSending(false);
  };

  const fmt = (iso: string) => new Date(iso).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="flex flex-col h-full">
      {lightbox && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4" onClick={() => setLightbox(null)}>
          <img src={lightbox} className="max-w-full max-h-full rounded-xl object-contain" />
          <button className="absolute top-4 right-4 text-white hover:text-gray-300"><Icon name="X" size={28} /></button>
        </div>
      )}
      <div className="bg-gray-800 px-4 py-3 flex items-center gap-3 border-b border-gray-700">
        <button onClick={onBack} className="text-gray-400 hover:text-white transition-colors"><Icon name="ArrowLeft" size={20} /></button>
        <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-sm">
          {other[0]?.toUpperCase()}
        </div>
        <span className="text-white font-semibold">{other}</span>
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.length === 0 && <p className="text-center text-gray-600 mt-10">Напиши первое сообщение!</p>}
        {messages.map(msg => {
          const isMe = msg.sender === myNick;
          return (
            <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
              <div className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                {msg.image_url && (
                  <img src={msg.image_url} className="rounded-xl max-w-[220px] cursor-pointer hover:opacity-90 transition-opacity mb-1"
                    onClick={() => setLightbox(msg.image_url!)} />
                )}
                {msg.message && msg.message !== "📷" && (
                  <div className={`px-4 py-2 rounded-2xl text-sm break-words max-w-xs lg:max-w-md ${isMe ? "bg-blue-500 text-white rounded-tr-sm" : "bg-gray-800 text-gray-100 rounded-tl-sm"}`}>
                    {msg.message}
                  </div>
                )}
                <span className="text-xs text-gray-600 mt-1">{fmt(msg.created_at)}</span>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>
      {preview && (
        <div className="bg-gray-900 border-t border-gray-800 px-4 pt-3 flex items-start gap-2">
          <div className="relative">
            <img src={preview} className="h-20 w-20 object-cover rounded-xl" />
            <button onClick={clearPreview} className="absolute -top-2 -right-2 bg-gray-700 hover:bg-gray-600 text-white rounded-full p-0.5 transition-colors">
              <Icon name="X" size={14} />
            </button>
          </div>
          <p className="text-gray-500 text-xs mt-2">Фото готово к отправке</p>
        </div>
      )}
      <div className="bg-gray-900 border-t border-gray-800 px-4 py-3 flex gap-2">
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onFileChange} />
        <button onClick={pickFile} className="text-gray-500 hover:text-gray-300 transition-colors px-1">
          <Icon name="Image" size={22} />
        </button>
        <input className="flex-1 bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-2 outline-none focus:border-blue-500 text-sm"
          placeholder="Сообщение..." value={text} onChange={e => setText(e.target.value)}
          onKeyDown={e => e.key === "Enter" && send()} />
        <button onClick={send} disabled={sending || uploading || (!text.trim() && !preview)}
          className="bg-blue-500 hover:bg-blue-600 disabled:opacity-40 text-white rounded-xl px-4 py-2 transition-colors">
          {sending || uploading ? <Icon name="Loader" size={18} className="animate-spin" /> : <Icon name="Send" size={18} />}
        </button>
      </div>
    </div>
  );
}

export default function DirectMessages() {
  const navigate = useNavigate();
  const [myNick, setMyNick] = useState(localStorage.getItem("rp_nick") || "");
  const [chats, setChats] = useState<Chat[]>([]);
  const [openChat, setOpenChat] = useState<string | null>(() => {
    const pending = localStorage.getItem("rp_dm_open");
    if (pending) { localStorage.removeItem("rp_dm_open"); return pending; }
    return null;
  });
  const [newNick, setNewNick] = useState("");
  const [showNew, setShowNew] = useState(false);

  const fetchChats = async (nick: string) => {
    const res = await fetch(`${DM_URL}?action=chats&nick=${encodeURIComponent(nick)}`);
    const data = await res.json();
    setChats(data.chats || []);
  };

  useEffect(() => { if (myNick) fetchChats(myNick); }, [myNick]);

  const handleEnter = (nick: string) => { localStorage.setItem("rp_nick", nick); setMyNick(nick); };

  const startNewChat = () => {
    const n = newNick.trim();
    if (!n || n === myNick) return;
    setOpenChat(n);
    setShowNew(false);
    setNewNick("");
  };

  if (!myNick) return <NickGate onEnter={handleEnter} />;

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      <div className="bg-gray-900 border-b border-gray-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => openChat ? setOpenChat(null) : navigate("/")} className="text-gray-400 hover:text-white transition-colors">
            <Icon name="ArrowLeft" size={20} />
          </button>
          <h1 className="text-lg font-bold text-white">
            {openChat ? openChat : "Личка"}
          </h1>
        </div>
        {!openChat && (
          <button onClick={() => setShowNew(true)} className="text-blue-400 hover:text-blue-300 transition-colors">
            <Icon name="Plus" size={22} />
          </button>
        )}
      </div>

      {openChat ? (
        <div className="flex-1 flex flex-col overflow-hidden" style={{ height: "calc(100vh - 57px)" }}>
          <ChatView myNick={myNick} other={openChat} onBack={() => { setOpenChat(null); fetchChats(myNick); }} />
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto">
          {showNew && (
            <div className="p-4 bg-gray-900 border-b border-gray-700">
              <p className="text-gray-400 text-sm mb-3">Новый чат — введи ник игрока</p>
              <div className="flex gap-2">
                <input className="flex-1 bg-gray-800 border border-gray-600 text-white rounded-lg px-4 py-2 text-sm outline-none focus:border-blue-500"
                  placeholder="Ник игрока..." value={newNick} onChange={e => setNewNick(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && startNewChat()} autoFocus />
                <button onClick={startNewChat} className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm transition-colors">
                  Открыть
                </button>
                <button onClick={() => setShowNew(false)} className="text-gray-500 hover:text-gray-300 px-2">
                  <Icon name="X" size={18} />
                </button>
              </div>
            </div>
          )}

          {chats.length === 0 && !showNew && (
            <div className="text-center text-gray-600 mt-16 px-4">
              <Icon name="MessageSquare" size={40} className="mx-auto mb-3 opacity-30" />
              <p>Личок пока нет</p>
              <button onClick={() => setShowNew(true)} className="mt-4 text-blue-400 hover:text-blue-300 text-sm transition-colors">
                + Начать новый чат
              </button>
            </div>
          )}

          {chats.map(c => (
            <button key={c.nick} onClick={() => setOpenChat(c.nick)}
              className="w-full flex items-center gap-4 px-4 py-4 border-b border-gray-800 hover:bg-gray-900 transition-colors text-left">
              <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">
                {c.nick[0]?.toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-semibold">{c.nick}</p>
                <p className="text-gray-500 text-xs">{new Date(c.last_time).toLocaleString("ru-RU", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}</p>
              </div>
              <Icon name="ChevronRight" size={18} className="text-gray-600" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}