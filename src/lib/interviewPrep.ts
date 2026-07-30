import type { ResumeAnalysis } from "./ats";

export type InterviewQuestionCategory =
  | "Opening"
  | "Behavioral"
  | "Role skills";

export type InterviewQuestion = {
  id: string;
  category: InterviewQuestionCategory;
  question: string;
  whyAsked: string;
  outline: string[];
  evidence: string[];
};

export type InterviewPrep = {
  targetRole: string;
  focusTerms: string[];
  introductionPoints: string[];
  questions: InterviewQuestion[];
  questionsToAsk: string[];
  storySources: string[];
};

type InterviewPrepInput = {
  resumeText: string;
  jobListing: string;
  analysis: ResumeAnalysis;
  selectedTerms: Set<string> | string[];
  verifiedEvidence?: Record<string, string>;
  targetRole?: string;
};

function cleanLine(value: string) {
  return value
    .trim()
    .replace(/^[•●▪◦*-]\s*/, "")
    .replace(/\s+/g, " ");
}

function unique(values: string[]) {
  return values.filter(
    (value, index, source) =>
      value.length > 0 &&
      source.findIndex(
        (candidate) => candidate.toLowerCase() === value.toLowerCase(),
      ) === index,
  );
}

function extractResumeLines(resumeText: string) {
  return resumeText
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .map(cleanLine)
    .filter(
      (line) =>
        line.length >= 24 &&
        !/^(professional summary|summary|profile|experience|professional experience|work experience|employment|education|skills|core skills|technical skills|competencies)$/i.test(
          line,
        ),
    );
}

function strongestEvidence(resumeText: string) {
  const lines = extractResumeLines(resumeText);
  return unique([
    ...lines.filter((line) =>
      /(?:\d|%|\$|increased|reduced|improved|grew|saved|trained|led|managed)/i.test(
        line,
      ),
    ),
    ...lines,
  ]).slice(0, 5);
}

function firstSummaryLine(resumeText: string) {
  const lines = resumeText.replace(/\r\n?/g, "\n").split("\n");
  const headingIndex = lines.findIndex((line) =>
    /^(professional summary|summary|profile)\s*:?\s*$/i.test(line.trim()),
  );
  if (headingIndex >= 0) {
    const summary = lines
      .slice(headingIndex + 1)
      .map(cleanLine)
      .find(Boolean);
    if (summary) return summary;
  }
  return extractResumeLines(resumeText)[0] ?? "";
}

function naturalList(terms: string[]) {
  if (terms.length <= 1) return terms[0] ?? "";
  if (terms.length === 2) return `${terms[0]} and ${terms[1]}`;
  return `${terms.slice(0, -1).join(", ")}, and ${terms.at(-1)}`;
}

function includesAny(terms: string[], patterns: RegExp[]) {
  return terms.some((term) => patterns.some((pattern) => pattern.test(term)));
}

function makeQuestion(
  id: string,
  category: InterviewQuestionCategory,
  question: string,
  whyAsked: string,
  outline: string[],
  evidence: string[],
): InterviewQuestion {
  return {
    id,
    category,
    question,
    whyAsked,
    outline,
    evidence: unique(evidence).slice(0, 3),
  };
}

