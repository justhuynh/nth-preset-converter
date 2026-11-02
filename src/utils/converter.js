import jsQR from "jsqr";

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

export const MODE_INFO = Object.freeze({
  face: {
    id: "face",
    title: "QR mặt",
    subtitle: "Diện mạo & ngũ quan",
    label: "khuôn mặt",
    sample: "159868758",
    gallery: "Chọn mẫu mặt Bản Trung",
  },
  makeup: {
    id: "makeup",
    title: "Trang điểm",
    subtitle: "Son phấn & thần thái",
    label: "trang điểm",
    sample: "160500141",
    gallery: "Chọn mẫu trang điểm Bản Trung",
  },
  dye: {
    id: "dye",
    title: "Nhuộm màu",
    subtitle: "Tóc, áo & quần",
    label: "nhuộm màu",
    item: "trang phục",
    sample: "72616890",
    gallery: "Chọn mẫu nhuộm Bản Trung",
    category: "美发",
  },
  hair: {
    id: "hair",
    title: "Màu tóc",
    subtitle: "Nhuộm tóc & bảng màu",
    label: "màu tóc",
    item: "tóc",
    sample: "72616890",
    gallery: "Chọn mẫu tóc Bản Trung",
    category: "美发",
  },
  top: {
    id: "top",
    title: "Màu áo",
    subtitle: "Nhuộm thượng y",
    label: "màu áo",
    item: "áo",
    sample: "30831697",
    gallery: "Chọn mẫu áo Bản Trung",
    category: "上衫",
  },
  bottom: {
    id: "bottom",
    title: "Màu quần",
    subtitle: "Nhuộm hạ trang",
    label: "màu quần",
    item: "quần",
    sample: "30764065",
    gallery: "Chọn mẫu quần Bản Trung",
    category: "下衫",
  },
  photo: {
    id: "photo",
    title: "Chụp ảnh",
    subtitle: "Đoàn phim & góc máy",
    label: "chụp ảnh",
    sample: "40819780",
    gallery: "Chọn mẫu chụp ảnh Bản Trung",
    category: "拍照",
  },
});

export const MODES = Object.freeze([...Object.keys(MODE_INFO), "guide"]);

export const DYE_CATEGORIES = Object.freeze(["hair", "top", "bottom"]);
const DYE_MODES_SET = new Set(["dye", ...DYE_CATEGORIES]);
export const isDye = (kind) => DYE_MODES_SET.has(kind);

export function getDyeFallbackCategories(currentKind, error) {
  if (!DYE_CATEGORIES.includes(currentKind) || !error) return [];
  const code = error.code;
  const msg = typeof error.message === "string" ? error.message : "";

  if (code === "not_dye_design") {
    const mentionsHair = msg.includes("Màu tóc");
    const mentionsOutfit = msg.includes("Màu áo") || msg.includes("Màu quần");
    if (mentionsHair && !mentionsOutfit) {
      return currentKind === "hair" ? [] : ["hair"];
    }
    if (mentionsOutfit) {
      return ["top", "bottom"].filter((k) => k !== currentKind);
    }
  }

  if (code === "wrong_dye_category") {
    if (currentKind === "top") return ["bottom", "hair"];
    if (currentKind === "bottom") return ["top", "hair"];
    return ["top", "bottom"];
  }

  return [];
}

const ALLOWED_IMAGE_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);
const VALID_API_PATHS = new Set(["/api/config", "/api/convert"]);
const LOCAL_HOSTS = new Set(["127.0.0.1", "localhost", "[::1]"]);

const ROUTE_REGEX = Object.freeze({
  qr: /^\/api\/results\/[A-Za-z0-9_-]+\/qr\.png$/,
  preview: /^\/api\/results\/[A-Za-z0-9_-]+\/preview\.png$/,
  payload: /^\/f\/[A-Za-z0-9_-]+$/,
});

