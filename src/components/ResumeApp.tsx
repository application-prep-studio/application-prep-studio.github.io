"use client";

import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clipboard,
  ClipboardCheck,
  ClipboardList,
  Download,
  ExternalLink,
  FileDown,
  FileText,
  Link2,
  LoaderCircle,
  LockKeyhole,
  MessagesSquare,
  PenLine,
  ShieldCheck,
  Star,
  Upload,
  X,
} from "lucide-react";
import {
  ChangeEvent,
  Dispatch,
  DragEvent,
  KeyboardEvent,
  SetStateAction,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  analyzeResume,
  checkNaturalLanguage,
  createTailoredResume,
  KeywordResult,
  LanguageIssue,
  ResumeAnalysis,
} from "../lib/ats";
import {
  downloadResumeDocx,
  downloadResumePdf,
  downloadResumeText,
} from "../lib/exportResume";
import { parseResumeFile } from "../lib/fileParsing";
import {
  buildInterviewPrep,
  formatInterviewPrep,
  InterviewPrep,
} from "../lib/interviewPrep";

type Step = "inputs" | "match" | "edit" | "export" | "interview";
type Filter = "all" | "matched" | "missing";

const stepOrder: Step[] = ["inputs", "match", "edit", "export", "interview"];
const MIN_EVIDENCE_LENGTH = 12;
const JOB_IMPORT_ENDPOINT =
  import.meta.env.VITE_JOB_IMPORT_ENDPOINT ||
  "https://pocketstead-resume.kushumpeng.chatgpt.site/api/import-job";
const steps: Array<{
  id: Step;
  number: number;
  label: string;
  Icon: typeof FileText;
}> = [
  { id: "inputs", number: 1, label: "Inputs", Icon: FileText },
  { id: "match", number: 2, label: "Match", Icon: ClipboardList },
  { id: "edit", number: 3, label: "Edit", Icon: PenLine },
  { id: "export", number: 4, label: "Export", Icon: Download },
  {
    id: "interview",
    number: 5,
    label: "Interview Prep",
    Icon: MessagesSquare,
  },
];

function StepRail({
  activeStep,
  reachedStep,
  onSelect,
}: {
  activeStep: Step;
  reachedStep: number;
  onSelect: (step: Step) => void;
}) {
  return (
    <nav className="step-rail" aria-label="Résumé tailoring progress">
      {steps.map(({ id, number, label, Icon }, index) => {
        const isActive = id === activeStep;
        const isAvailable = index <= reachedStep;
        return (
          <button
            type="button"
            className={`step-item ${isActive ? "is-active" : ""}`}
            key={id}
            aria-current={isActive ? "step" : undefined}
            disabled={!isAvailable}
            onClick={() => onSelect(id)}
          >
            <span className="step-marker" aria-hidden="true" />
            <Icon size={23} strokeWidth={1.65} aria-hidden="true" />
            <span className="step-number">{number}</span>
            <span>{label}</span>
          </button>
        );
      })}
    </nav>
  );
}

type InputsStepProps = {
  resumeFile: File | null;
  resumeText: string;
  fileStatus: string;
  fileWarning: string;
  fileError: string;
  isDragging: boolean;
  isParsing: boolean;
  jobListing: string;
  jobListingUrl: string;
  onFile: (file?: File) => void;
  onClearResume: () => void;
  onDragging: (value: boolean) => void;
  onJobListing: (value: string) => void;
  onJobListingUrl: (value: string) => void;
  onResumeText: (value: string) => void;
  onAnalyze: () => void;
};

