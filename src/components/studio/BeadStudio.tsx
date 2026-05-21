"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import { drawPreviewCanvas, exportPatternImage } from "@/lib/bead/export";
import { generatePattern, type SourceImage } from "@/lib/bead/generate";
import type { GeneratedPattern, RatioPreset, SizeMode } from "@/types/bead";

const ratioOptions: { label: string; value: RatioPreset }[] = [
  { label: "??", value: "original" },
  { label: "1:1", value: "1:1" },
  { label: "4:5", value: "4:5" },
  { label: "3:4", value: "3:4" },
  { label: "16:9", value: "16:9" },
  { label: "9:16", value: "9:16" },
];

const presetSizes = [24, 32, 48, 64, 96];

async function loadImageElement(file: File): Promise<SourceImage> {
  if (typeof createImageBitmap === "function") {
    const bitmap = await createImageBitmap(file);
    return {
      element: bitmap,
      width: bitmap.width,
      height: bitmap.height,
      name: file.name,
    };
  }

  return new Promise<SourceImage>((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      resolve({
        element: image,
        width: image.naturalWidth,
        height: image.naturalHeight,
        name: file.name,
      });
      URL.revokeObjectURL(url);
    };
    image.onerror = () => {
      reject(new Error("???????????"));
      URL.revokeObjectURL(url);
    };
    image.src = url;
  });
}

