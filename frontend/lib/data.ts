export const mockQuestions = [
  {
    id: "1",
    title: "Derivative of Polynomial",
    question: "What is the derivative of f(x) = x² + 3x - 5?",
    difficulty: "Easy",
    options: { A: "2x + 3", B: "2x - 3", C: "x² + 3", D: "2x² + 3x" },
  },
  {
    id: "2",
    title: "Linear Equation",
    question: "Solve the equation: 2x + 5 = 13",
    difficulty: "Easy",
    options: { A: "x = 4", B: "x = 5", C: "x = 6", D: "x = 7" },
  },
  {
    id: "3",
    title: "Circle Area",
    question: "What is the area of a circle with radius 5?",
    difficulty: "Medium",
    options: { A: "10π", B: "25π", C: "50π", D: "100π" },
  },
  {
    id: "4",
    title: "Limit Problem",
    question: "Find the limit: lim(x→0) sin(x)/x",
    difficulty: "Hard",
    options: { A: "0", B: "1", C: "∞", D: "Does not exist" },
  },
  {
    id: "5",
    title: "Integration",
    question: "What is the integral of 3x²?",
    difficulty: "Medium",
    options: { A: "x³", B: "x³ + C", C: "3x³", D: "3x³ + C" },
  },
];

export const mockSessions = [
  {
    id: "session-1",
    questionId: "1",
    questionTitle: "Derivative of Polynomial",
    startedAt: "2026-01-24T10:30:00",
    duration: "15 min",
  },
  {
    id: "session-2",
    questionId: "3",
    questionTitle: "Circle Area",
    startedAt: "2026-01-24T09:15:00",
    duration: "22 min",
  },
  {
    id: "session-3",
    questionId: "4",
    questionTitle: "Limit Problem",
    startedAt: "2026-01-23T14:20:00",
    duration: "35 min",
  },
];
