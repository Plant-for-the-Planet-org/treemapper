const fs = require("fs");
const path = require("path");
const readline = require("readline");

const CSV_PATH = path.join(__dirname, "data.csv");
const PROGRESS_PATH = path.join(__dirname, "migration-progress.json");

function parseCSVLine(line) {
  const fields = [];
  let i = 0;
  while (i < line.length) {
    if (line[i] === '"') {
      // Quoted field
      let field = "";
      i++; // skip opening quote
      while (i < line.length) {
        if (line[i] === '"' && line[i + 1] === '"') {
          field += '"';
          i += 2;
        } else if (line[i] === '"') {
          i++; // skip closing quote
          break;
        } else {
          field += line[i++];
        }
      }
      fields.push(field);
      if (line[i] === ",") i++; // skip comma after quoted field
    } else {
      // Unquoted field
      const end = line.indexOf(",", i);
      if (end === -1) {
        fields.push(line.slice(i).trim());
        break;
      }
      fields.push(line.slice(i, end).trim());
      i = end + 1;
    }
  }
  return fields;
}

function parseCSV(content) {
  const lines = content
    .split("\n")
    .map((l) => l.replace(/\r$/, ""))
    .filter((l) => l.trim());
  const headers = parseCSVLine(lines[0]);
  return lines.slice(1).map((line) => {
    const values = parseCSVLine(line);
    return Object.fromEntries(headers.map((h, i) => [h, values[i] ?? ""]));
  });
}

// --- Progress tracking ---

function loadProgress() {
  if (fs.existsSync(PROGRESS_PATH)) {
    return JSON.parse(fs.readFileSync(PROGRESS_PATH, "utf-8"));
  }
  return { records: {} };
}

function saveProgress(progress) {
  fs.writeFileSync(PROGRESS_PATH, JSON.stringify(progress, null, 2), "utf-8");
}

function setRecord(progress, email, status, error = null) {
  progress.records[email] = { status, updatedAt: new Date().toISOString() };
  if (error) progress.records[email].error = error;
  saveProgress(progress);
}

// --- Interactive pause ---

async function promptOnError(label, email, reason) {
  console.error(`\n${label} ❌ ${email} — ${reason}`);
  console.log(`\nScript paused. Options:`);
  console.log(`  s — skip this user and continue`);
  console.log(`  q — quit the script (fix the issue and re-run to resume)\n`);

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

  return new Promise((resolve) => {
    const ask = () => {
      rl.question("Enter choice [s/q]: ", (answer) => {
        const choice = answer.trim().toLowerCase();
        if (choice === "s" || choice === "q") {
          rl.close();
          resolve(choice);
        } else {
          ask();
        }
      });
    };
    ask();
  });
}

// --- API calls ---

const BASE_URL = "http://localhost:3001/api/migration";

const POLL_INTERVAL_MS = 1_000;
const TIMEOUT_MS = 30 * 60_000;

async function startMigration(email) {
  const res = await fetch(`${BASE_URL}/start`, {
    method: "POST",
    headers: {
      "X-Profile-ID": email,
      "Content-Type": "application/json",
    },
    body: "{}",
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
  return res.json();
}

async function getStatus(email) {
  const res = await fetch(
    `${BASE_URL}/status-by-email?email=${encodeURIComponent(email)}`,
    {
      headers: {
        Authorization: `Bearer ${AUTH_TOKEN}`,
      },
    }
  );
  if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
  return res.json();
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForCompletion(email, index, total) {
  const deadline = Date.now() + TIMEOUT_MS;
  while (Date.now() < deadline) {
    await sleep(POLL_INTERVAL_MS);
    let status;
    try {
      status = await getStatus(email);
    } catch (err) {
      console.log(`  [${index}/${total}] ${email} — poll error: ${err.message}, retrying...`);
      continue;
    }
    const step = status.data?.currentStep;
    console.log(`  [${index}/${total}] ${email} — status: ${step}`);
    if (step === "completed") return "completed";
    if (step === "failed") return "failed";
  }
  return "timeout";
}

// --- Main ---

async function main() {
  if (!AUTH_TOKEN) {
    console.error("AUTH_TOKEN is empty. Set it at the top of the script.");
    process.exit(1);
  }

  const progress = loadProgress();
  const csvContent = fs.readFileSync(CSV_PATH, "utf-8");
  const records = parseCSV(csvContent);

  console.log(`Found ${records.length} records in CSV`);

  const alreadyDone = Object.values(progress.records).filter(
    (r) => r.status === "completed" || r.status === "skipped"
  ).length;
  if (alreadyDone > 0) {
    console.log(`Resuming — ${alreadyDone} already completed/skipped (from migration-progress.json)\n`);
  } else {
    console.log();
  }

  let success = 0;
  let failed = 0;
  let skipped = 0;

  for (let i = 0; i < records.length; i++) {
    const email = records[i].email?.trim();
    const label = `[${i + 1}/${records.length}]`;

    if (!email) {
      console.warn(`${label} Skipping — no email (user_profile_id: ${records[i].user_profile_id})`);
      failed++;
      continue;
    }

    // Skip already completed or skipped users
    const prev = progress.records[email];
    if (prev?.status === "completed") {
      console.log(`${label} ⏭  ${email} — already completed, skipping`);
      success++;
      continue;
    }
    if (prev?.status === "skipped") {
      console.log(`${label} ⏭  ${email} — previously skipped, skipping`);
      skipped++;
      continue;
    }

    console.log(`\n${label} Starting migration for: ${email}`);

    let errorReason = null;

    try {
      await startMigration(email);
      const result = await waitForCompletion(email, i + 1, records.length);

      if (result === "completed") {
        console.log(`${label} ✅ ${email} — completed`);
        setRecord(progress, email, "completed");
        success++;
        continue;
      } else if (result === "timeout") {
        errorReason = `timed out after ${TIMEOUT_MS / 60_000} minutes`;
      } else {
        errorReason = "migration failed";
      }
    } catch (err) {
      errorReason = `error: ${err.message}`;
    }

    // --- Error: pause and ask ---
    setRecord(progress, email, "failed", errorReason);
    const choice = await promptOnError(label, email, errorReason);

    if (choice === "s") {
      setRecord(progress, email, "skipped", errorReason);
      console.log(`${label} ⏭  ${email} — skipped\n`);
      skipped++;
    } else {
      // quit
      console.log(`\nQuitting. Progress saved to migration-progress.json`);
      console.log(`Fix the issue, then re-run the script to resume from where you left off.\n`);
      console.log(`Summary so far: ✅ ${success} completed, ⏭  ${skipped} skipped, ❌ ${failed + 1} failed`);
      process.exit(0);
    }
  }

  console.log(
    `\nDone! ✅ ${success} completed, ⏭  ${skipped} skipped, ❌ ${failed} failed out of ${records.length} records.`
  );
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
