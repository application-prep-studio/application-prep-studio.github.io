export type KeywordStatus = "matched" | "related" | "missing";
export type KeywordImportance = "high" | "medium" | "supporting";

export type KeywordResult = {
  id: string;
  term: string;
  status: KeywordStatus;
  importance: KeywordImportance;
  jobEvidence: string;
  resumeEvidence: string;
  matchedAs?: string;
  weight: number;
};

export type ResumeAnalysis = {
  coverage: number;
  exactMatches: number;
  relatedMatches: number;
  missingCount: number;
  targetRole: string;
  keywords: KeywordResult[];
};

export type LanguageIssue = {
  id: string;
  type: "cliché" | "length" | "first-person" | "repetition";
  message: string;
  excerpt: string;
};

type SkillDefinition = {
  term: string;
  aliases?: string[];
};

const SKILL_LIBRARY: SkillDefinition[] = [
  { term: "account management" },
  { term: "agile" },
  { term: "application support" },
  { term: "API", aliases: ["APIs", "application programming interface"] },
  { term: "Asana" },
  { term: "AWS", aliases: ["Amazon Web Services"] },
  { term: "Azure", aliases: ["Microsoft Azure"] },
  { term: "B2B", aliases: ["business-to-business"] },
  { term: "B2C", aliases: ["business-to-consumer"] },
  { term: "billing support" },
  { term: "case management" },
  { term: "change management" },
  {
    term: "chat support",
    aliases: ["live chat", "live chat support", "messaging support"],
  },
  { term: "cloud computing", aliases: ["cloud platforms"] },
  { term: "coaching" },
  { term: "Confluence" },
  { term: "content management" },
  { term: "continuous improvement", aliases: ["process improvement"] },
  {
    term: "cross-functional collaboration",
    aliases: [
      "cross functional collaboration",
      "cross-functional teams",
      "shared weekly trends",
    ],
  },
  { term: "CRM", aliases: ["customer relationship management"] },
  { term: "customer experience", aliases: ["CX"] },
  { term: "customer retention", aliases: ["retention"] },
  { term: "customer service", aliases: ["client service"] },
  { term: "customer success", aliases: ["client success"] },
  {
    term: "customer support",
    aliases: ["client support", "customer service", "user support"],
  },
  { term: "data analysis", aliases: ["analyzing data", "data analytics"] },
  { term: "data entry" },
  { term: "data privacy", aliases: ["privacy compliance"] },
  { term: "data security", aliases: ["information security"] },
  {
    term: "documentation",
    aliases: [
      "documented",
      "documenting",
      "process documentation",
      "technical documentation",
    ],
  },
  { term: "email support", aliases: ["email", "email-based support"] },
  {
    term: "escalation management",
    aliases: ["escalations", "escalation process"],
  },
  { term: "Excel", aliases: ["Microsoft Excel"] },
  { term: "Freshdesk" },
  { term: "Freshservice" },
  { term: "Gainsight" },
  { term: "GitHub" },
  { term: "Google Analytics", aliases: ["GA4"] },
  { term: "Google Workspace", aliases: ["G Suite", "Google Suite"] },
  { term: "HIPAA" },
  { term: "HubSpot" },
  { term: "incident management", aliases: ["incident response"] },
  { term: "Intercom" },
  { term: "inventory management" },
  {
    term: "issue escalation",
    aliases: ["escalate", "escalated", "escalating"],
  },
  { term: "IT support", aliases: ["information technology support"] },
  { term: "Jira" },
  { term: "knowledge base", aliases: ["help center", "knowledge-base articles"] },
  { term: "KPI", aliases: ["KPIs", "key performance indicators"] },
  { term: "lead generation" },
  { term: "learning management system", aliases: ["LMS"] },
  { term: "Microsoft 365", aliases: ["Office 365", "Microsoft Office"] },
  { term: "Microsoft Teams", aliases: ["Teams"] },
  { term: "Monday.com" },
  { term: "onboarding", aliases: ["customer onboarding", "client onboarding", "user onboarding"] },
  { term: "order management", aliases: ["order processing"] },
  { term: "phone support", aliases: ["telephone support", "voice support"] },
  { term: "Power BI" },
  {
    term: "problem solving",
    aliases: [
      "problem-solving",
      "resolve",
      "resolved",
      "resolving",
      "complex questions",
    ],
  },
  { term: "product support" },
  { term: "project management" },
  { term: "quality assurance", aliases: ["QA", "quality review"] },
  { term: "remote support", aliases: ["virtual support"] },
  { term: "reporting", aliases: ["report creation", "reports"] },
  { term: "Salesforce" },
  { term: "SaaS", aliases: ["software as a service"] },
  { term: "service desk", aliases: ["help desk", "helpdesk"] },
  { term: "SLA", aliases: ["SLAs", "service level agreement", "service-level agreement"] },
  { term: "Slack" },
  { term: "SOC 2", aliases: ["SOC2"] },
  { term: "software integrations", aliases: ["integrations", "system integrations"] },
  { term: "SQL" },
  { term: "stakeholder management", aliases: ["stakeholder communication"] },
  { term: "technical support", aliases: ["technical customer support"] },
  { term: "ticket management", aliases: ["ticketing", "support tickets", "ticket queue"] },
  { term: "time management" },
  { term: "training", aliases: ["facilitation", "user training", "customer training"] },
  {
    term: "troubleshooting",
    aliases: [
      "account issues",
      "diagnose",
      "diagnosed",
      "fix",
      "fixed",
      "issue resolution",
      "resolve",
      "resolved",
      "resolving",
      "technical troubleshooting",
    ],
  },
  { term: "Twilio" },
  { term: "workflow automation", aliases: ["automation", "automated workflows"] },
  {
    term: "written communication",
    aliases: [
      "business writing",
      "documented",
      "documentation",
      "email",
      "written communications",
    ],
  },
  { term: "Zendesk" },
  { term: "Zoom" },
  { term: "JavaScript" },
  { term: "TypeScript" },
  { term: "Python" },
  { term: "Java" },
  { term: "React" },
  { term: "Node.js", aliases: ["NodeJS", "Node"] },
  { term: "HTML" },
  { term: "CSS" },
  { term: "PostgreSQL", aliases: ["Postgres"] },
  { term: "MySQL" },
  { term: "Figma" },
  { term: "Adobe Creative Cloud", aliases: ["Adobe CC"] },
  { term: "Canva" },
  { term: "SEO", aliases: ["search engine optimization"] },
  { term: "social media management" },
  { term: "financial analysis" },
  { term: "bookkeeping" },
  { term: "QuickBooks" },
  { term: "scheduling" },
  { term: "calendar management" },
  { term: "vendor management" },
  { term: "contract management" },
  { term: "risk management" },
  { term: "compliance" },
  { term: "research" },
  { term: "presentation skills", aliases: ["presentations"] },
];

