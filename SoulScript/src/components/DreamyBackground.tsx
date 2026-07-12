"use client";

import { memo } from "react";

const RegularStars = memo(function RegularStars() {
  const stars = [
    { x: 10, y: 6, size: 4, opacity: 0.6 },
    { x: 30, y: 11, size: 3, opacity: 0.5 },
    { x: 78, y: 13, size: 4, opacity: 0.6 },
    { x: 12, y: 23, size: 3, opacity: 0.5 },
    { x: 42, y: 29, size: 4, opacity: 0.6 },
    { x: 65, y: 7, size: 3, opacity: 0.5 },
    { x: 88, y: 19, size: 4, opacity: 0.6 },
    { x: 22, y: 32, size: 3, opacity: 0.5 },
    { x: 55, y: 3, size: 4, opacity: 0.6 },
    { x: 92, y: 27, size: 3, opacity: 0.5 },
    { x: 38, y: 17, size: 4, opacity: 0.6 },
    { x: 8, y: 31, size: 3, opacity: 0.5 },
    { x: 62, y: 25, size: 4, opacity: 0.6 },
    { x: 85, y: 10, size: 3, opacity: 0.5 },
    { x: 20, y: 19, size: 4, opacity: 0.6 },
    { x: 50, y: 14, size: 3, opacity: 0.5 },
    { x: 25, y: 26, size: 3, opacity: 0.5 },
    { x: 75, y: 30, size: 4, opacity: 0.6 },
    { x: 40, y: 5, size: 3, opacity: 0.5 },
    { x: 95, y: 16, size: 3, opacity: 0.5 },
  ];

  return (
    <>
      {stars.map((star, i) => (
        <div
          key={`star-${i}`}
          className="star"
          style={{
            position: "absolute",
            left: `${star.x}%`,
            top: `${star.y}%`,
            width: star.size,
            height: star.size,
            borderRadius: "50%",
            backgroundColor: "#FFFFFF",
            opacity: star.opacity,
            animationDelay: `${(i % 2) * 1.5}s`,
          }}
        />
      ))}
    </>
  );
});

const BrightStars = memo(function BrightStars() {
  const stars = [
    { x: 42, y: 8, size: 6, opacity: 0.7 },
    { x: 80, y: 24, size: 5, opacity: 0.65 },
    { x: 15, y: 28, size: 6, opacity: 0.7 },
    { x: 70, y: 15, size: 5, opacity: 0.65 },
    { x: 32, y: 20, size: 5, opacity: 0.6 },
    { x: 88, y: 8, size: 5, opacity: 0.65 },
    { x: 52, y: 31, size: 6, opacity: 0.7 },
  ];

  return (
    <>
      {stars.map((star, i) => (
        <div
          key={`bright-${i}`}
          className="bright-star"
          style={{
            position: "absolute",
            left: `${star.x}%`,
            top: `${star.y}%`,
            width: star.size,
            height: star.size,
            borderRadius: "50%",
            backgroundColor: "#818CF8",
            opacity: star.opacity,
            animationDelay: `${i * 0.7}s`,
          }}
        />
      ))}
    </>
  );
});

const GlowStars = memo(function GlowStars() {
  const stars = [
    { x: 25, y: 14 },
    { x: 62, y: 10 },
    { x: 82, y: 26 },
  ];

  return (
    <>
      {stars.map((star, i) => (
        <div
          key={`glow-${i}`}
          className="glow-star"
          style={{
            position: "absolute",
            left: `${star.x}%`,
            top: `${star.y}%`,
            width: 5,
            height: 5,
            borderRadius: "50%",
            backgroundColor: "#FFFFFF",
            opacity: 0.55,
            animationDelay: `${i * 1.3}s`,
          }}
        />
      ))}
    </>
  );
});

const Clouds = memo(function Clouds() {
  return (
    <>
      <div
        className="cloud"
        style={{
          position: "absolute",
          left: "5%",
          top: "9%",
          width: "33%",
          height: 36,
        }}
      />
      <div
        className="cloud"
        style={{
          position: "absolute",
          left: "48%",
          top: "21%",
          width: "28%",
          height: 30,
        }}
      />
    </>
  );
});

const Moon = memo(function Moon() {
  return (
    <>
      {/* Outer glow */}
      <div
        className="moon"
        style={{
          position: "absolute",
          right: "8%",
          top: "5%",
          width: 56,
          height: 56,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(245,245,245,0.25) 0%, rgba(245,245,245,0.08) 50%, transparent 100%)",
          filter: "blur(10px)",
        }}
      />
      {/* Core */}
      <div
        style={{
          position: "absolute",
          right: "7%",
          top: "6%",
          width: 42,
          height: 42,
          borderRadius: "50%",
          background:
            "radial-gradient(circle at 30% 30%, #F5F5F5 0%, #C8D0E0 50%, transparent 100%)",
        }}
      />
      {/* Shadow for crescent effect */}
      <div
        style={{
          position: "absolute",
          right: "5%",
          top: "5%",
          width: 32,
          height: 32,
          borderRadius: "50%",
          backgroundColor: "#0B0F19",
        }}
      />
    </>
  );
});

export default function DreamyBackground() {
  return (
    <div className="dreamy-bg">
      <Moon />
      <Clouds />
      <RegularStars />
      <BrightStars />
      <GlowStars />
    </div>
  );
}