function InputsStep({
  resumeFile,
  resumeText,
  fileStatus,
  fileWarning,
  fileError,
  isDragging,
  isParsing,
  jobListing,
  jobListingUrl,
  onFile,
  onClearResume,
  onDragging,
  onJobListing,
  onJobListingUrl,
  onResumeText,
  onAnalyze,
}: InputsStepProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [showExtractedText, setShowExtractedText] = useState(false);
  const [showPasteResume, setShowPasteResume] = useState(false);
  const [linkStatus, setLinkStatus] = useState("");
  const [linkError, setLinkError] = useState("");
  const [isImportingLink, setIsImportingLink] = useState(false);
  const canAnalyze =
    resumeText.trim().length >= 80 && jobListing.trim().length >= 120;

  function onFileChange(event: ChangeEvent<HTMLInputElement>) {
    onFile(event.target.files?.[0]);
    event.target.value = "";
  }

  function onDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    onDragging(false);
    onFile(event.dataTransfer.files?.[0]);
  }

  function onDropzoneKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      inputRef.current?.click();
    }
  }

  async function importJobLink() {
    setLinkError("");
    setLinkStatus("");
    setIsImportingLink(true);

    try {
      const response = await fetch(JOB_IMPORT_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: jobListingUrl }),
      });
      const result = (await response.json()) as {
        error?: string;
        text?: string;
        title?: string;
        company?: string;
        sourceUrl?: string;
      };
      if (!response.ok || !result.text) {
        throw new Error(result.error || "The job page could not be imported.");
      }

      onJobListing(result.text);
      if (result.sourceUrl) onJobListingUrl(result.sourceUrl);
      const sourceLabel = [result.title, result.company]
        .filter(Boolean)
        .join(" at ");
      setLinkStatus(
        `${sourceLabel ? `${sourceLabel} · ` : ""}${result.text
          .trim()
          .split(/\s+/)
          .length.toLocaleString()} words imported. Review the text below.`,
      );
    } catch (error) {
      setLinkError(
        `${
          error instanceof Error
            ? error.message
            : "The job page could not be imported."
        } You can paste the description below.`,
      );
    } finally {
      setIsImportingLink(false);
    }
  }

  return (
    <>
      <div className="workspace-heading">
        <h1>Tailor your résumé for this job</h1>
        <p>Match ATS keywords without inventing experience.</p>
      </div>

      <details className="how-to-use" open>
        <summary>
          <span className="how-to-title">
            <ClipboardCheck size={22} strokeWidth={1.7} aria-hidden="true" />
            <span>
              <strong>How to use Application Prep Studio</strong>
              <small>Follow these five steps from résumé to application.</small>
            </span>
          </span>
          <span className="how-to-toggle" aria-hidden="true">
            Guide
            <ChevronDown size={18} strokeWidth={1.8} />
          </span>
        </summary>
        <ol className="how-to-steps">
          <li>
            <span className="how-to-number">1</span>
            <div>
              <strong>Add your résumé</strong>
              <p>Upload a PDF, DOCX, or TXT file—or paste the résumé text.</p>
            </div>
          </li>
          <li>
            <span className="how-to-number">2</span>
            <div>
              <strong>Add the job</strong>
              <p>
                Paste the public job link and tap <b>Import</b>. If it is
                blocked, paste the description instead.
              </p>
            </div>
          </li>
          <li>
            <span className="how-to-number">3</span>
            <div>
              <strong>Analyze the match</strong>
              <p>
                Tap <b>Analyze match</b> to see matching, transferable, and
                missing ATS keywords.
              </p>
            </div>
          </li>
          <li>
            <span className="how-to-number">4</span>
            <div>
              <strong>Create and review</strong>
              <p>
                Confirm only skills you can support, then create the tailored
                résumé and check every line.
              </p>
            </div>
          </li>
          <li>
            <span className="how-to-number">5</span>
            <div>
              <strong>Prepare, download, and apply</strong>
              <p>
                Use Interview Prep, download your résumé, and open the job
                application to submit it yourself.
              </p>
            </div>
          </li>
        </ol>
        <div className="how-to-notes">
          <p>
            <ShieldCheck size={17} strokeWidth={1.8} aria-hidden="true" />
            Missing keywords are included only when you provide truthful
            evidence.
          </p>
          <p>
            <Download size={17} strokeWidth={1.8} aria-hidden="true" />
            On iPhone or iPad, downloaded files are usually in the Files app
            under Downloads.
          </p>
        </div>
      </details>

      <div className="input-grid">
        <section className="input-column resume-column">
          <h2>1. Add your résumé</h2>
          {resumeFile ? (
            <div className="file-ready">
              <div className="file-ready-icon" aria-hidden="true">
                <FileText size={31} strokeWidth={1.55} />
                <span>
                  <Check size={14} strokeWidth={2.5} />
                </span>
              </div>
              <div className="file-ready-copy">
                <strong>{resumeFile.name}</strong>
                <span>{fileStatus}</span>
              </div>
              <button
                className="icon-button"
                type="button"
                onClick={onClearResume}
                aria-label="Remove résumé"
              >
                <X size={20} />
              </button>
              <div className="file-actions">
                <button
                  type="button"
                  className="text-button"
                  onClick={() => setShowExtractedText((current) => !current)}
                >
                  {showExtractedText ? "Hide text" : "Review text"}
                </button>
                <button
                  type="button"
                  className="text-button"
                  onClick={() => inputRef.current?.click()}
                >
                  Replace file
                </button>
              </div>
            </div>
          ) : (
            <div
              className={`dropzone ${isDragging ? "is-dragging" : ""}`}
              role="button"
              tabIndex={0}
              aria-label="Upload résumé"
              aria-disabled={isParsing}
              onClick={() => {
                if (!isParsing) inputRef.current?.click();
              }}
              onKeyDown={onDropzoneKeyDown}
              onDragEnter={(event) => {
                event.preventDefault();
                onDragging(true);
              }}
              onDragOver={(event) => event.preventDefault()}
              onDragLeave={() => onDragging(false)}
              onDrop={onDrop}
            >
              <FileText
                className="dropzone-icon"
                size={54}
                strokeWidth={1.35}
                aria-hidden="true"
              />
              <p>
                {isParsing
                  ? "Reading your résumé…"
                  : "Upload your résumé file to get started."}
              </p>
              <span
                className="secondary-button upload-button"
                aria-hidden="true"
              >
                <Upload size={18} strokeWidth={1.8} aria-hidden="true" />
                Upload résumé
              </span>
            </div>
          )}
          <input
            ref={inputRef}
            className="visually-hidden"
            type="file"
            accept=".docx,.pdf,.txt,text/plain,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            onChange={onFileChange}
          />
          <p className="format-note">Supports DOCX, PDF, TXT · up to 10 MB</p>
          {!resumeFile ? (
            <button
              type="button"
              className="paste-resume-toggle"
              aria-expanded={showPasteResume}
              onClick={() => setShowPasteResume((current) => !current)}
            >
              {showPasteResume ? "Hide pasted text" : "Or paste résumé text"}
            </button>
          ) : null}
          {showPasteResume && !resumeFile ? (
            <div className="paste-resume-panel">
              <label htmlFor="pasted-resume">Résumé text</label>
              <textarea
                id="pasted-resume"
                value={resumeText}
                onChange={(event) => onResumeText(event.target.value)}
                placeholder="Paste the full text of your résumé here…"
                spellCheck
              />
              <span>
                {resumeText.trim().length >= 80
                  ? `${resumeText.trim().split(/\s+/).length.toLocaleString()} words ready`
                  : "Paste at least a short résumé to continue."}
              </span>
            </div>
          ) : null}
          {fileWarning ? (
            <p className="inline-message is-warning">{fileWarning}</p>
          ) : null}
          {fileError ? (
            <p className="inline-message is-error" role="alert">
              {fileError}
            </p>
          ) : null}
        </section>

        <section className="input-column job-column">
          <label htmlFor="job-listing-url">2. Add the job listing</label>
          <div className="job-link-card">
            <div className="job-link-row">
              <span className="job-link-icon" aria-hidden="true">
                <Link2 size={19} strokeWidth={1.8} />
              </span>
              <input
                id="job-listing-url"
                type="url"
                inputMode="url"
                autoCapitalize="none"
                autoCorrect="off"
                value={jobListingUrl}
                onChange={(event) => {
                  onJobListingUrl(event.target.value);
                  setLinkStatus("");
                  setLinkError("");
                }}
                placeholder="https://company.com/jobs/…"
              />
              <button
                type="button"
                className="import-link-button"
                disabled={isImportingLink || !jobListingUrl.trim()}
                onClick={() => void importJobLink()}
              >
                {isImportingLink ? (
                  <LoaderCircle
                    className="spinning-icon"
                    size={17}
                    aria-hidden="true"
                  />
                ) : null}
                {isImportingLink ? "Importing" : "Import"}
              </button>
            </div>
            <p>Works with public job pages. Your résumé is never sent.</p>
          </div>
          {linkStatus ? (
            <p className="inline-message is-success" role="status">
              <CheckCircle2 size={15} aria-hidden="true" />
              {linkStatus}
            </p>
          ) : null}
          {linkError ? (
            <p className="inline-message is-error" role="alert">
              <AlertCircle size={15} aria-hidden="true" />
              {linkError}
            </p>
          ) : null}
          <div className="paste-divider">
            <span>or paste the description</span>
          </div>
          <textarea
            id="job-listing"
            value={jobListing}
            onChange={(event) => onJobListing(event.target.value)}
            placeholder="The imported job description will appear here, or paste it yourself…"
            spellCheck
          />
          <div className="action-row">
            <button
              type="button"
              className="primary-button"
              disabled={!canAnalyze}
              aria-describedby="analysis-requirements"
              onClick={onAnalyze}
            >
              Analyze match
            </button>
            <p className="device-note">
              <LockKeyhole size={18} strokeWidth={1.75} aria-hidden="true" />
              Your résumé stays on this device.
            </p>
            <span id="analysis-requirements" className="visually-hidden">
              Add a readable résumé and complete job description to enable
              analysis.
            </span>
          </div>
        </section>
      </div>

      {showExtractedText && resumeFile ? (
        <section className="extracted-panel">
          <div>
            <h2>Review extracted résumé text</h2>
            <p>Correct anything that did not import cleanly before analysis.</p>
          </div>
          <textarea
            aria-label="Extracted résumé text"
            value={resumeText}
            onChange={(event) => onResumeText(event.target.value)}
          />
        </section>
      ) : (
        <section className="next-preview" aria-label="Next step">
          <h2>Your complete workspace</h2>
          <p>
            Keyword matching&nbsp; • &nbsp;Tailored résumé&nbsp; •
            &nbsp;Interview Prep
          </p>
        </section>
      )}
    </>
  );
}

