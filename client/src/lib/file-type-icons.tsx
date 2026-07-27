/**
 * MIME / extension → icon mapping for files and folders.
 * Add new rules to MIME_ICON_RULES (first match wins).
 */

export type FileIconKind =
  | "folder"
  | "image"
  | "video"
  | "audio"
  | "pdf"
  | "word"
  | "excel"
  | "powerpoint"
  | "archive"
  | "code"
  | "text"
  | "json"
  | "generic";

type IconRule = {
  kind: FileIconKind;
  mimePrefixes?: string[];
  mimeExact?: string[];
  extensions?: string[];
};

/** Order matters: first matching rule is used. */
export const MIME_ICON_RULES: IconRule[] = [
  {
    kind: "image",
    mimePrefixes: ["image/"],
    extensions: [
      "png",
      "jpg",
      "jpeg",
      "gif",
      "webp",
      "svg",
      "bmp",
      "ico",
      "heic",
      "heif",
    ],
  },
  {
    kind: "video",
    mimePrefixes: ["video/"],
    extensions: ["mp4", "webm", "mov", "avi", "mkv", "m4v"],
  },
  {
    kind: "audio",
    mimePrefixes: ["audio/"],
    extensions: ["mp3", "wav", "ogg", "m4a", "flac", "aac"],
  },
  {
    kind: "pdf",
    mimeExact: ["application/pdf"],
    extensions: ["pdf"],
  },
  {
    kind: "word",
    mimeExact: [
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.oasis.opendocument.text",
    ],
    extensions: ["doc", "docx", "odt", "rtf"],
  },
  {
    kind: "excel",
    mimeExact: [
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.oasis.opendocument.spreadsheet",
      "text/csv",
    ],
    extensions: ["xls", "xlsx", "csv", "ods"],
  },
  {
    kind: "powerpoint",
    mimeExact: [
      "application/vnd.ms-powerpoint",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      "application/vnd.oasis.opendocument.presentation",
    ],
    extensions: ["ppt", "pptx", "odp"],
  },
  {
    kind: "archive",
    mimeExact: [
      "application/zip",
      "application/x-zip-compressed",
      "application/x-rar-compressed",
      "application/vnd.rar",
      "application/x-7z-compressed",
      "application/gzip",
      "application/x-tar",
    ],
    extensions: ["zip", "rar", "7z", "tar", "gz", "bz2"],
  },
  {
    kind: "json",
    mimeExact: ["application/json", "application/ld+json"],
    extensions: ["json"],
  },
  {
    kind: "code",
    mimePrefixes: ["application/javascript", "application/typescript"],
    mimeExact: [
      "text/javascript",
      "text/typescript",
      "application/x-python-code",
      "text/x-python",
      "text/html",
      "text/css",
      "application/xml",
      "text/xml",
    ],
    extensions: [
      "js",
      "jsx",
      "ts",
      "tsx",
      "py",
      "java",
      "go",
      "rs",
      "c",
      "cpp",
      "h",
      "cs",
      "php",
      "rb",
      "swift",
      "kt",
      "html",
      "css",
      "scss",
      "xml",
      "yaml",
      "yml",
      "sh",
    ],
  },
  {
    kind: "text",
    mimePrefixes: ["text/"],
    extensions: ["txt", "md", "markdown", "log"],
  },
];

const EXTENSION_FROM_NAME = /\.([a-z0-9]+)$/i;

function extensionFromName(name?: string) {
  if (!name) return "";
  const m = name.match(EXTENSION_FROM_NAME);
  return m?.[1]?.toLowerCase() ?? "";
}

function mimeMatchesRule(mime: string, rule: IconRule) {
  const lower = mime.toLowerCase();
  if (rule.mimeExact?.some((m) => lower === m)) return true;
  if (rule.mimePrefixes?.some((p) => lower.startsWith(p))) return true;
  return false;
}

export function resolveFileIconKind(options: {
  type: "folder" | "file";
  mimeType?: string | null;
  name?: string;
}): FileIconKind {
  if (options.type === "folder") return "folder";

  const mime = (options.mimeType || "").trim().toLowerCase();
  const ext = extensionFromName(options.name);

  for (const rule of MIME_ICON_RULES) {
    if (mime && mimeMatchesRule(mime, rule)) return rule.kind;
    if (ext && rule.extensions?.includes(ext)) return rule.kind;
  }

  return "generic";
}

