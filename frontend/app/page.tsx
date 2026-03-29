"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Line, LineChart } from "recharts";
import { ChartContainer } from "@/components/ui/chart";

const EXAM_NAMES = ["JEE", "NEET", "AP Exams", "SAT"];

function RotatingText({
  items,
  interval = 2500,
}: {
  items: string[];
  interval?: number;
}) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(
      () => setIndex((i) => (i + 1) % items.length),
      interval,
    );
    return () => clearInterval(id);
  }, [items.length, interval]);

  return (
    <span className="inline-block relative overflow-hidden align-bottom">
      <span key={index} className="inline-block animate-slide-up text-primary">
        {items[index]}
      </span>
    </span>
  );
}

const generateMathData = () => {
  const data = [];
  const start = -2 * Math.PI;
  const end = 2 * Math.PI;
  const step = 0.1;

  for (let x = start; x <= end; x += step) {
    const tanValue = Math.tan(x);
    const cappedTan = Math.abs(tanValue) > 5 ? null : tanValue;

    data.push({
      x,
      sin: Math.sin(x),
      cos: Math.cos(x),
      tan: cappedTan,
    });
  }
  return data;
};

const mathData = generateMathData();

function MathCurveDoodle({
  dataKey,
  className,
  color = "#d1c5b4",
}: {
  dataKey: "sin" | "cos" | "tan";
  className: string;
  color?: string;
}) {
  return (
    <div className={`absolute pointer-events-none opacity-40 ${className}`}>
      <ChartContainer
        config={{ [dataKey]: { color } }}
        className="w-full h-full"
      >
        <LineChart data={mathData}>
          <Line
            type="monotone"
            dataKey={dataKey}
            stroke={`var(--color-${dataKey})`}
            strokeWidth={3}
            dot={false}
            isAnimationActive={false}
            connectNulls={false}
          />
        </LineChart>
      </ChartContainer>
    </div>
  );
}

const INSTITUTIONS = [
  { name: "IIT Bombay", style: "font-serif text-lg" },
  { name: "Stanford", style: "font-serif text-lg" },
  { name: "MIT", style: "font-serif tracking-widest text-lg" },
  { name: "DTU", style: "font-serif tracking-wider text-lg" },
];

const HOW_IT_WORKS_STEPS = [
  {
    title: "Choose a Question",
    description:
      "Browse our collection of educational questions and pick one to work on.",
    bg: "bg-[#fce8e8]",
  },
  {
    title: "Draw Your Solution",
    description:
      "Use intuitive drawing tools to sketch, annotate, and solve on the canvas.",
    bg: "bg-[#e8e8fc]",
  },
  {
    title: "Understand with AI agents",
    description:
      "Intelligent agents help you grasp the problem and guide you toward a solution.",
    bg: "bg-[#e8fce8]",
  },
  {
    title: "Collaborate & share",
    description:
      "Work with others, get feedback, and export your solutions when you're done.",
    bg: "bg-[#fcfce8]",
  },
] as const;

const FEATURES = [
  {
    title: "AI Explainer",
    description:
      "Get instant, clear explanations for any concept. Tailored to your level.",
    bg: "bg-[#fce8e8]", // Pink
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        className="size-8 mb-3 text-foreground"
      >
        <path d="M12 18v-5.25m0 0a6.01 6.01 0 0 0 1.5-.189m-1.5.189a6.01 6.01 0 0 1-1.5-.189m3.75 7.478a12.06 12.06 0 0 1-4.5 0m3.75 2.383a14.406 14.406 0 0 1-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 1 0-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
      </svg>
    ),
  },
  {
    title: "Step-by-Step Hints",
    description:
      "Break down complex problems into manageable steps with global hints.",
    bg: "bg-[#e8e8fc]", // Purple
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        className="size-8 mb-3 text-foreground"
      >
        <path d="M12 18v-5.25m0 0a6.01 6.01 0 0 0 1.5-.189m-1.5.189a6.01 6.01 0 0 1-1.5-.189m3.75 7.478a12.06 12.06 0 0 1-4.5 0m3.75 2.383a14.406 14.406 0 0 1-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 1 0-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
      </svg>
    ),
  },
  {
    title: "Interactive Canvas",
    description:
      "Solve problems visually on an infinite canvas with smart tools.",
    bg: "bg-[#e8fce8]", // Green
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        className="size-8 mb-3 text-foreground"
      >
        <path d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
      </svg>
    ),
  },
];