function KeywordRow({
  keyword,
  selected,
  evidence,
  onToggle,
  onEvidence,
}: {
  keyword: KeywordResult;
  selected: boolean;
  evidence: string;
  onToggle: (keyword: KeywordResult, selected: boolean) => void;
  onEvidence: (keyword: KeywordResult, value: string) => void;
}) {
  const canSelect =
    keyword.status !== "missing" ||
    evidence.trim().length >= MIN_EVIDENCE_LENGTH;
  const statusLabel =
    keyword.status === "matched"
      ? "Already present"
      : keyword.status === "related"
        ? `Transferable match${keyword.matchedAs ? `: ${keyword.matchedAs} → will adapt` : ""}`
        : evidence.trim().length >= MIN_EVIDENCE_LENGTH
          ? "Confirmed by you · will include"
          : "Needs your confirmation";

  return (
    <article className={`keyword-row is-${keyword.status}`}>
      <div className="keyword-control">
        <input
          id={`keyword-${keyword.id}`}
          type="checkbox"
          checked={selected}
          disabled={!canSelect}
          onChange={(event) => onToggle(keyword, event.target.checked)}
        />
        <label htmlFor={`keyword-${keyword.id}`}>
          <span className="keyword-term">{keyword.term}</span>
          <span className="keyword-meta">
            {statusLabel} · {keyword.importance} priority
          </span>
        </label>
      </div>
      <div className="keyword-evidence">
        <span>Job listing</span>
        <p>{keyword.jobEvidence || `Mentions ${keyword.term}.`}</p>
        {keyword.resumeEvidence ? (
          <>
            <span>Your résumé</span>
            <p>{keyword.resumeEvidence}</p>
          </>
        ) : null}
      </div>
      {keyword.status === "missing" ? (
        <div className="verify-field">
          <label htmlFor={`evidence-${keyword.id}`}>
            If this is true, briefly say how or where you used it. The keyword
            will then be included automatically:
          </label>
          <input
            id={`evidence-${keyword.id}`}
            type="text"
            value={evidence}
            onChange={(event) => onEvidence(keyword, event.target.value)}
            placeholder={`Example: Used ${keyword.term} to…`}
          />
        </div>
      ) : null}
    </article>
  );
}

type MatchStepProps = {
  analysis: ResumeAnalysis;
  targetRole: string;
  selectedTerms: Set<string>;
  verifiedEvidence: Record<string, string>;
  onTargetRole: (value: string) => void;
  onSelectedTerms: Dispatch<SetStateAction<Set<string>>>;
  onVerifiedEvidence: Dispatch<SetStateAction<Record<string, string>>>;
  onBack: () => void;
  onContinue: () => void;
};