function formatFileSize(size: number): string {
  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`;
  }
  return `${(size / (1024 * 1024)).toFixed(2)} MB`;
}

function stripExtension(name: string): string {
  return name.replace(/\.[^.]+$/, "") || "bead-pattern";
}

export function BeadStudio() {
  const [ratio, setRatio] = useState<RatioPreset>("original");
  const [sizeMode, setSizeMode] = useState<SizeMode>("preset");
  const [presetLongEdge, setPresetLongEdge] = useState<number>(48);
  const [customWidth, setCustomWidth] = useState<number>(48);
  const [customHeight, setCustomHeight] = useState<number>(48);
  const [showGrid, setShowGrid] = useState(true);
  const [showCodes, setShowCodes] = useState(true);
  const [previewMode, setPreviewMode] = useState<"pattern" | "source">("pattern");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [source, setSource] = useState<SourceImage | null>(null);
  const [sourcePreviewUrl, setSourcePreviewUrl] = useState<string>("");
  const [sourceFileMeta, setSourceFileMeta] = useState<{ name: string; size: number } | null>(null);
  const [pattern, setPattern] = useState<GeneratedPattern | null>(null);
  const [error, setError] = useState<string>("");
  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const generationIdRef = useRef(0);

  useEffect(() => {
    return () => {
      if (sourcePreviewUrl) {
        URL.revokeObjectURL(sourcePreviewUrl);
      }

      if (source?.element instanceof ImageBitmap) {
        source.element.close();
      }
    };
  }, [source, sourcePreviewUrl]);

  const canGenerate = Boolean(source);

  const patternSummary = useMemo(() => {
    if (!pattern) {
      return null;
    }

    return {
      totalColors: pattern.counts.length,
      totalBeads: pattern.totalBeads,
      sizeLabel: `${pattern.width} ? ${pattern.height}`,
    };
  }, [pattern]);

  const previewTitle = previewMode === "pattern" ? "????" : "????";
  const compareButtonLabel = previewMode === "pattern" ? "??????" : "??????";
  const previewDescription = previewMode === "pattern" ? "????????????" : "?????????";

  const runGenerate = useCallback(async () => {
    if (!source) {
      return;
    }

    if (sizeMode === "custom" && (customWidth < 8 || customHeight < 8)) {
      setError("????????? 8 ??");
      return;
    }

    const currentId = generationIdRef.current + 1;
    generationIdRef.current = currentId;
    setIsGenerating(true);
    setError("");

    try {
      const nextPattern = generatePattern({
        source,
        ratio,
        sizeMode,
        presetLongEdge,
        customWidth,
        customHeight,
      });

      if (generationIdRef.current === currentId) {
        setPattern(nextPattern);
      }
    } catch (generationError) {
      const message = generationError instanceof Error ? generationError.message : "???????????";
      setError(message);
    } finally {
      if (generationIdRef.current === currentId) {
        setIsGenerating(false);
      }
    }
  }, [customHeight, customWidth, presetLongEdge, ratio, sizeMode, source]);

  useEffect(() => {
    if (!source) {
      return;
    }

    void runGenerate();
  }, [runGenerate, source]);

  useEffect(() => {
    if (!pattern || !previewCanvasRef.current) {
      return;
    }

    drawPreviewCanvas(previewCanvasRef.current, pattern, { showGrid, showCodes });
  }, [pattern, showCodes, showGrid]);

  const handleFileChange = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) {
        return;
      }

      if (!file.type.startsWith("image/")) {
        setError("????????");
        return;
      }

      if (source?.element instanceof ImageBitmap) {
        source.element.close();
      }
      if (sourcePreviewUrl) {
        URL.revokeObjectURL(sourcePreviewUrl);
      }

      setIsGenerating(true);
      setError("");
      setPattern(null);
      setPreviewMode("pattern");

      try {
        const nextSource = await loadImageElement(file);
        const nextPreviewUrl = URL.createObjectURL(file);
        setSource(nextSource);
        setSourcePreviewUrl(nextPreviewUrl);
        setSourceFileMeta({ name: file.name, size: file.size });
        setRatio("original");
        setCustomWidth(48);
        setCustomHeight(48);
      } catch (loadError) {
        const message = loadError instanceof Error ? loadError.message : "???????";
        setError(message);
        setIsGenerating(false);
      }
    },
    [source, sourcePreviewUrl],
  );

  const handleReset = useCallback(() => {
    if (source?.element instanceof ImageBitmap) {
      source.element.close();
    }
    if (sourcePreviewUrl) {
      URL.revokeObjectURL(sourcePreviewUrl);
    }

    setSource(null);
    setSourcePreviewUrl("");
    setSourceFileMeta(null);
    setPattern(null);
    setError("");
    setRatio("original");
    setSizeMode("preset");
    setPresetLongEdge(48);
    setCustomWidth(48);
    setCustomHeight(48);
    setPreviewMode("pattern");
  }, [source, sourcePreviewUrl]);

  const handleDownload = useCallback(async () => {
    if (!pattern) {
      return;
    }

    try {
      setIsDownloading(true);
      const blob = await exportPatternImage(pattern);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${stripExtension(pattern.sourceName)}-${pattern.width}x${pattern.height}.png`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (downloadError) {
      const message = downloadError instanceof Error ? downloadError.message : "???????????";
      setError(message);
    } finally {
      setIsDownloading(false);
    }
  }, [pattern]);

  return (
    <section className="studio-shell">
      <div className="container studio-page">
        <header className="site-header studio-inline-header">
          <div className="nav-row studio-nav-row">
            <div className="brand brand-with-version">
              <span className="brand-title">??????</span>
              <span className="version-badge">V1.0</span>
            </div>
          </div>
        </header>

        <div className="studio-layout">
          <aside className="panel surface-card control-panel">
            <div className="panel-header">
              <h2>????</h2>
            </div>

            <div className="field-block">
              <label className="field-label">????</label>
              <div className="chip-row">
                {ratioOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    className={`chip ${ratio === option.value ? "chip-active" : ""}`}
                    onClick={() => setRatio(option.value)}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="field-block">
              <div className="field-label with-inline-actions">
                <span>????</span>
                <div className="mode-switch">
                  <button
                    type="button"
                    className={`mode-button ${sizeMode === "preset" ? "mode-button-active" : ""}`}
                    onClick={() => setSizeMode("preset")}
                  >
                    ??
                  </button>
                  <button
                    type="button"
                    className={`mode-button ${sizeMode === "custom" ? "mode-button-active" : ""}`}
                    onClick={() => setSizeMode("custom")}
                  >
                    ???
                  </button>
                </div>
              </div>

              {sizeMode === "preset" ? (
                <div className="chip-row">
                  {presetSizes.map((size) => (
                    <button
                      key={size}
                      type="button"
                      className={`chip ${presetLongEdge === size ? "chip-active" : ""}`}
                      onClick={() => setPresetLongEdge(size)}
                    >
                      ?? {size}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="custom-grid">
                  <label>
                    <span>??</span>
                    <input
                      type="number"
                      min={8}
                      max={128}
                      value={customWidth}
                      onChange={(event) => setCustomWidth(Number(event.target.value))}
                    />
                  </label>
                  <label>
                    <span>??</span>
                    <input
                      type="number"
                      min={8}
                      max={128}
                      value={customHeight}
                      onChange={(event) => setCustomHeight(Number(event.target.value))}
                    />
                  </label>
                </div>
              )}
            </div>

            <div className="field-block">
              <label className="field-label">????</label>
              <div className="toggle-list">
                <label className="toggle-item">
                  <input type="checkbox" checked={showGrid} onChange={() => setShowGrid((value) => !value)} />
                  <span>????</span>
                </label>
                <label className="toggle-item">
                  <input type="checkbox" checked={showCodes} onChange={() => setShowCodes((value) => !value)} />
                  <span>??????</span>
                </label>
              </div>
            </div>

            <div className="action-row">
              <button
                type="button"
                className="primary-button action-button"
                disabled={!canGenerate || isGenerating}
                onClick={() => void runGenerate()}
              >
                {isGenerating ? "???..." : "????"}
              </button>
              <button type="button" className="secondary-button action-button" onClick={handleReset}>
                ??
              </button>
            </div>
          </aside>

          <section className="panel surface-card preview-panel">
            <div className="panel-header preview-header">
              <div className="preview-header-copy">
                <h2>{previewTitle}</h2>
              </div>
              <button
                type="button"
                className="primary-button action-button download-button"
                onClick={() => void handleDownload()}
                disabled={!pattern || isDownloading}
              >
                {isDownloading ? "???..." : "?? PNG"}
              </button>
            </div>

            {error ? <div className="error-banner">{error}</div> : null}

            {!source ? (
              <div className="empty-state">
                <h3>????????</h3>
                <p>??????????????????????????</p>
              </div>
            ) : (
              <div className="preview-stack">
                <div className="comparison-layout">
                  <article
                    className={`comparison-card ${previewMode === "pattern" ? "comparison-card-active" : "comparison-card-muted"}`}
                  >
                    <div className="comparison-card-head">
                      <span>????</span>
                      <span>{pattern ? patternSummary?.sizeLabel : "???"}</span>
                    </div>
                    {pattern ? (
                      <div className="canvas-wrap preview-frame">
                        <canvas ref={previewCanvasRef} className="preview-canvas" />
                      </div>
                    ) : (
                      <div className="mini-empty">??????...</div>
                    )}
                  </article>

                  <aside className="comparison-center">
                    <label className="upload-dropzone upload-dropzone-compact">
                      <input type="file" accept="image/*" onChange={handleFileChange} />
                      <span className="upload-title">?????</span>
                      <span className="upload-caption">?? JPG / PNG / WebP</span>
                    </label>

                    {sourceFileMeta ? (
                      <div className="file-meta">
                        <span>{sourceFileMeta.name}</span>
                        <span>{formatFileSize(sourceFileMeta.size)}</span>
                      </div>
                    ) : null}

                    <button
                      type="button"
                      className="secondary-button action-button compare-button"
                      onClick={() => setPreviewMode((mode) => (mode === "pattern" ? "source" : "pattern"))}
                      disabled={!source}
                    >
                      {compareButtonLabel}
                    </button>

                    <div className="compare-caption">{previewDescription}</div>
                  </aside>

                  <article
                    className={`comparison-card ${previewMode === "source" ? "comparison-card-active" : "comparison-card-muted"}`}
                  >
                    <div className="comparison-card-head">
                      <span>??</span>
                      <span>{sourceFileMeta?.name ?? "????"}</span>
                    </div>
                    <div className="preview-image-frame preview-frame">
                      {sourcePreviewUrl ? (
                        <img src={sourcePreviewUrl} alt="??????" className="source-preview-image" />
                      ) : null}
                    </div>
                  </article>
                </div>

                {patternSummary ? (
                  <div className="summary-grid">
                    <article className="summary-card">
                      <span>????</span>
                      <strong>{patternSummary.sizeLabel}</strong>
                    </article>
                    <article className="summary-card">
                      <span>????</span>
                      <strong>{patternSummary.totalColors} ?</strong>
                    </article>
                    <article className="summary-card">
                      <span>???</span>
                      <strong>{patternSummary.totalBeads} ?</strong>
                    </article>
                    <article className="summary-card">
                      <span>????</span>
                      <strong>{pattern?.ratioLabel}</strong>
                    </article>
                  </div>
                ) : null}

                {pattern ? (
                  <div className="stats-card">
                    <div className="stats-header">
                      <h3>???????</h3>
                      <p>????????????????</p>
                    </div>
                    <div className="stats-grid">
                      {pattern.counts.map((item) => (
                        <article key={item.color.code} className="stats-item">
                          <span className="swatch" style={{ backgroundColor: item.color.hex }} />
                          <div>
                            <strong>
                              {item.color.code} ? ? {item.color.name}
                            </strong>
                            <p>{item.count} ?</p>
                          </div>
                        </article>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            )}
          </section>
        </div>
      </div>
    </section>
  );
}
