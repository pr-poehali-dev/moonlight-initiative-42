interface HeaderProps {
  className?: string;
}

export default function Header({ className }: HeaderProps) {
  return (
    <header className={`absolute top-0 left-0 right-0 z-10 p-6 ${className ?? ""}`}>
      <div className="flex justify-between items-center">
        <div className="text-sm uppercase tracking-wide font-bold">
          <span className="text-red-500">РП</span>{" "}
          <span className="text-blue-500">СТРАН</span>{" "}
          <span className="text-white">ЧАТ</span>
        </div>
        <nav className="flex gap-8">
          <a
            href="#chat"
            className="text-white hover:text-neutral-400 transition-colors duration-300 uppercase text-sm"
          >
            Чат
          </a>
          <a
            href="#market"
            className="text-white hover:text-neutral-400 transition-colors duration-300 uppercase text-sm"
          >
            Маркет
          </a>
        </nav>
      </div>
    </header>
  );
}