const RGBA_HEX_REGEX = /^#[\da-f]{8}$/i;
const VIETNAMESE_CHAR_REGEX = /[À-ỹ]/;
const CONTROL_NAME_REGEX = /^([A-Za-z][A-Za-z0-9_]{0,60})\s/;
const STRUCTURE_WEIGHT_REGEX = /^StructureWeight([1-8])$/;
const ARRAY_COMPAT_REGEX = /^The (face controller|face style|body controller) array has (\d{1,6}) encoded values/;
const UNKNOWN_FIELDS_REGEX = /^Unrecognized face fields were preserved: ([\d, ]+)$/;

export function apiOrigin(value, pageOrigin) {
  const url = new URL(value || pageOrigin);
  const local = url.protocol === "http:" && LOCAL_HOSTS.has(url.hostname);
  if (
    (url.protocol !== "https:" && !local) ||
    url.username ||
    url.password ||
    url.pathname !== "/" ||
    url.search ||
    url.hash
  ) {
    throw new Error("Địa chỉ máy chủ chưa hợp lệ.");
  }
  return url.origin;
}

export function apiURL(path, origin) {
  if (!VALID_API_PATHS.has(path)) {
    throw new Error("Đường dẫn API không hợp lệ.");
  }
  return apiOrigin(origin, origin) + path;
}

export function apiRequest(path, origin, options = {}, fetchImpl = fetch) {
  return fetchImpl(apiURL(path, origin), {
    ...options,
    mode: "cors",
    credentials: "omit",
    redirect: "error",
  });
}

export function unwrapResult(value) {
  if (value && typeof value === "object" && value.result && typeof value.result === "object") {
    return value.result;
  }
  return value && typeof value === "object" ? value : {};
}

export function localResultURL(value, origin, kind) {
  if (typeof value !== "string" || !value) return null;
  if (value.includes("\\") || /\/\.{1,2}(?:\/|$)/.test(value) || /%2e/i.test(value)) {
    return null;
  }
  try {
    const base = new URL(origin || "http://127.0.0.1:8080");
    const url = new URL(value, base.origin);
    const route = ROUTE_REGEX[kind];
    if (!route) return null;
    if (
      url.username ||
      url.password ||
      !/^https?:$/.test(url.protocol) ||
      !route.test(url.pathname)
    ) {
      return null;
    }
    return url.pathname;
  } catch {
    return null;
  }
}

export function hostedResultURL(value, origin, kind) {
  try {
    const baseOrigin = apiOrigin(origin, origin);
    const url = new URL(value, baseOrigin);
    if (url.username || url.password || url.search || url.hash) return null;
    const path = localResultURL(value, baseOrigin, kind);
    return path ? baseOrigin + path : null;
  } catch {
    return null;
  }
}

export function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Không đọc được ảnh. Vui lòng chọn ảnh khác."));
    reader.onabort = () => reject(new DOMException("Đã hủy", "AbortError"));
    reader.readAsDataURL(file);
  });
}

export function inputBody(value) {
  const input = String(value || "").trim();
  if (!input) throw new Error("Dán link hoặc nội dung chia sẻ.");
  if (input.length > 12000) {
    throw new Error("Nội dung quá dài. Chỉ giữ phần chia sẻ cần chuyển.");
  }
  return { input };
}

export function imageError(file, limit = MAX_IMAGE_BYTES) {
  if (!file || !file.size) {
    return "Ảnh rỗng. Vui lòng chọn một ảnh mã QR khác.";
  }
  const max = Math.min(MAX_IMAGE_BYTES, Number(limit) > 0 ? Number(limit) : MAX_IMAGE_BYTES);
  if (file.size > max) {
    return (
      "Ảnh quá lớn. Vui lòng chọn ảnh tối đa " +
      (max === MAX_IMAGE_BYTES ? "5 MB" : Math.round(max / 1024) + " KB") +
      "."
    );
  }
  if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
    return "Vui lòng chọn ảnh PNG, JPG hoặc WebP.";
  }
  return null;
}

export function publicURL(value) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password ? url.href : null;
  } catch {
    return null;
  }
}