function MatchStep({
  analysis,
  targetRole,
  selectedTerms,
  verifiedEvidence,
  onTargetRole,
  onSelectedTerms,
  onVerifiedEvidence,
  onBack,
  onContinue,
}: MatchStepProps) {
  const [filter, setFilter] = useState<Filter>("all");
  const visibleKeywords = analysis.keywords.filter((keyword) => {
    if (filter === "matched") return keyword.status !== "missing";
    if (filter === "missing") return keyword.status === "missing";
    return true;
  });
  const totalWeight = analysis.keywords.reduce(
    (sum, keyword) => sum + keyword.weight,
    0,
  );
  const plannedWeight = analysis.keywords.reduce(
    (sum, keyword) =>
      selectedTerms.has(keyword.term) ? sum + keyword.weight : sum,
    0,
  );
  const plannedCoverage =
    totalWeight > 0 ? Math.round((plannedWeight / totalWeight) * 100) : 0;

  function toggleKeyword(keyword: KeywordResult, checked: boolean) {
    onSelectedTerms((current) => {
      const next = new Set(current);
      if (checked) next.add(keyword.term);
      else next.delete(keyword.term);
      return next;
    });
  }

  function updateEvidence(keyword: KeywordResult, value: string) {
    onVerifiedEvidence((current) => ({ ...current, [keyword.id]: value }));
    onSelectedTerms((current) => {
      const next = new Set(current);
      if (value.trim().length >= MIN_EVIDENCE_LENGTH) {
        next.add(keyword.term);
      } else {
        next.delete(keyword.term);
      }
      return next;
    });
  }

  return (
    <>
      <div className="workspace-heading match-heading">
        <h1>Review the keyword match</h1>
        <p>
          Transferable experience is adapted automatically. Confirm only tools
          or experience that your résumé does not already show.
        </p>
      </div>

      <section className="match-summary">
        <div className="coverage-block">
          <strong>{analysis.coverage}%</strong>
          <span>keyword coverage estimate</span>
          <div
            className="coverage-track"
            role="progressbar"
            aria-label="Keyword coverage estimate"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={analysis.coverage}
          >
            <span style={{ width: `${analysis.coverage}%` }} />
          </div>
          <small>This is guidance, not a score from an employer’s ATS.</small>
        </div>
        <dl className="match-counts">
          <div>
            <dt>Exact</dt>
            <dd>{analysis.exactMatches}</dd>
          </div>
          <div>
            <dt>Related</dt>
            <dd>{analysis.relatedMatches}</dd>
          </div>
          <div>
            <dt>Missing</dt>
            <dd>{analysis.missingCount}</dd>
          </div>
        </dl>
        <label className="role-field" htmlFor="target-role">
          Target role
          <input
            id="target-role"
            value={targetRole}
            onChange={(event) => onTargetRole(event.target.value)}
            placeholder="Enter the job title"
          />
        </label>
      </section>

      <div className="match-toolbar">
        <div className="filter-tabs" aria-label="Filter keyword results">
          {(["all", "matched", "missing"] as Filter[]).map((value) => (
            <button
              type="button"
              key={value}
              className={filter === value ? "is-selected" : ""}
              onClick={() => setFilter(value)}
            >
              {value === "all"
                ? "All keywords"
                : value === "matched"
                  ? "Ready to use"
                  : "Needs confirmation"}
            </button>
          ))}
        </div>
        <p>
          {selectedTerms.size} terms selected · {plannedCoverage}% planned
          coverage
        </p>
      </div>

      <section className="keyword-list" aria-label="Keyword analysis">
        {visibleKeywords.length > 0 ? (
          visibleKeywords.map((keyword) => (
            <KeywordRow
              key={keyword.id}
              keyword={keyword}
              selected={selectedTerms.has(keyword.term)}
              evidence={verifiedEvidence[keyword.id] ?? ""}
              onToggle={toggleKeyword}
              onEvidence={updateEvidence}
            />
          ))
        ) : (
          <p className="empty-filter">No keywords are in this category.</p>
        )}
      </section>

      <div className="footer-actions">
        <button type="button" className="secondary-button" onClick={onBack}>
          <ArrowLeft size={18} aria-hidden="true" />
          Back to inputs
        </button>
        <button
          type="button"
          className="primary-button"
          onClick={onContinue}
          disabled={selectedTerms.size === 0}
        >
          Create tailored résumé
          <ArrowRight size={18} aria-hidden="true" />
        </button>
      </div>
    </>
  );
}

