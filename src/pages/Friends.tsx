import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Icon from "@/components/ui/icon";

const FRIENDS_URL = "https://functions.poehali.dev/e30bc7b1-e7c9-481d-8493-e23f79032ee6";

interface User { nickname: string; last_seen: string | null; }

function NickGate({ onEnter }: { onEnter: (nick: string) => void }) {
  const [input, setInput] = useState("");
  const saved = localStorage.getItem("rp_nick") || "";
  useEffect(() => { if (saved) onEnter(saved); }, []);
  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl p-8 w-full max-w-sm text-center">
        <h1 className="text-2xl font-bold mb-2 text-white">Друзья</h1>
        <p className="text-gray-400 mb-6 text-sm">Введи свой никнейм</p>
        <input className="w-full bg-gray-800 border border-gray-600 text-white rounded-lg px-4 py-3 mb-4 outline-none focus:border-red-500"
          placeholder="Твой ник..." value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && input.trim() && onEnter(input.trim())} />
        <button onClick={() => { if (input.trim()) { localStorage.setItem("rp_nick", input.trim()); onEnter(input.trim()); }}}
          className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-3 rounded-lg transition-colors">
          Войти
        </button>
      </div>
    </div>
  );
}

export default function Friends() {
  const navigate = useNavigate();
  const [myNick, setMyNick] = useState(localStorage.getItem("rp_nick") || "");
  const [friends, setFriends] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [searching, setSearching] = useState(false);
  const [tab, setTab] = useState<"friends" | "search">("friends");
  const [addedNicks, setAddedNicks] = useState<Set<string>>(new Set());

  const fetchFriends = async (nick: string) => {
    const res = await fetch(`${FRIENDS_URL}?action=list&nick=${encodeURIComponent(nick)}`);
    const data = await res.json();
    setFriends(data.friends || []);
  };

  useEffect(() => { if (myNick) fetchFriends(myNick); }, [myNick]);

  const handleEnter = (nick: string) => { localStorage.setItem("rp_nick", nick); setMyNick(nick); };

  const doSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    const res = await fetch(`${FRIENDS_URL}?action=search&q=${encodeURIComponent(searchQuery.trim())}`);
    const data = await res.json();
    setSearchResults((data.users || []).filter((u: User) => u.nickname !== myNick));
    setSearching(false);
  };

  const addFriend = async (friendNick: string) => {
    await fetch(FRIENDS_URL, { method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_nick: myNick, friend_nick: friendNick }) });
    setAddedNicks(prev => new Set([...prev, friendNick]));
    await fetchFriends(myNick);
  };

  const removeFriend = async (friendNick: string) => {
    await fetch(FRIENDS_URL, { method: "DELETE", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_nick: myNick, friend_nick: friendNick }) });
    await fetchFriends(myNick);
  };

  const isOnline = (last_seen: string | null) => {
    if (!last_seen) return false;
    return (Date.now() - new Date(last_seen).getTime()) < 5 * 60 * 1000;
  };

  if (!myNick) return <NickGate onEnter={handleEnter} />;

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      <div className="bg-gray-900 border-b border-gray-800 px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate("/")} className="text-gray-400 hover:text-white transition-colors">
          <Icon name="ArrowLeft" size={20} />
        </button>
        <h1 className="text-lg font-bold text-white">Друзья</h1>
        <span className="text-gray-500 text-sm ml-auto">{myNick}</span>
      </div>

      {/* Tabs */}
      <div className="flex bg-gray-900 border-b border-gray-800">
        <button onClick={() => setTab("friends")}
          className={`flex-1 py-3 text-sm font-semibold transition-colors ${tab === "friends" ? "text-red-400 border-b-2 border-red-400" : "text-gray-500 hover:text-gray-300"}`}>
          Мои друзья ({friends.length})
        </button>
        <button onClick={() => setTab("search")}
          className={`flex-1 py-3 text-sm font-semibold transition-colors ${tab === "search" ? "text-red-400 border-b-2 border-red-400" : "text-gray-500 hover:text-gray-300"}`}>
          Найти игрока
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {tab === "friends" && (
          <div>
            {friends.length === 0 && (
              <div className="text-center text-gray-600 mt-16 px-4">
                <Icon name="Users" size={40} className="mx-auto mb-3 opacity-30" />
                <p>Друзей пока нет</p>
                <button onClick={() => setTab("search")} className="mt-4 text-red-400 hover:text-red-300 text-sm transition-colors">
                  Найти игроков →
                </button>
              </div>
            )}
            {friends.map(nick => (
              <div key={nick} className="flex items-center gap-4 px-4 py-4 border-b border-gray-800">
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-red-500 flex items-center justify-center text-white font-bold">
                    {nick[0]?.toUpperCase()}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-semibold">{nick}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => { localStorage.setItem("rp_dm_open", nick); navigate("/dm"); }}
                    className="text-blue-400 hover:text-blue-300 transition-colors p-2">
                    <Icon name="MessageSquare" size={18} />
                  </button>
                  <button onClick={() => removeFriend(nick)}
                    className="text-gray-600 hover:text-red-400 transition-colors p-2">
                    <Icon name="UserMinus" size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === "search" && (
          <div>
            <div className="p-4 flex gap-2">
              <input className="flex-1 bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-3 outline-none focus:border-red-500 text-sm"
                placeholder="Введи ник игрока..."
                value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                onKeyDown={e => e.key === "Enter" && doSearch()} autoFocus />
              <button onClick={doSearch} disabled={searching || !searchQuery.trim()}
                className="bg-red-500 hover:bg-red-600 disabled:opacity-40 text-white rounded-xl px-4 py-3 transition-colors">
                <Icon name="Search" size={18} />
              </button>
            </div>

            {searching && <p className="text-center text-gray-500 text-sm">Ищу...</p>}

            {!searching && searchResults.length === 0 && searchQuery && (
              <p className="text-center text-gray-600 text-sm mt-4">Никого не найдено</p>
            )}

            {searchResults.map(user => {
              const isFriend = friends.includes(user.nickname);
              const justAdded = addedNicks.has(user.nickname);
              return (
                <div key={user.nickname} className="flex items-center gap-4 px-4 py-4 border-b border-gray-800">
                  <div className="w-10 h-10 rounded-full bg-purple-500 flex items-center justify-center text-white font-bold">
                    {user.nickname[0]?.toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <p className="text-white font-semibold">{user.nickname}</p>
                    <p className={`text-xs ${isOnline(user.last_seen) ? "text-green-400" : "text-gray-500"}`}>
                      {isOnline(user.last_seen) ? "В сети" : "Не в сети"}
                    </p>
                  </div>
                  {isFriend || justAdded ? (
                    <span className="text-green-400 text-sm flex items-center gap-1">
                      <Icon name="Check" size={16} /> Друг
                    </span>
                  ) : (
                    <button onClick={() => addFriend(user.nickname)}
                      className="bg-red-500 hover:bg-red-600 text-white text-sm px-4 py-2 rounded-lg transition-colors flex items-center gap-1">
                      <Icon name="UserPlus" size={15} /> Добавить
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}