const STOP_WORDS = new Set([
  "about",
  "above",
  "after",
  "again",
  "against",
  "along",
  "also",
  "among",
  "another",
  "apply",
  "based",
  "because",
  "before",
  "being",
  "below",
  "between",
  "both",
  "business",
  "candidate",
  "company",
  "could",
  "each",
  "employee",
  "employment",
  "equal",
  "every",
  "excellent",
  "experience",
  "including",
  "information",
  "into",
  "job",
  "looking",
  "must",
  "other",
  "our",
  "preferred",
  "provide",
  "required",
  "requirements",
  "responsibilities",
  "responsible",
  "role",
  "should",
  "skills",
  "strong",
  "their",
  "there",
  "these",
  "they",
  "this",
  "through",
  "under",
  "using",
  "what",
  "when",
  "where",
  "which",
  "while",
  "with",
  "within",
  "work",
  "working",
  "would",
  "years",
  "your",
]);

const PRIORITY_PATTERN =
  /\b(must|required|requirements?|qualifications?|preferred|proficien|experience with|knowledge of|responsibilities|you will|we are looking)\b/i;

const ROLE_PATTERN =
  /\b(manager|specialist|analyst|engineer|associate|coordinator|representative|administrator|designer|developer|consultant|lead|director|technician|support|success|operations|advisor|agent)\b/i;

