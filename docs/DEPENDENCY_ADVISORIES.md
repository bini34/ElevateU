# Day 3 advisory inventory

Reviewed 2026-09-19. This appendix preserves every advisory source/range record returned by the captured Day 3 baseline audits and maps it to the selected final lockfile resolution. It complements [DEPENDENCIES.md](DEPENDENCIES.md), which records upgrade decisions and final verification. Advisory ranges and severities below are the registry snapshot, not an independent exploitability certification.

## Counting and classification

Client npm reported **19 vulnerable package entries** (14 high, 4 moderate, 1 low), including **6 inherited-only entries**. Its underlying `via` objects contain **37 source/range records covering 29 distinct GHSA identifiers**. `--omit=dev` retained 11 package entries (7 high, 3 moderate, 1 low). Laravel scaffold npm separately reported **9 package entries** (1 critical, 6 high, 2 moderate), with **57 source/range records covering 57 GHSA identifiers**; its production-only audit reported zero. The same GHSA can occur in both npm trees or in multiple version branches. These records must not be summed as distinct vulnerabilities.

Composer reported **4 records across 2 runtime packages**: 1 high, 1 medium, 1 low and 1 unrated. Two Laravel records describe the same CRLF vulnerability from different feeds. The beginning-of-Day-3 counts are separate from the older Day 1/Day 2 history.

Priority **A** means demonstrated realistic, unmitigated production exposure; **B** means a runtime dependency with conditional or currently mitigated exposure; **C** means development/build-only use; **D** means transitive/tooling movement requiring a parent update or scoped override. These are remediation priorities, not replacements for advisory severity. The existing image/email/signed-URL controls reduce the relevant runtime findings to B at this baseline; no additional unmitigated A path was established by this dependency review.

"Production-installed" below means the package finding remained in the baseline `npm audit --omit=dev`, not that all its code ships in the Next standalone image or is HTTP-reachable. Direct/transitive describes the affected node, not merely another same-name dependency at the root. "Selected patched version" is the exact reviewed resolution that clears the records, not a claim that it is the earliest fixed release. Exposure and compatibility notes apply to every record in the corresponding package subsection.

All six final audit snapshots (client full/production, scaffold full/production, Composer full/production) report **zero findings**. The final Composer snapshots also have empty abandoned/filter arrays. No advisory ignore or warning suppression was added. This does not inventory base-image operating-system CVEs, prove all application security issues are resolved, or remove the deployment blockers in [SECURITY.md](SECURITY.md).

## Client npm package inventory

Baseline installed versions come from the pre-Day-3 client lockfile; selected versions come from the final `client/package-lock.json`.

| Package | Baseline affected installed version(s) | Selected version(s) | Relationship / baseline installation | Priority |
| --- | --- | --- | --- | --- |
| `@babel/runtime` | 7.25.6 | 7.29.7 | Transitive; Production-installed (may also serve dev tooling) | B |
| `@typescript-eslint/eslint-plugin` | 7.2.0 | 7.2.0 | Transitive; Development-only | C |
| `@typescript-eslint/parser` | 7.2.0 | 7.2.0 | Transitive; Development-only | C |
| `@typescript-eslint/type-utils` | 7.2.0 | 7.2.0 | Transitive; Development-only | C |
| `@typescript-eslint/typescript-estree` | 7.2.0 | 7.2.0 | Transitive; Development-only | C |
| `@typescript-eslint/utils` | 7.2.0 | 7.2.0 | Transitive; Development-only | C |
| `ajv` | 6.12.6 | 6.15.0 | Transitive; Development-only | C |
| `brace-expansion` | 2.0.1, 1.1.11 | 2.1.7, 1.1.21 | Transitive; Production-installed (may also serve dev tooling) | D |
| `cross-spawn` | 7.0.3 | 7.0.6 | Transitive; Production-installed (may also serve dev tooling) | D |
| `flatted` | 3.3.1 | 3.4.4 | Transitive; Development-only | C |
| `glob` | 10.3.10 | 10.5.0 (affected branch); 7.2.3 unaffected | Transitive; Production-installed (may also serve dev tooling) | D |
| `js-yaml` | 4.1.0 | 4.3.2 | Transitive; Development-only | C |
| `minimatch` | 9.0.3, 9.0.5, 3.1.2 | 9.0.9, 3.1.5 | Transitive; Production-installed (may also serve dev tooling) | D |
| `next` | 15.5.25 | 15.5.25 | Direct; Production-installed (may also serve dev tooling) | D |
| `picomatch` | 2.3.1 | 2.3.2 | Transitive; Production-installed (may also serve dev tooling) | D |
| `postcss` | 8.4.31 | 8.5.28 | Transitive; Production-installed (may also serve dev tooling) | D |
| `postcss-selector-parser` | 6.1.2 | 6.1.4 | Transitive; Production-installed (may also serve dev tooling) | D |
| `sharp` | 0.33.5 | 0.35.4 | Direct; Production-installed (may also serve dev tooling) | B |
| `yaml` | 2.5.1 | 2.9.1 | Transitive; Production-installed (may also serve dev tooling) | D |

### @babel/runtime

**Exposure / priority B:** Runtime helper through Flowbite/tailwind-merge. The advisory requires the affected generated named-capture replacement helper and a problematic input; no matching public input path was identified.

**Resolution / breaking-change risk:** Compatible Babel runtime patch; low compatibility risk.