export async function decodeQrFromImageFile(file) {
  if (!file || typeof document === "undefined") return null;

  // Try native BarcodeDetector first if supported
  if (typeof window !== "undefined" && "BarcodeDetector" in window) {
    try {
      const detector = new window.BarcodeDetector({ formats: ["qr_code"] });
      const bitmap = await createImageBitmap(file);
      try {
        const codes = await detector.detect(bitmap);
        const found = codes?.find((c) => c?.rawValue && String(c.rawValue).trim());
        if (found) return String(found.rawValue).trim();
      } finally {
        bitmap.close?.();
      }
    } catch {
      /* fallback to jsQR */
    }
  }

  return new Promise((resolve) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const w = img.naturalWidth || img.width;
      const h = img.naturalHeight || img.height;
      if (!w || !h) {
        resolve(null);
        return;
      }

      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) {
        resolve(null);
        return;
      }

      // Regions: full image, then 4 corners + center (for full game screenshots with corner QR)
      const regions = [
        { sx: 0, sy: 0, sw: w, sh: h, maxDim: 1200 },
        { sx: Math.floor(w * 0.55), sy: Math.floor(h * 0.55), sw: Math.ceil(w * 0.45), sh: Math.ceil(h * 0.45), maxDim: 900 },
        { sx: 0, sy: Math.floor(h * 0.55), sw: Math.ceil(w * 0.45), sh: Math.ceil(h * 0.45), maxDim: 900 },
        { sx: Math.floor(w * 0.55), sy: 0, sw: Math.ceil(w * 0.45), sh: Math.ceil(h * 0.45), maxDim: 900 },
        { sx: 0, sy: 0, sw: Math.ceil(w * 0.45), sh: Math.ceil(h * 0.45), maxDim: 900 },
        { sx: Math.floor(w * 0.2), sy: Math.floor(h * 0.2), sw: Math.ceil(w * 0.6), sh: Math.ceil(h * 0.6), maxDim: 900 },
      ];

      for (const r of regions) {
        if (r.sw < 24 || r.sh < 24) continue;
        const scale = Math.min(1, r.maxDim / Math.max(r.sw, r.sh));
        const dw = Math.max(1, Math.round(r.sw * scale));
        const dh = Math.max(1, Math.round(r.sh * scale));
        canvas.width = dw;
        canvas.height = dh;
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, dw, dh);
        ctx.drawImage(img, r.sx, r.sy, r.sw, r.sh, 0, 0, dw, dh);
        const imageData = ctx.getImageData(0, 0, dw, dh);
        const code = jsQR(imageData.data, dw, dh, { inversionAttempts: "attemptBoth" });
        if (code && code.data && String(code.data).trim()) {
          resolve(String(code.data).trim());
          return;
        }
      }
      resolve(null);
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(null);
    };
    img.src = objectUrl;
  });
}

