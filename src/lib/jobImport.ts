export type ImportedJob = {
  text: string;
  title: string;
  company: string;
  sourceUrl: string;
};

const MAX_HTML_CHARACTERS = 1_500_000;

function decodeHtmlEntities(value: string) {
  const named: Record<string, string> = {
    amp: "&",
    apos: "'",
    gt: ">",
    hellip: "…",
    ldquo: "“",
    lsquo: "‘",
    lt: "<",
    mdash: "—",
    nbsp: " ",
    ndash: "–",
    quot: '"',
    rdquo: "”",
    rsquo: "’",
  };

  return value
    .replace(/&#(\d+);/g, (_, code: string) =>
      String.fromCodePoint(Number(code)),
    )
    .replace(/&#x([\da-f]+);/gi, (_, code: string) =>
      String.fromCodePoint(Number.parseInt(code, 16)),
    )
    .replace(/&([a-z]+);/gi, (entity, name: string) =>
      Object.hasOwn(named, name.toLowerCase())
        ? named[name.toLowerCase()]
        : entity,
    );
}

function cleanText(value: string) {
  return decodeHtmlEntities(
    value
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/(?:p|div|li|section|article|h[1-6])>/gi, "\n")
      .replace(/<li\b[^>]*>/gi, "• ")
      .replace(/<[^>]+>/g, " "),
  )
    .replace(/\u00a0/g, " ")
    .replace(/[ \t]+/g, " ")
    .replace(/ *\n */g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function findJobPosting(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object") return null;
  if (Array.isArray(value)) {
    for (const item of value) {
      const result = findJobPosting(item);
      if (result) return result;
    }
    return null;
  }

  const record = value as Record<string, unknown>;
  const type = record["@type"];
  if (
    type === "JobPosting" ||
    (Array.isArray(type) && type.includes("JobPosting"))
  ) {
    return record;
  }

  for (const nested of Object.values(record)) {
    const result = findJobPosting(nested);
    if (result) return result;
  }
  return null;
}

function textFromSchema(value: unknown): string {
  if (typeof value === "string") return cleanText(value);
  if (Array.isArray(value)) {
    return value.map(textFromSchema).filter(Boolean).join("\n");
  }
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    return textFromSchema(
      record.name ?? record.value ?? record.description ?? "",
    );
  }
  return "";
}

function companyFromSchema(job: Record<string, unknown>) {
  const organization = job.hiringOrganization;
  if (typeof organization === "string") return cleanText(organization);
  if (organization && typeof organization === "object") {
    return textFromSchema((organization as Record<string, unknown>).name);
  }
  return "";
}

export function parseJobPostingHtml(
  rawHtml: string,
  sourceUrl: string,
): ImportedJob {
  const html = rawHtml.slice(0, MAX_HTML_CHARACTERS);
  const scripts = [
    ...html.matchAll(
      /<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi,
    ),
  ];

  for (const script of scripts) {
    try {
      const parsed = JSON.parse(decodeHtmlEntities(script[1].trim()));
      const job = findJobPosting(parsed);
      if (!job) continue;

      const title = textFromSchema(job.title);
      const company = companyFromSchema(job);
      const sections = [
        title,
        company ? `Company: ${company}` : "",
        textFromSchema(job.description),
        textFromSchema(job.responsibilities),
        textFromSchema(job.qualifications),
        textFromSchema(job.skills),
        textFromSchema(job.experienceRequirements),
        textFromSchema(job.educationRequirements),
      ].filter(Boolean);
      const text = [...new Set(sections)].join("\n\n").trim();
      if (text.length >= 120) {
        return { text, title, company, sourceUrl };
      }
    } catch {
      // Ignore invalid structured data and continue to the readable-page fallback.
    }
  }

  const titleMatch = html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i);
  const pageTitle = titleMatch ? cleanText(titleMatch[1]) : "";
  const readableHtml = html
    .replace(
      /<(?:script|style|noscript|svg|nav|header|footer)\b[\s\S]*?<\/(?:script|style|noscript|svg|nav|header|footer)>/gi,
      " ",
    )
    .replace(/<!--[\s\S]*?-->/g, " ");
  const text = cleanText(`${pageTitle}\n${readableHtml}`);

  if (
    text.length < 120 ||
    !/\b(job|position|role|responsibilit|qualification|requirements?|apply)\b/i.test(
      text,
    )
  ) {
    throw new Error(
      "We could not find a complete public job description on that page.",
    );
  }

  return {
    text: text.slice(0, 60_000),
    title: pageTitle.replace(/\s*[|–—-].*$/, "").trim(),
    company: "",
    sourceUrl,
  };
}

export function isBlockedJobHostname(hostname: string) {
  const host = hostname.toLowerCase().replace(/\.$/, "");
  if (
    host === "localhost" ||
    host.endsWith(".localhost") ||
    host.endsWith(".local") ||
    host.endsWith(".internal")
  ) {
    return true;
  }

  const ipv4 = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (ipv4) {
    const octets = ipv4.slice(1).map(Number);
    if (octets.some((octet) => octet > 255)) return true;
    const [a, b] = octets;
    return (
      a === 0 ||
      a === 10 ||
      a === 127 ||
      a >= 224 ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168)
    );
  }

  const ipv6 = host.replace(/^\[|\]$/g, "");
  return (
    ipv6 === "::1" ||
    ipv6 === "::" ||
    /^f[cd][\da-f]{2}:/i.test(ipv6) ||
    /^fe[89ab][\da-f]:/i.test(ipv6)
  );
}

export function validatePublicJobUrl(value: string) {
  let url: URL;
  try {
    url = new URL(value.trim());
  } catch {
    throw new Error("Enter the full job link, beginning with https://.");
  }

  if (url.protocol !== "https:") {
    throw new Error("For privacy and security, the job link must use https://.");
  }
  if (url.username || url.password || isBlockedJobHostname(url.hostname)) {
    throw new Error("That address cannot be imported.");
  }
  return url;
}
