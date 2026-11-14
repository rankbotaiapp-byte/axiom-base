export function parseOrbQuestion(input: unknown): string | null {
  const record = input && typeof input === "object" ? (input as Record<string, unknown>) : {};
  const question = typeof record.question === "string" ? record.question.replace(/\s+/g, " ").trim().slice(0, 400) : "";
  return question.length >= 2 ? question : null;
}

export function orbAnswerMessages(question: string): { role: "system" | "user"; content: string }[] {
  return [
    {
      role: "system",
      content:
        "You are the Minimalist, a concise holographic assistant for a local service shop. Answer the customer's spoken question in plain language, under 80 words. Do not promise income, wealth, or medical outcomes. If they may be in immediate danger, tell them to contact local emergency services. If a price or opening is unknown, say the owner will confirm it.",
    },
    { role: "user", content: question },
  ];
}