export function qrPresentation(resultOrData, origin, kind = "face") {
  const result = unwrapResult(resultOrData);
  const imageURL = localResultURL(result.qr_image_url, origin, "qr");
  const copyURL =
    publicURL(result.qr_url) ||
    (result.payload_url ? hostedResultURL(result.payload_url, origin, "payload") : null);
  if ((result.ready_for_game === true || imageURL) && imageURL) {
    if (kind === "photo") {
      return {
        mode: "ready",
        imageURL,
        copyURL,
        label: "QR chụp ảnh · thử nghiệm",
        title: "Tải QR chụp ảnh cho Bản Global",
        description:
          "Nhập ảnh QR tại giao diện Đoàn phim của Bản Global để thử thiết lập môi trường và góc máy. Kiểm tra kết quả và chọn lại tư thế nếu cần.",
        downloadLabel: "Tải QR",
      };
    }
    if (isDye(kind)) {
      const info = MODE_INFO[kind] || MODE_INFO.dye;
      return {
        mode: "ready",
        imageURL,
        copyURL,
        label: "QR " + info.label + " đã tạo",
        title: "Tải QR " + info.label + " cho Bản Global",
        description:
          "Nhập QR trong phần nhuộm " +
          (info.item || "trang phục") +
          " của Bản Global. Kiểm tra vật phẩm và màu trong game trước khi lưu.",
        downloadLabel: "Tải QR",
      };
    }
    return {
      mode: "ready",
      imageURL,
      copyURL,
      label: kind === "makeup" ? "QR trang điểm đã tạo" : "QR đã tạo",
      title: kind === "makeup" ? "Tải QR trang điểm cho Bản Global" : "Tải QR, nhập vào game",
      description:
        kind === "makeup"
          ? "Trong Bản Global, chọn mục Trang điểm ở phía dưới khi nhập QR để giữ khuôn mặt và cơ thể hiện tại."
          : "Chọn ảnh này trong mục nhập khuôn mặt của Bản Global.",
      downloadLabel: "Tải QR",
    };
  }

  const previewImage = localResultURL(result.preview_qr_image_url, origin, "preview");
  let validPreview = false;
  try {
    const url = new URL(result.preview_qr_url);
    validPreview =
      url.protocol === "http:" &&
      LOCAL_HOSTS.has(url.hostname) &&
      !url.username &&
      !url.password &&
      ROUTE_REGEX.payload.test(url.pathname);
  } catch {
    /* ignore */
  }
  if (result.ready_for_game !== true && previewImage && (validPreview || previewImage)) {
    return {
      mode: "preview",
      imageURL: previewImage,
      copyURL: null,
      label: "Chỉ dùng để xem trước",
      title: "QR xem trước — chưa nhập được vào game",
      description: "QR cục bộ cần HTTPS công khai để nhập trong game.",
      downloadLabel: "Tải QR xem trước",
    };
  }
  return { mode: "none", imageURL: null, copyURL: null };
}

const CONTROL_LABELS = Object.freeze({
  SkinHue: "Sắc độ da",
  SkinSaturation: "Độ bão hòa màu da",
  SkinLightness: "Độ sáng da",
  PupilSize: "Kích thước đồng tử",
  IrisSize: "Kích thước mống mắt",
  SkinGloss: "Độ bóng da",
  SkinWrinkleIntensity: "Độ đậm nếp nhăn",
  SkinDetail: "Chi tiết da",
  EyeSpecularBrightness: "Độ sáng phản chiếu mắt",
  EyeReflectionInstensity: "Cường độ phản chiếu mắt",
  EyeShadowIntensity: "Độ đậm phấn mắt",
  EyeShadowSpecularIntensity: "Cường độ phản sáng phấn mắt",
  EyeShadowGlitterScale: "Kích thước nhũ mắt",
  EyeShadowSpecularScale: "Kích thước phản sáng phấn mắt",
  EyeShadowSpecularBrightness: "Độ sáng phản sáng phấn mắt",
  EyelashLength: "Độ dài mi",
  EyelashDense: "Độ dày mi",
  EyebrowBaseDense: "Độ đậm nền lông mày",
  EyelashRotate: "Góc xoay mi",
  EyelashWidth: "Độ rộng mi",
  EyelashHeight: "Độ cao mi",
  EyelashPosX: "Vị trí ngang của mi",
  EyelashPosY: "Vị trí dọc của mi",
  EyebrowDense: "Độ đậm lông mày",
  EyelineDense: "Độ đậm viền mắt",
  BlusherDensity: "Độ đậm má hồng",
  BlusherPosX: "Vị trí ngang má hồng",
  BlusherPosY: "Vị trí dọc má hồng",
  BlusherRotate: "Góc xoay má hồng",
  BlusherSpecularDensity: "Độ đậm phản sáng má hồng",
  BlusherSpecularScale: "Kích thước phản sáng má hồng",
  BlusherSpecularBrightness: "Độ sáng phản sáng má hồng",
  LipsDensity: "Độ đậm màu môi",
  LipsGloss: "Độ bóng môi",
  LipsSpecularDensity: "Độ đậm phản sáng môi",
  LipsSpecularScale: "Kích thước phản sáng môi",
  LipsSpecularBrightness: "Độ sáng phản sáng môi",
  LipsBumpIntensity: "Cường độ vân môi",
  TattooDense: "Độ đậm hình xăm",
  TattooRotate: "Góc xoay hình xăm",
  TattooPosX: "Vị trí ngang hình xăm",
  TattooPosY: "Vị trí dọc hình xăm",
  TattooScaleX: "Tỉ lệ ngang hình xăm",
  TattooScaleY: "Tỉ lệ dọc hình xăm",
  LongBeardDense: "Độ đậm râu dài",
  LongBeardRate: "Tỉ lệ râu dài",
  BronzerDensity: "Độ đậm tạo khối",
  Tattoo2Dense: "Độ đậm hình xăm thứ hai",
  Tattoo2Rotate: "Góc xoay hình xăm thứ hai",
  Tattoo2PosX: "Vị trí ngang hình xăm thứ hai",
  Tattoo2PosY: "Vị trí dọc hình xăm thứ hai",
  Tattoo2ScaleX: "Tỉ lệ ngang hình xăm thứ hai",
  Tattoo2ScaleY: "Tỉ lệ dọc hình xăm thứ hai",
  SkinTypeIntensity: "Cường độ kiểu da",
});

