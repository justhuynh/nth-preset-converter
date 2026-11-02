import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  MAX_IMAGE_BYTES,
  MODE_INFO,
  MODES,
  DYE_CATEGORIES,
  isDye,
  getDyeFallbackCategories,
  apiOrigin,
  apiRequest,
  unwrapResult,
  hostedResultURL,
  readFileAsDataURL,
  decodeQrFromImageFile,
  inputBody,
  imageError,
  qrPresentation,
  warningMessages,
  photoWarningMessages,
  faceModelNotice,
  compatibilitySummary,
  expiryNote,
  apiErrorMessage,
  formatValue,
  extractValidColors,
} from "./utils/converter.js";
import {
  MODE_ICON_MAP,
  ArrowRightIcon,
  LinkIcon,
  ImageIcon,
  UploadCloudIcon,
  CheckCircleIcon,
  DownloadIcon,
  CopyIcon,
  InfoIcon,
  CloseIcon,
  SparkleIcon,
  GuideIcon,
} from "./components/Icons.jsx";
import { WuxiaParticles } from "./components/WuxiaParticles.jsx";
import { GuidePanel } from "./components/GuidePanel.jsx";

const MODE_LIST = [
  { id: "face", title: "QR mặt", sub: "Diện mạo & ngũ quan" },
  { id: "makeup", title: "Trang điểm", sub: "Son phấn & thần thái" },
  { id: "dye", title: "Nhuộm màu", sub: "Tóc, áo & quần" },
  { id: "photo", title: "Chụp ảnh", sub: "Đoàn phim & góc máy" },
  { id: "guide", title: "Hướng dẫn", sub: "Cẩm nang chi tiết" },
];

const INITIAL_DRAFTS = {
  face: "",
  makeup: "",
  dye: "",
  photo: "",
};

const CN_GALLERY_URL = "https://h.163.com/avatar/#/TheRecommendedDesign";

