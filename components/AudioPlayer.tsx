"use client";

import { useEffect, useRef } from "react";

export default function AudioPlayer() {
  const audio1Ref = useRef<HTMLAudioElement>(null);
  const audio2Ref = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const a1 = audio1Ref.current;
    const a2 = audio2Ref.current;
    if (!a1 || !a2) return;
    
    a1.volume = 0.4;
    a2.volume = 0.4;
    
    const playPromise = a1.play();
    if (playPromise !== undefined) {
      playPromise.catch(() => {
        document.addEventListener('click', () => {
          a1.play().catch(() => {});
        }, { once: true });
      });
    }
    
    a1.addEventListener('ended', () => {
      a2.play().catch(() => {});
    });
    
    a2.addEventListener('ended', () => {
      a1.play().catch(() => {});
    });
  }, []);

  return (
    <>
      <audio ref={audio1Ref} src="/audio/Take%20A%20Chance%20With%20Me_spotdown.org.mp3" preload="auto" />
      <audio ref={audio2Ref} src="/audio/The%20Man%20Who%20Can't%20Be%20Moved_spotdown.org.mp3" preload="auto" />
    </>
  );
}