function controlLabel(message) {
  const name = (CONTROL_NAME_REGEX.exec(message) || [])[1]?.replace(/_Abs$/, "");
  if (name && CONTROL_LABELS[name]) return CONTROL_LABELS[name];
  const structure = STRUCTURE_WEIGHT_REGEX.exec(name || "");
  return structure ? "Trọng số cấu trúc " + structure[1] : "Thông số này";
}

function warningText(warning) {
  const message = typeof warning.message === "string" ? warning.message : "";
  const label = controlLabel(message);
  switch (warning.code) {
    case "partial_compatibility":
      return "Đã chuyển 49 thông số trang điểm có đối chiếu. Mẫu nền, kiểu dáng, cơ thể và các thông số mới vẫn có thể hiển thị khác giữa hai phiên bản.";
    case "unsupported_control":
      return label + " có giá trị mới nhưng chưa xác định được cách đổi sang Bản Global. Công cụ giữ nguyên dữ liệu gốc.";
    case "china_only_control":
      return label + " chưa có thông số tương ứng trong Bản Global. Dữ liệu được giữ nguyên và có thể không được game áp dụng.";
    case "clamped_control":
      return label + " nằm ngoài khoảng hỗ trợ của Bản Global và đã được giới hạn về giá trị gần nhất có thể biểu diễn.";
    case "array_compatibility": {
      const match = ARRAY_COMPAT_REGEX.exec(message);
      if (!match) {
        return "Một mảng dữ liệu vượt giới hạn của phiên bản cũ. Công cụ giữ nguyên mảng; game có thể không sử dụng toàn bộ dữ liệu.";
      }
      const labels = {
        "face controller": "điều chỉnh khuôn mặt",
        "face style": "kiểu khuôn mặt",
        "body controller": "điều chỉnh cơ thể",
      };
      return (
        "Mảng " +
        labels[match[1]] +
        " có " +
        match[2] +
        " giá trị, vượt giới hạn của phiên bản cũ. Công cụ giữ nguyên mảng; game có thể không sử dụng toàn bộ dữ liệu."
      );
    }
    case "unknown_fields_preserved": {
      const match = UNKNOWN_FIELDS_REGEX.exec(message);
      const ids = match
        ? match[1]
            .split(",")
            .map((x) => x.trim())
            .filter((x) => /^\d{1,5}$/.test(x))
        : [];
      const detail = ids.length
        ? " (mã " +
          ids.slice(0, 16).join(", ") +
          (ids.length > 16 ? " và " + (ids.length - 16) + " mã khác" : "") +
          ")"
        : "";
      return (
        "Đã giữ nguyên các thông số chưa nhận diện" +
        detail +
        ". Chưa xác nhận được tác dụng của chúng trong Bản Global."
      );
    }
    case "public_url_required":
      return "Để nhập dữ liệu đã chuyển đổi vào game, cần địa chỉ HTTPS công khai. QR cục bộ chỉ dùng để xem trước; bạn vẫn có thể tải dữ liệu.";
    default:
      return VIETNAMESE_CHAR_REGEX.test(message)
        ? message
        : "Máy chủ có lưu ý bổ sung về mức độ tương thích. Hãy kiểm tra diện mạo sau khi nhập trong game.";
  }
}

