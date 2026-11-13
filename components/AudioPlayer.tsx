"use client";

import { useEffect, useRef } from "react";

const TRACKS = [
  "/audio/Dengarkan%20Hatiku_spotdown.org.mp3",
  "/audio/Take%20A%20Chance%20With%20Me_spotdown.org.mp3",
  "/audio/The%20Man%20Who%20Can't%20Be%20Moved_spotdown.org.mp3",
  "/audio/I%20Wish%20You%20Were%20Here_spotdown.org.mp3",
  "/audio/You'll%20Be%20in%20My%20Heart_spotdown.org.mp3",
  "/audio/i%20like%20you%20so%20much,%20you'll%20know%20it_spotdown.org.mp3",
];

export default function AudioPlayer() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const indexRef = useRef(0);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = 0.4;
    audio.src = TRACKS[0];

    const play = () => {
      audio.play().catch(() => {
        const handler = () => {
          audio.play().catch(() => {});
          document.removeEventListener("click", handler);
        };
        document.addEventListener("click", handler, { once: true });
      });
    };

    const onEnded = () => {
      indexRef.current = (indexRef.current + 1) % TRACKS.length;
      audio.src = TRACKS[indexRef.current];
      play();
    };

    audio.addEventListener("ended", onEnded);
    play();

    return () => {
      audio.removeEventListener("ended", onEnded);
      audio.pause();
    };
  }, []);

  return <audio ref={audioRef} preload="auto" loop={false} />;
}
