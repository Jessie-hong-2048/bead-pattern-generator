"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import { drawPreviewCanvas, exportPatternImage } from "@/lib/bead/export";
import { generatePattern, type SourceImage } from "@/lib/bead/generate";
import type { GeneratedPattern, RatioPreset, SizeMode } from "@/types/bead";

const ratioOptions: { label: string; value: RatioPreset }[] = [
  { label: "原图", value: "original" },
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
      reject(new Error("图片加载失败，请尝试重新上传。"));
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

export function BeadStudio() {
  const [ratio, setRatio] = useState<RatioPreset>("original");
  const [sizeMode, setSizeMode] = useState<SizeMode>("preset");
  const [presetLongEdge, setPresetLongEdge] = useState<number>(48);
  const [customWidth, setCustomWidth] = useState<number>(48);
  const [customHeight, setCustomHeight] = useState<number>(48);
  const [showGrid, setShowGrid] = useState(true);
  const [showCodes, setShowCodes] = useState(true);
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
      sizeLabel: `${pattern.width} × ${pattern.height}`,
    };
  }, [pattern]);

  const runGenerate = useCallback(async () => {
    if (!source) {
      return;
    }

    if (sizeMode === "custom" && (customWidth < 8 || customHeight < 8)) {
      setError("自定义宽高至少为 8。");
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
      const message =
        generationError instanceof Error ? generationError.message : "生成失败，请稍后再试。";
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
        setError("请上传图片文件。");
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
        const message = loadError instanceof Error ? loadError.message : "图片加载失败。";
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
      link.download = `${pattern.sourceName.replace(/\.[^.]+$/, "") || "bead-pattern"}-${pattern.width}x${pattern.height}.png`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (downloadError) {
      const message = downloadError instanceof Error ? downloadError.message : "下载失败，请稍后再试。";
      setError(message);
    } finally {
      setIsDownloading(false);
    }
  }, [pattern]);

  return (
    <section className="studio-shell">
      <div className="container studio-page">
        <div className="page-hero studio-hero">
          <div>
            <span className="eyebrow">拼豆工作台</span>
            <h1>上传图片，自动生成拼豆网格图</h1>
            <p>
              当前版本默认使用内置色卡，并采用自动居中裁剪。上传后会立即生成第一版结果，你也可以继续调整比例与尺寸。
            </p>
          </div>
          <div className="hero-mini-card">
            <strong>适配场景</strong>
            <span>头像图、宠物图、Q 版插画、简单照片</span>
          </div>
        </div>

        <div className="studio-layout">
          <aside className="panel surface-card control-panel">
            <div className="panel-header">
              <h2>参数设置</h2>
              <p>上传图片后可立即生成，支持手机和电脑浏览器。</p>
            </div>

            <div className="field-block upload-block">
              <label className="field-label">上传图片</label>
              <label className="upload-dropzone">
                <input type="file" accept="image/*" onChange={handleFileChange} />
                <span className="upload-title">点击上传或重新选择图片</span>
                <span className="upload-caption">支持 JPG / PNG / WebP</span>
              </label>
              {sourceFileMeta ? (
                <div className="file-meta">
                  <span>{sourceFileMeta.name}</span>
                  <span>{formatFileSize(sourceFileMeta.size)}</span>
                </div>
              ) : null}
            </div>

            <div className="field-block">
              <label className="field-label">比例</label>
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
                <span>尺寸</span>
                <div className="mode-switch">
                  <button
                    type="button"
                    className={`mode-button ${sizeMode === "preset" ? "mode-button-active" : ""}`}
                    onClick={() => setSizeMode("preset")}
                  >
                    预设
                  </button>
                  <button
                    type="button"
                    className={`mode-button ${sizeMode === "custom" ? "mode-button-active" : ""}`}
                    onClick={() => setSizeMode("custom")}
                  >
                    自定义
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
                      长边 {size}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="custom-grid">
                  <label>
                    <span>宽</span>
                    <input
                      type="number"
                      min={8}
                      max={128}
                      value={customWidth}
                      onChange={(event) => setCustomWidth(Number(event.target.value))}
                    />
                  </label>
                  <label>
                    <span>高</span>
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
              <label className="field-label">显示控制</label>
              <div className="toggle-list">
                <label className="toggle-item">
                  <input type="checkbox" checked={showGrid} onChange={() => setShowGrid((value) => !value)} />
                  <span>显示网格线</span>
                </label>
                <label className="toggle-item">
                  <input type="checkbox" checked={showCodes} onChange={() => setShowCodes((value) => !value)} />
                  <span>显示颜色编号</span>
                </label>
              </div>
            </div>

            <div className="field-block notice-card">
              <strong>当前规则</strong>
              <p>自动匹配最接近颜色，默认内置色卡，裁剪方式为自动居中裁剪。</p>
            </div>

            <div className="action-row">
              <button
                type="button"
                className="primary-button action-button"
                disabled={!canGenerate || isGenerating}
                onClick={() => void runGenerate()}
              >
                {isGenerating ? "生成中..." : "重新生成"}
              </button>
              <button type="button" className="secondary-button action-button" onClick={handleReset}>
                重置
              </button>
            </div>
          </aside>

          <section className="panel surface-card preview-panel">
            <div className="panel-header preview-header">
              <div>
                <h2>结果预览</h2>
                <p>生成后可查看颜色用量，并下载 PNG 制作图。</p>
              </div>
              <button
                type="button"
                className="primary-button action-button download-button"
                onClick={() => void handleDownload()}
                disabled={!pattern || isDownloading}
              >
                {isDownloading ? "下载中..." : "下载 PNG"}
              </button>
            </div>

            {error ? <div className="error-banner">{error}</div> : null}

            {!source ? (
              <div className="empty-state">
                <h3>先上传一张图片</h3>
                <p>上传后会自动生成第一版拼豆配色图，支持手机和电脑使用。</p>
              </div>
            ) : (
              <div className="preview-stack">
                <div className="preview-top-grid">
                  <div className="source-card">
                    <h3>原图预览</h3>
                    {sourcePreviewUrl ? <img src={sourcePreviewUrl} alt="原图预览" className="source-preview-image" /> : null}
                  </div>

                  <div className="source-card">
                    <h3>拼豆网格预览</h3>
                    {pattern ? (
                      <div className="canvas-wrap">
                        <canvas ref={previewCanvasRef} className="preview-canvas" />
                      </div>
                    ) : (
                      <div className="mini-empty">正在生成拼豆图...</div>
                    )}
                  </div>
                </div>

                {patternSummary ? (
                  <div className="summary-grid">
                    <article className="summary-card">
                      <span>成品尺寸</span>
                      <strong>{patternSummary.sizeLabel}</strong>
                    </article>
                    <article className="summary-card">
                      <span>颜色数量</span>
                      <strong>{patternSummary.totalColors} 种</strong>
                    </article>
                    <article className="summary-card">
                      <span>总颗数</span>
                      <strong>{patternSummary.totalBeads} 颗</strong>
                    </article>
                    <article className="summary-card">
                      <span>当前比例</span>
                      <strong>{pattern?.ratioLabel}</strong>
                    </article>
                  </div>
                ) : null}

                {pattern ? (
                  <div className="stats-card">
                    <div className="stats-header">
                      <h3>颜色用量统计</h3>
                      <p>已按用量从高到低排序</p>
                    </div>
                    <div className="stats-grid">
                      {pattern.counts.map((item) => (
                        <article key={item.color.code} className="stats-item">
                          <span className="swatch" style={{ backgroundColor: item.color.hex }} />
                          <div>
                            <strong>
                              {item.color.code} · {item.color.name}
                            </strong>
                            <p>{item.count} 颗</p>
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