export function warningMessages(...groups) {
  return [
    ...new Set(
      groups
        .flat()
        .map((x) => (typeof x === "string" ? { message: x } : x))
        .filter((x) => x && typeof x.message === "string" && x.message.trim())
        .map(warningText)
    ),
  ];
}

const LENS_LABELS = Object.freeze({
  FOV: "góc nhìn",
  DOF: "độ sâu trường ảnh",
  Bloom: "quầng sáng",
  Exposure: "phơi sáng",
  Contrast: "độ tương phản",
  Saturation: "độ bão hòa",
  Focus: "lấy nét",
  Vignette: "tối góc",
  Temperature: "nhiệt độ màu",
  Tint: "sắc độ",
});

export function photoWarningMessages(conversion = {}) {
  const messages = warningMessages(
    Array.isArray(conversion?.warnings) ? conversion.warnings.slice(0, 3) : []
  );
  const fields = (key) =>
    Array.isArray(conversion?.[key])
      ? conversion[key].filter((x) => typeof x === "string" && x)
      : [];
  const omitted = new Set(fields("omitted_fields"));
  if (omitted.size) {
    const parts = [];
    const has = (...keys) => keys.some((key) => omitted.has(key));
    if (has("UGCLevelId", "UGCLevelWorkId")) parts.push("cảnh UGC");
    if (has("SceneID", "TargetPos")) parts.push("cảnh và vị trí chụp");
    if (has("Direction", "MainPlayerDirection")) parts.push("hướng đứng của nhân vật");
    if (has("ExpressionID", "ExpressionPauseTime", "DiyExpressionUrl")) {
      parts.push("động tác và biểu cảm");
    }
    if (has("LookAtPos")) parts.push("hướng nhìn của nhân vật");
    messages.push(
      (parts.length
        ? "Chưa chuyển " + parts.join(", ") + ". "
        : "Một số thông tin của mẫu gốc chưa được chuyển. ") +
        "Xem phạm vi đầy đủ trong Chi tiết chuyển đổi."
    );
  }
  const disabled = fields("disabled_lens_fields");
  if (disabled.length) {
    const labels = [
      ...new Set(
        disabled.map((key) =>
          Object.hasOwn(LENS_LABELS, key) ? LENS_LABELS[key] : "một số hiệu ứng khác"
        )
      ),
    ];
    messages.push(
      "Các hiệu ứng không có trong mã đã được tắt: " +
        labels.join(", ") +
        ". Bạn có thể bật lại và chỉnh trong game."
    );
  }
  if (fields("inherited_lighting_fields").length) {
    messages.push(
      "Một số thiết lập ánh sáng không có trong mã sẽ dùng thiết lập ban đầu của Bản Global; hãy kiểm tra và chỉnh lại nếu cần."
    );
  }
  if (fields("suppressed_light_fields").length) {
    messages.push(
      "Các đèn tắt trong mẫu gốc được giữ ở mức không phát sáng để hạn chế việc Bản Global tự bật lại."
    );
  }
  return messages;
}

