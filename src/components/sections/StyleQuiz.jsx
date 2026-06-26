import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  RefreshCw,
  CheckCircle2,
  Brain,
  Gem,
  Crown,
  WandSparkles,
} from "lucide-react";
import { Button } from "../ui/Button";
import { GlassCard } from "../ui/GlassCard";
import { cn } from "../../utils/cn";

const questions = [
  {
    id: "occasion",
    question: "What occasion are you shopping for?",
    options: [
      "Daily Luxury",
      "Evening Gala",
      "Special Gift",
      "Bridal",
      "Bespoke Request",
    ],
  },
  {
    id: "style",
    question: "What style do you prefer?",
    options: [
      "Minimalist",
      "Editorial Modern",
      "Timeless Classic",
      "Bold Statement",
      "Vintage Inspired",
    ],
  },
  {
    id: "metal",
    question: "What metal tone do you like?",
    options: [
      "18K Yellow Gold",
      "Rose Gold",
      "White Gold / Platinum",
      "Sterling Silver",
      "Mixed Metals",
    ],
  },
  {
    id: "budget",
    question: "What is your investment range?",
    options: [
      "$500 - $1,500",
      "$1,500 - $5,000",
      "$5,000 - $15,000",
      "$15,000+",
      "Consult with AI",
    ],
  },
];

const getAuraProfile = (answers) => {
  const style = answers.style || "Timeless Classic";
  const occasion = answers.occasion || "Special Gift";
  const metal = answers.metal || "18K Yellow Gold";
  const budget = answers.budget || "$1,500 - $5,000";

  let aura = "Heritage Royal";
  let bestMatch = "Aurelia Diamond Ring";
  let score = 96;
  let reason =
    "A refined luxury profile with balanced elegance, premium gifting intent, and timeless visual appeal.";

  if (style === "Minimalist") {
    aura = "Quiet Luxe";
    bestMatch = "Celeste Gold Bracelet";
    score = 94;
    reason =
      "Your selections suggest clean silhouettes, subtle shine, and everyday elegance with a premium finish.";
  }

  if (style === "Editorial Modern") {
    aura = "Modern Muse";
    bestMatch = "Nova Pearl Drop Earrings";
    score = 97;
    reason =
      "Your profile leans toward contemporary jewellery with visual drama, clean luxury, and editorial styling.";
  }

  if (style === "Timeless Classic") {
    aura = "Heritage Royal";
    bestMatch = "Aurelia Diamond Ring";
    score = 98;
    reason =
      "Your taste matches classic luxury pieces designed for long-term elegance, gifting, and premium occasions.";
  }

  if (style === "Bold Statement") {
    aura = "Statement Icon";
    bestMatch = "Seraphina Emerald Necklace";
    score = 95;
    reason =
      "Your answers indicate a preference for expressive jewellery with high visual presence and occasion impact.";
  }

  if (style === "Vintage Inspired") {
    aura = "Vintage Heirloom";
    bestMatch = "Elara Antique Gold Choker";
    score = 96;
    reason =
      "Your profile aligns with ornate detailing, heirloom-inspired design, and warm classic metal tones.";
  }

  if (occasion === "Bridal") {
    score = Math.min(score + 1, 99);
    bestMatch = "Maison Bridal Diamond Set";
  }

  if (occasion === "Special Gift") {
    score = Math.min(score + 1, 99);
  }

  return {
    aura,
    bestMatch,
    score,
    reason,
    occasion,
    style,
    metal,
    budget,
  };
};

