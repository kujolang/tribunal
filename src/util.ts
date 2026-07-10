import { createHash, randomBytes } from "node:crypto";
import { readFile } from "node:fs/promises";
import { basename, resolve } from "node:path";
import type { Docket } from "./types.js";

export function now(): string {
  return new Date().toISOString();
}

export function sha256(value: string | Buffer): string {
  return createHash("sha256").update(value).digest("hex");
}

export function createRunId(date = new Date()): string {
  return `${date.toISOString().replace(/[:.]/g, "-")}-${randomBytes(3).toString("hex")}`;
}

export async function loadDocket(sourcePath: string): Promise<Docket> {
  const absolute = resolve(sourcePath);
  let content: string;
  try {
    content = await readFile(absolute, "utf8");
  } catch (error) {
    throw new Error(
      `Unable to read docket file '${absolute}': ${(error as Error).message}`,
    );
  }
  if (!content.trim()) throw new Error(`Docket file '${absolute}' is empty.`);
  const titleLine =
    content.split("\n").find((line) => line.trim()) ?? basename(absolute);
  const title = titleLine
    .replace(/^#+\s*/, "")
    .trim()
    .slice(0, 160);
  return {
    id: sha256(absolute + content).slice(0, 16),
    title,
    sourcePath: absolute,
    content,
    scope:
      extractSection(content, "scope") ??
      "The decision described by this docket.",
    nonGoals: extractList(content, ["non-goals", "non goals"]),
    openedAt: now(),
    contentSha256: sha256(content),
  };
}

export function findSecretExposure(value: string): string | undefined {
  const patterns: Array<[RegExp, string]> = [
    [
      /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
      "private key material",
    ],
    [/\bsk-[A-Za-z0-9_-]{20,}\b/, "provider API key"],
    [
      /\b(?:api[_-]?key|access[_-]?token|secret)\s*[:=]\s*["']?[A-Za-z0-9_./+-]{16,}/i,
      "credential-like value",
    ],
    [/\bgh[opusr]_[A-Za-z0-9]{20,}\b/, "GitHub token"],
  ];
  return patterns.find(([pattern]) => pattern.test(value))?.[1];
}

export function safeStructured(value: unknown): Record<string, unknown> {
  if (typeof value === "object" && value !== null && !Array.isArray(value))
    return value as Record<string, unknown>;
  return {};
}

export function stringArray(value: unknown, fallback: string[] = []): string[] {
  return Array.isArray(value)
    ? value.filter((entry): entry is string => typeof entry === "string")
    : fallback;
}

export function stringValue(value: unknown, fallback: string): string {
  return typeof value === "string" && value.trim() ? value : fallback;
}

export function numberValue(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function extractSection(content: string, heading: string): string | undefined {
  const lines = content.split("\n");
  const index = lines.findIndex((line) =>
    new RegExp(`^#{1,6}\\s+${escapeRegExp(heading)}\\s*$`, "i").test(
      line.trim(),
    ),
  );
  if (index < 0) return undefined;
  const body: string[] = [];
  for (const line of lines.slice(index + 1)) {
    if (/^#{1,6}\s+/.test(line)) break;
    body.push(line);
  }
  return body.join("\n").trim() || undefined;
}

function extractList(content: string, headings: string[]): string[] {
  for (const heading of headings) {
    const section = extractSection(content, heading);
    if (section) {
      return section
        .split("\n")
        .map((line) => line.replace(/^\s*[-*+]\s+/, "").trim())
        .filter(Boolean);
    }
  }
  return [];
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
