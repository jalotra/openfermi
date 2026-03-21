"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Line, LineChart } from "recharts";
import { ChartContainer } from "@/components/ui/chart";

// Generate math data for doodles
const generateMathData = () => {
  const data = [];
  const start = -2 * Math.PI;
  const end = 2 * Math.PI;
  const step = 0.1;

  for (let x = start; x <= end; x += step) {
    const tanValue = Math.tan(x);
    // Cap tan values to avoid giant vertical lines at asymptotes
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
  { name: "ALLEN", style: "font-bold tracking-wider text-lg" },
  { name: "FIITJEE", style: "font-bold tracking-wide text-lg" },
  { name: "Stanford", style: "font-serif text-lg" },
  { name: "MIT", style: "font-bold tracking-widest text-lg" },
  { name: "Resonance", style: "font-semibold text-lg" },
];

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

function TabletMockup() {
  return (
    <div className="relative z-10 w-full max-w-[800px] mx-auto mt-12 mb-16">
      {/* Outer Tablet Frame */}
      <div className="rounded-[2.5rem] bg-[#eaddc9] p-3 shadow-2xl border border-[#d1c5b4]">
        {/* Inner Screen */}
        <div className="rounded-[2rem] bg-white border border-[#d1c5b4] overflow-hidden flex h-[450px] text-left">
          {/* Left Panel: AI Steps */}
          <div className="w-[28%] border-r border-[#e0d8d0] p-4 flex flex-col bg-[#faf9f6]">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="size-5 rounded bg-[#fce8e8] flex items-center justify-center border border-[#e5b5b5]">
                  <span className="text-[10px] font-bold text-foreground">
                    T
                  </span>
                </div>
                <span className="text-xs font-semibold text-foreground">
                  Tars AI
                </span>
              </div>
              <svg
                viewBox="0 0 24 24"
                className="size-4 text-gray-400"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M12 5v14M5 12h14" />
              </svg>
            </div>

            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold text-foreground">
                AI Steps
              </span>
              <span className="text-[10px] bg-white border border-[#e0d8d0] px-2 py-1 rounded-full text-gray-500">
                Pre-requisite
              </span>
            </div>

            <div className="flex-1 space-y-3 overflow-hidden">
              {[
                {
                  title: "Step 1",
                  desc: "Set current limits of integration on my prompt proper or past fact.",
                  active: true,
                },
                {
                  title: "Step 2",
                  desc: "Base close straight coordinates to the enough limits.",
                  active: false,
                },
                {
                  title: "Step 3",
                  desc: "All limits are guided fast.",
                  active: false,
                },
                {
                  title: "Step 4",
                  desc: "Does limit approach candidate with vast loss.",
                  active: false,
                },
                {
                  title: "Step 5",
                  desc: "Time to cross multiply the...",
                  active: false,
                },
              ].map((step, i) => (
                <div
                  key={i}
                  className={`p-3 rounded-xl border ${step.active ? "bg-white border-[#d1c5b4] shadow-sm" : "bg-transparent border-transparent opacity-60"}`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <div
                      className={`size-4 rounded-full flex items-center justify-center text-[10px] ${step.active ? "bg-[#e8e8fc] text-foreground" : "bg-gray-200 text-gray-500"}`}
                    >
                      {i === 0 ? "/" : ""}
                    </div>
                    <span className="text-xs font-bold text-foreground">
                      {step.title}
                    </span>
                  </div>
                  <p className="text-[10px] text-gray-500 leading-tight ml-6">
                    {step.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Center Panel: Canvas */}
          <div className="flex-1 p-4 flex flex-col bg-white relative">
            {/* Toolbar */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-1 bg-[#faf9f6] p-1 rounded-lg border border-[#e0d8d0]">
                {["Free", "Select", "Format", "Length", "Math"].map(
                  (tool, i) => (
                    <button
                      key={tool}
                      className={`px-3 py-1.5 rounded-md text-[10px] font-medium flex items-center gap-1 ${i === 0 ? "bg-white shadow-sm text-foreground" : "text-gray-500 hover:bg-gray-100"}`}
                    >
                      <div className="size-3 rounded-sm bg-gray-200" />
                      {tool}
                    </button>
                  ),
                )}
              </div>
              <button className="px-4 py-1.5 bg-white border border-[#e0d8d0] rounded-lg text-[10px] font-bold flex items-center gap-1 shadow-sm">
                <span className="text-green-600">✓</span> Submit
              </button>
            </div>

            {/* Canvas Content */}
            <div className="flex-1 relative">
              <p className="text-sm text-foreground mb-4">
                ① Find <span className="font-serif italic">a</span> in the
                problem <span className="font-serif italic">b b</span> :
              </p>

              <div className="flex items-start gap-8 mb-8">
                <div className="text-lg font-serif italic text-foreground">
                  ∫ f(x) dt ={" "}
                  <span className="inline-block border-b border-foreground pb-1 mb-1">
                    √ L² - ab²
                  </span>
                  <br />
                  <span className="ml-12">a²</span>
                </div>

                {/* Hand-drawn graph */}
                <svg
                  viewBox="0 0 100 100"
                  className="w-32 h-32 text-foreground"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <path d="M10 90 L90 90 M10 10 L10 90" />
                  <path d="M10 90 L60 40 L80 40" />
                  <path d="M60 40 L60 90" strokeDasharray="4 4" />
                  <text
                    x="5"
                    y="15"
                    fontSize="10"
                    stroke="none"
                    fill="currentColor"
                  >
                    y
                  </text>
                  <text
                    x="95"
                    y="95"
                    fontSize="10"
                    stroke="none"
                    fill="currentColor"
                  >
                    x
                  </text>
                  <text
                    x="55"
                    y="98"
                    fontSize="10"
                    stroke="none"
                    fill="currentColor"
                  >
                    b
                  </text>
                  <text
                    x="5"
                    y="45"
                    fontSize="10"
                    stroke="none"
                    fill="currentColor"
                  >
                    a
                  </text>
                  <text
                    x="85"
                    y="35"
                    fontSize="10"
                    stroke="none"
                    fill="currentColor"
                  >
                    y=f(x)
                  </text>
                  {/* Hatched area */}
                  <path
                    d="M15 85 L25 90 M20 80 L35 90 M25 75 L45 90 M30 70 L55 90 M35 65 L60 85 M40 60 L60 80 M45 55 L60 75 M50 50 L60 70 M55 45 L60 65"
                    strokeWidth="0.5"
                  />
                </svg>
              </div>

              <p className="text-sm text-foreground mb-4">
                ② Consider using integration by parts for the first term...
              </p>

              <div className="text-base font-serif italic text-foreground space-y-4">
                <p>
                  = ½ ∫ f(a) da ={" "}
                  <span className="inline-block border-b border-foreground pb-1 mb-1">
                    da
                  </span>{" "}
                  ∫ dx
                </p>
                <p>= ∫ (1+a)dt + (1+w) = 0</p>
                <p>=</p>
              </div>
            </div>
          </div>

          {/* Right Panel: Director */}
          <div className="w-[25%] border-l border-[#e0d8d0] p-4 flex flex-col bg-[#faf9f6]">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold text-foreground">
                Director
              </span>
              <svg
                viewBox="0 0 24 24"
                className="size-4 text-gray-400"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </div>

            <div className="flex-1 space-y-4 overflow-hidden">
              <div className="flex gap-2">
                <div className="size-5 rounded-full bg-[#e8e8fc] shrink-0" />
                <div>
                  <p className="text-[10px] font-bold text-foreground">
                    Tars AI Tutor
                  </p>
                  <p className="text-[10px] text-gray-500 leading-tight mt-1">
                    proton lasers smeared belts per cor wrons.
                  </p>
                </div>
              </div>

              <div className="flex justify-end">
                <div className="bg-[#fce8e8] text-foreground text-[10px] px-3 py-2 rounded-xl rounded-tr-sm border border-[#e5b5b5]">
                  How could feet?
                </div>
              </div>

              <div className="flex gap-2">
                <div className="size-5 rounded-full bg-[#e8e8fc] shrink-0" />
                <div>
                  <p className="text-[10px] font-bold text-foreground">
                    Tars AI Tutor
                  </p>
                  <p className="text-[10px] text-gray-500 leading-tight mt-1">
                    Consists using Pigeon by gents in Sin Gartish, nomore Sontic
                    Vilonets to free regeneration to another burnout.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-4 relative">
              <input
                type="text"
                placeholder="Type a message..."
                className="w-full bg-white border border-[#e0d8d0] rounded-lg px-3 py-2 text-[10px] focus:outline-none"
              />
              <svg
                viewBox="0 0 24 24"
                className="size-3 absolute right-3 top-2.5 text-gray-400"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
              </svg>
            </div>
          </div>
        </div>
      </div>
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
          {["Features", "Pricing", "Resources"].map((item) => (
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
            href="/login"
            className="hover:opacity-70 transition-opacity hidden sm:block"
          >
            Login
          </Link>
          <Link href="/signup">
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
            Solve JEE Problems at
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
            <Link href="#demo">
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
            </Link>
          </div>

          <TabletMockup />

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
        </div>

        {/* Features Section */}
        <div className="mb-24 text-center w-full">
          <h2 className="text-3xl font-bold mb-2">
            First attempt to final solution.
          </h2>
          <h3 className="text-2xl font-medium text-gray-600 mb-10">
            No grind.
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 w-full">
            {FEATURES.map((feature) => (
              <div
                key={feature.title}
                className={`${feature.bg} rounded-3xl p-6 border border-[#d1c5b4] shadow-sm text-left hover:-translate-y-1 transition-transform`}
              >
                {feature.icon}
                <h4 className="font-bold text-sm mb-2">{feature.title}</h4>
                <p className="text-xs text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* AI Tutor Section */}
        <div className="mb-24 text-center relative w-full">
          <h2 className="text-3xl font-bold mb-8">
            An AI Tutor with Superpowers
          </h2>

          <div className="max-w-md mx-auto mb-12 relative">
            <div className="bg-[#fcfce8] border border-[#d1c5b4] rounded-full px-6 py-3 shadow-sm flex items-center justify-between">
              <span className="text-sm text-gray-500">
                Describe your doubt (e.g. &quot;Help me with rotational
                motion&quot;)
              </span>
              <div className="size-6 rounded-full bg-[#e8e8fc] flex items-center justify-center">
                <svg
                  viewBox="0 0 24 24"
                  className="size-3 text-foreground"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 w-full">
            {SUBJECTS.map((subject) => (
              <div
                key={subject.name}
                className={`${subject.bg} rounded-3xl p-6 border border-[#d1c5b4] shadow-sm flex flex-col items-center text-center hover:-translate-y-1 transition-transform`}
              >
                {subject.icon}
                <h4 className="font-bold text-sm mb-2">{subject.name}</h4>
                <p className="text-xs text-gray-600 leading-relaxed">
                  {subject.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center mb-24 w-full">
          <h2 className="text-3xl font-bold mb-6">
            Start Mastering JEE Today.
          </h2>
          <Link href="/signup">
            <button className="bg-[#6b4c3a] border-2 border-background ring-1 ring-[#6b4c3a] text-background px-8 py-3 rounded-full font-medium hover:bg-[#5a3f2f] transition-colors shadow-sm">
              Get Started
            </button>
          </Link>
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