const HEADING_PATTERN =
  /^(professional summary|summary|profile|core skills|skills|technical skills|competencies|experience|professional experience|work experience|employment|education|certifications?|projects?)$/i;

function normalize(value: string) {
  return value
    .toLowerCase()
    .replace(/\bc\+\+\b/g, "cplusplus")
    .replace(/\bc#\b/g, "csharp")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function containsNormalized(haystack: string, needle: string) {
  const source = ` ${normalize(haystack)} `;
  const target = ` ${normalize(needle)} `;
  return target.trim().length > 1 && source.includes(target);
}

function compactEvidence(value: string, term: string) {
  const lines = value
    .split(/\n|(?<=[.!?])\s+/)
    .map((line) => line.trim())
    .filter(Boolean);
  const found = lines.find((line) => containsNormalized(line, term));
  if (!found) return "";
  return found.length > 190 ? `${found.slice(0, 187).trim()}…` : found;
}

function occurrences(text: string, terms: string[]) {
  const normalized = ` ${normalize(text)} `;
  let count = 0;
  for (const term of terms) {
    const target = ` ${normalize(term)} `;
    let start = 0;
    while (target.trim().length > 1) {
      const index = normalized.indexOf(target, start);
      if (index < 0) break;
      count += 1;
      start = index + target.length;
    }
  }
  return count;
}

function priorityFor(jobListing: string, term: string): KeywordImportance {
  const evidence = compactEvidence(jobListing, term);
  const count = occurrences(jobListing, [term]);
  if (PRIORITY_PATTERN.test(evidence) || count >= 3) return "high";
  if (count >= 2) return "medium";
  return "supporting";
}

function weightFor(importance: KeywordImportance) {
  if (importance === "high") return 3;
  if (importance === "medium") return 2;
  return 1;
}

function detectTargetRole(jobListing: string) {
  const lines = jobListing
    .split(/\n/)
    .map((line) => line.trim().replace(/^[-•*]\s*/, ""))
    .filter(Boolean)
    .slice(0, 18);

  for (const line of lines) {
    const explicit = line.match(/^job title\s*:\s*(.+)$/i);
    if (explicit?.[1]) return explicit[1].trim().slice(0, 80);
  }

  const likely = lines.find(
    (line) =>
      line.length >= 4 &&
      line.length <= 80 &&
      ROLE_PATTERN.test(line) &&
      !/\b(responsibilities|requirements|qualifications|about|overview|location|salary)\b/i.test(
        line,
      ),
  );
  return likely ?? "";
}

function extractGenericTerms(jobListing: string) {
  const candidates = new Map<string, number>();
  const allWords = normalize(jobListing).split(" ");
  for (const word of allWords) {
    if (
      word.length < 5 ||
      STOP_WORDS.has(word) ||
      /^\d+$/.test(word)
    ) {
      continue;
    }
    candidates.set(word, (candidates.get(word) ?? 0) + 1);
  }

  const specialTerms =
    jobListing.match(
      /\b(?:[A-Z]{2,}(?:[ ./+-][A-Z0-9]{2,})*|[A-Z][a-z]+(?:[A-Z][A-Za-z0-9]+)+)\b/g,
    ) ?? [];
  for (const special of specialTerms) {
    if (!STOP_WORDS.has(normalize(special))) {
      candidates.set(special, (candidates.get(special) ?? 0) + 3);
    }
  }

  return [...candidates.entries()]
    .filter(([, score]) => score >= 2)
    .toSorted((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 8)
    .map(([term]) => term);
}

export function analyzeResume(
  resumeText: string,
  jobListing: string,
): ResumeAnalysis {
  const definitions: SkillDefinition[] = [];
  const seen = new Set<string>();

  for (const definition of SKILL_LIBRARY) {
    const jobTerms = [definition.term, ...(definition.aliases ?? [])];
    const presentInJob = jobTerms.some((term) =>
      containsNormalized(jobListing, term),
    );
    if (presentInJob) {
      definitions.push(definition);
      seen.add(normalize(definition.term));
    }
  }

  if (definitions.length < 6) {
    for (const term of extractGenericTerms(jobListing)) {
      const key = normalize(term);
      const overlapsKnownTerm = [...seen].some(
        (known) =>
          ` ${known} `.includes(` ${key} `) ||
          ` ${key} `.includes(` ${known} `),
      );
      if (!seen.has(key) && !overlapsKnownTerm && key.length > 2) {
        definitions.push({ term });
        seen.add(key);
      }
    }
  }

  const keywords = definitions
    .map((definition): KeywordResult => {
      const canonicalMatch = containsNormalized(resumeText, definition.term);
      const alias = (definition.aliases ?? []).find((candidate) =>
        containsNormalized(resumeText, candidate),
      );
      const jobAliases = [definition.term, ...(definition.aliases ?? [])];
      const jobTerm =
        jobAliases.find((candidate) =>
          containsNormalized(jobListing, candidate),
        ) ?? definition.term;
      const importance = priorityFor(jobListing, jobTerm);
      const status: KeywordStatus = canonicalMatch
        ? "matched"
        : alias
          ? "related"
          : "missing";
      const resumeTerm = canonicalMatch ? definition.term : alias;

      return {
        id: normalize(definition.term).replace(/\s/g, "-"),
        term: definition.term,
        status,
        importance,
        jobEvidence: compactEvidence(jobListing, jobTerm),
        resumeEvidence: resumeTerm
          ? compactEvidence(resumeText, resumeTerm)
          : "",
        matchedAs: alias,
        weight: weightFor(importance),
      };
    })
    .toSorted((a, b) => {
      const statusOrder = { missing: 0, related: 1, matched: 2 };
      return (
        b.weight - a.weight ||
        statusOrder[a.status] - statusOrder[b.status] ||
        a.term.localeCompare(b.term)
      );
    })
    .slice(0, 24);

  const totalWeight = keywords.reduce((sum, keyword) => sum + keyword.weight, 0);
  const coveredWeight = keywords.reduce((sum, keyword) => {
    if (keyword.status === "matched") return sum + keyword.weight;
    if (keyword.status === "related") return sum + keyword.weight * 0.75;
    return sum;
  }, 0);

  return {
    coverage:
      totalWeight > 0 ? Math.round((coveredWeight / totalWeight) * 100) : 0,
    exactMatches: keywords.filter((keyword) => keyword.status === "matched")
      .length,
    relatedMatches: keywords.filter((keyword) => keyword.status === "related")
      .length,
    missingCount: keywords.filter((keyword) => keyword.status === "missing")
      .length,
    targetRole: detectTargetRole(jobListing),
    keywords,
  };
}

function naturalList(terms: string[]) {
  if (terms.length <= 1) return terms[0] ?? "";
  if (terms.length === 2) return `${terms[0]} and ${terms[1]}`;
  return `${terms.slice(0, -1).join(", ")}, and ${terms.at(-1)}`;
}

function isHeading(line: string) {
  const clean = line.trim().replace(/:$/, "");
  return (
    HEADING_PATTERN.test(clean) ||
    (clean.length > 2 &&
      clean.length < 45 &&
      clean === clean.toUpperCase() &&
      /[A-Z]/.test(clean))
  );
}

function sectionRange(lines: string[], names: RegExp) {
  const start = lines.findIndex((line) => names.test(line.trim().replace(/:$/, "")));
  if (start < 0) return null;
  let end = lines.length;
  for (let index = start + 1; index < lines.length; index += 1) {
    if (isHeading(lines[index])) {
      end = index;
      break;
    }
  }
  return { start, end };
}

function contactEnd(lines: string[]) {
  const firstBlank = lines.findIndex(
    (line, index) => index > 0 && line.trim() === "",
  );
  if (firstBlank > 0 && firstBlank <= 8) return firstBlank + 1;
  return Math.min(3, lines.length);
}

function selectedTermSet(terms: string[]) {
  return new Set(terms.map(normalize));
}

function rewriteEvidenceBackedBullets(lines: string[], selectedTerms: string[]) {
  const selected = selectedTermSet(selectedTerms);
  const has = (term: string) => selected.has(normalize(term));
  const experienceRange = sectionRange(
    lines,
    /^(experience|professional experience|work experience|employment)$/i,
  );
  if (!experienceRange) return;

  for (
    let index = experienceRange.start + 1;
    index < experienceRange.end;
    index += 1
  ) {
    const line = lines[index];
    const bullet = line.match(/^(\s*(?:[-•●▪◦*])\s*)(.+)$/);
    if (!bullet?.[2]) continue;

    const prefix = bullet[1];
    const content = bullet[2].trim();

    const serviceResult = content.match(
      /^Resolved\s+(.+?)\s+by phone and email\s+while\s+(.+?)([.!]?)$/i,
    );
    if (
      serviceResult?.[1] &&
      serviceResult[2] &&
      (has("customer support") ||
        has("email support") ||
        has("problem solving") ||
        has("troubleshooting"))
    ) {
      const methods = [
        has("problem solving") ? "problem-solving" : "",
        has("troubleshooting") ? "troubleshooting" : "",
      ].filter(Boolean);
      const delivery =
        has("customer support") || has("email support")
          ? `Delivered ${has("customer support") ? "customer support" : "support"} by resolving ${serviceResult[1]} through ${
              has("email support") ? "phone and email support" : "phone and email"
            }`
          : `Resolved ${serviceResult[1]} by phone and email`;
      const methodPhrase =
        methods.length > 0
          ? `, applying ${naturalList(methods)} skills`
          : "";
      lines[index] =
        `${prefix}${delivery}${methodPhrase} while ${serviceResult[2]}${serviceResult[3] || "."}`;
      continue;
    }

    const documentationResult = content.match(
      /^Documented\s+(.+?)\s+and shared\s+(.+?)\s+with\s+(.+?)([.!]?)$/i,
    );
    if (
      documentationResult?.[1] &&
      documentationResult[2] &&
      documentationResult[3] &&
      (has("documentation") ||
        has("written communication") ||
        has("cross-functional collaboration"))
    ) {
      const writingLead = has("written communication")
        ? has("documentation")
          ? "Used written communication to create"
          : "Used written communication to document"
        : has("documentation")
          ? "Created"
          : "Documented";
      const documentPhrase = has("documentation")
        ? ` documentation for ${documentationResult[1]}`
        : ` ${documentationResult[1]}`;
      const collaborationPhrase = has("cross-functional collaboration")
        ? ` and supported cross-functional collaboration by sharing ${documentationResult[2]} with ${documentationResult[3]}`
        : ` and shared ${documentationResult[2]} with ${documentationResult[3]}`;
      lines[index] =
        `${prefix}${writingLead}${documentPhrase}${collaborationPhrase}${documentationResult[4] || "."}`;
      continue;
    }

    const escalationResult = content.match(
      /^(.+?)\s+and escalated\s+(.+?)\s+to\s+(.+?)([.!]?)$/i,
    );
    if (
      escalationResult?.[1] &&
      escalationResult[2] &&
      escalationResult[3] &&
      has("issue escalation")
    ) {
      lines[index] =
        `${prefix}${escalationResult[1]} and handled issue escalation for ${escalationResult[2]} with ${escalationResult[3]}${escalationResult[4] || "."}`;
    }
  }
}

export function createTailoredResume(
  resumeText: string,
  selectedTerms: string[],
) {
  const uniqueTerms = selectedTerms
    .filter(Boolean)
    .filter(
      (term, index, source) =>
        source.findIndex((candidate) => normalize(candidate) === normalize(term)) ===
        index,
    );
  if (uniqueTerms.length === 0) return resumeText.trim();

  const lines = resumeText.replace(/\r\n?/g, "\n").split("\n");
  rewriteEvidenceBackedBullets(lines, uniqueTerms);
  const summaryRange = sectionRange(
    lines,
    /^(professional summary|summary|profile)$/i,
  );
  const summaryTerms = uniqueTerms
    .filter((term) => {
      if (!summaryRange) return true;
      return !containsNormalized(
        lines.slice(summaryRange.start, summaryRange.end).join(" "),
        term,
      );
    })
    .slice(0, 5);

  if (summaryTerms.length > 0) {
    if (!summaryRange) {
      const summarySentence = `Relevant experience includes ${naturalList(summaryTerms)}.`;
      const insertAt = contactEnd(lines);
      lines.splice(
        insertAt,
        0,
        "PROFESSIONAL SUMMARY",
        summarySentence,
        "",
      );
    }
  }

  const skillsRange = sectionRange(
    lines,
    /^(core skills|skills|technical skills|competencies)$/i,
  );
  const termsLine = uniqueTerms.join(" • ");

  if (skillsRange) {
    const currentSkills = lines
      .slice(skillsRange.start, skillsRange.end)
      .join(" ");
    const missingFromSection = uniqueTerms.filter(
      (term) => !containsNormalized(currentSkills, term),
    );
    if (missingFromSection.length > 0) {
      lines.splice(skillsRange.start + 1, 0, missingFromSection.join(" • "));
    }
  } else {
    const currentSummary = sectionRange(
      lines,
      /^(professional summary|summary|profile)$/i,
    );
    const insertAt = currentSummary?.end ?? contactEnd(lines);
    lines.splice(insertAt, 0, "CORE SKILLS", termsLine, "");
  }

  return lines
    .join("\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{4,}/g, "\n\n\n")
    .trim();
}

export function checkNaturalLanguage(resumeText: string): LanguageIssue[] {
  const issues: LanguageIssue[] = [];
  const clichés = [
    "results-driven",
    "dynamic professional",
    "proven track record",
    "go-getter",
    "outside the box",
    "synergy",
    "leverage",
    "thought leader",
    "rockstar",
    "ninja",
    "passionate professional",
  ];

  for (const phrase of clichés) {
    if (containsNormalized(resumeText, phrase)) {
      issues.push({
        id: `cliche-${normalize(phrase)}`,
        type: "cliché",
        message: `Replace “${phrase}” with a specific skill, action, or result.`,
        excerpt: compactEvidence(resumeText, phrase),
      });
    }
  }

  const sentences = resumeText
    .split(/(?<=[.!?])\s+|\n/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);
  for (const sentence of sentences) {
    const wordCount = sentence.split(/\s+/).length;
    if (wordCount > 36 && issues.filter((issue) => issue.type === "length").length < 3) {
      issues.push({
        id: `length-${issues.length}`,
        type: "length",
        message: `Shorten this ${wordCount}-word sentence for faster scanning.`,
        excerpt: sentence.length > 180 ? `${sentence.slice(0, 177)}…` : sentence,
      });
    }
  }

  const firstPerson = sentences.find((sentence) =>
    /\b(I|me|my|mine|we|our)\b/.test(sentence),
  );
  if (firstPerson) {
    issues.push({
      id: "first-person",
      type: "first-person",
      message: "Résumé bullets usually read more directly without first-person pronouns.",
      excerpt:
        firstPerson.length > 180
          ? `${firstPerson.slice(0, 177)}…`
          : firstPerson,
    });
  }

  const starters = new Map<string, number>();
  for (const line of resumeText.split("\n")) {
    const bullet = line.trim().match(/^(?:[-•*]\s*)?([A-Za-z]{3,})\b/);
    if (!bullet?.[1] || isHeading(line)) continue;
    const starter = bullet[1].toLowerCase();
    starters.set(starter, (starters.get(starter) ?? 0) + 1);
  }
  const repeated = [...starters.entries()].find(([, count]) => count >= 4);
  if (repeated) {
    issues.push({
      id: `repeat-${repeated[0]}`,
      type: "repetition",
      message: `“${repeated[0]}” starts ${repeated[1]} lines. Vary wording where it stays accurate.`,
      excerpt: repeated[0],
    });
  }

  return issues.slice(0, 8);
}
