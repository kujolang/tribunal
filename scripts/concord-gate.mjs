/* global process */
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";

const root = resolve(import.meta.dirname, "..");
const concordRoot = resolve(
  process.env.CONCORD_REPO ?? join(root, "../concord"),
);
const kujoBin = resolve(
  process.env.KUJO_RUNTIME_BIN ?? join(root, "../kujo/target/debug/kujo"),
);
const temp = await mkdtemp(join(tmpdir(), "tribunal-concord-gate-"));
try {
  const reportPath = join(temp, "concord.json");
  const scan = spawnSync(
    join(concordRoot, "kujo"),
    [
      "run",
      "concord.kujo",
      "--",
      "scan",
      "--dir",
      root,
      "--format",
      "json",
      "--output",
      reportPath,
    ],
    {
      cwd: concordRoot,
      env: { ...process.env, KUJO_RUNTIME_BIN: kujoBin },
      encoding: "utf8",
    },
  );
  if (![0, 1].includes(scan.status ?? -1)) {
    throw new Error(
      `Concord failed operationally (${scan.status}): ${scan.stderr || scan.stdout}`,
    );
  }
  const report = JSON.parse(await readFile(reportPath, "utf8"));
  const blocking = (report.findings ?? []).filter((finding) =>
    ["critical", "high"].includes(finding.severity),
  );
  if (blocking.length) {
    throw new Error(
      `Concord blocking drift: ${blocking.map((finding) => `${finding.id}: ${finding.summary}`).join("; ")}`,
    );
  }

  const help = spawnSync(
    process.execPath,
    [join(root, "dist/src/cli.js"), "help"],
    {
      cwd: root,
      encoding: "utf8",
    },
  );
  if (help.status !== 0)
    throw new Error(`Tribunal help failed: ${help.stderr}`);
  for (const command of [
    "review",
    "kill",
    "list",
    "show",
    "replay",
    "seal",
    "verify",
    "ingest",
    "export",
    "panels",
    "seats",
  ]) {
    if (!help.stdout.includes(`tribunal ${command}`)) {
      throw new Error(`CLI help is missing command '${command}'.`);
    }
  }
  process.stdout.write(
    `Concord gate passed: ${report.summary?.total_findings ?? 0} advisory findings; highest severity ${report.summary?.highest_severity ?? "none"}; CLI help contract aligned.\n`,
  );
} finally {
  await rm(temp, { recursive: true, force: true });
}