export function faceModelNotice(conversion) {
  if (
    conversion.model_changed === true &&
    conversion.source_face_type === "230face07" &&
    conversion.target_face_type === "230face02" &&
    conversion.face_parameters_preserved === true
  ) {
    return "Bản Trung nam07 → Bản Global nam02. Giữ nguyên 100% giá trị thanh trượt mặt; khác model nên hình dáng có thể khác.";
  }
  return conversion.model_changed === true &&
    conversion.source_face_type === "233face07" &&
    conversion.target_face_type === "233face05" &&
    conversion.face_parameters_preserved === true
    ? "Bản Trung nữ07 → Bản Global nữ05. Giữ nguyên 100% giá trị thanh trượt mặt; khác model nên hình dáng có thể khác."
    : "";
}

export function compatibilitySummary(conversion = {}, resultOrData = {}, kind = "face") {
  const result = unwrapResult(resultOrData);
  if (kind === "photo") {
    return "Chỉ chuyển các thiết lập chụp ảnh đã hỗ trợ; không kèm cảnh UGC, động tác hay biểu cảm. Chưa kiểm chứng độ giống trong game.";
  }
  if (isDye(kind)) {
    return (
      "Màu có thể hiển thị khác tùy chất liệu và vùng nhuộm của vật phẩm." +
      (result.in_game_verified === true ? "" : " Chưa kiểm chứng trong game.")
    );
  }
  const parts = [];
  const slots = (value) =>
    Array.isArray(value) ? value.filter((item) => item && Number.isInteger(item.slot)) : [];
  const replacements = slots(conversion.style_replacements);
  if (replacements.length) {
    parts.push(replacements.length + " kiểu trang điểm về mặc định Bản Global.");
  }
  const omitted = slots(conversion.omitted_style_slots);
  const skinTypes = omitted.filter((item) => item.slot === 22 && item.name === "SkinType");
  if (skinTypes.length) parts.push("Bỏ lớp da riêng của Bản Trung.");
  const otherLayers = omitted.length - skinTypes.length;
  if (otherLayers) parts.push(otherLayers + " lớp riêng của Bản Trung đã được bỏ.");
  const materialFallback =
    Array.isArray(conversion.material_fallbacks) &&
    conversion.material_fallbacks.some(
      (item) =>
        item &&
        item.policy === "vng_default_material" &&
        Number.isInteger(item.source_field) &&
        item.source_field >= 142 &&
        item.source_field <= 148
    );
  if (materialFallback) parts.push("Chi tiết bề mặt da dùng mặc định Bản Global.");
  const eye = conversion.eye_reflection_adjustment;
  if (
    conversion.target_client === "vng_pc" &&
    eye?.target_client === "vng_pc" &&
    eye.profile === "vng-pc-hdr08-20261024" &&
    eye.style_id === 10008 &&
    eye.approximate === true &&
    Number.isInteger(eye.before_encoded) &&
    Number.isInteger(eye.after_encoded) &&
    eye.before_encoded <= 255 &&
    eye.after_encoded >= 0 &&
    eye.after_encoded < eye.before_encoded
  ) {
    parts.push("Phản quang mắt đã hiệu chuẩn gần đúng cho Bản Global.");
  }
  if (conversion.mode === "passthrough") {
    parts.push(
      "Mẫu gốc tương thích trực tiếp 100% với Bản Global (giữ nguyên toàn bộ thông số gốc, không cần biến đổi thanh trượt)."
    );
  }
  if (kind !== "makeup" && conversion.body_policy === "vng_default") {
    parts.push("Thân về mặc định Bản Global.");
  }
  if (kind === "makeup") parts.push("Hãy xem trước trang điểm trong game trước khi lưu.");
  else if (result.in_game_verified !== true) parts.push("Chưa kiểm chứng trong game.");
  return parts.join(" ");
}

