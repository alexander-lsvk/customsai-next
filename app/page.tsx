"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton,
  useAuth,
} from "@clerk/nextjs";

interface Alternative {
  hs_code: string;
  description: string;
  reason: string;
}

interface EdgeCase {
  condition: string;
  hs_code: string;
  description: string;
  explanation: string;
}

interface ClassificationResult {
  primary_hs_code_thailand: string;
  primary_description?: string;
  confidence: number;
  alternatives: Alternative[];
  reasoning: string;
  interpreted_product?: string;
  edge_cases?: EdgeCase[];
}

// Try to parse partial JSON, returning what we can
function parsePartialJSON(text: string): Partial<ClassificationResult> | null {
  try {
    // Try complete parse first
    const parsed = JSON.parse(text);
    return {
      primary_hs_code_thailand: parsed.primary_hs_code,
      confidence: parsed.confidence,
      reasoning: parsed.reasoning,
      alternatives: parsed.alternatives || [],
      interpreted_product: parsed.interpreted_product,
      primary_description: parsed.primary_description,
      edge_cases: parsed.edge_cases || [],
    };
  } catch {
    // Try to extract individual fields from partial JSON
    const result: Partial<ClassificationResult> = {};

    // Extract interpreted_product
    const interpretedMatch = text.match(/"interpreted_product"\s*:\s*"([^"]*(?:\\.[^"]*)*)"/);
    if (interpretedMatch) result.interpreted_product = interpretedMatch[1].replace(/\\"/g, '"');

    // Extract primary_hs_code
    const hsCodeMatch = text.match(/"primary_hs_code"\s*:\s*"([^"]+)"/);
    if (hsCodeMatch) result.primary_hs_code_thailand = hsCodeMatch[1];

    // Extract primary_description
    const descMatch = text.match(/"primary_description"\s*:\s*"([^"]*(?:\\.[^"]*)*)"/);
    if (descMatch) result.primary_description = descMatch[1].replace(/\\"/g, '"');

    // Extract confidence
    const confMatch = text.match(/"confidence"\s*:\s*(0\.\d+)/);
    if (confMatch) result.confidence = parseFloat(confMatch[1]);

    // Extract reasoning (might be partial)
    const reasoningMatch = text.match(/"reasoning"\s*:\s*"((?:[^"\\]|\\.)*)(?:"|$)/);
    if (reasoningMatch) result.reasoning = reasoningMatch[1].replace(/\\"/g, '"').replace(/\\n/g, '\n');

    // Extract edge_cases array - find complete objects
    const edgeCasesMatch = text.match(/"edge_cases"\s*:\s*\[([\s\S]*)/);
    if (edgeCasesMatch) {
      const edgeCases: EdgeCase[] = [];
      const edgeRegex = /\{\s*"condition"\s*:\s*"([^"]*(?:\\.[^"]*)*)"\s*,\s*"hs_code"\s*:\s*"([^"]+)"\s*,\s*"description"\s*:\s*"([^"]*(?:\\.[^"]*)*)"\s*,\s*"explanation"\s*:\s*"([^"]*(?:\\.[^"]*)*)"\s*\}/g;
      let match;
      while ((match = edgeRegex.exec(edgeCasesMatch[1])) !== null) {
        edgeCases.push({
          condition: match[1].replace(/\\"/g, '"').replace(/\\n/g, '\n'),
          hs_code: match[2],
          description: match[3].replace(/\\"/g, '"'),
          explanation: match[4].replace(/\\"/g, '"').replace(/\\n/g, '\n'),
        });
      }
      if (edgeCases.length > 0) result.edge_cases = edgeCases;
    }

    // Extract alternatives array - find complete objects
    const alternativesMatch = text.match(/"alternatives"\s*:\s*\[([\s\S]*)/);
    if (alternativesMatch) {
      const alternatives: Alternative[] = [];
      const altRegex = /\{\s*"hs_code"\s*:\s*"([^"]+)"\s*,\s*"description"\s*:\s*"([^"]*(?:\\.[^"]*)*)"\s*,\s*"reason"\s*:\s*"([^"]*(?:\\.[^"]*)*)"\s*\}/g;
      let match;
      while ((match = altRegex.exec(alternativesMatch[1])) !== null) {
        alternatives.push({
          hs_code: match[1],
          description: match[2].replace(/\\"/g, '"'),
          reason: match[3].replace(/\\"/g, '"').replace(/\\n/g, '\n'),
        });
      }
      if (alternatives.length > 0) result.alternatives = alternatives;
    }

    return Object.keys(result).length > 0 ? result : null;
  }
}

export default function Home() {
  const { isSignedIn } = useAuth();
  const [description, setDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<ClassificationResult | null>(null);
  const [partialResult, setPartialResult] = useState<Partial<ClassificationResult> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyToClipboard = async (code: string, id: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const handleClassify = async () => {
    if (!description.trim()) return;

    setIsLoading(true);
    setError(null);
    setResult(null);
    setPartialResult(null);

    try {
      const response = await fetch("/api/classify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ description: description.trim() }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Classification failed");
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No response stream");

      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n\n").filter((line) => line.startsWith("data: "));

        for (const line of lines) {
          const jsonStr = line.replace("data: ", "");
          try {
            const data = JSON.parse(jsonStr);

            if (data.error) {
              throw new Error(data.error);
            }

            if (data.fullText) {
              const partial = parsePartialJSON(data.fullText);
              if (partial) setPartialResult(partial);
            }

            if (data.done && data.result) {
              setPartialResult(null);
              setResult(data.result);
              setIsLoading(false);
            }
          } catch (e) {
            if (e instanceof SyntaxError) continue;
            throw e;
          }
        }
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to classify. Please try again."
      );
      setIsLoading(false);
    }
  };

  return (
    <main className="gradient-bg min-h-screen flex flex-col items-center px-4 pt-28 pb-16">
      {/* Floating Navbar */}
      <nav className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-2xl px-6 py-3 rounded-full bg-white/70 backdrop-blur-xl border border-white/20 shadow-lg shadow-black/5">
        <div className="flex items-center justify-between">
          <span className="text-lg font-semibold text-gray-900">Customs AI</span>
          <div className="flex items-center gap-4">
            <SignedOut>
              <SignInButton mode="modal">
                <button className="text-sm text-gray-600 hover:text-gray-900 transition-colors cursor-pointer">
                  Sign in
                </button>
              </SignInButton>
              <SignUpButton mode="modal">
                <button className="text-sm px-4 py-1.5 rounded-full bg-gray-900 text-white hover:bg-gray-800 transition-colors cursor-pointer">
                  Sign up
                </button>
              </SignUpButton>
            </SignedOut>
            <SignedIn>
              <UserButton />
            </SignedIn>
          </div>
        </div>
      </nav>

      <div className="relative z-10 w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-semibold text-gray-900 mb-4 tracking-tight leading-tight">
            Your{" "}
            <span className="italic font-thin" style={{ fontFamily: "'PP Editorial New', serif" }}>smart assistant</span>{" "}
            for
            <br />
            customs classification.
          </h1>
          <p className="text-gray-500 text-base md:text-lg">
            AI-powered customs classification for ASEAN imports & exports
          </p>
        </div>

        {/* Card */}
        <Card className="glass-card rounded-2xl border-0 overflow-hidden">
          <CardContent className="p-6 md:p-8">
            {/* Input Section */}
            <div className="space-y-3">
              <label className="block text-sm font-semibold text-gray-700 text-left">
                Describe your product
              </label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brand names like 'Labubu' or 'iPhone' work, but add details for better accuracy (e.g. 'Labubu keychain, plastic, 5cm')"
                className="glass-input min-h-[100px] text-gray-900 placeholder:text-gray-400 rounded-xl resize-none focus:ring-0 focus:outline-none transition-all duration-200 text-base"
              />

              {isSignedIn ? (
                <Button
                  onClick={handleClassify}
                  disabled={isLoading || !description.trim()}
                  className="w-full h-12 rounded-xl text-base font-medium bg-gray-900 hover:bg-gray-800 text-white transition-all duration-200 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <svg
                        className="animate-spin h-4 w-4"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      Classifying...
                    </span>
                  ) : (
                    "Classify"
                  )}
                </Button>
              ) : (
                <SignUpButton mode="modal">
                  <Button
                    disabled={!description.trim()}
                    className="w-full h-12 rounded-xl text-base font-medium bg-gray-900 hover:bg-gray-800 text-white transition-all duration-200 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Classify
                  </Button>
                </SignUpButton>
              )}
            </div>

            {/* Error Message */}
            {error && (
              <div className="mt-4 p-3 rounded-lg bg-red-50 border border-red-100">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

          </CardContent>
        </Card>

        {/* Results Section - show skeleton or data */}
        {(isLoading || result || partialResult) && (() => {
          const displayResult = result || partialResult;
          const Skeleton = ({ className }: { className?: string }) => (
            <div className={`animate-pulse bg-gray-200 rounded ${className || ""}`} />
          );
          return (
            <div className="mt-8 space-y-4">
              {/* Primary Result Card */}
              <Card className="glass-card rounded-2xl border-0">
                <CardContent className="p-6 text-center">
                  {/* Interpreted Product */}
                  <div className="mb-4 pb-4 border-b border-gray-100">
                    <span className="text-gray-400 text-xs uppercase tracking-wider">
                      Interpreted as
                    </span>
                    {displayResult?.interpreted_product ? (
                      <p className="text-gray-700 text-base font-medium mt-1">
                        {displayResult.interpreted_product}
                      </p>
                    ) : (
                      <Skeleton className="h-5 w-48 mx-auto mt-1" />
                    )}
                  </div>

                  <p className="text-gray-400 text-xs uppercase tracking-wider mb-2">
                    HS Code
                  </p>
                  {displayResult?.primary_hs_code_thailand ? (
                    <>
                      <p className="text-3xl md:text-4xl font-semibold text-gray-900 font-mono tracking-wide">
                        {displayResult.primary_hs_code_thailand}
                      </p>
                      <button
                        onClick={() => copyToClipboard(displayResult.primary_hs_code_thailand!, "primary")}
                        className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-colors cursor-pointer"
                        title="Copy HS code"
                      >
                        {copiedId === "primary" ? (
                          <>
                            <svg className="w-3.5 h-3.5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <span className="text-emerald-600 text-xs">Copied</span>
                          </>
                        ) : (
                          <>
                            <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                            <span className="text-gray-600 text-xs">Copy</span>
                          </>
                        )}
                      </button>
                    </>
                  ) : (
                    <Skeleton className="h-10 w-40 mx-auto" />
                  )}

                  {displayResult?.primary_description ? (
                    <p className="text-gray-500 text-sm mt-3">
                      {displayResult.primary_description}
                    </p>
                  ) : (
                    <Skeleton className="h-4 w-56 mx-auto mt-3" />
                  )}

                  {displayResult?.confidence != null ? (
                    <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-50">
                      <div
                        className={`w-1.5 h-1.5 rounded-full ${displayResult.confidence >= 0.8
                          ? "bg-emerald-500"
                          : displayResult.confidence >= 0.6
                            ? "bg-amber-500"
                            : "bg-red-500"
                          }`}
                      />
                      <span className="text-gray-600 text-xs">
                        {(displayResult.confidence * 100).toFixed(0)}% confidence
                      </span>
                    </div>
                  ) : (
                    <Skeleton className="h-6 w-28 mx-auto mt-3 rounded-full" />
                  )}
                </CardContent>
              </Card>

              {/* Reasoning */}
              <Card className="glass-card rounded-2xl border-0">
                <CardContent className="p-5">
                  <p className="text-gray-400 text-xs uppercase tracking-wider mb-2">
                    Reasoning
                  </p>
                  {displayResult?.reasoning ? (
                    <div className="text-gray-600 text-sm leading-relaxed prose prose-sm prose-gray max-w-none">
                      <ReactMarkdown>{displayResult.reasoning}</ReactMarkdown>
                      {isLoading && <span className="animate-pulse">▋</span>}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-3/4" />
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Edge Cases */}
              <Card className="glass-card rounded-2xl border-0 border-l-4 border-l-amber-400">
                <CardContent className="p-5">
                  <p className="text-amber-600 text-xs uppercase tracking-wider mb-3">
                    Edge Cases
                  </p>
                  {displayResult?.edge_cases && displayResult.edge_cases.length > 0 ? (
                    <div className="space-y-3">
                      {displayResult.edge_cases.map((edge, index) => (
                        <div key={index} className="flex items-start gap-3">
                          <button
                            onClick={() => copyToClipboard(edge.hs_code, `edge-${index}`)}
                            className="relative shrink-0 cursor-pointer group"
                            title="Click to copy"
                          >
                            <code className="text-sm font-medium font-mono text-amber-600 group-hover:text-amber-700 transition-colors">
                              {edge.hs_code}
                            </code>
                            {copiedId === `edge-${index}` && (
                              <span className="absolute inset-0 flex items-center justify-center bg-white/80 rounded">
                                <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              </span>
                            )}
                          </button>
                          <div>
                            <p className="text-gray-500 text-xs">
                              <span className="text-gray-700 text-sm font-semibold">{edge.description}</span>
                              <br />
                              {edge.condition}
                              <br />
                              {edge.explanation}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <Skeleton className="h-5 w-24 shrink-0" />
                        <div className="flex-1 space-y-1">
                          <Skeleton className="h-4 w-full" />
                          <Skeleton className="h-3 w-2/3" />
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Alternatives */}
              <Card className="glass-card rounded-2xl border-0">
                <CardContent className="p-5">
                  <p className="text-gray-400 text-xs uppercase tracking-wider mb-3">
                    Alternatives
                  </p>
                  {displayResult?.alternatives && displayResult.alternatives.length > 0 ? (
                    <div className="space-y-3">
                      {displayResult.alternatives.map((alt, index) => (
                        <div key={index} className="flex items-start gap-3">
                          <button
                            onClick={() => copyToClipboard(alt.hs_code, `alt-${index}`)}
                            className="relative shrink-0 cursor-pointer group"
                            title="Click to copy"
                          >
                            <code className="text-sm font-medium font-mono text-gray-900 group-hover:text-gray-700 transition-colors">
                              {alt.hs_code}
                            </code>
                            {copiedId === `alt-${index}` && (
                              <span className="absolute inset-0 flex items-center justify-center bg-white/80 rounded">
                                <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              </span>
                            )}
                          </button>
                          <div>
                            <p className="text-gray-500 text-xs">
                              {alt.description && (
                                <>
                                  <span className="text-gray-700 text-sm font-semibold">{alt.description}</span>
                                  <br />
                                </>
                              )}
                              {alt.reason}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <Skeleton className="h-5 w-24 shrink-0" />
                        <div className="flex-1 space-y-1">
                          <Skeleton className="h-4 w-full" />
                          <Skeleton className="h-3 w-1/2" />
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <Skeleton className="h-5 w-24 shrink-0" />
                        <div className="flex-1 space-y-1">
                          <Skeleton className="h-4 w-3/4" />
                          <Skeleton className="h-3 w-2/3" />
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          );
        })()}

        {/* Disclaimer */}
        <div className="mt-10 p-4 rounded-xl bg-gray-50 border border-gray-100">
          <p className="text-gray-500 text-xs text-center leading-relaxed">
            <span className="font-semibold text-gray-600">Disclaimer:</span> This tool provides AI-generated HS code suggestions for reference only.
            Classifications may contain errors and should be verified with official customs authorities before use.
            Always consult a licensed customs broker for final classification decisions.
          </p>
        </div>

        {/* Footer */}
        <p className="text-center text-gray-400 text-xs mt-6">
          Powered by Customs AI.
          <br />
          @2025 Customs AI. All rights reserved.
        </p>
      </div>
    </main>
  );
}
