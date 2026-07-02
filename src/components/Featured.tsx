import Icon from "@/components/ui/icon";

const features = [
  {
    icon: "MessagesSquare",
    color: "text-red-500",
    title: "Чат для всех",
    text: "Общий чат сервера, где можно писать, общаться и делиться фото с другими игроками.",
  },
  {
    icon: "Wifi",
    color: "text-blue-500",
    title: "Кто в сети",
    text: "Смотри, кто сейчас онлайн и куда ушёл — всегда знай, кто рядом на сервере.",
  },
  {
    icon: "Mail",
    color: "text-red-500",
    title: "Личные сообщения",
    text: "Пиши игроку напрямую в личку — приватное общение один на один.",
  },
  {
    icon: "UserPlus",
    color: "text-blue-500",
    title: "Друзья по нику",
    text: "Добавляй друзей по никнейму и всегда держи любимых игроков под рукой.",
  },
];

export default function Featured() {
  return (
    <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center min-h-screen px-6 py-12 lg:py-0 bg-white">
      <div className="flex-1 h-[400px] lg:h-[800px] mb-8 lg:mb-0 lg:order-2">
        <img
          src="/images/woman-horse.jpg"
          alt="Игроки сервера"
          className="w-full h-full object-cover"
        />
      </div>
      <div className="flex-1 text-left lg:h-[800px] flex flex-col justify-center lg:mr-12 lg:order-1">
        <h3 className="uppercase mb-8 text-sm tracking-wide text-neutral-600">
          Всё для общения на сервере
        </h3>
        <div className="grid sm:grid-cols-2 gap-8">
          {features.map((f) => (
            <div key={f.title}>
              <Icon name={f.icon} className={`${f.color} mb-3`} size={32} />
              <h4 className="text-xl font-bold mb-2 text-neutral-900">
                {f.title}
              </h4>
              <p className="text-neutral-600 leading-relaxed">{f.text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}