const ICON_STYLES: Record<
  FileIconKind,
  { bg: string; fg: string; label: string }
> = {
  folder: { bg: "bg-amber-100", fg: "text-amber-700", label: "Folder" },
  image: { bg: "bg-violet-100", fg: "text-violet-700", label: "Image" },
  video: { bg: "bg-pink-100", fg: "text-pink-700", label: "Video" },
  audio: { bg: "bg-fuchsia-100", fg: "text-fuchsia-700", label: "Audio" },
  pdf: { bg: "bg-red-100", fg: "text-red-700", label: "PDF" },
  word: { bg: "bg-blue-100", fg: "text-blue-700", label: "Document" },
  excel: { bg: "bg-green-100", fg: "text-green-700", label: "Spreadsheet" },
  powerpoint: { bg: "bg-orange-100", fg: "text-orange-700", label: "Presentation" },
  archive: { bg: "bg-yellow-100", fg: "text-yellow-800", label: "Archive" },
  code: { bg: "bg-slate-200", fg: "text-slate-700", label: "Code" },
  text: { bg: "bg-zinc-200", fg: "text-zinc-700", label: "Text" },
  json: { bg: "bg-teal-100", fg: "text-teal-800", label: "JSON" },
  generic: { bg: "bg-zinc-100", fg: "text-zinc-600", label: "File" },
};

function FolderGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M10 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-8l-2-2Z" />
    </svg>
  );
}

function FileGlyph({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden
    >
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
      <path d="M14 2v6h6" />
    </svg>
  );
}

function ImageGlyph({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden
    >
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <path d="m21 15-5-5L5 21" />
    </svg>
  );
}

function PlayGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M8 5v14l11-7L8 5Z" />
    </svg>
  );
}

function MusicGlyph({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden
    >
      <path d="M9 18V5l12-2v13" />
      <circle cx="6" cy="18" r="3" />
      <circle cx="18" cy="16" r="3" />
    </svg>
  );
}

function PdfBadge({ className }: { className?: string }) {
  return (
    <span className={`text-[10px] font-bold leading-none ${className}`}>PDF</span>
  );
}

function KindBadge({
  text,
  className,
}: {
  text: string;
  className?: string;
}) {
  return (
    <span className={`text-[9px] font-bold leading-none ${className}`}>{text}</span>
  );
}

function InnerIcon({ kind }: { kind: FileIconKind }) {
  const iconClass = "h-5 w-5";
  switch (kind) {
    case "folder":
      return <FolderGlyph className={iconClass} />;
    case "image":
      return <ImageGlyph className={iconClass} />;
    case "video":
      return <PlayGlyph className={`${iconClass} ml-0.5`} />;
    case "audio":
      return <MusicGlyph className={iconClass} />;
    case "pdf":
      return <PdfBadge />;
    case "word":
      return <KindBadge text="DOC" />;
    case "excel":
      return <KindBadge text="XLS" />;
    case "powerpoint":
      return <KindBadge text="PPT" />;
    case "archive":
      return <KindBadge text="ZIP" />;
    case "json":
      return <KindBadge text="{ }" />;
    case "code":
      return <KindBadge text="</>" />;
    case "text":
      return <KindBadge text="TXT" />;
    default:
      return <FileGlyph className={iconClass} />;
  }
}

export function FileTypeIcon({
  kind,
  className = "",
}: {
  kind: FileIconKind;
  className?: string;
}) {
  const style = ICON_STYLES[kind];
  return (
    <span
      className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md ${style.bg} ${style.fg} ${className}`}
      title={style.label}
      aria-hidden
    >
      <InnerIcon kind={kind} />
    </span>
  );
}

export function ResourceFileIcon({
  type,
  mimeType,
  name,
  className,
}: {
  type: "folder" | "file";
  mimeType?: string | null;
  name?: string;
  className?: string;
}) {
  const kind = resolveFileIconKind({ type, mimeType, name });
  return <FileTypeIcon kind={kind} className={className} />;
}