const SUBJECTS = [
  {
    name: "Calculus",
    description: "Master continuous change with step-by-step guidance.",
    bg: "bg-[#fce8e8]", // Pink
    icon: (
      <span className="text-3xl font-serif italic mb-2 block text-foreground">
        f
      </span>
    ),
  },
  {
    name: "Physics",
    description: "Build deep conceptual understanding with interactive tools.",
    bg: "bg-[#e8e8fc]", // Purple
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        className="size-8 mb-2 text-foreground"
      >
        <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
      </svg>
    ),
  },
  {
    name: "Chemistry",
    description: "Solve organic and inorganic problems on a smart canvas.",
    bg: "bg-[#e8fce8]", // Green
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        className="size-8 mb-2 text-foreground"
      >
        <path d="M9.75 3.104v5.714a2.25 2.25 0 0 1-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 0 1 4.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0 1 12 15a9.065 9.065 0 0 0-6.23.693L5 14.5m14.8.8 1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0 1 12 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
      </svg>
    ),
  },
];

const FOOTER_LINKS = {
  Product: ["Features", "Pricing", "Changelog"],
  Resources: ["Blog", "Community", "Docs"],
  Company: ["About", "Careers", "Contact"],
  Legal: ["Privacy", "Terms"],
};

function MathDoodles() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
      <MathCurveDoodle
        dataKey="sin"
        className="top-20 left-[-5%] w-[400px] h-[200px] -rotate-12"
      />
      <MathCurveDoodle
        dataKey="cos"
        className="top-64 right-[-10%] w-[500px] h-[250px] rotate-12"
      />
      <MathCurveDoodle
        dataKey="tan"
        className="top-[40%] left-[5%] w-[300px] h-[300px] rotate-6"
      />
      <MathCurveDoodle
        dataKey="sin"
        className="top-[60%] right-[5%] w-[350px] h-[150px] -rotate-6"
      />
      <MathCurveDoodle
        dataKey="cos"
        className="bottom-[10%] left-[15%] w-[600px] h-[200px] rotate-6"
      />
    </div>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground font-sans overflow-x-hidden relative selection:bg-[#fce8e8]">
      <MathDoodles />

      {/* Navbar */}
      <nav className="relative z-20 flex items-center justify-between px-8 py-6 max-w-[1400px] mx-auto">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-lg bg-foreground text-background text-lg font-bold">
            T
          </div>
          <span className="text-xl font-semibold tracking-tight">Tars</span>
        </Link>

        <div className="hidden md:flex items-center gap-8 text-sm font-medium">
          {["Features"].map((item) => (
            <Link
              key={item}
              href={`#${item.toLowerCase()}`}
              className="hover:opacity-70 transition-opacity"
            >
              {item}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-6 text-sm font-medium">
          <Link
            href="/auth/login"
            className="hover:opacity-70 transition-opacity hidden sm:block"
          >
            Login
          </Link>
          <Link href="/auth/login">
            <button className="bg-[#6b4c3a] text-background px-6 py-2.5 rounded-full hover:bg-[#5a3f2f] transition-colors shadow-sm">
              Sign up
            </button>
          </Link>
        </div>
      </nav>

      {/* Main Single-Column Centered Layout */}
      <main className="relative z-10 max-w-5xl mx-auto px-8 flex flex-col items-center pb-24 text-center">
        {/* Hero Section */}
        <div className="flex flex-col pt-12 lg:pt-20 items-center w-full">
          <h1 className="text-5xl lg:text-6xl xl:text-[4.5rem] font-bold leading-[1.05] tracking-tight mb-6">
            Solve <RotatingText items={EXAM_NAMES} /> Problems at
            <br />
            the Speed of Thought.
          </h1>

          <p className="text-lg lg:text-xl text-gray-600 mb-10 max-w-lg">
            Go from stuck to solution with a clean, AI-powered problem-solving
            environment in minutes.
          </p>

          <div className="flex items-center justify-center gap-4 mb-8">
            <Link href="/questions">
              <button className="bg-[#fce8e8] border-2 border-background ring-1 ring-[#e5b5b5] text-foreground px-6 py-3 rounded-full font-medium flex items-center gap-2 hover:bg-[#f5d6d6] transition-colors shadow-sm">
                Start Learning
                <svg
                  viewBox="0 0 24 24"
                  className="size-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </Link>
            {/* <Link href="#demo">
              <button className="bg-[#e8fce8] border-2 border-background ring-1 ring-[#b5e5b5] text-foreground px-6 py-3 rounded-full font-medium flex items-center gap-2 hover:bg-[#d6f5d6] transition-colors shadow-sm">
                Watch Demo
                <svg
                  viewBox="0 0 24 24"
                  className="size-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </Link> */}
          </div>

          <div className="relative z-10 w-full max-w-[800px] mx-auto mt-12 mb-16">
            <div className="rounded-[2.5rem] bg-[#eaddc9] p-3 shadow-2xl border border-[#d1c5b4]">
              <div className="rounded-[2rem] bg-white border border-[#d1c5b4] overflow-hidden">
                <Image
                  src="/product_photo.png"
                  alt="Tars AI workspace showing AI steps, canvas, and tutor"
                  width={2140}
                  height={1338}
                  className="w-full h-auto block"
                  priority
                  sizes="(max-width: 800px) 100vw, 800px"
                />
              </div>
            </div>
          </div>
        </div>

        {/* How It Works Section */}
        <section className="w-full mb-24 text-center" id="features">
          <h2 className="text-3xl font-bold mb-2">How It Works</h2>
          <p className="text-2xl font-medium text-gray-600 mb-10 max-w-2xl mx-auto">
            Four simple steps from question to solution.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 w-full text-left">
            {HOW_IT_WORKS_STEPS.map((step, i) => (
              <div
                key={step.title}
                className={`${step.bg} rounded-3xl p-6 border border-[#d1c5b4] shadow-sm hover:-translate-y-1 transition-transform`}
              >
                <div className="size-10 rounded-full bg-background/80 border border-[#d1c5b4] flex items-center justify-center text-sm font-bold text-foreground mb-4">
                  {i + 1}
                </div>
                <h3 className="font-bold text-sm mb-2">{step.title}</h3>
                <p className="text-xs text-gray-600 leading-relaxed">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        <div className="mt-8 mb-24 w-full">
          <h3 className="text-xl font-medium mb-6 text-center">
            Used by students from
          </h3>
          <div className="flex items-center justify-center gap-8 flex-wrap opacity-70">
            {INSTITUTIONS.map((inst) => (
              <span key={inst.name} className={inst.style}>
                {inst.name}
              </span>
            ))}
          </div>
        </div>

        {/* Footer */}
        <footer className="w-full pt-12 border-t border-[#d1c5b4] flex flex-col sm:flex-row justify-between gap-8 text-left">
          <div>
            <Link href="/" className="flex items-center gap-2 mb-6">
              <div className="flex size-6 items-center justify-center rounded bg-foreground text-background text-xs font-bold">
                T
              </div>
              <span className="font-semibold">Tars</span>
            </Link>
            <div className="flex gap-4 opacity-50">
              <svg viewBox="0 0 24 24" className="size-5" fill="currentColor">
                <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z" />
              </svg>
              <svg viewBox="0 0 24 24" className="size-5" fill="currentColor">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
              <svg viewBox="0 0 24 24" className="size-5" fill="currentColor">
                <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
              </svg>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 w-full max-w-2xl">
            {Object.entries(FOOTER_LINKS).map(([category, links]) => (
              <div key={category}>
                <h5 className="font-bold text-sm mb-4">{category}</h5>
                <ul className="space-y-2">
                  {links.map((link) => (
                    <li key={link}>
                      <Link
                        href="#"
                        className="text-xs text-gray-500 hover:text-gray-900 transition-colors"
                      >
                        {link}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </footer>
        <div className="w-full">
          <p className="text-[10px] text-gray-400 text-right mt-8 pb-8">
            Privacy Tournament
          </p>
        </div>
      </main>
    </div>
  );
}
