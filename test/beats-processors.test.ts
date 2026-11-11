/**
 * @file Tests that the Beats processor patterns match the same lines as the patterns they replaced.
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { createContext, runInContext } from 'node:vm';
import { ModuleKind, ScriptTarget, transpileModule } from 'typescript';

/**
 * Evaluates a processor script and returns its `logPattern`.
 * @param processorId - The processor file name without extension.
 * @returns The regular expression the processor matches log lines with.
 * @example
 * const pattern = loadLogPattern('parse_ipfs');
 */
function loadLogPattern(processorId: string): RegExp {
  const source = readFileSync(
    path.join(
      process.cwd(),
      'projects/core/src/elastic/beats/processors',
      `${processorId}.ts`,
    ),
    'utf8',
  );
  const { outputText } = transpileModule(source, {
    compilerOptions: {
      target: ScriptTarget.ES2020,
      module: ModuleKind.CommonJS,
    },
  });
  const context = createContext({ module: { exports: {} }, exports: {} });
  // eslint-disable-next-line sonarjs/code-eval -- the test evaluates a repository processor script to read its pattern, as the processors index does
  runInContext(outputText.replaceAll(/\bconst\b/g, 'var'), context);
  return context.logPattern as RegExp;
}

/**
 * Builds a deterministic list of short inputs, whitespace and line terminators included.
 * @returns The candidate input tails.
 * @example
 * const tails = buildTails();
 */
function buildTails(): string[] {
  const pieces = [' ', 'x', '\n', '\r', ' ', 'a b'];
  let tails = [''];
  for (let round = 0; round < 4; round++) {
    tails = [
      ...tails,
      ...tails.flatMap((tail) => pieces.map((piece) => tail + piece)),
    ];
  }
  return [...new Set(tails)];
}

/* eslint-disable sonarjs/super-linear-regex -- these are the exact patterns the processors used before the rewrite, kept to prove equivalence */
const rows: [string, RegExp, string[]][] = [
  [
    'parse_ipfs',
    /^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z)\s+(DEBUG|INFO|WARN|ERROR|DPANIC|FATAL)\s+(.*)$/,
    [
      '2025-01-20T15:01:53.123Z INFO',
      '2025-01-20T15:01:53.123Z  FATAL',
      '2025-01-20T15:01:53.123ZINFO',
    ],
  ],
  [
    'parse_traefik',
    /^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z)\s+(TRC|DBG|INF|WRN|ERR|FTL|PNC)\s+(.*)$/,
    [
      '2025-01-20T15:01:53Z INF',
      '2025-01-20T15:01:53Z  PNC',
      '2025-01-20T15:01:53ZINF',
    ],
  ],
  [
    'parse_tailscale',
    /^(\d{4}\/\d{2}\/\d{2} \d{2}:\d{2}:\d{2})\s+(.*)$/,
    ['2025/01/20 02:48:34', '2025/01/20 02:48:3'],
  ],
];
/* eslint-enable sonarjs/super-linear-regex -- end of the legacy pattern table */

describe.each(rows)('%s logPattern', (processorId, previous, prefixes) => {
  const current = loadLogPattern(processorId);

  it('captures the same groups as the previous pattern', () => {
    const inputs = prefixes.flatMap((prefix) =>
      buildTails().map((tail) => prefix + tail),
    );
    const mismatches = inputs.filter(
      (input) =>
        JSON.stringify(previous.exec(input)) !==
        JSON.stringify(current.exec(input)),
    );
    expect(mismatches).toEqual([]);
  });

  it('matches a normal log line', () => {
    expect(current.test(`${prefixes[0]} hello world`)).toBe(true);
  });

  it('rejects a long whitespace run quickly', () => {
    const started = Date.now();
    expect(current.test(`${prefixes[0]}${' '.repeat(50_000)}x\ny`)).toBe(false);
    expect(Date.now() - started).toBeLessThan(1000);
  });
});
