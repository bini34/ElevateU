// Test-only TSX transpilation with the existing TypeScript dependency.
// Type correctness is checked separately by npm run typecheck.
import { readFile, access } from 'node:fs/promises';
import ts from 'typescript';

export async function resolve(specifier, context, nextResolve) {
  if (specifier === 'next/server') return nextResolve('next/server.js', context);
  if (specifier.startsWith('.') && !/\.[a-z]+$/i.test(specifier)) {
    for (const extension of ['.tsx', '.ts']) {
      const url = new URL(specifier + extension, context.parentURL);
      try { await access(url); } catch { continue; }
      return { url: url.href, shortCircuit: true };
    }
  }
  return nextResolve(specifier, context);
}

export async function load(url, context, nextLoad) {
  if (/\.tsx?$/.test(url)) {
    const source = await readFile(new URL(url), 'utf8');
    return { format: 'module', shortCircuit: true, source: ts.transpileModule(source, {
      fileName: new URL(url).pathname,
      compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
    }).outputText };
  }
  return nextLoad(url, context);
}