| npm source / advisory | Severity | Affected range reported | Finding |
| --- | --- | --- | --- |
| 1104000 / [GHSA-968p-4wvh-cqc8](https://github.com/advisories/GHSA-968p-4wvh-cqc8) | moderate | `<7.26.10` | Babel has inefficient RegExp complexity in generated code with .replace when transpiling named capturing groups |

### @typescript-eslint/eslint-plugin

**Exposure / priority C:** Inherited development-tool finding through typescript-estree -> minimatch. No independent advisory against this package is reported.

**Resolution / breaking-change risk:** Keep parser family 7.2.0 and replace its pinned minimatch with scoped 9.0.9 override; low-to-medium risk checked by lint/typecheck.

Inherited finding through `@typescript-eslint/type-utils`, `@typescript-eslint/utils`. npm marks the affected dependency-graph range as `6.16.0 - 7.5.0` with package-entry severity **high**. This is metadata about that dependency graph, not a new GHSA against this package.


### @typescript-eslint/parser

**Exposure / priority C:** Inherited development-tool finding through typescript-estree -> minimatch. No independent advisory against this package is reported.

**Resolution / breaking-change risk:** Keep parser family 7.2.0 and replace its pinned minimatch with scoped 9.0.9 override; low-to-medium risk checked by lint/typecheck.

Inherited finding through `@typescript-eslint/typescript-estree`. npm marks the affected dependency-graph range as `6.16.0 - 7.5.0` with package-entry severity **high**. This is metadata about that dependency graph, not a new GHSA against this package.


### @typescript-eslint/type-utils

**Exposure / priority C:** Inherited development-tool finding through typescript-estree -> minimatch. No independent advisory against this package is reported.

**Resolution / breaking-change risk:** Keep parser family 7.2.0 and replace its pinned minimatch with scoped 9.0.9 override; low-to-medium risk checked by lint/typecheck.

Inherited finding through `@typescript-eslint/typescript-estree`, `@typescript-eslint/utils`. npm marks the affected dependency-graph range as `6.16.0 - 7.5.0` with package-entry severity **high**. This is metadata about that dependency graph, not a new GHSA against this package.


### @typescript-eslint/typescript-estree

**Exposure / priority C:** Inherited development-tool finding through typescript-estree -> minimatch. No independent advisory against this package is reported.

**Resolution / breaking-change risk:** Keep parser family 7.2.0 and replace its pinned minimatch with scoped 9.0.9 override; low-to-medium risk checked by lint/typecheck.

Inherited finding through `minimatch`. npm marks the affected dependency-graph range as `6.16.0 - 7.5.0` with package-entry severity **high**. This is metadata about that dependency graph, not a new GHSA against this package.


### @typescript-eslint/utils

**Exposure / priority C:** Inherited development-tool finding through typescript-estree -> minimatch. No independent advisory against this package is reported.

**Resolution / breaking-change risk:** Keep parser family 7.2.0 and replace its pinned minimatch with scoped 9.0.9 override; low-to-medium risk checked by lint/typecheck.

Inherited finding through `@typescript-eslint/typescript-estree`. npm marks the affected dependency-graph range as `6.16.0 - 7.5.0` with package-entry severity **high**. This is metadata about that dependency graph, not a new GHSA against this package.


### ajv

**Exposure / priority C:** ESLint schema validator; the affected $data option would need attacker-controlled schemas/data. No application API uses this copy.

**Resolution / breaking-change risk:** Compatible 6.x update; low risk, checked by lint.

| npm source / advisory | Severity | Affected range reported | Finding |
| --- | --- | --- | --- |
| 1113714 / [GHSA-2g4f-4pwh-qvx6](https://github.com/advisories/GHSA-2g4f-4pwh-qvx6) | moderate | `<6.14.0` | ajv has ReDoS when using `$data` option |

### brace-expansion

**Exposure / priority D:** Glob/minimatch tooling receives filename/pattern inputs. Production installation retains build tooling through Flowbite/Tailwind peers; no HTTP pattern-expansion endpoint was found.

**Resolution / breaking-change risk:** Targeted fixes on both 1.x and 2.x branches; low risk, build/lint exercised.

| npm source / advisory | Severity | Affected range reported | Finding |
| --- | --- | --- | --- |
| 1105443 / [GHSA-v6h2-p8h4-qcjw](https://github.com/advisories/GHSA-v6h2-p8h4-qcjw) | low | `>=1.0.0 <=1.1.11` | brace-expansion Regular Expression Denial of Service vulnerability |
| 1105444 / [GHSA-v6h2-p8h4-qcjw](https://github.com/advisories/GHSA-v6h2-p8h4-qcjw) | low | `>=2.0.0 <=2.0.1` | brace-expansion Regular Expression Denial of Service vulnerability |
| 1115540 / [GHSA-f886-m6hf-6m8v](https://github.com/advisories/GHSA-f886-m6hf-6m8v) | moderate | `<1.1.13` | brace-expansion: Zero-step sequence causes process hang and memory exhaustion |
| 1115541 / [GHSA-f886-m6hf-6m8v](https://github.com/advisories/GHSA-f886-m6hf-6m8v) | moderate | `>=2.0.0 <2.0.3` | brace-expansion: Zero-step sequence causes process hang and memory exhaustion |
| 1123896 / [GHSA-3jxr-9vmj-r5cp](https://github.com/advisories/GHSA-3jxr-9vmj-r5cp) | high | `>=2.0.0 <2.1.2` | brace-expansion: DoS via exponential-time expansion of consecutive non-expanding {} groups |
| 1123897 / [GHSA-3jxr-9vmj-r5cp](https://github.com/advisories/GHSA-3jxr-9vmj-r5cp) | high | `<1.1.16` | brace-expansion: DoS via exponential-time expansion of consecutive non-expanding {} groups |
| 1130588 / [GHSA-mh99-v99m-4gvg](https://github.com/advisories/GHSA-mh99-v99m-4gvg) | high | `<1.1.17` | brace-expansion: DoS via unbounded expansion length causing an out-of-memory process crash |
| 1130589 / [GHSA-mh99-v99m-4gvg](https://github.com/advisories/GHSA-mh99-v99m-4gvg) | high | `>=2.0.0 <2.1.3` | brace-expansion: DoS via unbounded expansion length causing an out-of-memory process crash |
| 1130736 / [GHSA-rgw5-rvv9-x895](https://github.com/advisories/GHSA-rgw5-rvv9-x895) | high | `>=2.0.0 <2.1.4` | brace-expansion: DoS via unbounded intermediate arrays, bypassing the CVE-2026-14257 mitigation |
| 1130737 / [GHSA-rgw5-rvv9-x895](https://github.com/advisories/GHSA-rgw5-rvv9-x895) | high | `<1.1.18` | brace-expansion: DoS via unbounded intermediate arrays, bypassing the CVE-2026-14257 mitigation |

### cross-spawn

**Exposure / priority D:** Process launcher used by tooling, including foreground-child and ESLint. Untrusted command arguments could trigger the vulnerable parser; no application request launches it.

**Resolution / breaking-change risk:** Compatible 7.x patch; low risk.

| npm source / advisory | Severity | Affected range reported | Finding |
| --- | --- | --- | --- |
| 1104664 / [GHSA-3xgq-45jj-v275](https://github.com/advisories/GHSA-3xgq-45jj-v275) | high | `>=7.0.0 <7.0.5` | Regular Expression Denial of Service (ReDoS) in cross-spawn |

### flatted

**Exposure / priority C:** ESLint flat-cache serialization. Malicious cache contents can trigger parse recursion or prototype mutation; not the application JSON parser.

**Resolution / breaking-change risk:** Compatible 3.x patch; low risk, lint exercised.

| npm source / advisory | Severity | Affected range reported | Finding |
| --- | --- | --- | --- |
| 1114526 / [GHSA-25h7-pfq9-p65f](https://github.com/advisories/GHSA-25h7-pfq9-p65f) | high | `<3.4.0` | flatted vulnerable to unbounded recursion DoS in parse() revive phase |
| 1115357 / [GHSA-rf6f-7fwh-wjgh](https://github.com/advisories/GHSA-rf6f-7fwh-wjgh) | high | `<=3.4.1` | Prototype Pollution via parse() in NodeJS flatted |

### glob

**Exposure / priority D:** The finding concerns the glob CLI command option executing matched filenames in a shell. No ElevateU HTTP handler uses that CLI option.

**Resolution / breaking-change risk:** Patch the affected 10.x branch to 10.5.0; the separately retained 7.2.3 is outside this advisory range. Low risk.

| npm source / advisory | Severity | Affected range reported | Finding |
| --- | --- | --- | --- |
| 1109842 / [GHSA-5j98-mcp5-4vw2](https://github.com/advisories/GHSA-5j98-mcp5-4vw2) | high | `>=10.2.0 <10.5.0` | glob CLI: Command injection via -c/--cmd executes matches with shell:true |

### js-yaml

**Exposure / priority C:** ESLint configuration parsing. Exposure requires hostile YAML supplied to development tooling, not posts or chat messages.

**Resolution / breaking-change risk:** Compatible 4.x update; low risk, lint exercised.

| npm source / advisory | Severity | Affected range reported | Finding |
| --- | --- | --- | --- |
| 1112715 / [GHSA-mh29-5h37-fv8m](https://github.com/advisories/GHSA-mh29-5h37-fv8m) | moderate | `>=4.0.0 <4.1.1` | js-yaml has prototype pollution in merge (<<) |
| 1121860 / [GHSA-h67p-54hq-rp68](https://github.com/advisories/GHSA-h67p-54hq-rp68) | moderate | `>=4.0.0 <=4.1.1` | JS-YAML: Quadratic-complexity DoS in merge key handling via repeated aliases |
| 1123911 / [GHSA-52cp-r559-cp3m](https://github.com/advisories/GHSA-52cp-r559-cp3m) | high | `>=4.0.0 <4.3.0` | js-yaml: YAML merge-key chains can force quadratic CPU consumption |
| 1138115 / [GHSA-5p4m-2wfm-xmqj](https://github.com/advisories/GHSA-5p4m-2wfm-xmqj) | high | `>=4.0.0 <4.3.1` | JS-YAML: Quadratic CPU consumption in !!omap resolution (3.x and 4.x) — CVE-2026-59870 fix not backported |
| 1193727 / [GHSA-2883-xcg3-v3hh](https://github.com/advisories/GHSA-2883-xcg3-v3hh) | high | `>=4.0.0 <4.3.2` | js-yaml: maxTotalMergeKeys does not limit CPU use for empty merge sources |

### minimatch

**Exposure / priority D:** Glob matching in build/lint tools; no user-supplied glob-pattern API. Both production-installed tooling and development-only ESLint paths existed.

**Resolution / breaking-change risk:** Patch 3.x and 9.x. typescript-estree pins 9.0.3, so a scoped 9.0.9 override is retained; low-to-medium risk, lint/typecheck/build exercised.

| npm source / advisory | Severity | Affected range reported | Finding |
| --- | --- | --- | --- |
| 1113459 / [GHSA-3ppc-4f35-3m26](https://github.com/advisories/GHSA-3ppc-4f35-3m26) | high | `<3.1.3` | minimatch has a ReDoS via repeated wildcards with non-matching literal in pattern |
| 1113465 / [GHSA-3ppc-4f35-3m26](https://github.com/advisories/GHSA-3ppc-4f35-3m26) | high | `>=9.0.0 <9.0.6` | minimatch has a ReDoS via repeated wildcards with non-matching literal in pattern |
| 1113538 / [GHSA-7r86-cg39-jmmj](https://github.com/advisories/GHSA-7r86-cg39-jmmj) | high | `<3.1.3` | minimatch has ReDoS: matchOne() combinatorial backtracking via multiple non-adjacent GLOBSTAR segments |
| 1113544 / [GHSA-7r86-cg39-jmmj](https://github.com/advisories/GHSA-7r86-cg39-jmmj) | high | `>=9.0.0 <9.0.7` | minimatch has ReDoS: matchOne() combinatorial backtracking via multiple non-adjacent GLOBSTAR segments |
| 1113546 / [GHSA-23c5-xmqv-rm74](https://github.com/advisories/GHSA-23c5-xmqv-rm74) | high | `<3.1.4` | minimatch ReDoS: nested *() extglobs generate catastrophically backtracking regular expressions |
| 1113552 / [GHSA-23c5-xmqv-rm74](https://github.com/advisories/GHSA-23c5-xmqv-rm74) | high | `>=9.0.0 <9.0.7` | minimatch ReDoS: nested *() extglobs generate catastrophically backtracking regular expressions |

### next

**Exposure / priority D:** Inherited finding from its nested PostCSS, not a separate Next.js HTTP advisory in this snapshot. CSS processing is a build-input boundary.

**Resolution / breaking-change risk:** Keep 15.5.25; override only its PostCSS to tested 8.5.28. Medium compatibility risk because Next pins its compiler dependency; clean build and runtime checks required.

Inherited finding through `postcss`. npm marks the affected dependency-graph range as `9.3.4-canary.0 - 16.3.0-preview.10` with package-entry severity **moderate**. This is metadata about that dependency graph, not a new GHSA against this package.


### picomatch

**Exposure / priority D:** File watchers/glob tools, with no application route accepting patterns. Production installation alone does not establish HTTP reachability.

**Resolution / breaking-change risk:** Compatible 2.3.2 fix; low risk.

| npm source / advisory | Severity | Affected range reported | Finding |
| --- | --- | --- | --- |
| 1115549 / [GHSA-3v7f-55p6-f55p](https://github.com/advisories/GHSA-3v7f-55p6-f55p) | moderate | `<2.3.2` | Picomatch: Method Injection in POSIX Character Classes causes incorrect Glob Matching |
| 1115552 / [GHSA-c2c7-rcm5-vvqj](https://github.com/advisories/GHSA-c2c7-rcm5-vvqj) | high | `<2.3.2` | Picomatch has a ReDoS vulnerability via extglob quantifiers |

### postcss

**Exposure / priority D:** Next build CSS/source-map processing. Hostile CSS can cause output injection or local map-file reads; no API accepting arbitrary CSS was identified. The vulnerable node was Next's nested 8.4.31; root 8.5.28 was already patched.

**Resolution / breaking-change risk:** Scoped next -> postcss override to 8.5.28 rather than a Next major migration. Medium build compatibility risk; clean build verification required.

| npm source / advisory | Severity | Affected range reported | Finding |
| --- | --- | --- | --- |
| 1117015 / [GHSA-qx2v-qp2m-jg93](https://github.com/advisories/GHSA-qx2v-qp2m-jg93) | moderate | `<8.5.10` | PostCSS has XSS via Unescaped </style> in its CSS Stringify Output |
| 1124252 / [GHSA-6g55-p6wh-862q](https://github.com/advisories/GHSA-6g55-p6wh-862q) | high | `<=8.5.11` | PostCSS: Arbitrary file read and information disclosure via attacker-controlled sourceMappingURL in CSS comments |
| 1130709 / [GHSA-fxqj-rqcc-2cmp](https://github.com/advisories/GHSA-fxqj-rqcc-2cmp) | moderate | `<=8.5.22` | PostCSS: incomplete fix of GHSA-6g55-p6wh-862q — attacker-controlled sourceMappingURL reads arbitrary .map files when `from` is unset |
| 1139510 / [GHSA-r28c-9q8g-f849](https://github.com/advisories/GHSA-r28c-9q8g-f849) | high | `<=8.5.17` | PostCSS: Path Traversal in Previous Source Map Auto-Loading (sourceMappingURL) leads to Arbitrary .map File Disclosure |

### postcss-selector-parser

**Exposure / priority D:** Tailwind/PostCSS build-time selector parsing; deeply nested hostile selectors could exhaust processing. No user CSS input route exists.

**Resolution / breaking-change risk:** Compatible 6.x patch; low risk, CSS build exercised.

| npm source / advisory | Severity | Affected range reported | Finding |
| --- | --- | --- | --- |
| 1153170 / [GHSA-w9m9-85wc-3x92](https://github.com/advisories/GHSA-w9m9-85wc-3x92) | low | `>=6.1.0 <6.1.3` | postcss-selector-parser allows denial of service through uncontrolled AST recursion |

### sharp

**Exposure / priority B:** Native image decoding is a realistic public-media boundary, but the baseline disabled that route with unoptimized=true. Its lock also included Next's nested patched sharp 0.35.4, which Next would resolve before the vulnerable direct/root 0.33.5 copy in a matching install. No direct application sharp import was found. Day 3 patches the root and deduplicates both. Private message files must never enter the public optimizer.

**Resolution / breaking-change risk:** Intentional 0.33 -> 0.35 native-library change to 0.35.4, then restore optimization with public-path restrictions. Medium risk: Node/native-binary and image-output compatibility; verify images and container.

| npm source / advisory | Severity | Affected range reported | Finding |
| --- | --- | --- | --- |
| 1124066 / [GHSA-f88m-g3jw-g9cj](https://github.com/advisories/GHSA-f88m-g3jw-g9cj) | high | `<0.35.0` | sharp inherited vulnerabilities in libvips: CVE-2026-33327, CVE-2026-33328, CVE-2026-35590, CVE-2026-35591 |
| 1193725 / [GHSA-rgj7-g3m4-5g8c](https://github.com/advisories/GHSA-rgj7-g3m4-5g8c) | high | `<0.35.4` | sharp: Vulnerabilities in libheif: GHSA-g89c-p67h-r497 and GHSA-2jg2-4ch7-h545 |

### yaml

**Exposure / priority D:** PostCSS configuration parsing through build tooling; hostile nested YAML could overflow the stack. No user YAML endpoint was identified.

**Resolution / breaking-change risk:** Compatible 2.x update; low risk, build exercised.

| npm source / advisory | Severity | Affected range reported | Finding |
| --- | --- | --- | --- |
| 1115556 / [GHSA-48c2-rrv3-qjmp](https://github.com/advisories/GHSA-48c2-rrv3-qjmp) | moderate | `>=2.0.0 <2.8.3` | yaml is vulnerable to Stack Overflow via deeply nested YAML collections |

## Laravel scaffold npm package inventory

This is the independent `server/package.json` / `server/package-lock.json` tree. Its entire baseline audit disappears with `--omit=dev`; the PHP runtime uses Composer. Development-only installation still matters for build machines and any generated browser assets. The scaffold has a browser Axios import, but source review found no active Blade `@vite` inclusion; deploying that bundle would require reviewing its browser exposure as well.

| Package | Baseline affected installed version(s) | Selected version(s) | Relationship / baseline installation | Priority |
| --- | --- | --- | --- | --- |
| `axios` | 1.7.7 | 1.20.0 | Direct; Development-only | C |
| `esbuild` | 0.21.5 | 0.25.12 | Transitive; Development-only | C |
| `follow-redirects` | 1.15.9 | 1.16.0 | Transitive; Development-only | C |
| `form-data` | 4.0.1 | 4.0.6 | Transitive; Development-only | C |
| `nanoid` | 3.3.7 | 3.3.19 | Transitive; Development-only | C |
| `picomatch` | 2.3.1 | 2.3.2, 4.0.7 | Transitive; Development-only | C |
| `postcss` | 8.4.47 | 8.5.28 | Transitive; Development-only | C |
| `rollup` | 4.24.0 | 4.63.3 | Transitive; Development-only | C |
| `vite` | 5.4.9 | 6.4.3 | Direct; Development-only | C |

### axios

**Exposure / priority C:** Declared development dependency in the separate Laravel Vite scaffold, imported by its browser bootstrap. No active Blade @vite inclusion or PHP request use was found. Node HTTP/proxy advisories require that adapter; browser helpers would matter if the scaffold bundle is deployed.

**Resolution / breaking-change risk:** Compatible 1.x update to the same 1.20.0 as the Next client; low-to-medium transport compatibility risk.

| npm source / advisory | Severity | Affected range reported | Finding |
| --- | --- | --- | --- |
| 1111035 / [GHSA-jr5f-v2jv-69x6](https://github.com/advisories/GHSA-jr5f-v2jv-69x6) | high | `>=1.0.0 <1.8.2` | axios Requests Vulnerable To Possible SSRF and Credential Leakage via Absolute URL |
| 1112195 / [GHSA-4hjh-wcwx-xvwj](https://github.com/advisories/GHSA-4hjh-wcwx-xvwj) | high | `>=1.0.0 <1.12.0` | Axios is vulnerable to DoS attack through lack of data size check |
| 1116673 / [GHSA-3p68-rc4w-qgx5](https://github.com/advisories/GHSA-3p68-rc4w-qgx5) | moderate | `>=1.0.0 <1.15.0` | Axios has a NO_PROXY Hostname Normalization Bypass that Leads to SSRF |
| 1117574 / [GHSA-w9j2-pvgh-6h63](https://github.com/advisories/GHSA-w9j2-pvgh-6h63) | moderate | `>=1.0.0 <1.15.1` | Axios: Authentication Bypass via Prototype Pollution Gadget in `validateStatus` Merge Strategy |
| 1117576 / [GHSA-pmwg-cvhr-8vh7](https://github.com/advisories/GHSA-pmwg-cvhr-8vh7) | high | `>=1.0.0 <1.15.1` | Axios: Incomplete Fix for CVE-2025-62718 — NO_PROXY Protection Bypassed via RFC 1122 Loopback Subnet (127.0.0.0/8) in Axios 1.15.0 |
| 1117577 / [GHSA-3w6x-2g7m-8v23](https://github.com/advisories/GHSA-3w6x-2g7m-8v23) | moderate | `>=1.0.0 <1.15.2` | Axios: Invisible JSON Response Tampering via Prototype Pollution Gadget in `parseReviver` |
| 1117580 / [GHSA-xhjh-pmcv-23jw](https://github.com/advisories/GHSA-xhjh-pmcv-23jw) | low | `>=1.0.0 <1.15.1` | Axios: Null Byte Injection via Reverse-Encoding in AxiosURLSearchParams |
| 1117581 / [GHSA-445q-vr5w-6q77](https://github.com/advisories/GHSA-445q-vr5w-6q77) | moderate | `>=1.0.0 <1.15.1` | Axios: CRLF Injection in multipart/form-data body via unsanitized blob.type in formDataToStream |
| 1117583 / [GHSA-m7pr-hjqh-92cm](https://github.com/advisories/GHSA-m7pr-hjqh-92cm) | moderate | `>=1.0.0 <1.15.1` | Axios: no_proxy bypass via IP alias allows SSRF |
| 1117587 / [GHSA-5c9x-8gcm-mpgx](https://github.com/advisories/GHSA-5c9x-8gcm-mpgx) | moderate | `>=1.0.0 <1.15.1` | Axios' HTTP adapter-streamed uploads bypass maxBodyLength when maxRedirects: 0 |
| 1117589 / [GHSA-vf2m-468p-8v99](https://github.com/advisories/GHSA-vf2m-468p-8v99) | moderate | `>=1.0.0 <1.15.1` | Axios: HTTP adapter streamed responses bypass maxContentLength |
| 1117591 / [GHSA-pf86-5x62-jrwf](https://github.com/advisories/GHSA-pf86-5x62-jrwf) | high | `>=1.0.0 <1.15.1` | Axios: Prototype Pollution Gadgets - Response Tampering, Data Exfiltration, and Request Hijacking |
| 1117593 / [GHSA-6chq-wfr3-2hj9](https://github.com/advisories/GHSA-6chq-wfr3-2hj9) | high | `>=1.0.0 <1.15.1` | Axios: Header Injection via Prototype Pollution |
| 1117595 / [GHSA-xx6v-rp6x-q39c](https://github.com/advisories/GHSA-xx6v-rp6x-q39c) | moderate | `>=1.0.0 <1.15.1` | Axios: XSRF Token Cross-Origin Leakage via Prototype Pollution Gadget in `withXSRFToken` Boolean Coercion |
| 1117858 / [GHSA-43fc-jf86-j433](https://github.com/advisories/GHSA-43fc-jf86-j433) | high | `>=1.0.0 <=1.13.4` | Axios is Vulnerable to Denial of Service via __proto__ Key in mergeConfig |
| 1118607 / [GHSA-q8qp-cvcw-x6jj](https://github.com/advisories/GHSA-q8qp-cvcw-x6jj) | high | `>=1.0.0 <1.15.2` | Axios has prototype pollution read-side gadgets in HTTP adapter that allow credential injection and request hijacking |
| 1119404 / [GHSA-fvcv-3m26-pcqx](https://github.com/advisories/GHSA-fvcv-3m26-pcqx) | moderate | `>=1.0.0 <1.15.0` | Axios has Unrestricted Cloud Metadata Exfiltration via Header Injection Chain |
| 1120125 / [GHSA-62hf-57xw-28j9](https://github.com/advisories/GHSA-62hf-57xw-28j9) | moderate | `>=1.0.0 <1.15.1` | Axios: unbounded recursion in toFormData causes DoS via deeply nested request data |
| 1120547 / [GHSA-hfxv-24rg-xrqf](https://github.com/advisories/GHSA-hfxv-24rg-xrqf) | high | `>=1.0.0 <1.16.0` | Axios: Regular Expression Denial of Service (ReDoS) via Cookie Name Injection |
| 1120643 / [GHSA-777c-7fjr-54vf](https://github.com/advisories/GHSA-777c-7fjr-54vf) | high | `>=1.7.0 <1.16.0` | Allocation of Resources Without Limits or Throttling in Axios |
| 1120645 / [GHSA-p92q-9vqr-4j8v](https://github.com/advisories/GHSA-p92q-9vqr-4j8v) | high | `>=1.0.0 <1.16.0` | Axios: Proxy-Authorization Credential Leak to Origin Server Across HTTP-to-HTTPS Redirect in Axios Node.js HTTP Adapter |
| 1120647 / [GHSA-j5f8-grm9-p9fc](https://github.com/advisories/GHSA-j5f8-grm9-p9fc) | high | `>=1.0.0 <1.16.0` | Axios: Proxy-Authorization header leaks to redirect target when proxy is re-evaluated to direct connection |
| 1120649 / [GHSA-3g43-6gmg-66jw](https://github.com/advisories/GHSA-3g43-6gmg-66jw) | high | `>=1.0.0 <1.15.2` | axios Vulnerable to Credential Theft and Response Hijacking via Prototype Pollution Gadget in Config Merge |
| 1120650 / [GHSA-35jp-ww65-95wh](https://github.com/advisories/GHSA-35jp-ww65-95wh) | high | `>=1.0.0 <1.16.0` | axios Vulnerable to Full Man-in-the-Middle via Prototype Pollution Gadget in `config.proxy` |
| 1120652 / [GHSA-898c-q2cr-xwhg](https://github.com/advisories/GHSA-898c-q2cr-xwhg) | moderate | `>=1.0.0 <1.16.0` | axios has DoS & Header Injection via Prototype Pollution Read-Side Gadgets in axios merge functions |
| 1147949 / [GHSA-mmx7-hfxf-jppx](https://github.com/advisories/GHSA-mmx7-hfxf-jppx) | moderate | `>=1.0.0 <1.18.0` | Axios: Prototype pollution gadgets can alter axios request construction |
| 1147950 / [GHSA-pmv8-rq9r-6j72](https://github.com/advisories/GHSA-pmv8-rq9r-6j72) | moderate | `>=1.0.0 <1.18.0` | Axios: Deep formToJSON Key Recursion Can Cause Denial of Service |
| 1153180 / [GHSA-7q8q-rj6j-mhjq](https://github.com/advisories/GHSA-7q8q-rj6j-mhjq) | moderate | `>=1.0.0 <1.18.0` | Axios: Nested axios option objects can consume polluted prototype values |
| 1153182 / [GHSA-jqh4-m9w3-8hp9](https://github.com/advisories/GHSA-jqh4-m9w3-8hp9) | moderate | `>=1.7.0 <1.18.0` | Axios: Fetch adapter `ReadableStream` uploads bypass `maxBodyLength` |
| 1153185 / [GHSA-42h9-826w-cgv3](https://github.com/advisories/GHSA-42h9-826w-cgv3) | moderate | `>=1.0.0 <1.18.0` | Axios: Excessive recursion in formDataToJSON can cause denial of service |

### esbuild

**Exposure / priority C:** Development server origin/read restrictions are the affected boundary. The standalone Laravel PHP API does not run the esbuild server.

**Resolution / breaking-change risk:** Vite 6 selects patched esbuild 0.25.12. Transitive 0.x minor change; medium toolchain risk checked by clean build.

| npm source / advisory | Severity | Affected range reported | Finding |
| --- | --- | --- | --- |
| 1102341 / [GHSA-67mh-4wv8-2f99](https://github.com/advisories/GHSA-67mh-4wv8-2f99) | moderate | `<=0.24.2` | esbuild enables any website to send any requests to the development server and read the response |

### follow-redirects

**Exposure / priority C:** Axios Node adapter redirect handling. No PHP request or active Node backend invokes this scaffold copy.

**Resolution / breaking-change risk:** Compatible 1.x patch selected with Axios; low risk.

| npm source / advisory | Severity | Affected range reported | Finding |
| --- | --- | --- | --- |
| 1116560 / [GHSA-r4q5-vmmm-2653](https://github.com/advisories/GHSA-r4q5-vmmm-2653) | moderate | `<=1.15.11` | follow-redirects leaks Custom Authentication Headers to Cross-Domain Redirect Targets |

### form-data

**Exposure / priority C:** Axios Node multipart encoder. Predictable boundaries or injected field metadata matter when constructing attacker-influenced outgoing multipart requests; no such scaffold server path was found.

**Resolution / breaking-change risk:** Compatible 4.x patch selected with Axios; low risk. Critical audit severity is preserved despite limited application exposure.

| npm source / advisory | Severity | Affected range reported | Finding |
| --- | --- | --- | --- |
| 1109538 / [GHSA-fjxv-7rqg-78g4](https://github.com/advisories/GHSA-fjxv-7rqg-78g4) | critical | `>=4.0.0 <4.0.4` | form-data uses unsafe random function in form-data for choosing boundary |
| 1120743 / [GHSA-hmw2-7cc7-3qxx](https://github.com/advisories/GHSA-hmw2-7cc7-3qxx) | high | `>=4.0.0 <4.0.6` | form-data: CRLF injection in form-data via unescaped multipart field names and filenames |

### nanoid

**Exposure / priority C:** PostCSS build dependency; problematic generator size arguments require attacker control. ElevateU domain IDs are generated in PHP, not by this copy.

**Resolution / breaking-change risk:** Compatible 3.x update; low risk.

| npm source / advisory | Severity | Affected range reported | Finding |
| --- | --- | --- | --- |
| 1109563 / [GHSA-mwcw-c2x4-8c55](https://github.com/advisories/GHSA-mwcw-c2x4-8c55) | moderate | `<3.3.8` | Predictable results in nanoid generation when given non-integer values |
| 1138811 / [GHSA-28wg-ghj8-5hjv](https://github.com/advisories/GHSA-28wg-ghj8-5hjv) | high | `<3.3.16` | nanoid: non-secure generators can loop indefinitely with negative size |
| 1139427 / [GHSA-2v37-7h3g-55p8](https://github.com/advisories/GHSA-2v37-7h3g-55p8) | high | `<3.3.18` | nanoid: custom generators can loop indefinitely when size is zero |
| 1153189 / [GHSA-xwg4-73v4-xw9w](https://github.com/advisories/GHSA-xwg4-73v4-xw9w) | high | `<3.3.12` | nanoid: Integer Overflow or Wraparound |

### picomatch

**Exposure / priority C:** Laravel Vite full-reload watcher uses filename patterns; no application HTTP pattern endpoint.

**Resolution / breaking-change risk:** Patch affected 2.x to 2.3.2; Vite also introduces separate patched 4.0.7. Low-to-medium toolchain risk.

| npm source / advisory | Severity | Affected range reported | Finding |
| --- | --- | --- | --- |
| 1115549 / [GHSA-3v7f-55p6-f55p](https://github.com/advisories/GHSA-3v7f-55p6-f55p) | moderate | `<2.3.2` | Picomatch: Method Injection in POSIX Character Classes causes incorrect Glob Matching |
| 1115552 / [GHSA-c2c7-rcm5-vvqj](https://github.com/advisories/GHSA-c2c7-rcm5-vvqj) | high | `<2.3.2` | Picomatch has a ReDoS vulnerability via extglob quantifiers |

### postcss

**Exposure / priority C:** Laravel Vite CSS/source-map build input; not an arbitrary CSS upload processor. Source-map file reads or unsafe generated CSS require hostile build inputs.

**Resolution / breaking-change risk:** Compatible 8.5.28 update; low risk, scaffold build exercised.

| npm source / advisory | Severity | Affected range reported | Finding |
| --- | --- | --- | --- |
| 1117015 / [GHSA-qx2v-qp2m-jg93](https://github.com/advisories/GHSA-qx2v-qp2m-jg93) | moderate | `<8.5.10` | PostCSS has XSS via Unescaped </style> in its CSS Stringify Output |
| 1124252 / [GHSA-6g55-p6wh-862q](https://github.com/advisories/GHSA-6g55-p6wh-862q) | high | `<=8.5.11` | PostCSS: Arbitrary file read and information disclosure via attacker-controlled sourceMappingURL in CSS comments |
| 1130709 / [GHSA-fxqj-rqcc-2cmp](https://github.com/advisories/GHSA-fxqj-rqcc-2cmp) | moderate | `<=8.5.22` | PostCSS: incomplete fix of GHSA-6g55-p6wh-862q — attacker-controlled sourceMappingURL reads arbitrary .map files when `from` is unset |
| 1139510 / [GHSA-r28c-9q8g-f849](https://github.com/advisories/GHSA-r28c-9q8g-f849) | high | `<=8.5.17` | PostCSS: Path Traversal in Previous Source Map Auto-Loading (sourceMappingURL) leads to Arbitrary .map File Disclosure |

### rollup

**Exposure / priority C:** Vite bundling may write outside an intended output path if build inputs/plugins supply malicious paths. No user bundle-building API exists.

**Resolution / breaking-change risk:** Compatible 4.x update to 4.63.3; low risk, clean scaffold build exercised.

| npm source / advisory | Severity | Affected range reported | Finding |
| --- | --- | --- | --- |
| 1113515 / [GHSA-mw96-cpmx-2vgc](https://github.com/advisories/GHSA-mw96-cpmx-2vgc) | high | `>=4.0.0 <4.59.0` | Rollup 4 has Arbitrary File Write via Path Traversal |

### vite

**Exposure / priority C:** Dev-server file serving, source maps and Windows editor paths can expose local files/credentials if the development server is reachable by an attacker. It is not the production PHP request server.

**Resolution / breaking-change risk:** Intentional Vite 5 -> 6.4.3 plus Laravel Vite plugin 1.3.0; medium major/toolchain compatibility risk, checked by clean build. Vite 5 cannot cover the later reported ranges.

Inherited finding through `esbuild`. npm marks the affected dependency-graph range as `<=6.4.2` with package-entry severity **high**. This is metadata about that dependency graph, not a new GHSA against this package.

| npm source / advisory | Severity | Affected range reported | Finding |
| --- | --- | --- | --- |
| 1102437 / [GHSA-vg6x-rcgg-rjx6](https://github.com/advisories/GHSA-vg6x-rcgg-rjx6) | moderate | `>=5.0.0 <=5.4.11` | Websites were able to send any requests to the development server and read the response in vite |
| 1103517 / [GHSA-x574-m823-4x7w](https://github.com/advisories/GHSA-x574-m823-4x7w) | moderate | `>=5.0.0 <5.4.15` | Vite bypasses server.fs.deny when using ?raw?? |
| 1103884 / [GHSA-356w-63v5-8wf4](https://github.com/advisories/GHSA-356w-63v5-8wf4) | moderate | `>=5.0.0 <5.4.18` | Vite has an `server.fs.deny` bypass with an invalid `request-target` |
| 1104173 / [GHSA-859w-5945-r5v3](https://github.com/advisories/GHSA-859w-5945-r5v3) | moderate | `>=5.0.0 <=5.4.18` | Vite's server.fs.deny bypassed with /. for files under project root |
| 1104202 / [GHSA-xcj6-pq6g-qj4x](https://github.com/advisories/GHSA-xcj6-pq6g-qj4x) | moderate | `>=5.0.0 <5.4.17` | Vite allows server.fs.deny to be bypassed with .svg or relative paths |
| 1107323 / [GHSA-g4jq-h2w9-997c](https://github.com/advisories/GHSA-g4jq-h2w9-997c) | low | `<=5.4.19` | Vite middleware may serve files starting with the same name with the public directory |
| 1107327 / [GHSA-jqfw-vq24-v9c3](https://github.com/advisories/GHSA-jqfw-vq24-v9c3) | low | `<=5.4.19` | Vite's `server.fs` settings were not applied to HTML files |
| 1109131 / [GHSA-93m4-6634-74q7](https://github.com/advisories/GHSA-93m4-6634-74q7) | moderate | `>=5.2.6 <=5.4.20` | vite allows server.fs.deny bypass via backslash on Windows |
| 1112511 / [GHSA-4r4m-qw57-chr8](https://github.com/advisories/GHSA-4r4m-qw57-chr8) | moderate | `>=5.0.0 <5.4.16` | Vite has a `server.fs.deny` bypassed for `inline` and `raw` with `?import` query |
| 1116229 / [GHSA-4w7w-66w2-5vf9](https://github.com/advisories/GHSA-4w7w-66w2-5vf9) | moderate | `<=6.4.1` | Vite Vulnerable to Path Traversal in Optimized Deps `.map` Handling |
| 1120784 / [GHSA-v6wh-96g9-6wx3](https://github.com/advisories/GHSA-v6wh-96g9-6wx3) | moderate | `<=6.4.2` | launch-editor: NTLMv2 hash disclosure via UNC path handling on Windows |
| 1123525 / [GHSA-fx2h-pf6j-xcff](https://github.com/advisories/GHSA-fx2h-pf6j-xcff) | high | `<=6.4.2` | vite: `server.fs.deny` bypass on Windows alternate paths |

## Composer records

Both affected packages are runtime dependencies; none of the four records was development-only. Laravel is direct. `firebase/php-jwt` is transitive through Passport and Socialite. The table preserves both feeds for the duplicate Laravel email issue.

| Advisory / source | Package / baseline -> selected | Severity | Affected range reported | Fixed branch / selected path | Priority and application exposure | Breaking-change risk |
| --- | --- | --- | --- | --- | --- | --- |
| [PKSA-y2cr-5h3j-g3ys](https://github.com/advisories/GHSA-2x45-7fc3-mxwq) / GitHub: GHSA-2x45-7fc3-mxwq | `firebase/php-jwt` v6.10.1 -> v7.1.1 | low | `<7.0.0` | Fixed >=7.0.0; selected 7.1.1 through Passport 12.4.3 and Socialite 5.30.0. | B: Firebase handles Passport API-token cookies / Socialite provider tokens. ElevateU uses League/Lcobucci bearer tokens; cookie middleware is not enabled and social routes remain disabled. No direct application Firebase calls. | Intentional JWT 6 -> 7 enforces stronger key handling. Keep Passport 12 and bearer contract; no client-secret/schema conversion. |
| [PKSA-m5cs-t1y6-qpcs](https://github.com/advisories/GHSA-crmm-hgp2-wgrp) / GitHub: GHSA-crmm-hgp2-wgrp | `laravel/framework` v11.56.1 -> v12.69.2 | medium | `<12.61.1\|>=13.0.0,<13.12.0` | Fixed Laravel 12.61.1 / 13.12.0; selected 12.69.2. | B: local temporary signed serving was disabled; no application temporary-URL generation found. Private media uses bearer-authorized downloads. | Laravel 11 -> 12 framework movement; reviewed UUID, Carbon, storage, validation, DI, reset-broker and routing changes. No schema changes needed. |
| [PKSA-3r5d-mb8f-1qw9](https://github.com/advisories/GHSA-5vg9-5847-vvmq) / GitHub: GHSA-5vg9-5847-vvmq | `laravel/framework` v11.56.1 -> v12.69.2 | high | `<12.60.0\|>=13.0.0,<=13.9.0` | Fixed Laravel 12.60.0 / 13.10.0; selected 12.69.2. | B: password-reset mail is a real input boundary; Day 2 rejects ASCII controls in auth emails and patched Symfony mail handling. These controls were retained after the framework fix. | Laravel 11 -> 12 framework movement; reviewed UUID, Carbon, storage, validation, DI, reset-broker and routing changes. No schema changes needed. |
| [PKSA-mdq4-51ck-6kdq](https://github.com/laravel/framework/security/advisories/GHSA-5vg9-5847-vvmq) / FriendsOfPHP/security-advisories: laravel/framework/CVE-2026-48019.yaml | `laravel/framework` v11.56.1 -> v12.69.2 | Unrated | `>=9.0.0,<10.0.0\|>=10.0.0,<11.0.0\|>=11.0.0,<12.0.0\|>=12.0.0,<12.60.0\|>=13.0.0,<13.10.0` | Fixed Laravel 12.60.0 / 13.10.0; selected 12.69.2. | B: password-reset mail is a real input boundary; Day 2 rejects ASCII controls in auth emails and patched Symfony mail handling. These controls were retained after the framework fix. | Laravel 11 -> 12 framework movement; reviewed UUID, Carbon, storage, validation, DI, reset-broker and routing changes. No schema changes needed. |

### Composer compatibility findings

- `composer why` identified Passport 12.3.0 and Socialite 5.16.0 as the JWT 6 constraints. `composer why-not` also identified their Laravel 11-era Illuminate ranges, Tinker/Sail constraints, Collision's Laravel 12 conflict and old Symfony versions.
- [Passport 12.4.3](https://github.com/laravel/passport/releases/tag/v12.4.3) admits JWT 7, so the application can retain Passport 12 and its existing integer client IDs, token model, personal-client provisioning and secrets. Passport 13 would require additional compatibility/data work and was unnecessary for these findings.
- Socialite 5.30.0 admits Laravel 12 and JWT 7. Its newer 5.30.1/5.31.0 require phpseclib 4, while Passport 12 requires phpseclib 2/3; `why-not` confirms that blocker. The selected phpseclib 3.0.57 has no reported advisory in the final audit. Social routes stay disabled; a package update is not a complete OAuth implementation.
- Laravel 12.69.2 is the selected nearest supported framework major for PHP 8.2. The [official support table](https://laravel.com/framework/docs/12.x/releases#support-policy) gives Laravel 12 security support through 2027-02-24. Passport 12 is a compatibility bridge, not a promise of indefinite maintenance.
- The [Laravel 12 upgrade guide](https://laravel.com/framework/docs/12.x/upgrade) was checked against the source: the custom UUID trait uses `Str::uuid()`, Carbon was already 3.x, filesystem roots are explicit, SVG was already excluded, no nullable DI defaults or custom low-level database constructors were found, and the broker is framework-created. Auth/reset/media regression tests remain necessary to validate behavior.
- Reverb 1.11.1 remains compatible and unchanged. Tinker 2.11.1, Sail 1.67.0 and Collision 8.9.5 are required compatibility updates. The controlled resolver changed 20 versions and added 2 Symfony polyfills; no packages were removed. See the summary for resolver controls and test results.

## Evidence and reproducibility

This inventory was generated from the captured baseline `npm audit --json`, `npm audit --omit=dev --json` and `composer audit --locked --format=json` outputs, cross-checked against baseline and final lockfiles. Every npm object in each baseline `via` array has its own row, including duplicate GHSA records with different source IDs/ranges. String-only `via` entries are described separately as inherited findings. The appendix includes 37 client and 57 scaffold source/range rows plus all 4 Composer records.

Run the commands in [DEVELOPMENT.md](DEVELOPMENT.md#verification) to produce a new snapshot. Registry advisory data can change even when the lockfile does not. Current zero results apply to this reviewed snapshot; they are not an exclusion policy. Full build/runtime/integration outcomes and remaining support-lifecycle risks belong in [DEPENDENCIES.md](DEPENDENCIES.md).