export function expiryNote(resultOrData) {
  const result = unwrapResult(resultOrData);
  const expires = result.expires_at ? new Date(result.expires_at) : null;
  const date =
    expires && Number.isFinite(expires.getTime())
      ? new Intl.DateTimeFormat("vi-VN", { dateStyle: "short", timeStyle: "short" }).format(expires)
      : null;
  if (result.delivery === "source") {
    return (
      (date ? "Link tải trên trang hết hạn " + date + ". " : "") +
      "QR gốc do NetEase quản lý thời hạn."
    );
  }
  if (!date) return "";
  if (result.ready_for_game !== true && result.preview_qr_image_url) {
    return "Link xem trước và tải dữ liệu hết hạn " + date + ".";
  }
  return result.ready_for_game === true
    ? "QR hết hạn " + date + ". Chuyển lại khi cần."
    : "Link tải dữ liệu hết hạn " + date + ".";
}

const KNOWN_ERRORS = Object.freeze({
  invalid_payload:
    "Dữ liệu khuôn mặt không hợp lệ hoặc vượt giới hạn định dạng. Vui lòng thử lại với mã chia sẻ gốc.",
  unsupported_schema:
    "Phiên bản hoặc cấu trúc dữ liệu này chưa được hỗ trợ. Công cụ chưa tạo kết quả chuyển đổi.",
  unsupported_format:
    "Định dạng dữ liệu này chưa được hỗ trợ. Vui lòng thử với mã chia sẻ khuôn mặt gốc.",
  payload_too_large:
    "Dữ liệu khuôn mặt vượt kích thước cho phép. Vui lòng kiểm tra lại mã nguồn.",
  request_too_large: "Nội dung gửi lên vượt giới hạn 8 MB. Hãy chọn ảnh QR nhỏ hơn.",
  unsupported_dye_item:
    "Vật phẩm này chưa được hỗ trợ chuyển màu sang Bản Global. Vui lòng chọn mẫu khác.",
  wrong_dye_category:
    "Mã không thuộc phân loại đang chọn. Hãy chọn đúng Màu tóc, Màu áo hoặc Màu quần trong mục Nhuộm màu rồi chuyển lại.",
  incompatible_dye_channels:
    "Vùng nhuộm của hai vật phẩm chưa tương thích. Công cụ chưa tạo QR; vui lòng chọn mẫu khác.",
  invalid_dye_mode: "Chọn Mẫu mặc định hoặc Giữ mẫu gốc rồi thử lại.",
});

const PHOTO_ERROR_CODES = new Set([
  "invalid_payload",
  "unsupported_format",
  "payload_too_large",
  "invalid_link",
  "unsupported_link",
  "upstream_too_large",
]);

const DYE_ERROR_CODES = new Set(["invalid_payload", "unsupported_format", "payload_too_large"]);

export function apiErrorMessage(error, kind = "face") {
  if (kind === "photo" && PHOTO_ERROR_CODES.has(error?.code)) {
    return "Dữ liệu chụp ảnh không hợp lệ hoặc chưa được hỗ trợ. Hãy dùng link thiết kế hoặc ảnh chứa QR chụp ảnh Bản Trung.";
  }
  if (isDye(kind) && DYE_ERROR_CODES.has(error?.code)) {
    return (
      "Dữ liệu " +
      MODE_INFO[kind].label +
      " không hợp lệ hoặc chưa được hỗ trợ. Kiểm tra đúng loại mã rồi thử lại."
    );
  }
  if (KNOWN_ERRORS[error?.code]) return KNOWN_ERRORS[error.code];
  return typeof error?.message === "string" && VIETNAMESE_CHAR_REGEX.test(error.message)
    ? error.message
    : "Chưa thể xử lý dữ liệu này. Vui lòng kiểm tra mã nguồn và thử lại.";
}

export function formatValue(value) {
  if (value === null || value === undefined) return "—";
  if (typeof value === "number") {
    return new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 6 }).format(value);
  }
  if (typeof value === "string" || typeof value === "boolean") return String(value);
  return JSON.stringify(value);
}

export function extractValidColors(conversion) {
  return Array.isArray(conversion?.colors)
    ? conversion.colors
        .filter((color) => color && typeof color.rgba === "string" && RGBA_HEX_REGEX.test(color.rgba))
        .slice(0, 64)
    : [];
}