const StyleQuiz = () => {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [profile, setProfile] = useState(null);

  const handleOptionSelect = (option) => {
    const updatedAnswers = {
      ...answers,
      [questions[step].id]: option,
    };

    setAnswers(updatedAnswers);

    if (step < questions.length - 1) {
      setStep(step + 1);
    } else {
      generateMatch(updatedAnswers);
    }
  };

  const generateMatch = (finalAnswers) => {
    setIsGenerating(true);

    setTimeout(() => {
      setProfile(getAuraProfile(finalAnswers));
      setIsGenerating(false);
      setIsComplete(true);
    }, 2600);
  };

  const resetQuiz = () => {
    setStep(0);
    setAnswers({});
    setProfile(null);
    setIsComplete(false);
    setIsGenerating(false);
  };

  const goToMatches = () => {
    const section = document.querySelector("#neural-matches");
    if (section) {
      section.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section
      id="quiz"
      className="relative overflow-hidden border-y border-graphite/5 bg-ivory px-6 py-40 md:px-12"
    >
      <div className="relative z-10 mx-auto max-w-6xl">
        <div className="mb-24 text-center">
          <motion.span
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="mb-6 block text-[11px] font-bold uppercase tracking-[0.6em] text-graphite/30"
          >
            Interactive AI Curation
          </motion.span>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-5xl tracking-tighter md:text-7xl"
          >
            Define Your{" "}
            <span className="text-champagne-800/80 underline decoration-champagne/20 underline-offset-16 italic font-light">
              Aura
            </span>
          </motion.h2>

          <p className="mx-auto mt-6 max-w-2xl text-sm leading-8 text-graphite/45 md:text-base">
            Answer four quick questions and Luma AI will create your luxury
            jewellery style profile with a personalised match score.
          </p>
        </div>

        <GlassCard
          className="relative flex min-h-[620px] flex-col items-center justify-center overflow-hidden rounded-none border-black/[0.02] bg-white/70 p-8 text-center shadow-luxury ring-1 ring-black/5 md:p-20"
          hover={false}
        >
          <AnimatePresence mode="wait">
            {!isGenerating && !isComplete && (
              <motion.div
                key="quiz"
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -40 }}
                transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                className="w-full"
              >
                <div className="mb-16 flex justify-center gap-3">
                  {questions.map((_, i) => (
                    <div
                      key={i}
                      className={cn(
                        "h-1 transition-all duration-1000 ease-in-out",
                        i === step
                          ? "w-20 bg-champagne"
                          : i < step
                          ? "w-10 bg-graphite/30"
                          : "w-10 bg-graphite/10"
                      )}
                    />
                  ))}
                </div>

                <div className="mb-8 flex justify-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full border border-champagne/30 bg-champagne/10 text-champagne-800">
                    <Brain size={26} strokeWidth={1.3} />
                  </div>
                </div>

                <h3 className="mx-auto mb-16 max-w-3xl font-serif text-4xl italic leading-[1.1] tracking-tight text-graphite md:text-6xl">
                  {questions[step].question}
                </h3>

                <div className="flex flex-wrap justify-center gap-5">
                  {questions[step].options.map((option, i) => (
                    <motion.button
                      key={option}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.08, duration: 0.6 }}
                      onClick={() => handleOptionSelect(option)}
                      className="group relative flex items-center gap-4 overflow-hidden rounded-none border border-graphite/10 px-8 py-5 text-[11px] font-medium uppercase tracking-[0.25em] transition-all duration-700 hover:border-champagne/50 hover:bg-champagne/10 hover:shadow-xl md:px-10"
                    >
                      <span className="relative z-10">{option}</span>

                      <ArrowRight
                        size={14}
                        className="z-10 opacity-0 transition-all duration-500 group-hover:translate-x-2 group-hover:opacity-100"
                      />

                      <div className="absolute inset-0 translate-x-[-100%] bg-gradient-to-r from-champagne/5 to-transparent transition-transform duration-700 group-hover:translate-x-0" />
                    </motion.button>
                  ))}
                </div>

                {step > 0 && (
                  <button
                    onClick={() => setStep(step - 1)}
                    className="group mx-auto mt-20 flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.4em] text-graphite/40 transition-all duration-500 hover:text-graphite"
                  >
                    <ArrowLeft
                      size={14}
                      className="transition-transform duration-500 group-hover:-translate-x-2"
                    />
                    Back to Previous
                  </button>
                )}
              </motion.div>
            )}

            {isGenerating && (
              <motion.div
                key="generating"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center gap-12"
              >
                <div className="relative">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                    className="flex h-28 w-28 items-center justify-center rounded-full border border-dashed border-champagne"
                  />

                  <div className="absolute inset-0 flex items-center justify-center">
                    <Sparkles
                      size={40}
                      className="animate-pulse text-champagne-800"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-4">
                  <h3 className="font-serif text-3xl italic tracking-wide text-graphite md:text-4xl">
                    Creating Your Luma Style Profile...
                  </h3>

                  <p className="animate-pulse text-[11px] uppercase tracking-[0.5em] text-graphite/30">
                    Analysing Occasion · Metal Tone · Budget · Style Intent
                  </p>
                </div>
              </motion.div>
            )}

            {isComplete && profile && (
              <motion.div
                key="complete"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
                className="flex w-full flex-col items-center gap-10"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", bounce: 0.5, delay: 0.25 }}
                  className="mb-2 flex h-24 w-24 items-center justify-center rounded-full bg-champagne/10 text-champagne-800 ring-8 ring-champagne/5"
                >
                  <CheckCircle2 size={48} strokeWidth={1} />
                </motion.div>

                <div>
                  <p className="mb-4 text-[11px] font-bold uppercase tracking-[0.45em] text-graphite/30">
                    Your Luma Aura
                  </p>

                  <h3 className="font-serif text-5xl italic tracking-tight text-graphite md:text-7xl">
                    {profile.aura}
                  </h3>
                </div>

                <div className="grid w-full max-w-4xl gap-5 md:grid-cols-3">
                  <div className="border border-graphite/10 bg-white/70 p-7 text-left">
                    <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-full bg-champagne/10 text-champagne-800">
                      <Gem size={20} />
                    </div>

                    <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.35em] text-graphite/30">
                      Best Match
                    </p>

                    <h4 className="text-xl font-medium tracking-tight text-graphite">
                      {profile.bestMatch}
                    </h4>
                  </div>

                  <div className="border border-graphite/10 bg-white/70 p-7 text-left">
                    <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-full bg-champagne/10 text-champagne-800">
                      <Crown size={20} />
                    </div>

                    <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.35em] text-graphite/30">
                      AI Match
                    </p>

                    <h4 className="text-4xl font-serif italic text-champagne-800">
                      {profile.score}%
                    </h4>
                  </div>

                  <div className="border border-graphite/10 bg-white/70 p-7 text-left">
                    <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-full bg-champagne/10 text-champagne-800">
                      <WandSparkles size={20} />
                    </div>

                    <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.35em] text-graphite/30">
                      Profile
                    </p>

                    <h4 className="text-sm leading-7 text-graphite/60">
                      {profile.style} · {profile.metal}
                    </h4>
                  </div>
                </div>

                <div className="max-w-3xl border border-champagne/20 bg-champagne/10 p-8">
                  <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.4em] text-champagne-800/70">
                    AI Recommendation Reason
                  </p>

                  <p className="text-sm leading-8 text-graphite/60 md:text-base">
                    {profile.reason}
                  </p>
                </div>

                <div className="flex flex-col gap-6 pt-4 sm:flex-row">
                  <Button
                    variant="primary"
                    size="lg"
                    onClick={goToMatches}
                    className="px-14 shadow-2xl"
                  >
                    View Neural Matches
                  </Button>

                  <Button
                    variant="outline"
                    size="lg"
                    onClick={resetQuiz}
                    className="group flex items-center gap-3"
                  >
                    <RefreshCw
                      size={16}
                      className="transition-transform duration-1000 group-hover:rotate-180"
                    />
                    Restart Curation
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </GlassCard>
      </div>

      {/* Luxury Background Layers */}
      <div className="pointer-events-none absolute right-0 top-0 -z-10 h-full w-full overflow-hidden">
        <div className="absolute right-[-10%] top-[-10%] h-[500px] w-[500px] rounded-full bg-champagne/5 blur-[150px]" />
        <div className="absolute bottom-[-10%] left-[-10%] h-[600px] w-[600px] rounded-full bg-champagne/10 blur-[180px]" />
      </div>
    </section>
  );
};

export { StyleQuiz };