function LanguageReview({ issues }: { issues: LanguageIssue[] }) {
  return (
    <section className="language-review">
      <h2>Natural-language check</h2>
      {issues.length === 0 ? (
        <p className="check-message">
          <CheckCircle2 size={18} aria-hidden="true" />
          No common robotic phrases or scanning problems found.
        </p>
      ) : (
        <ul>
          {issues.map((issue) => (
            <li key={issue.id}>
              <AlertCircle size={17} aria-hidden="true" />
              <span>
                <strong>{issue.message}</strong>
                <small>{issue.excerpt}</small>
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function EditStep({
  editedResume,
  targetRole,
  selectedTerms,
  issues,
  onEditedResume,
  onBack,
  onContinue,
  onInterview,
}: {
  editedResume: string;
  targetRole: string;
  selectedTerms: Set<string>;
  issues: LanguageIssue[];
  onEditedResume: (value: string) => void;
  onBack: () => void;
  onContinue: () => void;
  onInterview: () => void;
}) {
  return (
    <>
      <div className="workspace-heading">
        <h1>Edit the tailored résumé</h1>
        <p>Everything remains editable. Check each statement before using it.</p>
      </div>

      <section className="prep-ready" aria-label="Interview prep is ready">
        <div className="prep-ready-icon" aria-hidden="true">
          <MessagesSquare size={24} strokeWidth={1.7} />
        </div>
        <div>
          <h2>Interview Prep is ready</h2>
          <p>
            Practice role-specific questions, build truthful answers, and
            prepare STAR stories from your résumé.
          </p>
        </div>
        <button
          type="button"
          className="secondary-button"
          onClick={onInterview}
        >
          Open Interview Prep
          <ArrowRight size={18} aria-hidden="true" />
        </button>
      </section>

      <div className="edit-layout">
        <aside className="edit-guidance">
          <section>
            <h2>Target</h2>
            <p>{targetRole || "Job title not detected"}</p>
          </section>
          <section>
            <h2>Included keywords</h2>
            <p>{selectedTerms.size} evidence-backed terms</p>
            <div className="selected-keywords">
              {[...selectedTerms].slice(0, 10).map((term) => (
                <span key={term}>{term}</span>
              ))}
            </div>
          </section>
          <LanguageReview issues={issues} />
        </aside>

        <section className="editor-panel">
          <label htmlFor="resume-editor">Résumé text</label>
          <textarea
            id="resume-editor"
            value={editedResume}
            onChange={(event) => onEditedResume(event.target.value)}
            spellCheck
          />
          <div className="editor-note">
            <ShieldCheck size={17} aria-hidden="true" />
            Existing facts and results were preserved while transferable
            wording was adapted. Review every change before applying.
          </div>
        </section>
      </div>

      <div className="footer-actions">
        <button type="button" className="secondary-button" onClick={onBack}>
          <ArrowLeft size={18} aria-hidden="true" />
          Back to keywords
        </button>
        <button
          type="button"
          className="primary-button"
          onClick={onContinue}
          disabled={editedResume.trim().length < 80}
        >
          Continue to export
          <ArrowRight size={18} aria-hidden="true" />
        </button>
      </div>
    </>
  );
}

function previewHeading(line: string) {
  const clean = line.trim().replace(/:$/, "");
  return (
    /^(professional summary|summary|profile|core skills|skills|technical skills|competencies|experience|professional experience|work experience|employment|education|certifications?|projects?)$/i.test(
      clean,
    ) ||
    (clean.length > 2 &&
      clean.length < 45 &&
      clean === clean.toUpperCase() &&
      /[A-Z]/.test(clean))
  );
}

function ResumeDocumentPreview({ text }: { text: string }) {
  const lines = text.replace(/\r\n?/g, "\n").split("\n");
  const firstContentIndex = lines.findIndex((line) => line.trim());
  const firstHeadingIndex = lines.findIndex(
    (line, index) => index > firstContentIndex && previewHeading(line),
  );
  const headerEndIndex =
    firstHeadingIndex >= 0 ? firstHeadingIndex : firstContentIndex + 5;

  return (
    <div className="resume-document">
      {lines.map((sourceLine, index) => {
        const line = sourceLine.trim();
        if (!line) {
          return <span className="resume-spacer" key={`space-${index}`} />;
        }
        if (index === firstContentIndex) {
          return <h1 key={`name-${index}`}>{line}</h1>;
        }
        if (previewHeading(line)) {
          return <h2 key={`heading-${index}`}>{line}</h2>;
        }
        const bullet = line.match(/^(?:[-•●▪◦*])\s*(.+)$/);
        if (bullet?.[1]) {
          return (
            <p className="resume-bullet" key={`bullet-${index}`}>
              {bullet[1]}
            </p>
          );
        }
        const isContact =
          index < headerEndIndex &&
          index <= firstContentIndex + 4 &&
          (/@|\b(?:linkedin|portfolio|github)\b|(?:\+?1[-.\s]?)?\(?\d{3}\)?/i.test(
            line,
          ) ||
            index === firstContentIndex + 1);
        const isRole =
          !isContact &&
          line.length < 120 &&
          (/\b(?:19|20)\d{2}\b|\bpresent\b|\bcurrent\b/i.test(line) ||
            /\s[|—–]\s/.test(line));
        return (
          <p
            className={
              isContact ? "resume-contact" : isRole ? "resume-role" : undefined
            }
            key={`line-${index}`}
          >
            {line}
          </p>
        );
      })}
    </div>
  );
}

function ExportStep({
  editedResume,
  targetRole,
  jobListingUrl,
  selectedCount,
  coverage,
  onBack,
  onContinue,
}: {
  editedResume: string;
  targetRole: string;
  jobListingUrl: string;
  selectedCount: number;
  coverage: number;
  onBack: () => void;
  onContinue: () => void;
}) {
  const [copyStatus, setCopyStatus] = useState("");
  const [docxStatus, setDocxStatus] = useState("");
  const [pdfStatus, setPdfStatus] = useState("");
  const safeJobListingUrl = (() => {
    try {
      const parsed = new URL(jobListingUrl.trim());
      return parsed.protocol === "https:" ? parsed.toString() : "";
    } catch {
      return "";
    }
  })();

  async function copyResume() {
    try {
      await navigator.clipboard.writeText(editedResume);
      setCopyStatus("Copied");
    } catch {
      setCopyStatus("Copy failed");
    }
  }

  async function downloadDocx() {
    setDocxStatus("Preparing…");
    try {
      await downloadResumeDocx(editedResume, targetRole);
      setDocxStatus("Downloaded");
    } catch {
      setDocxStatus("Could not create DOCX");
    }
  }

  async function downloadPdf() {
    setPdfStatus("Preparing…");
    try {
      await downloadResumePdf(editedResume, targetRole);
      setPdfStatus("Downloaded");
    } catch {
      setPdfStatus("Could not create PDF");
    }
  }

  return (
    <>
      <div className="workspace-heading">
        <h1>Export your résumé</h1>
        <p>Choose a clean ATS-friendly format, then review the final file.</p>
      </div>

      <div className="export-layout">
        <section className="export-controls">
          <section className="assisted-apply">
            <span className="assisted-kicker">Assisted apply</span>
            <h2>Ready for the application?</h2>
            <p>
              First download the tailored résumé, then open the original job
              page. You review every answer and submit.
            </p>
            <div className="assisted-actions">
              <button
                type="button"
                onClick={() => void downloadDocx()}
              >
                <FileDown size={18} aria-hidden="true" />
                1. Download résumé
              </button>
              {safeJobListingUrl ? (
                <a
                  href={safeJobListingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink size={18} aria-hidden="true" />
                  2. Open job application
                </a>
              ) : (
                <span className="disabled-apply-link" aria-disabled="true">
                  <ExternalLink size={18} aria-hidden="true" />
                  2. Add a job link first
                </span>
              )}
            </div>
            <small>
              The application opens through a direct link, which works more
              reliably on iPhone. Screening questions are never answered
              automatically.
            </small>
          </section>
          <button type="button" onClick={() => void downloadDocx()}>
            <FileDown size={23} aria-hidden="true" />
            <span>
              <strong>Download Word file</strong>
              <small>Editable DOCX · recommended</small>
            </span>
            {docxStatus ? <em>{docxStatus}</em> : null}
          </button>
          <button type="button" onClick={() => void downloadPdf()}>
            <FileDown size={23} aria-hidden="true" />
            <span>
              <strong>Download PDF file</strong>
              <small>Ready to upload from Files</small>
            </span>
            {pdfStatus ? <em>{pdfStatus}</em> : null}
          </button>
          <button
            type="button"
            onClick={() => downloadResumeText(editedResume, targetRole)}
          >
            <Download size={23} aria-hidden="true" />
            <span>
              <strong>Download plain text</strong>
              <small>Best for application text boxes</small>
            </span>
          </button>
          <button type="button" onClick={() => void copyResume()}>
            {copyStatus === "Copied" ? (
              <ClipboardCheck size={23} aria-hidden="true" />
            ) : (
              <Clipboard size={23} aria-hidden="true" />
            )}
            <span>
              <strong>Copy résumé text</strong>
              <small>{copyStatus || "Paste it anywhere"}</small>
            </span>
          </button>

          <section className="export-checklist">
            <h2>Final checks</h2>
            <p>
              <CheckCircle2 size={17} aria-hidden="true" />
              {selectedCount} selected keywords included
            </p>
            <p>
              <CheckCircle2 size={17} aria-hidden="true" />
              {coverage}% source keyword coverage
            </p>
            <p>
              <CheckCircle2 size={17} aria-hidden="true" />
              No hidden prompts, tool branding, or generative metadata
            </p>
          </section>
        </section>

        <section className="resume-preview" aria-label="Résumé preview">
          <div className="paper-toolbar">
            <span>{targetRole || "Tailored résumé"}</span>
            <span>{editedResume.split(/\s+/).length.toLocaleString()} words</span>
          </div>
          <ResumeDocumentPreview text={editedResume} />
        </section>
      </div>

      <div className="footer-actions no-print">
        <button type="button" className="secondary-button" onClick={onBack}>
          <ArrowLeft size={18} aria-hidden="true" />
          Back to editor
        </button>
        <button type="button" className="primary-button" onClick={onContinue}>
          Open interview prep
          <ArrowRight size={18} aria-hidden="true" />
        </button>
      </div>

      <article className="print-resume">
        <ResumeDocumentPreview text={editedResume} />
      </article>
    </>
  );
}

type StarDraft = {
  source: string;
  situation: string;
  task: string;
  action: string;
  result: string;
};

function InterviewStep({
  prep,
  onBack,
}: {
  prep: InterviewPrep;
  onBack: () => void;
}) {
  const [openQuestion, setOpenQuestion] = useState(prep.questions[0]?.id ?? "");
  const [copyStatus, setCopyStatus] = useState("");
  const [star, setStar] = useState<StarDraft>({
    source: prep.storySources[0] ?? "",
    situation: "",
    task: "",
    action: "",
    result: "",
  });

  function updateStar(field: keyof StarDraft, value: string) {
    setStar((current) => ({ ...current, [field]: value }));
  }

  async function copyPrep() {
    try {
      await navigator.clipboard.writeText(formatInterviewPrep(prep, star));
      setCopyStatus("Prep notes copied");
    } catch {
      setCopyStatus("Copy failed");
    }
  }

  return (
    <>
      <div className="workspace-heading interview-heading">
        <div>
          <h1>Prepare for the interview</h1>
          <p>
            Practice likely questions using only evidence from your résumé.
          </p>
        </div>
        <button
          type="button"
          className="secondary-button interview-copy"
          onClick={() => void copyPrep()}
        >
          {copyStatus === "Prep notes copied" ? (
            <ClipboardCheck size={18} aria-hidden="true" />
          ) : (
            <Clipboard size={18} aria-hidden="true" />
          )}
          {copyStatus || "Copy prep notes"}
        </button>
      </div>

      <div className="interview-focus">
        <span>Target role</span>
        <strong>{prep.targetRole}</strong>
        <p>
          Focus:{" "}
          {prep.focusTerms.length
            ? prep.focusTerms.slice(0, 6).join(" · ")
            : "your strongest relevant experience"}
        </p>
      </div>

      <div className="interview-layout">
        <section className="question-section">
          <div className="section-heading">
            <div>
              <h2>Likely questions</h2>
              <p>Open each question for a truthful answer outline.</p>
            </div>
            <span>{prep.questions.length} questions</span>
          </div>
          <div className="question-list">
            {prep.questions.map((question, index) => {
              const isOpen = openQuestion === question.id;
              return (
                <article
                  className={`interview-question ${isOpen ? "is-open" : ""}`}
                  key={question.id}
                >
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    aria-controls={`answer-${question.id}`}
                    onClick={() =>
                      setOpenQuestion((current) =>
                        current === question.id ? "" : question.id,
                      )
                    }
                  >
                    <span className="question-number">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className="question-copy">
                      <small>{question.category}</small>
                      <strong>{question.question}</strong>
                    </span>
                    {isOpen ? (
                      <ChevronUp size={19} aria-hidden="true" />
                    ) : (
                      <ChevronDown size={19} aria-hidden="true" />
                    )}
                  </button>
                  {isOpen ? (
                    <div
                      className="answer-outline"
                      id={`answer-${question.id}`}
                    >
                      <p className="why-asked">
                        <strong>Why it may come up:</strong>{" "}
                        {question.whyAsked}
                      </p>
                      <h3>Build your answer</h3>
                      <ol>
                        {question.outline.map((point) => (
                          <li key={point}>{point}</li>
                        ))}
                      </ol>
                      {question.evidence.length ? (
                        <div className="evidence-cue">
                          <span>Your supporting evidence</span>
                          {question.evidence.map((line) => (
                            <p key={line}>{line}</p>
                          ))}
                        </div>
                      ) : (
                        <p className="evidence-warning">
                          No specific résumé example was found for this
                          question. Choose a real example before practicing it.
                        </p>
                      )}
                    </div>
                  ) : null}
                </article>
              );
            })}
          </div>
        </section>

        <aside className="interview-sidebar">
          <section className="intro-outline">
            <h2>60-second introduction</h2>
            <p>Use this structure in your own voice.</p>
            <ol>
              {prep.introductionPoints.map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ol>
          </section>

          <section className="ask-list">
            <h2>Questions to ask them</h2>
            <p>Choose two or three that genuinely matter to you.</p>
            <ul>
              {prep.questionsToAsk.map((question) => (
                <li key={question}>{question}</li>
              ))}
            </ul>
          </section>
        </aside>
      </div>

      <section className="star-practice">
        <div className="star-heading">
          <div className="star-icon" aria-hidden="true">
            <Star size={22} strokeWidth={1.7} />
          </div>
          <div>
            <h2>STAR story practice</h2>
            <p>
              Turn one real résumé example into a concise Situation, Task,
              Action, Result answer.
            </p>
          </div>
        </div>

        <label className="story-source" htmlFor="story-source">
          Evidence to practice
          <select
            id="story-source"
            value={star.source}
            onChange={(event) => updateStar("source", event.target.value)}
          >
            {prep.storySources.length ? (
              prep.storySources.map((source) => (
                <option key={source} value={source}>
                  {source}
                </option>
              ))
            ) : (
              <option value="">Choose a real example from your résumé</option>
            )}
          </select>
        </label>

        <div className="star-grid">
          {(
            [
              [
                "situation",
                "Situation",
                "What was happening? Include only the context needed.",
              ],
              [
                "task",
                "Task",
                "What were you personally responsible for?",
              ],
              [
                "action",
                "Action",
                "What steps did you take? Be specific about your contribution.",
              ],
              [
                "result",
                "Result",
                "What changed? Use only a result you can verify.",
              ],
            ] as const
          ).map(([field, label, placeholder]) => (
            <label key={field} htmlFor={`star-${field}`}>
              <span>{label}</span>
              <textarea
                id={`star-${field}`}
                value={star[field]}
                onChange={(event) => updateStar(field, event.target.value)}
                placeholder={placeholder}
              />
            </label>
          ))}
        </div>
        <p className="truth-note">
          <ShieldCheck size={17} aria-hidden="true" />
          Keep names, numbers, tools, and outcomes accurate. It is fine to say
          what you learned or are still learning.
        </p>
      </section>

      <div className="footer-actions">
        <button type="button" className="secondary-button" onClick={onBack}>
          <ArrowLeft size={18} aria-hidden="true" />
          Back to export
        </button>
      </div>
    </>
  );
}

export default function ResumeApp() {
  const [activeStep, setActiveStep] = useState<Step>("inputs");
  const [reachedStep, setReachedStep] = useState(0);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumeText, setResumeText] = useState("");
  const [fileStatus, setFileStatus] = useState("");
  const [fileWarning, setFileWarning] = useState("");
  const [fileError, setFileError] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [jobListing, setJobListing] = useState("");
  const [jobListingUrl, setJobListingUrl] = useState("");
  const [analysis, setAnalysis] = useState<ResumeAnalysis | null>(null);
  const [targetRole, setTargetRole] = useState("");
  const [selectedTerms, setSelectedTerms] = useState<Set<string>>(new Set());
  const [verifiedEvidence, setVerifiedEvidence] = useState<
    Record<string, string>
  >({});
  const [editedResume, setEditedResume] = useState("");
  const languageIssues = useMemo(
    () => (editedResume ? checkNaturalLanguage(editedResume) : []),
    [editedResume],
  );
  const plannedCoverage = useMemo(() => {
    if (!analysis) return 0;
    const totalWeight = analysis.keywords.reduce(
      (sum, keyword) => sum + keyword.weight,
      0,
    );
    const selectedWeight = analysis.keywords.reduce(
      (sum, keyword) =>
        selectedTerms.has(keyword.term) ? sum + keyword.weight : sum,
      0,
    );
    return totalWeight > 0
      ? Math.round((selectedWeight / totalWeight) * 100)
      : 0;
  }, [analysis, selectedTerms]);

  useEffect(() => {
    if (
      import.meta.env.PROD &&
      "serviceWorker" in navigator
    ) {
      let refreshing = false;
      const reloadForUpdate = () => {
        if (refreshing) return;
        refreshing = true;
        window.location.reload();
      };
      navigator.serviceWorker.addEventListener(
        "controllerchange",
        reloadForUpdate,
      );
      void navigator.serviceWorker
        .register("/sw.js")
        .then((registration) => registration.update());
      return () =>
        navigator.serviceWorker.removeEventListener(
          "controllerchange",
          reloadForUpdate,
        );
    }
  }, []);

  async function handleFile(file?: File) {
    if (!file) return;
    setFileError("");
    setFileWarning("");
    setIsParsing(true);
    setFileStatus("Reading résumé…");

    try {
      const parsed = await parseResumeFile(file);
      setResumeFile(file);
      setResumeText(parsed.text);
      setFileWarning(parsed.warning ?? "");
      setFileStatus(
        `${parsed.format} ready · ${parsed.text.split(/\s+/).length.toLocaleString()} words`,
      );
    } catch (error) {
      setResumeFile(null);
      setResumeText("");
      setFileStatus("");
      setFileError(
        error instanceof Error ? error.message : "This file could not be read.",
      );
    } finally {
      setIsParsing(false);
    }
  }

  function clearResume() {
    setResumeFile(null);
    setResumeText("");
    setFileStatus("");
    setFileWarning("");
    setFileError("");
  }

  function runAnalysis() {
    const result = analyzeResume(resumeText, jobListing);
    setAnalysis(result);
    setTargetRole(result.targetRole);
    setSelectedTerms(
      new Set(
        result.keywords
          .filter((keyword) => keyword.status !== "missing")
          .map((keyword) => keyword.term),
      ),
    );
    setVerifiedEvidence({});
    setReachedStep((current) => Math.max(current, 1));
    setActiveStep("match");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function buildTailoredResume() {
    if (!analysis) return;
    const verifiedMissing = analysis.keywords
      .filter(
        (keyword) =>
          keyword.status === "missing" &&
          selectedTerms.has(keyword.term) &&
          (verifiedEvidence[keyword.id] ?? "").trim().length >=
            MIN_EVIDENCE_LENGTH,
      )
      .map((keyword) => keyword.term);
    const evidenceBacked = analysis.keywords
      .filter(
        (keyword) =>
          keyword.status !== "missing" && selectedTerms.has(keyword.term),
      )
      .map((keyword) => keyword.term);
    setEditedResume(
      createTailoredResume(resumeText, [
        ...evidenceBacked,
        ...verifiedMissing,
      ]),
    );
    setReachedStep((current) => Math.max(current, 4));
    setActiveStep("edit");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function goToExport() {
    setReachedStep((current) => Math.max(current, 3));
    setActiveStep("export");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function goToInterview() {
    setReachedStep((current) => Math.max(current, 4));
    setActiveStep("interview");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function selectStep(step: Step) {
    const index = stepOrder.indexOf(step);
    if (index <= reachedStep) {
      setActiveStep(step);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <button
          type="button"
          className="brand"
          onClick={() => selectStep("inputs")}
          aria-label="Application Prep Studio inputs"
        >
          Application Prep Studio
        </button>
        <div className="privacy-mark">
          <ShieldCheck size={22} strokeWidth={1.7} aria-hidden="true" />
          <span>Private • Résumé stays local</span>
        </div>
      </header>

      <div className="app-body">
        <StepRail
          activeStep={activeStep}
          reachedStep={reachedStep}
          onSelect={selectStep}
        />

        <section className="workspace">
          {activeStep === "inputs" ? (
            <InputsStep
              resumeFile={resumeFile}
              resumeText={resumeText}
              fileStatus={fileStatus}
              fileWarning={fileWarning}
              fileError={fileError}
              isDragging={isDragging}
              isParsing={isParsing}
              jobListing={jobListing}
              jobListingUrl={jobListingUrl}
              onFile={(file) => void handleFile(file)}
              onClearResume={clearResume}
              onDragging={setIsDragging}
              onJobListing={setJobListing}
              onJobListingUrl={setJobListingUrl}
              onResumeText={setResumeText}
              onAnalyze={runAnalysis}
            />
          ) : null}

          {activeStep === "match" && analysis ? (
            <MatchStep
              analysis={analysis}
              targetRole={targetRole}
              selectedTerms={selectedTerms}
              verifiedEvidence={verifiedEvidence}
              onTargetRole={setTargetRole}
              onSelectedTerms={setSelectedTerms}
              onVerifiedEvidence={setVerifiedEvidence}
              onBack={() => setActiveStep("inputs")}
              onContinue={buildTailoredResume}
            />
          ) : null}

          {activeStep === "edit" ? (
            <EditStep
              editedResume={editedResume}
              targetRole={targetRole}
              selectedTerms={selectedTerms}
              issues={languageIssues}
              onEditedResume={setEditedResume}
              onBack={() => setActiveStep("match")}
              onContinue={goToExport}
              onInterview={goToInterview}
            />
          ) : null}

          {activeStep === "export" && analysis ? (
            <ExportStep
              editedResume={editedResume}
              targetRole={targetRole}
              jobListingUrl={jobListingUrl}
              selectedCount={selectedTerms.size}
              coverage={plannedCoverage}
              onBack={() => setActiveStep("edit")}
              onContinue={goToInterview}
            />
          ) : null}

          {activeStep === "interview" && analysis ? (
            <InterviewStep
              prep={buildInterviewPrep({
                resumeText,
                jobListing,
                analysis,
                selectedTerms,
                verifiedEvidence,
                targetRole,
              })}
              onBack={() => setActiveStep("export")}
            />
          ) : null}
        </section>
      </div>
    </main>
  );
}
