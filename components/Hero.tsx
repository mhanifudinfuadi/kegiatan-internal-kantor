// components/Hero.tsx

"use client";

import React, { useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import styles from './Hero.module.css'; // Assuming CSS module usage for complex styling/animation

// Placeholder for actual data
const headlineData = {
  line1: "Dokumentasi yang",
  line2: "Menyimpan momen",
};

// Placeholder for styles matching design.md
const Hero = ({ onNavigate }: { onNavigate: () => void }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isVideoLoaded, setIsVideoLoaded] = React.useState(false);

  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const handleLoadedMetadata = () => {
      setIsVideoLoaded(true);
    };

    // Set initial state for video loading
    videoElement.addEventListener('canplay', handleLoadedMetadata);

    // Handle reduced motion by pausing and showing poster if needed
    if (prefersReducedMotion) {
      videoElement.pause();
      // Note: In a real scenario, we'd control the visibility of the poster here
    }

    // Cleanup
    return () => {
      videoElement.removeEventListener('canplay', handleLoadedMetadata);
    };
  }, []);

  const handleCtaClick = () => {
    // Trigger the transition logic, then navigate
    onNavigate(); 
  };

  return (
    <div className={styles.heroContainer}>
      {/* Layer 0: Video */}
      <video 
        ref={videoRef} 
        className={styles.videoLayer}
        autoPlay 
        muted 
        loop 
        playsInline 
        poster="/assets/hero/white-hood-blossoms.webp" 
        // Use a custom source list for better compatibility
        // For production, this should be <source> tags with different codecs/formats
      >
        <source src="/assets/hero/white-hood-blossoms.mp4" type="video/mp4" />
        Your browser does not support the video tag.
      </video>

      {/* Layer 1: Tint (Overlay) */}
      <div className={styles.tintLayer}></div>

      <div className={styles.contentWrapper}>
        {/* Layer 2: Headline */}
        <header className={styles.headlineWrapper}>
          <h1 className={styles.headline}>
            <span className={styles.line1}>
              {headlineData.line1}
            </span>
            <span className={styles.line2}>
              {headlineData.line2}
            </span>
          </h1>
        </header>

        {/* Layer 3: CTA */}
        <div className={styles.ctaWrapper}>
          <Link href="/dokumentasi" onClick={handleCtaClick} className={styles.ctaButton}>
            <div className={styles.ctaContent}>
              <span>Go to teh room</span>
              <span className={styles.ctaIcon}>&#x27A4;</span> {/* Right arrow icon */}
            </div>
          </Link>
        </div>
        
        {/* Layer 4: Grain (Optional - implemented via CSS or dedicated component if needed) */}
      </div>
    </div>
  );
};

export default Hero;