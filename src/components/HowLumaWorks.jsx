import { motion } from "framer-motion";
import { Sparkles, Brain, SlidersHorizontal, Gem, BadgeCheck } from "lucide-react";

const steps = [
  {
    icon: SlidersHorizontal,
    title: "Style Signals",
    text: "The user selects occasion, budget, metal tone, jewellery type, and design preference.",
  },
  {
    icon: Brain,
    title: "AI Preference Mapping",
    text: "Luma AI converts choices into a style profile and compares it with every jewellery piece.",
  },
  {
    icon: Sparkles,
    title: "Match Score",
    text: "Each product gets a personalized score based on elegance, gifting intent, and user taste.",
  },
  {
    icon: Gem,
    title: "Curated Recommendations",
    text: "The best matched products are ranked and shown as luxury recommendations.",
  },
];

export default function HowLumaWorks() {
  return (
    <section className="relative overflow-hidden bg-[#090604] px-6 py-24 text-white">
      <div className="absolute left-1/2 top-0 h-72 w-72 -translate-x-1/2 rounded-full bg-amber-300/10 blur-3xl" />

      <div className="relative mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="mx-auto max-w-3xl text-center"
        >
          <div className="mx-auto mb-5 flex w-fit items-center gap-2 rounded-full border border-amber-200/20 bg-white/5 px-5 py-2 text-sm text-amber-200">
            <BadgeCheck size={16} />
            AI Personalisation Engine
          </div>

          <h2 className="text-4xl font-semibold tracking-tight md:text-6xl">
            How Luma AI Finds Your Jewellery Match
          </h2>

          <p className="mt-5 text-base leading-8 text-white/65 md:text-lg">
            LumaJewels AI is designed as a luxury shopping prototype where user
            preferences are transformed into intelligent jewellery recommendations
            with personalized match scores.
          </p>
        </motion.div>

        <div className="mt-16 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, index) => {
            const Icon = step.icon;

            return (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 35 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.12 }}
                className="group rounded-[2rem] border border-white/10 bg-white/[0.04] p-7 shadow-2xl backdrop-blur-xl transition duration-300 hover:-translate-y-2 hover:border-amber-200/40 hover:bg-white/[0.07]"
              >
                <div className="mb-7 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-200/10 text-amber-200 ring-1 ring-amber-200/20 transition group-hover:scale-110">
                  <Icon size={24} />
                </div>

                <p className="mb-3 text-sm uppercase tracking-[0.3em] text-amber-200/70">
                  Step {index + 1}
                </p>

                <h3 className="text-xl font-semibold text-white">
                  {step.title}
                </h3>

                <p className="mt-4 text-sm leading-7 text-white/60">
                  {step.text}
                </p>
              </motion.div>
            );
          })}
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="mt-14 rounded-[2rem] border border-amber-200/20 bg-gradient-to-r from-amber-200/10 via-white/[0.04] to-amber-200/10 p-6 text-center shadow-2xl"
        >
          <p className="text-sm uppercase tracking-[0.35em] text-amber-200">
            Prototype Intelligence
          </p>

          <p className="mx-auto mt-4 max-w-4xl text-lg leading-8 text-white/75">
            The goal is to demonstrate how luxury jewellery discovery can become
            more personal using AI-driven recommendations, interactive quizzes,
            match scoring, wishlist intent, and curated product storytelling.
          </p>
        </motion.div>
      </div>
    </section>
  );
}