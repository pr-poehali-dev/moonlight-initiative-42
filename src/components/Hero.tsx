import { useScroll, useTransform, motion } from "framer-motion";
import { useRef } from "react";

export default function Hero() {
  const container = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: container,
    offset: ["start start", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], ["0vh", "50vh"]);

  return (
    <div
      ref={container}
      className="relative flex items-center justify-center h-screen overflow-hidden"
    >
      <motion.div
        style={{ y }}
        className="absolute inset-0 w-full h-full"
      >
        <img
          src="/images/mountain-landscape.jpg"
          alt="Mountain landscape"
          className="w-full h-full object-cover"
        />
      </motion.div>

      <div className="relative z-10 text-center text-white">
        <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight mb-6">
          <span className="text-red-500">РП</span>{" "}
          <span className="text-blue-500">СТРАН</span> ЧАТ
        </h1>
        <p className="text-lg md:text-xl max-w-2xl mx-auto px-6 opacity-90 mb-8">
          Общий чат для всех игроков сервера — общайся, находи друзей и узнавай,
          кто сейчас в сети
        </p>
        <div className="flex flex-wrap gap-4 justify-center">
          <button className="bg-red-500 text-white px-6 py-3 text-sm uppercase tracking-wide transition-all duration-300 hover:bg-red-600 cursor-pointer">
            Чат для всех
          </button>
          <button className="bg-blue-500 text-white px-6 py-3 text-sm uppercase tracking-wide transition-all duration-300 hover:bg-blue-600 cursor-pointer">
            Личка
          </button>
          <button className="border border-white text-white px-6 py-3 text-sm uppercase tracking-wide transition-all duration-300 hover:bg-white hover:text-black cursor-pointer">
            Друзья
          </button>
        </div>
      </div>
    </div>
  );
}