function parseInitialRoute() {
  const raw = window.location.hash.replace(/^#/, "").trim().toLowerCase();
  if (DYE_CATEGORIES.includes(raw) || raw === "dye") {
    return "dye";
  }
  if (MODES.includes(raw)) {
    return raw;
  }
  return "face";
}

function getGalleryHref() {
  return CN_GALLERY_URL;
}

function tokenizeWords(text) {
  if (!text || typeof text !== "string") return [];
  return text.match(/\S+\s*/g) || [];
}

const completedStreamIds = new Set();
let streamIdCounter = 0;

function StreamingWhiteContent({ streamId, compatText, modelNote, warnings }) {
  const warningsKey = Array.isArray(warnings) ? warnings.join("\n") : "";
  const compatTokens = React.useMemo(() => tokenizeWords(compatText), [compatText]);
  const warningTokensList = React.useMemo(
    () => (Array.isArray(warnings) ? warnings.map((w) => tokenizeWords(w)) : []),
    [warningsKey]
  );

  const totalTokens = React.useMemo(() => {
    const warnSum = warningTokensList.reduce((acc, arr) => acc + arr.length, 0);
    return compatTokens.length + warnSum;
  }, [compatTokens, warningTokensList]);

  const alreadyDone = streamId ? completedStreamIds.has(streamId) : false;
  const [revealedCount, setRevealedCount] = useState(() =>
    alreadyDone ? totalTokens : 1
  );
  const [shouldAnimateWords, setShouldAnimateWords] = useState(() => !alreadyDone);

  useEffect(() => {
    if (totalTokens === 0) {
      setRevealedCount(0);
      setShouldAnimateWords(false);
      return;
    }
    if (streamId && completedStreamIds.has(streamId)) {
      setRevealedCount(totalTokens);
      setShouldAnimateWords(false);
      return;
    }
    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
    if (prefersReducedMotion) {
      if (streamId) completedStreamIds.add(streamId);
      setRevealedCount(totalTokens);
      setShouldAnimateWords(false);
      return;
    }

    setShouldAnimateWords(true);
    setRevealedCount(1);
    let progressed = false;

    const stepMs = Math.max(48, Math.min(68, Math.round(3600 / totalTokens)));
    const interval = setInterval(() => {
      progressed = true;
      setRevealedCount((prev) => {
        if (prev + 1 >= totalTokens) {
          clearInterval(interval);
          if (streamId) completedStreamIds.add(streamId);
          return totalTokens;
        }
        return prev + 1;
      });
    }, stepMs);

    return () => {
      clearInterval(interval);
      if (progressed && streamId) {
        completedStreamIds.add(streamId);
      }
    };
  }, [streamId, totalTokens]);

  const isStreaming = revealedCount < totalTokens;
  const wordAnimClass = shouldAnimateWords ? "inline animate-word-stream" : "inline";
  const visibleCompatCount = Math.min(compatTokens.length, revealedCount);
  const compatActive = isStreaming && revealedCount <= compatTokens.length;

  let remainingAfterCompat = Math.max(0, revealedCount - compatTokens.length);

  return (
    <>
      {compatTokens.length > 0 ? (
        <p className="text-sm text-[#e3eff8] leading-relaxed">
          {compatTokens.slice(0, visibleCompatCount).map((token, idx) => (
            <span key={idx} className={wordAnimClass}>
              {token}
            </span>
          ))}
          {compatActive ? (
            <span
              className="inline-block w-1.5 h-3.5 ml-0.5 align-middle rounded-xs bg-[#5ce1d6] shadow-[0_0_8px_#5ce1d6] animate-pulse"
              aria-hidden="true"
            />
          ) : null}
        </p>
      ) : null}

      {modelNote ? (
        <p className="mt-2 rounded-lg border border-[#f5d48f]/35 bg-[#f5d48f]/10 px-3 py-2 text-sm font-semibold text-[#f5d48f]">
          ✦ {modelNote}
        </p>
      ) : null}

      {warningTokensList.length > 0 && revealedCount > compatTokens.length ? (
        <ul className="mt-3 space-y-2 border-t border-[#f2d08b]/20 pt-3 text-sm text-[#e3eff8] list-disc list-inside">
          {warningTokensList.map((tokens, idx) => {
            if (remainingAfterCompat <= 0) return null;
            const countForThisItem = Math.min(tokens.length, remainingAfterCompat);
            remainingAfterCompat -= countForThisItem;
            const itemActive =
              isStreaming &&
              countForThisItem > 0 &&
              (countForThisItem < tokens.length || remainingAfterCompat === 0);

            return (
              <li key={idx} className="leading-relaxed">
                {tokens.slice(0, countForThisItem).map((token, tIdx) => (
                  <span key={tIdx} className={wordAnimClass}>
                    {token}
                  </span>
                ))}
                {itemActive ? (
                  <span
                    className="inline-block w-1.5 h-3.5 ml-0.5 align-middle rounded-xs bg-[#5ce1d6] shadow-[0_0_8px_#5ce1d6] animate-pulse"
                    aria-hidden="true"
                  />
                ) : null}
              </li>
            );
          })}
        </ul>
      ) : null}
    </>
  );
}

export function App() {
  const [mode, setMode] = useState(parseInitialRoute);
  const [inputTab, setInputTab] = useState("link"); // "link" | "image"
  const [drafts, setDrafts] = useState(INITIAL_DRAFTS);
  const [dyeMode, setDyeMode] = useState("default"); // "default" | "exact"

  // Animation state triggers when clicking tabs/items
  const [tabAnimTick, setTabAnimTick] = useState(0);
  const [lastClickedMode, setLastClickedMode] = useState(null);
  const [subTabAnimTick, setSubTabAnimTick] = useState(0);

  // Config state
  const [maxImageBytes, setMaxImageBytes] = useState(MAX_IMAGE_BYTES);

  // Image upload state
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewObjectURL, setPreviewObjectURL] = useState("");
  const [isDragging, setIsDragging] = useState(false);

  // Conversion execution state
  const [busy, setBusy] = useState(false);
  const [progressStep, setProgressStep] = useState(0);
  const [feedback, setFeedback] = useState({ message: "", tone: "info" });
  const [resultsByMode, setResultsByMode] = useState({}); // { [mode]: { result, kind, streamId } }
  const [copiedId, setCopiedId] = useState("");
  const resultData = resultsByMode[mode] || null;

  const abortControllerRef = useRef(null);
  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);
  const resultSectionRef = useRef(null);

  const pageOrigin = window.location.origin;
  const configuredOrigin = (() => {
    try {
      return apiOrigin(window.NTH_CONVERTER_CONFIG?.apiBaseUrl || "", pageOrigin);
    } catch {
      return pageOrigin;
    }
  })();

  // Sync hash with mode
  useEffect(() => {
    const onHashChange = () => {
      const next = parseInitialRoute();
      setMode((prev) => {
        if (prev !== next) {
          setTabAnimTick((t) => t + 1);
          setFeedback({ message: "", tone: "info" });
        }
        return next;
      });
    };
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  // Load API config on mount
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await apiRequest("/api/config", configuredOrigin, {
          headers: { Accept: "application/json" },
        });
        if (!res.ok) throw new Error("config_error");
        const cfg = await res.json();
        if (!active) return;
        const limit = Number(cfg.max_image_bytes);
        if (limit > 0) {
          setMaxImageBytes(Math.min(MAX_IMAGE_BYTES, limit));
        }
      } catch {
        // Ignore config error
      }
    })();
    return () => {
      active = false;
    };
  }, [configuredOrigin]);

  // Optional autorun for automated E2E verification (?autorun=1)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("autorun") !== "1") return;
    const sample = (MODE_INFO[mode] || MODE_INFO.face).sample || "159868758";
    setDrafts((prev) => ({ ...prev, [mode]: sample }));
    const resolvedKind = mode === "guide" ? "face" : mode === "dye" ? "hair" : mode;
    apiRequest("/api/convert", configuredOrigin, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        input: sample,
        conversion_kind: resolvedKind,
        target_client: "vng_pc",
      }),
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((payload) => {
        if (payload) {
          const targetMode = mode === "guide" ? "face" : mode;
          setResultsByMode((prev) => ({
            ...prev,
            [targetMode]: {
              result: payload,
              kind: resolvedKind,
              streamId: ++streamIdCounter,
            },
          }));
        }
      })
      .catch(() => {});
  }, [configuredOrigin]);

  // Cleanup preview object URL
  useEffect(() => {
    return () => {
      if (previewObjectURL) {
        URL.revokeObjectURL(previewObjectURL);
      }
    };
  }, [previewObjectURL]);

  const handleSelectFile = useCallback(
    (file) => {
      setPreviewObjectURL((old) => {
        if (old) URL.revokeObjectURL(old);
        return "";
      });
      if (!file) {
        setSelectedFile(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
        return;
      }
      const err = imageError(file, maxImageBytes);
      if (err) {
        setSelectedFile(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
        setFeedback({ message: err, tone: "error" });
        return;
      }
      const nextURL = URL.createObjectURL(file);
      setSelectedFile(file);
      setPreviewObjectURL(nextURL);
      setFeedback({ message: "", tone: "info" });
    },
    [maxImageBytes]
  );

  // Global clipboard paste for QR images
  useEffect(() => {
    const handlePaste = (event) => {
      if (busy || mode === "guide") return;
      const items = Array.from(event.clipboardData?.items || []);
      const imgItem = items.find((item) => item.type && item.type.startsWith("image/"));
      if (!imgItem) return;
      const file = imgItem.getAsFile();
      if (!file) return;
      event.preventDefault();
      setInputTab("image");
      setSubTabAnimTick((t) => t + 1);
      handleSelectFile(file);
      setFeedback({
        message: "Đã nhận ảnh QR từ bộ nhớ tạm. Bấm Chuyển ảnh QR để tiếp tục.",
        tone: "info",
      });
    };
    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [busy, mode, handleSelectFile]);

  const handleSelectMode = (nextMode) => {
    if (busy || !MODES.includes(nextMode)) return;
    const normalized = DYE_CATEGORIES.includes(nextMode) ? "dye" : nextMode;
    setLastClickedMode(normalized);
    if (normalized !== mode) {
      setTabAnimTick((t) => t + 1);
      setMode(normalized);
      setFeedback({ message: "", tone: "info" });
    }
    const targetHash = "#" + normalized;
    if (window.location.hash !== targetHash) {
      history.replaceState(null, "", targetHash);
    }
  };

  const handleSelectInputTab = (nextTab) => {
    if (busy) return;
    setInputTab(nextTab);
    setSubTabAnimTick((t) => t + 1);
    setFeedback({ message: "", tone: "info" });
  };

  const currentModeInfo = MODE_INFO[mode] || MODE_INFO.face;
  const currentDraft = drafts[mode] ?? "";
  const currentDyeMode = dyeMode;

  const handleSelectDyeMode = (value) => {
    if (busy || mode !== "dye") return;
    setDyeMode(value);
  };

  const handleDraftChange = (e) => {
    const val = e.target.value;
    setDrafts((prev) => ({ ...prev, [mode]: val }));
    if (feedback.tone === "error") {
      setFeedback({ message: "", tone: "info" });
    }
  };

  const handleFillSample = () => {
    if (busy || mode === "guide") return;
    const sampleId = currentModeInfo.sample;
    setInputTab("link");
    setSubTabAnimTick((t) => t + 1);
    setDrafts((prev) => ({ ...prev, [mode]: sampleId }));
    setFeedback({
      message: `Đã điền mã mẫu ${currentModeInfo.label} (${sampleId}). Nhấn Chuyển đổi để xem kết quả.`,
      tone: "info",
    });
    textareaRef.current?.focus();
  };

  const handleClearInput = () => {
    if (busy) return;
    setDrafts((prev) => ({ ...prev, [mode]: "" }));
    setFeedback({ message: "", tone: "info" });
    textareaRef.current?.focus();
  };

  const handleCancelRequest = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };

  const runConversion = async (requestFactory) => {
    if (busy) return;
    const controller = new AbortController();
    abortControllerRef.current = controller;
    let resolvedKind = mode === "guide" ? "face" : mode === "dye" ? "hair" : mode;
    let currentStep = 1;
    const updateStep = (step) => {
      currentStep = step;
      setProgressStep(step);
    };

    const targetMode = mode === "guide" ? "face" : mode;
    setBusy(true);
    setResultsByMode((prev) => ({ ...prev, [targetMode]: null }));
    updateStep(1);
    setFeedback({
      message: `Đang chuyển đổi dữ liệu ${currentModeInfo.label} từ Bản Trung sang Bản Global...`,
      tone: "loading",
    });

    const timer1 = setTimeout(() => updateStep(2), 320);
    const timer2 = setTimeout(() => updateStep(3), 680);

    try {
      let response = await requestFactory(controller.signal, resolvedKind);
      let payload = null;
      try {
        payload = await response.json();
      } catch {
        payload = null;
      }

      // Smart Auto-Detection across dye categories (hair -> top -> bottom)
      const fallbackKinds = !response.ok
        ? getDyeFallbackCategories(resolvedKind, payload?.error)
        : [];
      if (fallbackKinds.length > 0) {
        for (const altKind of fallbackKinds) {
          setFeedback({
            message: `Đang tự động nhận diện phân loại nhuộm (${MODE_INFO[altKind].title})...`,
            tone: "loading",
          });
          const altResponse = await requestFactory(controller.signal, altKind);
          let altPayload = null;
          try {
            altPayload = await altResponse.json();
          } catch {
            altPayload = null;
          }
          const nextFallbacks = !altResponse.ok
            ? getDyeFallbackCategories(altKind, altPayload?.error)
            : [];
          if (altResponse.ok || nextFallbacks.length === 0) {
            response = altResponse;
            payload = altPayload;
            resolvedKind = altKind;
            break;
          }
        }
      }

      if (!response.ok) {
        const message = payload?.error
          ? apiErrorMessage(payload.error, resolvedKind)
          : "Không thể chuyển đổi dữ liệu lúc này. Vui lòng thử lại sau.";
        throw new Error(message);
      }
      if (!payload || typeof payload !== "object") {
        throw new Error("Phản hồi từ máy chủ không hợp lệ.");
      }

      clearTimeout(timer1);
      clearTimeout(timer2);

      // Ensure smooth gliding progression across steps 1 -> 2 -> 3 if server responded faster
      if (currentStep < 2 && !controller.signal.aborted) {
        updateStep(2);
        await new Promise((r) => setTimeout(r, 240));
      }
      if (currentStep < 3 && !controller.signal.aborted) {
        updateStep(3);
        await new Promise((r) => setTimeout(r, 260));
      }

      setFeedback({ message: "", tone: "info" });
      setResultsByMode((prev) => ({
        ...prev,
        [targetMode]: {
          result: payload,
          kind: resolvedKind,
          streamId: ++streamIdCounter,
        },
      }));

      setTimeout(() => {
        resultSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }, 90);
    } catch (err) {
      if (err?.name === "AbortError") {
        setFeedback({ message: "Đã hủy yêu cầu chuyển đổi.", tone: "info" });
      } else {
        setFeedback({
          message: err instanceof Error ? err.message : "Đã xảy ra lỗi không xác định.",
          tone: "error",
        });
      }
    } finally {
      clearTimeout(timer1);
      clearTimeout(timer2);
      abortControllerRef.current = null;
      setBusy(false);
      setProgressStep(0);
    }
  };

  const handleConvertText = () => {
    let baseBody;
    try {
      baseBody = inputBody(currentDraft);
    } catch (err) {
      setFeedback({
        message: err instanceof Error ? err.message : "Nội dung chưa hợp lệ.",
        tone: "error",
      });
      textareaRef.current?.focus();
      return;
    }

    runConversion((signal, kindToTry) => {
      const bodyObj = {
        ...baseBody,
        conversion_kind: kindToTry,
        target_client: "vng_pc",
      };
      if (isDye(kindToTry)) {
        bodyObj.dye_mode = currentDyeMode;
      }
      return apiRequest("/api/convert", configuredOrigin, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(bodyObj),
        signal,
      });
    });
  };

  const handleConvertImage = () => {
    const err = imageError(selectedFile, maxImageBytes);
    if (err) {
      setFeedback({ message: err, tone: "error" });
      return;
    }

    let dataUrlPromise = null;
    let decodedQrPromise = null;

    runConversion(async (signal, kindToTry) => {
      if (!dataUrlPromise) {
        dataUrlPromise = readFileAsDataURL(selectedFile);
      }
      const dataUrl = await dataUrlPromise;
      const bodyObj = {
        image_base64: dataUrl,
        conversion_kind: kindToTry,
        target_client: "vng_pc",
      };
      if (isDye(kindToTry)) {
        bodyObj.dye_mode = currentDyeMode;
      }

      const res = await apiRequest("/api/convert", configuredOrigin, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(bodyObj),
        signal,
      });

      if (res.ok || res.status === 429) {
        return res;
      }

      // Check if we can decode the QR code client-side (e.g. cropped or full screenshot) as fallback
      const cloned = res.clone();
      let errPayload = null;
      try {
        errPayload = await cloned.json();
      } catch {
        errPayload = null;
      }
      if (getDyeFallbackCategories(kindToTry, errPayload?.error).length > 0) {
        return res;
      }

      // Only fall back to client-side QR crop decoding if the server couldn't locate the QR code in the image
      if (errPayload?.error?.code !== "qr_not_found") {
        return res;
      }

      if (!decodedQrPromise) {
        decodedQrPromise = decodeQrFromImageFile(selectedFile);
      }
      const decodedText = await decodedQrPromise;
      if (decodedText) {
        const fallbackBody = {
          input: decodedText,
          conversion_kind: kindToTry,
          target_client: "vng_pc",
        };
        if (isDye(kindToTry)) {
          fallbackBody.dye_mode = currentDyeMode;
        }
        return apiRequest("/api/convert", configuredOrigin, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify(fallbackBody),
          signal,
        });
      }

      return res;
    });
  };

  const triggerCopy = async (text, id) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => {
        setCopiedId((prev) => (prev === id ? "" : prev));
      }, 1800);
    } catch {
      setFeedback({
        message: "Trình duyệt chặn sao chép tự động. Vui lòng sao chép thủ công.",
        tone: "error",
      });
    }
  };

  // Compute formatted result presentation when resultData is available
  const renderedResult = React.useMemo(() => {
    if (!resultData) return null;
    const { result, kind, streamId } = resultData;
    const source = result.source || {};
    const conversion = result.conversion || {};
    const innerResult = unwrapResult(result);
    const qr = qrPresentation(innerResult, configuredOrigin, kind);
    const qrSrc = qr.imageURL
      ? hostedResultURL(qr.imageURL, configuredOrigin, qr.mode === "preview" ? "preview" : "qr") ||
        configuredOrigin + qr.imageURL
      : null;
    const payloadHref = hostedResultURL(innerResult.payload_url, configuredOrigin, "payload");
    const colors = isDye(kind) ? extractValidColors(conversion) : [];
    const warnings =
      kind === "photo"
        ? photoWarningMessages(conversion)
        : warningMessages(result.warnings, isDye(kind) ? [] : conversion.warnings);
    const modelNote = faceModelNotice(conversion);
    const compatText = compatibilitySummary(conversion, innerResult, kind);
    const expText = expiryNote(innerResult);

    const genderLabel =
      source.gender === 1 || source.gender === "1"
        ? "Nữ"
        : source.gender === 0 || source.gender === "0"
        ? "Nam"
        : null;

    const summaryItems = [
      { label: "Phân loại", value: MODE_INFO[kind]?.title || kind },
      { label: "Định dạng nguồn", value: source.share_id ? `Bản Trung (#${source.share_id})` : "Bản Trung" },
      { label: "Định dạng đích", value: "Bản Global" },
    ];
    if (source.title) {
      summaryItems.push({
        label: "Tên mẫu gốc",
        value: genderLabel ? `${source.title} (${genderLabel})` : source.title,
      });
    } else if (genderLabel) {
      summaryItems.push({
        label: "Giới tính mẫu",
        value: genderLabel,
      });
    }
    if (conversion.mode === "passthrough") {
      summaryItems.push({
        label: "Chế độ xử lý",
        value: "Tương thích trực tiếp (Giữ nguyên 100%)",
      });
    } else if (conversion.source_face_type || conversion.target_face_type) {
      summaryItems.push({
        label: "Mẫu khuôn mặt",
        value: `${conversion.source_face_type || "—"} → ${conversion.target_face_type || "—"}`,
      });
    }
    if (Number.isInteger(conversion.converted_count)) {
      summaryItems.push({
        label: "Thông số đã chuyển",
        value: String(conversion.converted_count),
      });
    } else if (Number.isInteger(conversion.translated_controls)) {
      summaryItems.push({
        label: "Thông số đối chiếu",
        value: String(conversion.translated_controls),
      });
    }
    if (Number.isInteger(conversion.quantized_count)) {
      summaryItems.push({
        label: "Thông số làm tròn",
        value: String(conversion.quantized_count),
      });
    }
    if (colors.length > 0) {
      summaryItems.push({
        label: "Số vùng màu",
        value: `${colors.length} màu RGBA`,
      });
    }

    const rawControls = Array.isArray(conversion.preview_fields)
      ? conversion.preview_fields
      : Array.isArray(conversion.controls)
      ? conversion.controls
      : Array.isArray(conversion.parameters)
      ? conversion.parameters
      : [];

    return {
      streamId,
      result,
      innerResult,
      source,
      kind,
      conversion,
      qr,
      qrSrc,
      payloadHref,
      colors,
      warnings,
      modelNote,
      compatText,
      expText,
      summaryItems,
      rawControls: rawControls.slice(0, 120),
    };
  }, [resultData, configuredOrigin]);

  return (
    <div className="relative min-h-screen overflow-x-hidden flex flex-col justify-between text-[#fdfbf7] selection:bg-[#5ce1d6]/30 selection:text-[#fdfbf7]">
      {/* Ambient Wuxia Canvas Particles + Interactive Click Sparks */}
      <WuxiaParticles />

      {/* Decorative Ambient Glows */}
      <div
        className="pointer-events-none fixed -top-36 -left-32 w-[480px] h-[480px] rounded-full bg-[#5ce1d6]/12 blur-[110px] z-0"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none fixed -bottom-40 -right-32 w-[520px] h-[520px] rounded-full bg-[#f5d48f]/12 blur-[120px] z-0"
        aria-hidden="true"
      />

      <div className="relative z-10 w-full max-w-[1220px] mx-auto px-4 sm:px-6 pt-4 sm:pt-6 pb-10">
        {/* TOP HEADER */}
        <header className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#f2d08b]/30 bg-[#0d1f2d]/85 backdrop-blur-xl px-4 sm:px-6 py-3.5 shadow-[0_16px_40px_rgba(3,10,18,0.45)]">
          <a
            href="#face"
            onClick={(e) => {
              e.preventDefault();
              handleSelectMode("face");
            }}
            className="group flex items-center gap-3.5 focus-visible:outline-2 focus-visible:outline-[#f5d48f] rounded-xl"
          >
            <div className="relative w-12 h-12 flex items-center justify-center shrink-0">
              <span
                className="absolute inset-0 rounded-full border border-dashed border-[#f5d48f]/60 animate-spin-slow"
                aria-hidden="true"
              />
              <span
                className="absolute inset-1 rounded-full border border-[#5ce1d6]/45 animate-spin-reverse"
                aria-hidden="true"
              />
              <img
                src="/assets/logo-crest.svg"
                alt="Dung Hoa Các"
                width="38"
                height="38"
                fetchPriority="high"
                decoding="async"
                className="relative z-10 w-9 h-9 object-contain transition-transform duration-300 group-hover:scale-110"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-[family-name:var(--font-display)] text-xl sm:text-2xl font-bold tracking-wide bg-gradient-to-r from-[#fffdf9] via-[#f5d48f] to-[#5ce1d6] bg-clip-text text-transparent">
                  Dung Hoa Các
                </span>
                <span className="hidden sm:inline-block text-[11px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border border-[#f5d48f]/35 bg-[#f5d48f]/12 text-[#f5d48f]">
                  Nghịch Thủy Hàn
                </span>
              </div>
              <p className="text-xs sm:text-sm text-[#d4e3ee] font-medium">
                Công Cụ Chuyển Mã Diện Mạo & Trang Phục
              </p>
            </div>
          </a>

          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
            {/* Route Pill: Bản Trung -> Bản Global */}
            <div
              className="inline-flex items-center gap-2 rounded-full border border-[#f2d08b]/35 bg-[#081520]/90 px-3.5 py-1.5 text-xs sm:text-sm font-bold shadow-inner"
              aria-label="Chuyển đổi từ Bản Trung sang Bản Global"
            >
              <span className="text-[#f5d48f]">Bản Trung</span>
              <ArrowRightIcon className="w-4 h-4 text-[#5ce1d6]" />
              <span className="text-[#5ce1d6]">Bản Global</span>
            </div>
          </div>
        </header>

        {/* HERO BANNER */}
        <section
          aria-labelledby="hero-heading"
          className="mt-4 sm:mt-5 relative overflow-hidden rounded-2xl border border-[#f2d08b]/30 bg-gradient-to-br from-[#132a3c]/90 via-[#0e2130]/90 to-[#091622]/95 backdrop-blur-xl p-4 sm:p-6 lg:p-7 shadow-[0_22px_55px_rgba(3,10,18,0.5)]"
        >
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 lg:gap-6 items-center">
            <div className="md:col-span-7 space-y-2.5 sm:space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#5ce1d6]/35 bg-[#5ce1d6]/12 px-3 py-1 text-[11px] sm:text-xs font-bold uppercase tracking-wider text-[#5ce1d6]">
                <SparkleIcon className="w-3.5 h-3.5 text-[#f5d48f] shrink-0" />
                <span className="truncate">Tây Hồ Nguyệt Sắc · Biện Kinh Hoa Đăng</span>
              </div>

              <h1
                id="hero-heading"
                className="text-xl sm:text-3xl lg:text-4xl font-bold leading-tight tracking-tight text-[#fdfbf7]"
              >
                Chuyển Đổi Mã QR & Link Chia Sẻ{" "}
                <span className="bg-gradient-to-r from-[#f5d48f] via-[#ffe6b3] to-[#5ce1d6] bg-clip-text text-transparent">
                  Bản Trung → Bản Global
                </span>
              </h1>

              <p className="text-xs sm:text-sm lg:text-base text-[#d8e6f2] leading-relaxed max-w-2xl">
                Đồng bộ trọn vẹn thông số <strong className="text-[#f5d48f]">Khuôn mặt</strong>,{" "}
                <strong className="text-[#f5d48f]">Trang điểm</strong>,{" "}
                <strong className="text-[#f5d48f]">Nhuộm màu (Tóc · Áo · Quần)</strong> và{" "}
                <strong className="text-[#f5d48f]">Chụp ảnh Đoàn phim</strong> từ{" "}
                <strong className="text-[#5ce1d6]">Bản Trung</strong> sang{" "}
                <strong className="text-[#5ce1d6]">Bản Global</strong> chỉ trong một chạm.
              </p>
            </div>

            {/* Decorative Chibi Art Card (Purely Decorative — No Sect-to-Feature Mapping) */}
            <div className="md:col-span-5">
              <div className="relative mx-auto max-w-md md:max-w-none overflow-hidden rounded-xl border border-[#f5d48f]/40 bg-[#08131c] shadow-[0_14px_35px_rgba(0,0,0,0.45)] animate-float">
                <img
                  src="/assets/chibi/hero-sects.jpg"
                  alt="Minh họa Bát Đại Môn Phái Nghịch Thủy Hàn"
                  width="1376"
                  height="768"
                  fetchPriority="high"
                  decoding="async"
                  className="w-full aspect-[16/9] sm:h-44 lg:h-48 object-cover object-[center_75%]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#07121b] via-[#07121b]/25 to-transparent" />
                <div className="absolute bottom-2 left-2.5 right-2.5 flex items-center justify-between gap-1.5">
                  <span className="inline-flex items-center gap-1 rounded-lg bg-[#091622]/85 backdrop-blur-md border border-[#f5d48f]/35 px-2 py-0.5 text-[11px] font-bold text-[#f5d48f] truncate">
                    ✦ Giang Hồ Diện Mạo Lục
                  </span>
                  <span className="rounded-lg bg-[#091622]/85 backdrop-blur-md border border-[#5ce1d6]/35 px-2 py-0.5 text-[10px] sm:text-[11px] font-semibold text-[#5ce1d6] shrink-0">
                    Bát Đại Môn Phái
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* MAIN WORKSPACE: LEFT MODE TABS + RIGHT CONVERTER */}
        <div className="mt-5 sm:mt-6 grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-start">
          {/* LEFT COMMAND DOCK: 5 MODES WITH CLICK & RIPPLE ANIMATIONS */}
          <aside
            aria-label="Danh mục chức năng chuyển đổi"
            className="lg:col-span-4 xl:col-span-3 rounded-2xl border border-[#f2d08b]/30 bg-[#102332]/85 backdrop-blur-xl p-3.5 sm:p-4 shadow-[0_20px_50px_rgba(3,10,18,0.5)] lg:sticky lg:top-5"
          >
            <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-[#f2d08b]/20">
              <span className="font-[family-name:var(--font-display)] text-base font-bold tracking-wide text-[#f5d48f]">
                Danh Mục Chuyển Đổi
              </span>
              <span className="text-[11px] font-semibold text-[#9fc0d6]">
                {MODE_LIST.length} mục
              </span>
            </div>

            <nav
              role="tablist"
              aria-label="Chế độ chuyển mã"
              className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-1 gap-2"
            >
              {MODE_LIST.map((item, idx) => {
                const IconComponent =
                  item.id === "dye"
                    ? MODE_ICON_MAP.hair || GuideIcon
                    : MODE_ICON_MAP[item.id] || GuideIcon;
                const isActive = mode === item.id;
                const isJustClicked = lastClickedMode === item.id;
                const isLastOddMobile = idx === MODE_LIST.length - 1 && MODE_LIST.length % 2 === 1;

                return (
                  <button
                    key={item.id}
                    type="button"
                    role="tab"
                    id={`tab-mode-${item.id}`}
                    aria-selected={isActive}
                    onClick={() => handleSelectMode(item.id)}
                    className={`group relative overflow-hidden flex items-center md:flex-col md:justify-center lg:flex-row lg:justify-start gap-2 sm:gap-2 lg:gap-3 rounded-xl px-2.5 py-2.5 md:px-2 md:py-3 lg:px-3.5 lg:py-3 text-left md:text-center lg:text-left transition-all duration-300 cursor-pointer select-none ${
                      isLastOddMobile ? "col-span-2 sm:col-span-1" : ""
                    } ${
                      isActive
                        ? "border-2 border-[#f5d48f] bg-gradient-to-r from-[#f5d48f]/22 via-[#5ce1d6]/15 to-[#132c3d]/90 text-[#fdfbf7] shadow-[0_8px_24px_rgba(245,212,143,0.2)] scale-[1.01]"
                        : "border border-[#f2d08b]/20 bg-[#0a1824]/75 text-[#d8e6f2] hover:border-[#f5d48f]/50 hover:bg-[#142d40]/80 lg:hover:translate-x-0.5"
                    } ${isJustClicked ? "animate-click-pop" : ""}`}
                  >
                    {/* Active Sword Indicator Bar */}
                    {isActive ? (
                      <span
                        className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-gradient-to-b from-[#f5d48f] via-[#5ce1d6] to-[#f5d48f] shadow-[0_0_10px_#f5d48f] md:hidden lg:block"
                        aria-hidden="true"
                      />
                    ) : null}

                    {/* Click Ripple Ring Burst */}
                    {isActive && isJustClicked ? (
                      <span
                        key={tabAnimTick}
                        className="pointer-events-none absolute inset-0 rounded-xl border-2 border-[#5ce1d6] animate-ripple-ring"
                        aria-hidden="true"
                      />
                    ) : null}

                    <span
                      className={`flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-lg shrink-0 transition-transform duration-300 group-hover:scale-110 ${
                        isActive
                          ? "bg-gradient-to-br from-[#f5d48f] to-[#d9a44e] text-[#091520] shadow-[0_0_14px_rgba(245,212,143,0.45)]"
                          : "bg-[#13293b] text-[#f5d48f] border border-[#f5d48f]/25"
                      }`}
                    >
                      <IconComponent className="w-4 h-4 sm:w-5 sm:h-5" />
                    </span>

                    <div className="min-w-0 flex-1 md:w-full">
                      <div className="flex items-center md:justify-center lg:justify-between justify-between gap-1">
                        <span
                          className={`text-[13px] sm:text-sm font-bold truncate ${
                            isActive ? "text-[#fdfbf7]" : "text-[#e6f0f8]"
                          }`}
                        >
                          {item.title}
                        </span>
                        {isActive ? (
                          <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-[#5ce1d6] shadow-[0_0_8px_#5ce1d6] shrink-0 md:hidden lg:inline-block" />
                        ) : null}
                      </div>
                      <p className="text-[11px] text-[#9fc0d6] truncate mt-0.5">
                        {item.sub}
                      </p>
                    </div>
                  </button>
                );
              })}
            </nav>

            {/* Decorative Chibi Companion inside Command Dock on Desktop */}
            <div className="hidden lg:flex items-center gap-3 mt-4 pt-3.5 border-t border-[#f2d08b]/20">
              <img
                src="/assets/chibi/chibi-tovan.jpg"
                alt="Tiểu sư muội Tố Vấn"
                width="52"
                height="52"
                loading="lazy"
                decoding="async"
                className="w-12 h-12 rounded-xl object-cover border border-[#f5d48f]/45 shrink-0"
              />
              <p className="text-xs text-[#d4e3ee] leading-snug">
                Mẹo nhỏ: Nhấn <strong className="text-[#f5d48f]">Ctrl + V</strong> ở bất kỳ đâu để dán nhanh ảnh chụp màn hình chứa mã QR!
              </p>
            </div>
          </aside>

          {/* RIGHT MAIN PANEL: ANIMATED TAB CONTENT */}
          <main className="lg:col-span-8 xl:col-span-9 min-w-0">
            {mode === "guide" ? (
              <GuidePanel key={`guide-${tabAnimTick}`} onSelectMode={handleSelectMode} />
            ) : (
              <section
                key={`panel-${mode}-${tabAnimTick}`}
                aria-labelledby="converter-panel-title"
                className="animate-tab-enter rounded-2xl border border-[#f2d08b]/30 bg-[#102332]/88 backdrop-blur-xl p-5 sm:p-7 shadow-[0_24px_60px_rgba(3,10,18,0.55)]"
              >
                {/* Mode Header Bar */}
                <div className="flex flex-wrap items-start justify-between gap-3 sm:gap-4 pb-4 sm:pb-5 mb-4 sm:mb-5 border-b border-[#f2d08b]/20">
                  <div>
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] sm:text-xs font-bold uppercase tracking-wider text-[#5ce1d6] mb-1">
                      <span>Danh Mục Đang Chọn</span>
                      <span>·</span>
                      <span className="text-[#f5d48f]">Bản Trung → Bản Global</span>
                    </div>
                    <h2
                      id="converter-panel-title"
                      className="text-xl sm:text-3xl font-bold text-[#fdfbf7] tracking-tight"
                    >
                      {mode === "dye"
                        ? "Chuyển đổi Màu tóc · Màu áo · Màu quần (Tự động nhận diện)"
                        : `Chuyển đổi ${currentModeInfo.title} (${currentModeInfo.subtitle})`}
                    </h2>
                  </div>

                  {/* Link to Official CN Sample Gallery */}
                  <a
                    href={getGalleryHref()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-xl border border-[#f5d48f]/40 bg-[#f5d48f]/12 px-3.5 py-2 text-xs font-bold text-[#f5d48f] hover:bg-[#f5d48f]/22 hover:border-[#f5d48f]/70 active:scale-95 transition"
                  >
                    <span>{currentModeInfo.gallery}</span>
                    <ArrowRightIcon className="w-3.5 h-3.5" />
                  </a>
                </div>

                {/* DYE MODE SELECTOR (Unified Nhuộm màu tab — No 3-way sub-tabs) */}
                {mode === "dye" ? (
                  <div className="mb-5 rounded-xl border border-[#5ce1d6]/30 bg-[#091723]/85 p-3.5 sm:p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs font-bold uppercase tracking-wider text-[#5ce1d6]">
                            Chế độ áp mẫu nhuộm (Tóc · Áo · Quần)
                          </span>
                          <span className="inline-flex items-center gap-1 rounded-full border border-[#f5d48f]/35 bg-[#f5d48f]/12 px-2 py-0.5 text-[10px] font-bold text-[#f5d48f]">
                            ✦ Tự động nhận diện
                          </span>
                        </div>
                        <p className="text-xs text-[#d4e3ee] mt-0.5">
                          {currentDyeMode === "default"
                            ? "Áp màu lên mẫu mặc định của Bản Global. Hệ thống tự động nhận diện mã Màu tóc, Màu áo hoặc Màu quần khi chuyển đổi."
                            : "Giữ đúng mã vật phẩm gốc (yêu cầu nhân vật đã sở hữu). Hệ thống tự động nhận diện mã Màu tóc, Màu áo hoặc Màu quần khi chuyển đổi."}
                        </p>
                      </div>

                      <div
                        role="radiogroup"
                        aria-label="Chế độ mẫu nhuộm"
                        className="relative grid grid-cols-2 rounded-xl border border-[#f2d08b]/30 bg-[#061018] p-1 sm:min-w-[260px] shrink-0"
                      >
                        {/* Sliding Active Pill Background */}
                        <span
                          className={`pointer-events-none absolute top-1 bottom-1 left-1 w-[calc(50%-4px)] rounded-lg bg-gradient-to-r from-[#f5d48f] to-[#dfb360] shadow transition-transform duration-300 ease-out ${
                            currentDyeMode === "exact" ? "translate-x-full" : "translate-x-0"
                          }`}
                          aria-hidden="true"
                        />
                        <button
                          type="button"
                          role="radio"
                          aria-checked={currentDyeMode === "default"}
                          onClick={() => handleSelectDyeMode("default")}
                          className={`relative z-10 rounded-lg px-3 py-1.5 text-xs font-bold transition-colors cursor-pointer ${
                            currentDyeMode === "default" ? "text-[#08131c]" : "text-[#d8e6f2] hover:text-white"
                          }`}
                        >
                          Mẫu mặc định
                        </button>
                        <button
                          type="button"
                          role="radio"
                          aria-checked={currentDyeMode === "exact"}
                          onClick={() => handleSelectDyeMode("exact")}
                          className={`relative z-10 rounded-lg px-3 py-1.5 text-xs font-bold transition-colors cursor-pointer ${
                            currentDyeMode === "exact" ? "text-[#08131c]" : "text-[#d8e6f2] hover:text-white"
                          }`}
                        >
                          Giữ mẫu gốc
                        </button>
                      </div>
                    </div>
                  </div>
                ) : null}

                {/* INPUT METHOD SUB-TABS (Dán link vs Ảnh QR) WITH SLIDING INDICATOR */}
                <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                  <div
                    role="tablist"
                    aria-label="Phương thức nhập dữ liệu"
                    className="relative grid grid-cols-2 rounded-xl border border-[#f2d08b]/30 bg-[#08141f] p-1 w-full sm:w-80"
                  >
                    <span
                      className={`pointer-events-none absolute top-1 bottom-1 left-1 w-[calc(50%-4px)] rounded-lg bg-gradient-to-r from-[#5ce1d6] to-[#2aa8a0] shadow-[0_4px_15px_rgba(92,225,214,0.3)] transition-transform duration-300 ease-out ${
                        inputTab === "image" ? "translate-x-full" : "translate-x-0"
                      }`}
                      aria-hidden="true"
                    />
                    <button
                      type="button"
                      role="tab"
                      aria-selected={inputTab === "link"}
                      onClick={() => handleSelectInputTab("link")}
                      className={`relative z-10 inline-flex items-center justify-center gap-2 rounded-lg py-2 px-3 text-xs sm:text-sm font-bold transition-colors cursor-pointer ${
                        inputTab === "link" ? "text-[#06121a]" : "text-[#d8e6f2] hover:text-white"
                      }`}
                    >
                      <LinkIcon className="w-4 h-4" />
                      <span>Dán link / Mã</span>
                    </button>
                    <button
                      type="button"
                      role="tab"
                      aria-selected={inputTab === "image"}
                      onClick={() => handleSelectInputTab("image")}
                      className={`relative z-10 inline-flex items-center justify-center gap-2 rounded-lg py-2 px-3 text-xs sm:text-sm font-bold transition-colors cursor-pointer ${
                        inputTab === "image" ? "text-[#06121a]" : "text-[#d8e6f2] hover:text-white"
                      }`}
                    >
                      <ImageIcon className="w-4 h-4" />
                      <span>Ảnh QR</span>
                    </button>
                  </div>

                  {/* Quick Sample Button & Guide Shortcut */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleFillSample}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-[#5ce1d6]/40 bg-[#5ce1d6]/12 px-3 py-2 text-xs font-bold text-[#5ce1d6] hover:bg-[#5ce1d6]/22 active:scale-95 transition cursor-pointer"
                    >
                      <SparkleIcon className="w-3.5 h-3.5" />
                      <span>Thử mã mẫu ({currentModeInfo.sample})</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSelectMode("guide")}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-[#f2d08b]/30 bg-[#0a1824] px-3 py-2 text-xs font-semibold text-[#d8e6f2] hover:border-[#f5d48f]/60 hover:text-[#f5d48f] active:scale-95 transition cursor-pointer"
                    >
                      <GuideIcon className="w-3.5 h-3.5" />
                      <span>Hướng dẫn</span>
                    </button>
                  </div>
                </div>

                {/* SUB-TAB BODY WITH SMOOTH ENTER ANIMATION */}
                <div key={`subtab-${inputTab}-${subTabAnimTick}`} className="animate-subtab-enter">
                  {inputTab === "link" ? (
                    <div className="space-y-4">
                      <div className="relative">
                        <label
                          htmlFor="share-link-input"
                          className="block text-xs font-bold uppercase tracking-wider text-[#f5d48f] mb-2"
                        >
                          Dán link chia sẻ, văn bản Thiết Kế hoặc mã ID {currentModeInfo.label} Bản Trung
                        </label>
                        <textarea
                          ref={textareaRef}
                          id="share-link-input"
                          rows={4}
                          value={currentDraft}
                          onChange={handleDraftChange}
                          onKeyDown={(e) => {
                            if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                              e.preventDefault();
                              handleConvertText();
                            }
                          }}
                          placeholder={`Ví dụ: https://h.163.com/avatar/... hoặc mã số ${currentModeInfo.sample}...`}
                          className="w-full rounded-xl border border-[#f2d08b]/35 bg-[#08141f]/90 p-4 text-sm sm:text-base text-[#fdfbf7] placeholder-[#7fa3bd] focus:border-[#5ce1d6] focus:outline-none focus:ring-2 focus:ring-[#5ce1d6]/30 transition"
                        />
                        {currentDraft ? (
                          <button
                            type="button"
                            onClick={handleClearInput}
                            aria-label="Xóa nội dung đã nhập"
                            className="absolute top-9 right-3 inline-flex items-center gap-1 rounded-lg border border-[#f2d08b]/30 bg-[#102436] px-2.5 py-1 text-xs font-semibold text-[#d4e3ee] hover:text-white hover:border-[#f5d48f] transition cursor-pointer"
                          >
                            <CloseIcon className="w-3 h-3" />
                            <span>Xóa</span>
                          </button>
                        ) : null}
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <p className="text-xs text-[#9fc0d6]">
                          Nhấn <kbd className="rounded bg-[#091622] px-1.5 py-0.5 border border-[#f2d08b]/30 text-[#f5d48f]">Ctrl + Enter</kbd> để chuyển đổi nhanh.
                        </p>

                        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                          {busy ? (
                            <button
                              type="button"
                              onClick={handleCancelRequest}
                              className="rounded-xl border border-[#ff7b8b]/50 bg-[#ff7b8b]/15 px-4 py-3 text-sm font-bold text-[#ff9aa7] hover:bg-[#ff7b8b]/25 transition cursor-pointer"
                            >
                              Hủy
                            </button>
                          ) : null}

                          <button
                            type="button"
                            disabled={busy}
                            onClick={handleConvertText}
                            className="relative overflow-hidden w-full sm:w-auto inline-flex items-center justify-center gap-2.5 rounded-xl bg-gradient-to-r from-[#f5d48f] via-[#e8be6b] to-[#5ce1d6] px-6 py-3.5 text-sm sm:text-base font-extrabold text-[#07131d] shadow-[0_10px_28px_rgba(245,212,143,0.3)] hover:brightness-105 active:scale-95 disabled:opacity-60 transition cursor-pointer"
                          >
                            <span>
                              {busy ? "Đang chuyển đổi..." : `Chuyển đổi ${currentModeInfo.title}`}
                            </span>
                            <ArrowRightIcon className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div
                        onDragOver={(e) => {
                          e.preventDefault();
                          setIsDragging(true);
                        }}
                        onDragLeave={() => setIsDragging(false)}
                        onDrop={(e) => {
                          e.preventDefault();
                          setIsDragging(false);
                          const file = e.dataTransfer?.files?.[0];
                          if (file) handleSelectFile(file);
                        }}
                        onClick={() => fileInputRef.current?.click()}
                        className={`relative overflow-hidden rounded-2xl border-2 border-dashed p-6 sm:p-8 text-center transition cursor-pointer ${
                          isDragging
                            ? "border-[#5ce1d6] bg-[#5ce1d6]/15"
                            : "border-[#f5d48f]/45 bg-[#08141f]/85 hover:border-[#5ce1d6]/70 hover:bg-[#0c1d2c]/90"
                        }`}
                      >
                        {/* Animated Laser Scan Line */}
                        <span
                          className="pointer-events-none absolute left-4 right-4 h-0.5 bg-gradient-to-r from-transparent via-[#5ce1d6] to-transparent shadow-[0_0_12px_#5ce1d6] animate-laser"
                          aria-hidden="true"
                        />

                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/png,image/jpeg,image/webp"
                          onChange={(e) => handleSelectFile(e.target.files?.[0] || null)}
                          className="hidden"
                        />

                        {previewObjectURL && selectedFile ? (
                          <div
                            onClick={(e) => e.stopPropagation()}
                            className="flex flex-col sm:flex-row items-center justify-center gap-5 text-left"
                          >
                            <img
                              src={previewObjectURL}
                              alt="Xem trước ảnh QR đã chọn"
                              className="w-28 h-28 rounded-xl object-contain border border-[#f5d48f]/50 bg-[#050d14] p-1.5 shadow-lg"
                            />
                            <div className="space-y-2 text-center sm:text-left">
                              <span className="inline-block rounded-full bg-[#5ce1d6]/15 border border-[#5ce1d6]/40 px-2.5 py-0.5 text-xs font-bold text-[#5ce1d6]">
                                Đã sẵn sàng quét QR
                              </span>
                              <p className="text-sm font-bold text-[#fdfbf7] break-all max-w-xs">
                                {selectedFile.name}
                              </p>
                              <p className="text-xs text-[#9fc0d6]">
                                Kích thước: {Math.max(1, Math.round(selectedFile.size / 1024))} KB
                              </p>
                              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                                <button
                                  type="button"
                                  onClick={() => fileInputRef.current?.click()}
                                  className="rounded-lg border border-[#f5d48f]/45 bg-[#f5d48f]/15 px-3 py-1.5 text-xs font-bold text-[#f5d48f] hover:bg-[#f5d48f]/25 transition cursor-pointer"
                                >
                                  Đổi ảnh khác
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleSelectFile(null)}
                                  className="rounded-lg border border-[#ff7b8b]/40 bg-[#ff7b8b]/12 px-3 py-1.5 text-xs font-bold text-[#ff9aa7] hover:bg-[#ff7b8b]/22 transition cursor-pointer"
                                >
                                  Xóa ảnh
                                </button>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center space-y-2.5">
                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#f5d48f]/20 to-[#5ce1d6]/20 border border-[#f5d48f]/40 flex items-center justify-center text-[#f5d48f] shadow-inner">
                              <UploadCloudIcon className="w-7 h-7" />
                            </div>
                            <p className="text-base font-bold text-[#fdfbf7]">
                              Chạm để chọn ảnh QR hoặc kéo thả ảnh vào đây
                            </p>
                            <p className="text-xs sm:text-sm text-[#9fc0d6]">
                              Hỗ trợ <strong className="text-[#f5d48f]">PNG, JPG, WebP</strong> (tối đa 5 MB) · Hoặc nhấn{" "}
                              <strong className="text-[#5ce1d6]">Ctrl + V</strong> để dán ảnh từ bộ nhớ tạm
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center justify-end gap-3">
                        {busy ? (
                          <button
                            type="button"
                            onClick={handleCancelRequest}
                            className="rounded-xl border border-[#ff7b8b]/50 bg-[#ff7b8b]/15 px-4 py-3 text-sm font-bold text-[#ff9aa7] hover:bg-[#ff7b8b]/25 transition cursor-pointer"
                          >
                            Hủy
                          </button>
                        ) : null}

                        <button
                          type="button"
                          disabled={busy || !selectedFile}
                          onClick={handleConvertImage}
                          className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 rounded-xl bg-gradient-to-r from-[#f5d48f] via-[#e8be6b] to-[#5ce1d6] px-6 py-3.5 text-sm sm:text-base font-extrabold text-[#07131d] shadow-[0_10px_28px_rgba(245,212,143,0.3)] hover:brightness-105 active:scale-95 disabled:opacity-50 transition cursor-pointer"
                        >
                          <span>
                            {busy ? "Đang giải mã QR..." : `Chuyển ảnh QR (${currentModeInfo.title})`}
                          </span>
                          <ArrowRightIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* 3-STEP PROGRESS BAR WHEN BUSY */}
                {busy ? (
                  <div
                    className="mt-5 rounded-xl border border-[#5ce1d6]/40 bg-[#081520]/90 p-4 space-y-3"
                    role="status"
                    aria-live="polite"
                  >
                    <div className="flex items-center justify-between text-xs font-bold text-[#5ce1d6]">
                      <span className="inline-flex items-center gap-2">
                        <span
                          className="w-2 h-2 rounded-full bg-[#5ce1d6] shadow-[0_0_8px_#5ce1d6] animate-pulse"
                          aria-hidden="true"
                        />
                        <span>Đang vận chuyển chân khí giải mã dữ liệu...</span>
                      </span>
                      <span className="rounded-full border border-[#5ce1d6]/30 bg-[#5ce1d6]/12 px-2.5 py-0.5 text-[11px]">
                        Bước {progressStep}/3
                      </span>
                    </div>

                    {/* Smooth Gliding Qi Progress Track */}
                    <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-[#061018] border border-[#5ce1d6]/20">
                      <div
                        className="relative h-full rounded-full bg-gradient-to-r from-[#5ce1d6] via-[#f5d48f] to-[#5ce1d6] shadow-[0_0_14px_#5ce1d6] transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]"
                        style={{ width: `${Math.max(1, progressStep) * (100 / 3)}%` }}
                      >
                        <span
                          className="pointer-events-none absolute inset-0 w-1/2 bg-gradient-to-r from-transparent via-white/75 to-transparent animate-shimmer"
                          aria-hidden="true"
                        />
                      </div>
                    </div>

                    {/* 3 Steps with Smooth Sliding Glider Pill */}
                    <div className="relative grid grid-cols-3 rounded-xl border border-[#f2d08b]/20 bg-[#061018]/95 p-1 text-xs">
                      <span
                        className="pointer-events-none absolute top-1 bottom-1 left-1 w-[calc((100%-8px)/3)] overflow-hidden rounded-lg border border-[#5ce1d6]/80 bg-gradient-to-r from-[#5ce1d6]/25 via-[#f5d48f]/18 to-[#5ce1d6]/25 shadow-[0_0_20px_rgba(92,225,214,0.32)] transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]"
                        style={{
                          transform: `translateX(${Math.max(0, Math.min(2, progressStep - 1)) * 100}%)`,
                        }}
                        aria-hidden="true"
                      >
                        <span className="pointer-events-none absolute inset-0 w-1/2 bg-gradient-to-r from-transparent via-white/25 to-transparent animate-shimmer" />
                      </span>

                      {[
                        { step: 1, label: "1. Giải mã Bản Trung" },
                        { step: 2, label: "2. Đối chiếu Bản Global" },
                        { step: 3, label: "3. Khởi tạo mã QR" },
                      ].map((item) => {
                        const isCurrent = progressStep === item.step;
                        const isDone = progressStep > item.step;
                        return (
                          <div
                            key={item.step}
                            className={`relative z-10 flex items-center justify-center sm:justify-start gap-1.5 rounded-lg px-2.5 sm:px-3 py-2 font-semibold text-center sm:text-left transition-all duration-500 ease-out ${
                              isCurrent
                                ? "text-[#fdfbf7] scale-[1.01]"
                                : isDone
                                ? "text-[#5ce1d6]"
                                : "text-[#7fa3bd]"
                            }`}
                          >
                            <span
                              className={`hidden sm:inline-block w-1.5 h-1.5 rounded-full shrink-0 transition-all duration-500 ${
                                isCurrent
                                  ? "bg-[#f5d48f] shadow-[0_0_8px_#f5d48f] scale-125"
                                  : isDone
                                  ? "bg-[#5ce1d6] shadow-[0_0_6px_#5ce1d6]"
                                  : "bg-[#7fa3bd]/40"
                              }`}
                              aria-hidden="true"
                            />
                            <span className="truncate">{item.label}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : null}

                {/* FEEDBACK MESSAGE BANNER */}
                {feedback.message ? (
                  <div
                    role={feedback.tone === "error" ? "alert" : "status"}
                    className={`mt-5 flex items-start gap-3 rounded-xl border p-4 text-sm font-medium ${
                      feedback.tone === "error"
                        ? "border-[#ff7b8b]/50 bg-[#2d1219]/90 text-[#ffd4d9]"
                        : "border-[#f5d48f]/40 bg-[#0c1d2b]/90 text-[#f5d48f]"
                    }`}
                  >
                    <InfoIcon className="w-5 h-5 shrink-0 mt-0.5" />
                    <span>{feedback.message}</span>
                  </div>
                ) : null}

                {/* CONVERSION RESULT SECTION */}
                {renderedResult ? (
                  <div
                    ref={resultSectionRef}
                    className="mt-7 pt-6 border-t border-[#f2d08b]/25 space-y-6 animate-tab-enter"
                  >
                    {/* Status Summary Card */}
                    <div className="rounded-2xl border border-[#48d6a4]/45 bg-gradient-to-br from-[#0e292d]/90 to-[#0a1c28]/95 p-5 shadow-lg">
                      <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
                        <div className="inline-flex flex-wrap items-center gap-2 text-sm font-extrabold text-[#48d6a4]">
                          <CheckCircleIcon className="w-5 h-5 shrink-0" />
                          <span>
                            {renderedResult.conversion.mode === "passthrough"
                              ? `QR sẵn sàng (Tương thích trực tiếp) · ${MODE_INFO[renderedResult.kind]?.title}`
                              : `Chuyển đổi hoàn tất · ${MODE_INFO[renderedResult.kind]?.title} (Bản Trung → Bản Global)`}
                          </span>
                          {renderedResult.source.title || renderedResult.source.share_id ? (
                            <span className="rounded-lg border border-[#5ce1d6]/35 bg-[#5ce1d6]/12 px-2.5 py-0.5 text-sm font-bold text-[#5ce1d6]">
                              {renderedResult.source.title ? `${renderedResult.source.title} ` : ""}
                              {renderedResult.source.gender === 1 || renderedResult.source.gender === "1"
                                ? "· Nữ "
                                : renderedResult.source.gender === 0 || renderedResult.source.gender === "0"
                                ? "· Nam "
                                : ""}
                              {renderedResult.source.share_id ? `#${renderedResult.source.share_id}` : ""}
                            </span>
                          ) : null}
                        </div>
                        {renderedResult.expText ? (
                          <span className="text-sm font-semibold text-[#f5d48f] bg-[#f5d48f]/12 border border-[#f5d48f]/30 rounded-full px-3 py-0.5">
                            {renderedResult.expText}
                          </span>
                        ) : null}
                      </div>

                      <StreamingWhiteContent
                        streamId={renderedResult.streamId}
                        compatText={renderedResult.compatText}
                        modelNote={renderedResult.modelNote}
                        warnings={renderedResult.warnings}
                      />
                    </div>

                    {/* QR Image & Download Actions */}
                    {renderedResult.qr.mode !== "none" && renderedResult.qrSrc ? (
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center rounded-2xl border border-[#f5d48f]/40 bg-[#091723]/90 p-5 sm:p-6">
                        <div className="md:col-span-5 flex flex-col items-center">
                          <div className="relative p-3 rounded-2xl border-2 border-[#f5d48f]/60 bg-white shadow-[0_12px_35px_rgba(0,0,0,0.5)]">
                            <img
                              src={renderedResult.qrSrc}
                              alt="Mã QR kết quả cho Bản Global"
                              width="240"
                              height="240"
                              className="w-48 h-48 sm:w-56 sm:h-56 object-contain"
                            />
                          </div>
                          <span className="mt-2.5 text-xs font-bold uppercase tracking-wider text-[#f5d48f]">
                            {renderedResult.qr.label}
                          </span>
                        </div>

                        <div className="md:col-span-7 space-y-4">
                          <div>
                            <h3 className="text-xl sm:text-2xl font-bold text-[#fdfbf7]">
                              {renderedResult.qr.title}
                            </h3>
                            <p className="text-sm text-[#d4e3ee] mt-1 leading-relaxed">
                              {renderedResult.qr.description}
                            </p>
                          </div>

                          <div className="flex flex-wrap items-center gap-3 pt-1">
                            <a
                              href={renderedResult.qrSrc}
                              download={`nth-global-${renderedResult.kind}-qr.png`}
                              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#f5d48f] to-[#dfb360] px-5 py-3 text-sm font-extrabold text-[#07131d] shadow hover:brightness-105 active:scale-95 transition"
                            >
                              <DownloadIcon className="w-4 h-4" />
                              <span>{renderedResult.qr.downloadLabel}</span>
                            </a>

                            {renderedResult.qr.copyURL ? (
                              <button
                                type="button"
                                onClick={() => triggerCopy(renderedResult.qr.copyURL, "qr-link")}
                                className="inline-flex items-center gap-2 rounded-xl border border-[#5ce1d6]/45 bg-[#5ce1d6]/12 px-4 py-3 text-sm font-bold text-[#5ce1d6] hover:bg-[#5ce1d6]/22 active:scale-95 transition cursor-pointer"
                              >
                                <CopyIcon className="w-4 h-4" />
                                <span>
                                  {copiedId === "qr-link" ? "Đã sao chép link QR!" : "Sao chép link QR"}
                                </span>
                              </button>
                            ) : null}

                            {renderedResult.payloadHref ? (
                              <a
                                href={renderedResult.payloadHref}
                                download
                                className="inline-flex items-center gap-2 rounded-xl border border-[#f2d08b]/30 bg-[#102436] px-4 py-3 text-xs font-bold text-[#d8e6f2] hover:border-[#f5d48f] hover:text-[#f5d48f] transition"
                              >
                                <DownloadIcon className="w-4 h-4" />
                                <span>Tải dữ liệu gốc</span>
                              </a>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    ) : null}

                    {/* DYE COLOR SWATCHES (For Hair, Top, Bottom) */}
                    {renderedResult.colors.length > 0 ? (
                      <div className="rounded-2xl border border-[#f2d08b]/30 bg-[#091723]/90 p-5 space-y-4">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div>
                            <h3 className="text-lg font-bold text-[#fdfbf7]">
                              Bảng màu RGBA đã tách ({renderedResult.colors.length} vùng)
                            </h3>
                            <p className="text-xs text-[#9fc0d6]">
                              Nhấn vào từng ô màu để sao chép mã HEX RGBA dùng trong Bản Global.
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              triggerCopy(
                                renderedResult.colors.map((c) => c.rgba).join("\n"),
                                "all-colors"
                              )
                            }
                            className="inline-flex items-center gap-1.5 rounded-xl border border-[#f5d48f]/40 bg-[#f5d48f]/12 px-3.5 py-2 text-xs font-bold text-[#f5d48f] hover:bg-[#f5d48f]/22 transition cursor-pointer"
                          >
                            <CopyIcon className="w-3.5 h-3.5" />
                            <span>
                              {copiedId === "all-colors" ? "Đã chép toàn bộ!" : "Sao chép tất cả"}
                            </span>
                          </button>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                          {renderedResult.colors.map((item, index) => {
                            const swatchId = `color-${index}`;
                            return (
                              <button
                                key={swatchId}
                                type="button"
                                onClick={() => triggerCopy(item.rgba, swatchId)}
                                className="group flex items-center gap-3 rounded-xl border border-[#f2d08b]/25 bg-[#0d1f2f] p-2.5 text-left hover:border-[#5ce1d6] active:scale-95 transition cursor-pointer"
                              >
                                <span
                                  className="w-9 h-9 rounded-lg border border-white/25 shrink-0 shadow-inner"
                                  style={{ backgroundColor: item.rgba.slice(0, 7) }}
                                />
                                <div className="min-w-0">
                                  <div className="text-xs font-bold text-[#fdfbf7] font-mono truncate">
                                    {item.rgba}
                                  </div>
                                  <div className="text-[11px] text-[#9fc0d6]">
                                    {copiedId === swatchId
                                      ? "Đã chép!"
                                      : item.slot !== undefined
                                      ? `Vùng ${item.slot}`
                                      : `Màu #${index + 1}`}
                                  </div>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ) : null}

                    {/* COLLAPSIBLE TECHNICAL DETAILS & COMPARISON TABLE */}
                    <details className="group rounded-2xl border border-[#f2d08b]/25 bg-[#08141f]/90 overflow-hidden">
                      <summary className="flex items-center justify-between gap-3 px-5 py-4 cursor-pointer select-none text-sm font-bold text-[#f5d48f] hover:bg-[#0e2233] transition">
                        <span>Chi tiết kỹ thuật & đối chiếu thông số (Bản Trung → Bản Global)</span>
                        <span className="text-xs text-[#5ce1d6] group-open:rotate-180 transition-transform">
                          ▼
                        </span>
                      </summary>

                      <div className="px-5 pb-5 pt-2 border-t border-[#f2d08b]/15 space-y-4">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          {renderedResult.summaryItems.map((item, idx) => (
                            <div
                              key={idx}
                              className="rounded-xl border border-[#f2d08b]/20 bg-[#0c1d2c] p-3"
                            >
                              <div className="text-[11px] text-[#9fc0d6] uppercase font-semibold">
                                {item.label}
                              </div>
                              <div className="text-sm font-bold text-[#fdfbf7] mt-0.5">
                                {item.value}
                              </div>
                            </div>
                          ))}
                        </div>

                        {renderedResult.rawControls.length > 0 ? (
                          <div className="overflow-x-auto rounded-xl border border-[#f2d08b]/20">
                            <table className="w-full text-left text-xs">
                              <thead className="bg-[#0f2436] text-[#f5d48f] uppercase">
                                <tr>
                                  <th className="py-2.5 px-3 font-bold">Thông số</th>
                                  <th className="py-2.5 px-3 font-bold">Bản Trung</th>
                                  <th className="py-2.5 px-3 font-bold">Bản Global</th>
                                  <th className="py-2.5 px-3 font-bold">Trạng thái</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-[#f2d08b]/10 text-[#d8e6f2]">
                                {renderedResult.rawControls.map((ctrl, idx) => (
                                  <tr key={idx} className="hover:bg-[#0e2233]/60">
                                    <td className="py-2 px-3 font-semibold text-[#fdfbf7]">
                                      {ctrl.label || ctrl.name || ctrl.field || `Thông số #${idx + 1}`}
                                    </td>
                                    <td className="py-2 px-3 font-mono">
                                      {formatValue(ctrl.source_value ?? ctrl.cn_value ?? ctrl.before)}
                                    </td>
                                    <td className="py-2 px-3 font-mono text-[#5ce1d6]">
                                      {formatValue(ctrl.target_value ?? ctrl.vng_value ?? ctrl.after)}
                                    </td>
                                    <td className="py-2 px-3">
                                      {ctrl.status || (ctrl.clamped ? "Đã giới hạn" : "Đã chuyển")}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ) : renderedResult.conversion.mode === "passthrough" ? (
                          <div className="rounded-xl border border-[#5ce1d6]/30 bg-[#0b1f2e] px-4 py-3 text-xs text-[#d8e6f2] leading-relaxed">
                            ✦ Mẫu thiết kế <strong className="text-[#f5d48f]">{renderedResult.source.title || `#${renderedResult.source.share_id || ""}`}</strong> sử dụng cấu trúc dữ liệu tương thích trực tiếp 1:1 với Bản Global. Toàn bộ thông số khuôn mặt gốc được giữ nguyên 100% mà không cần biến đổi hay làm tròn thanh trượt.
                          </div>
                        ) : null}
                      </div>
                    </details>
                  </div>
                ) : null}
              </section>
            )}
          </main>
        </div>
      </div>

      {/* FOOTER */}
      <footer className="relative z-10 mt-8 border-t border-[#f2d08b]/20 bg-[#07121c]/90 backdrop-blur-md py-5 px-4 text-center">
        <p className="text-xs sm:text-sm font-medium text-[#d8e6f2]">
          Dự án phi lợi nhuận vì cộng đồng Nghịch Thủy Hàn
        </p>
        <p className="text-xs font-bold text-[#f5d48f] mt-1 tracking-wide">
          Crafted with ♥ by Huynh Huynh
        </p>
      </footer>
    </div>
  );
}
export default App;