export function buildInterviewPrep({
  resumeText,
  jobListing,
  analysis,
  selectedTerms,
  verifiedEvidence = {},
  targetRole,
}: InterviewPrepInput): InterviewPrep {
  const selected = new Set(
    [...selectedTerms].map((term) => term.trim().toLowerCase()),
  );
  const role = targetRole?.trim() || analysis.targetRole || "this position";
  const selectedKeywords = analysis.keywords.filter((keyword) =>
    selected.has(keyword.term.toLowerCase()),
  );
  const focusTerms = selectedKeywords
    .toSorted(
      (a, b) =>
        b.weight - a.weight ||
        a.status.localeCompare(b.status) ||
        a.term.localeCompare(b.term),
    )
    .map((keyword) => keyword.term)
    .slice(0, 8);

  const evidenceByTerm = new Map<string, string>();
  for (const keyword of selectedKeywords) {
    const verified = (verifiedEvidence[keyword.id] ?? "").trim();
    const evidence = cleanLine(keyword.resumeEvidence || verified);
    if (evidence) evidenceByTerm.set(keyword.term.toLowerCase(), evidence);
  }

  const evidenceFor = (...patterns: RegExp[]) =>
    unique(
      selectedKeywords
        .filter((keyword) =>
          patterns.some((pattern) => pattern.test(keyword.term)),
        )
        .map((keyword) => evidenceByTerm.get(keyword.term.toLowerCase()) ?? "")
        .filter(Boolean),
    );

  const storySources = unique([
    ...strongestEvidence(resumeText),
    ...evidenceByTerm.values(),
  ]).slice(0, 6);
  const summary = firstSummaryLine(resumeText);
  const topTerms = focusTerms.slice(0, 3);
  const questions: InterviewQuestion[] = [
    makeQuestion(
      "background",
      "Opening",
      `Tell me about yourself and your background for this ${role} role.`,
      "This tests whether you can connect your experience to the role clearly and briefly.",
      [
        summary
          ? `Open with this résumé-supported positioning: “${summary}”`
          : "Open with your current professional focus and relevant years of experience.",
        topTerms.length
          ? `Connect your background to ${naturalList(topTerms)}.`
          : "Connect two or three relevant strengths to the job.",
        "Close with why this role is the right next step, using your own genuine motivation.",
      ],
      storySources.slice(0, 2),
    ),
    makeQuestion(
      "interest",
      "Opening",
      `Why are you interested in this ${role} opportunity?`,
      "Interviewers want a specific connection between your goals, the work, and the employer.",
      [
        "Name one responsibility from the listing that genuinely interests you.",
        topTerms.length
          ? `Tie that interest to your experience with ${naturalList(topTerms.slice(0, 2))}.`
          : "Tie that interest to a real strength from your résumé.",
        "Add one employer-specific reason after researching the organization.",
      ],
      storySources.slice(0, 1),
    ),
  ];

  if (
    includesAny(focusTerms, [
      /customer|client|support|service|success/i,
      /account management/i,
    ])
  ) {
    questions.push(
      makeQuestion(
        "customer",
        "Behavioral",
        "Tell me about a time you handled a difficult customer or user issue.",
        "This checks judgment, empathy, communication, and ownership under pressure.",
        [
          "Situation: briefly explain the customer’s issue and why it was difficult.",
          "Action: describe how you listened, clarified the problem, and chose the next step.",
          "Result: use a real outcome or service measure; do not estimate one you cannot support.",
          "Reflection: explain what you would repeat in a similar situation.",
        ],
        evidenceFor(/customer|client|support|service|success/i),
      ),
    );
  }

  if (
    includesAny(focusTerms, [
      /troubleshooting|problem solving|technical support|application support|incident/i,
    ])
  ) {
    questions.push(
      makeQuestion(
        "problem-solving",
        "Role skills",
        "Walk me through a problem you had to diagnose and resolve.",
        "The interviewer is looking for a repeatable thought process, not just the final answer.",
        [
          "Define the problem and the effect it had.",
          "Explain what you checked first and why.",
          "Describe the action you took, including when you involved someone else.",
          "Finish with the verified result and what the experience taught you.",
        ],
        evidenceFor(
          /troubleshooting|problem solving|technical support|application support|incident/i,
        ),
      ),
    );
  }

  if (
    includesAny(focusTerms, [
      /cross-functional|stakeholder|escalation|collaboration|project management/i,
    ])
  ) {
    questions.push(
      makeQuestion(
        "collaboration",
        "Behavioral",
        "Describe a time you worked across teams or escalated an issue.",
        "This reveals how you communicate context, choose the right owner, and stay accountable.",
        [
          "Explain the issue, the teams involved, and your responsibility.",
          "Show what information you gathered before the handoff or escalation.",
          "Describe how you communicated and followed through.",
          "Share the real outcome and any process improvement that followed.",
        ],
        evidenceFor(
          /cross-functional|stakeholder|escalation|collaboration|project management/i,
        ),
      ),
    );
  }

  if (
    includesAny(focusTerms, [
      /documentation|written communication|knowledge base|reporting|content/i,
    ])
  ) {
    questions.push(
      makeQuestion(
        "documentation",
        "Role skills",
        "How do you document recurring issues and communicate clearly in writing?",
        "The role may depend on accurate notes, reusable guidance, or clear written updates.",
        [
          "Name the audience and the type of information you documented.",
          "Explain how you made the information accurate, clear, and easy to reuse.",
          "Describe how the documentation was shared or maintained.",
          "Use a real example from your résumé as proof.",
        ],
        evidenceFor(
          /documentation|written communication|knowledge base|reporting|content/i,
        ),
      ),
    );
  }

  if (
    includesAny(focusTerms, [
      /time management|ticket management|case management|SLA|KPI|quality assurance/i,
    ])
  ) {
    questions.push(
      makeQuestion(
        "priorities",
        "Behavioral",
        "Tell me about a time you had to manage competing priorities.",
        "This tests how you balance urgency, quality, and service expectations.",
        [
          "Explain the volume or competing deadlines without overstating them.",
          "Describe the criteria you used to prioritize.",
          "Show how you communicated expectations and tracked follow-through.",
          "Close with a measurable or observable result from your real experience.",
        ],
        evidenceFor(
          /time management|ticket management|case management|SLA|KPI|quality assurance/i,
        ),
      ),
    );
  }

  if (
    includesAny(focusTerms, [/training|coaching|onboarding|leadership|management/i])
  ) {
    questions.push(
      makeQuestion(
        "development",
        "Behavioral",
        "Give me an example of how you helped someone learn a process or improve.",
        "Interviewers use this to assess patience, communication, and team contribution.",
        [
          "Describe what the person or group needed to learn.",
          "Explain how you adjusted your approach to make it understandable.",
          "Share how you checked progress or reinforced the process.",
          "Use only the outcome shown in your résumé or one you can personally verify.",
        ],
        evidenceFor(/training|coaching|onboarding|leadership|management/i),
      ),
    );
  }

  const supportedNamedTools = selectedKeywords.filter(
    (keyword) =>
      /^[A-Z][A-Za-z0-9 .+#-]*$/.test(keyword.term) &&
      evidenceByTerm.has(keyword.term.toLowerCase()),
  );
  if (supportedNamedTools.length > 0) {
    const tools = supportedNamedTools.slice(0, 3).map((keyword) => keyword.term);
    questions.push(
      makeQuestion(
        "tools",
        "Role skills",
        `How have you used ${naturalList(tools)} in your work?`,
        "The listing names these tools, so the interviewer may test the depth of your hands-on experience.",
        [
          "State the actual task or workflow where you used each tool.",
          "Describe what you personally did rather than what the team did.",
          "Share a real outcome, frequency, or level of responsibility.",
          "Be direct about anything you are still learning.",
        ],
        supportedNamedTools
          .map(
            (keyword) =>
              evidenceByTerm.get(keyword.term.toLowerCase()) ?? "",
          )
          .filter(Boolean),
      ),
    );
  }

  if (questions.length < 6 && focusTerms.length > 0) {
    const covered = questions
      .flatMap((question) => question.evidence)
      .join(" ")
      .toLowerCase();
    const fallbackTerm =
      focusTerms.find((term) => !covered.includes(term.toLowerCase())) ??
      focusTerms[0];
    questions.push(
      makeQuestion(
        "job-specific",
        "Role skills",
        `How have you applied ${fallbackTerm} in your work?`,
        "This is a prominent requirement in the job listing.",
        [
          "Define what this skill meant in your actual work.",
          "Choose one specific example and clarify your personal contribution.",
          "Add a verified result or lesson learned.",
          "If your experience is transferable rather than direct, say so plainly and connect the relevant steps.",
        ],
        evidenceFor(
          new RegExp(
            fallbackTerm.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
            "i",
          ),
        ),
      ),
    );
  }

  const listingMentionsChannels =
    /\b(email|chat|phone|messaging|inbound|outbound)\b/i.test(jobListing);
  const questionsToAsk = [
    `What would success look like in the first 90 days for this ${role} role?`,
    "Which results or behaviors matter most when performance is evaluated?",
    "What are the most common challenges the person in this role will handle?",
    "How does this role work with other teams when an issue needs collaboration or escalation?",
    listingMentionsChannels
      ? "How is work divided across the communication channels mentioned in the job listing?"
      : "What does a typical day or week look like for this role?",
    "What would you want the person you hire to improve or take ownership of first?",
  ];

  return {
    targetRole: role,
    focusTerms,
    introductionPoints: questions[0].outline,
    questions: questions.slice(0, 8),
    questionsToAsk,
    storySources,
  };
}

export function formatInterviewPrep(
  prep: InterviewPrep,
  star?: {
    source?: string;
    situation?: string;
    task?: string;
    action?: string;
    result?: string;
  },
) {
  const questionText = prep.questions
    .map(
      (question, index) =>
        `${index + 1}. ${question.question}\nWhy it may come up: ${question.whyAsked}\nAnswer outline:\n${question.outline
          .map((point) => `- ${point}`)
          .join("\n")}${
          question.evidence.length
            ? `\nRésumé evidence:\n${question.evidence
                .map((line) => `- ${line}`)
                .join("\n")}`
            : ""
        }`,
    )
    .join("\n\n");
  const starText =
    star &&
    [star.situation, star.task, star.action, star.result].some((value) =>
      value?.trim(),
    )
      ? `\n\nSTAR PRACTICE\nEvidence source: ${star.source || "Not selected"}\nSituation: ${star.situation || ""}\nTask: ${star.task || ""}\nAction: ${star.action || ""}\nResult: ${star.result || ""}`
      : "";

  return `INTERVIEW PREP — ${prep.targetRole.toUpperCase()}

Keep every answer accurate. Use these outlines as prompts, not scripts.

60-SECOND INTRODUCTION
${prep.introductionPoints.map((point) => `- ${point}`).join("\n")}

LIKELY QUESTIONS
${questionText}

QUESTIONS TO ASK THE INTERVIEWER
${prep.questionsToAsk.map((question) => `- ${question}`).join("\n")}${starText}`;
}
