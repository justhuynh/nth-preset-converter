import jsQR from "jsqr";
import QRCode from "qrcode";

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

export async function generateClientQrDataURL(text) {
  if (!text || typeof text !== "string") return null;
  try {
    return await QRCode.toDataURL(text.trim(), {
      width: 480,
      margin: 2,
      errorCorrectionLevel: "M",
      color: {
        dark: "#000000",
        light: "#ffffff",
      },
    });
  } catch {
    return null;
  }
}

export const MODE_INFO_VI = Object.freeze({
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

export const MODE_INFO_EN = Object.freeze({
  face: {
    id: "face",
    title: "Face QR",
    subtitle: "Facial sculpting & features",
    label: "face preset",
    sample: "159868758",
    gallery: "Browse CN Face Gallery",
  },
  makeup: {
    id: "makeup",
    title: "Makeup",
    subtitle: "Cosmetics & aura",
    label: "makeup preset",
    sample: "160500141",
    gallery: "Browse CN Makeup Gallery",
  },
  dye: {
    id: "dye",
    title: "Dyeing",
    subtitle: "Hair, top & bottom",
    label: "dye preset",
    item: "outfit",
    sample: "72616890",
    gallery: "Browse CN Dye Gallery",
    category: "美发",
  },
  hair: {
    id: "hair",
    title: "Hair Dye",
    subtitle: "Hair dye & palette",
    label: "hair dye",
    item: "hair",
    sample: "72616890",
    gallery: "Browse CN Hair Gallery",
    category: "美发",
  },
  top: {
    id: "top",
    title: "Top Dye",
    subtitle: "Upper garment dye",
    label: "top dye",
    item: "top",
    sample: "30831697",
    gallery: "Browse CN Top Gallery",
    category: "上衫",
  },
  bottom: {
    id: "bottom",
    title: "Bottom Dye",
    subtitle: "Lower garment dye",
    label: "bottom dye",
    item: "bottom",
    sample: "30764065",
    gallery: "Browse CN Bottom Gallery",
    category: "下衫",
  },
  photo: {
    id: "photo",
    title: "Photo Mode",
    subtitle: "Studio & camera preset",
    label: "photo preset",
    sample: "40819780",
    gallery: "Browse CN Photo Gallery",
    category: "拍照",
  },
});

export const MODE_INFO = MODE_INFO_VI;

export function getModeInfo(lang = "vi") {
  return lang === "en" ? MODE_INFO_EN : MODE_INFO_VI;
}

export const MODES = Object.freeze([...Object.keys(MODE_INFO_VI), "guide"]);

export const DYE_CATEGORIES = Object.freeze(["hair", "top", "bottom"]);
const DYE_MODES_SET = new Set(["dye", ...DYE_CATEGORIES]);
export const isDye = (kind) => DYE_MODES_SET.has(kind);

export function getDyeFallbackCategories(currentKind, error) {
  if (!DYE_CATEGORIES.includes(currentKind) || !error) return [];
  const code = error.code;
  const msg = typeof error.message === "string" ? error.message : "";

  if (code === "not_dye_design") {
    const mentionsHair = msg.includes("Màu tóc") || /hair/i.test(msg);
    const mentionsOutfit =
      msg.includes("Màu áo") || msg.includes("Màu quần") || /top|bottom|outfit/i.test(msg);
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
const ARRAY_COMPAT_REGEX =
  /^The (face controller|face style|body controller) array has (\d{1,6}) encoded values/;
const UNKNOWN_FIELDS_REGEX = /^Unrecognized face fields were preserved: ([\d, ]+)$/;
const STYLE_DEFAULTED_VI_REGEX =
  /^Style (\d+) ở vị trí (\d+) chưa có trong VNG; đã thay bằng mẫu mặc định (\d+)/i;

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
    throw new Error("Invalid server origin.");
  }
  return url.origin;
}

export function apiURL(path, origin) {
  if (!VALID_API_PATHS.has(path)) {
    throw new Error("Invalid API path.");
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

export function readFileAsDataURL(file, lang = "vi") {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () =>
      reject(
        new Error(
          lang === "en"
            ? "Could not read the image file. Please select another image."
            : "Không đọc được ảnh. Vui lòng chọn ảnh khác."
        )
      );
    reader.onabort = () =>
      reject(new DOMException(lang === "en" ? "Aborted" : "Đã hủy", "AbortError"));
    reader.readAsDataURL(file);
  });
}

export function inputBody(value, lang = "vi") {
  const input = String(value || "").trim();
  if (!input) {
    throw new Error(
      lang === "en"
        ? "Please paste a share link, preset text, or design ID."
        : "Dán link hoặc nội dung chia sẻ."
    );
  }
  if (input.length > 12000) {
    throw new Error(
      lang === "en"
        ? "Input is too long. Please keep only the share text or ID needed."
        : "Nội dung quá dài. Chỉ giữ phần chia sẻ cần chuyển."
    );
  }
  return { input };
}

export function imageError(file, limit = MAX_IMAGE_BYTES, lang = "vi") {
  if (!file || !file.size) {
    return lang === "en"
      ? "The image file is empty. Please choose another QR image."
      : "Ảnh rỗng. Vui lòng chọn một ảnh mã QR khác.";
  }
  const max = Math.min(MAX_IMAGE_BYTES, Number(limit) > 0 ? Number(limit) : MAX_IMAGE_BYTES);
  if (file.size > max) {
    const sizeText = max === MAX_IMAGE_BYTES ? "5 MB" : Math.round(max / 1024) + " KB";
    return lang === "en"
      ? `Image is too large. Please select an image up to ${sizeText}.`
      : `Ảnh quá lớn. Vui lòng chọn ảnh tối đa ${sizeText}.`;
  }
  if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
    return lang === "en"
      ? "Please select a PNG, JPG, or WebP image."
      : "Vui lòng chọn ảnh PNG, JPG hoặc WebP.";
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

export function qrPresentation(resultOrData, origin, kind = "face", lang = "vi", source = null) {
  const result = unwrapResult(resultOrData);
  const modeMap = getModeInfo(lang);
  const serverImageURL = localResultURL(result.qr_image_url, origin, "qr");
  const clientDataURL =
    typeof result.client_qr_data_url === "string" &&
    result.client_qr_data_url.startsWith("data:image/png;base64,")
      ? result.client_qr_data_url
      : null;
  const imageURL = serverImageURL || clientDataURL;
  const copyURL =
    publicURL(result.qr_url) ||
    (result.payload_url ? hostedResultURL(result.payload_url, origin, "payload") : null) ||
    publicURL(source?.original_url);
  if (clientDataURL && !serverImageURL) {
    return lang === "en"
      ? {
          mode: "palette",
          imageURL: clientDataURL,
          copyURL: null,
          label: "Palette QR · Generated locally",
          title: "Download Dye Palette QR",
          description:
            "The server returned a color palette only (no in-game QR). This QR encodes the RGBA palette as text so you can save/share it and enter the colors manually in the Global Server. It is not importable in-game.",
          downloadLabel: "Download QR",
        }
      : {
          mode: "palette",
          imageURL: clientDataURL,
          copyURL: null,
          label: "QR bảng màu · Tạo cục bộ",
          title: "Tải QR bảng màu nhuộm",
          description:
            "Máy chủ chỉ trả về bảng màu (không có QR nhập game). QR này mã hóa bảng màu RGBA dạng văn bản để bạn lưu/chia sẻ và nhập màu thủ công trong Bản Global. Không thể quét để nhập trực tiếp vào game.",
          downloadLabel: "Tải QR",
        };
  }
  if ((result.ready_for_game === true || imageURL) && imageURL) {
    if (kind === "photo") {
      return lang === "en"
        ? {
            mode: "ready",
            imageURL,
            copyURL,
            label: "Photo QR · Experimental",
            title: "Download Photo QR for Global Server",
            description:
              "Import this QR image in the Studio / Film Crew interface of the Global Server to apply camera & lighting settings. Review and adjust poses if needed.",
            downloadLabel: "Download QR",
          }
        : {
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
      const info = modeMap[kind] || modeMap.dye;
      return lang === "en"
        ? {
            mode: "ready",
            imageURL,
            copyURL,
            label: `${info.title} QR Ready`,
            title: `Download ${info.title} QR for Global Server`,
            description: `Import this QR in the ${
              info.item || "outfit"
            } dyeing menu of the Global Server. Preview the item and color channels in-game before saving.`,
            downloadLabel: "Download QR",
          }
        : {
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
    return lang === "en"
      ? {
          mode: "ready",
          imageURL,
          copyURL,
          label: kind === "makeup" ? "Makeup QR Ready" : "Face QR Ready",
          title:
            kind === "makeup"
              ? "Download Makeup QR for Global Server"
              : "Download QR & Import In-Game",
          description:
            kind === "makeup"
              ? "In the Global Server, select the Makeup option at the bottom when importing the QR to keep your current face and body sculpting."
              : "Select this QR image in the face import menu of the Global Server.",
          downloadLabel: "Download QR",
        }
      : {
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
    return lang === "en"
      ? {
          mode: "preview",
          imageURL: previewImage,
          copyURL: null,
          label: "Preview Only",
          title: "Preview QR — Cannot be imported in-game yet",
          description: "Local QR requires a public HTTPS URL to be imported into the game.",
          downloadLabel: "Download Preview QR",
        }
      : {
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

const CONTROL_LABELS_VI = Object.freeze({
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

const CONTROL_LABELS_EN = Object.freeze({
  SkinHue: "Skin Hue",
  SkinSaturation: "Skin Saturation",
  SkinLightness: "Skin Lightness",
  PupilSize: "Pupil Size",
  IrisSize: "Iris Size",
  SkinGloss: "Skin Gloss",
  SkinWrinkleIntensity: "Skin Wrinkle Intensity",
  SkinDetail: "Skin Detail",
  EyeSpecularBrightness: "Eye Specular Brightness",
  EyeReflectionInstensity: "Eye Reflection Intensity",
  EyeShadowIntensity: "Eyeshadow Intensity",
  EyeShadowSpecularIntensity: "Eyeshadow Specular Intensity",
  EyeShadowGlitterScale: "Eyeshadow Glitter Scale",
  EyeShadowSpecularScale: "Eyeshadow Specular Scale",
  EyeShadowSpecularBrightness: "Eyeshadow Specular Brightness",
  EyelashLength: "Eyelash Length",
  EyelashDense: "Eyelash Density",
  EyebrowBaseDense: "Eyebrow Base Density",
  EyelashRotate: "Eyelash Rotation",
  EyelashWidth: "Eyelash Width",
  EyelashHeight: "Eyelash Height",
  EyelashPosX: "Eyelash Horizontal Position",
  EyelashPosY: "Eyelash Vertical Position",
  EyebrowDense: "Eyebrow Density",
  EyelineDense: "Eyeliner Density",
  BlusherDensity: "Blush Density",
  BlusherPosX: "Blush Horizontal Position",
  BlusherPosY: "Blush Vertical Position",
  BlusherRotate: "Blush Rotation",
  BlusherSpecularDensity: "Blush Specular Density",
  BlusherSpecularScale: "Blush Specular Scale",
  BlusherSpecularBrightness: "Blush Specular Brightness",
  LipsDensity: "Lip Color Density",
  LipsGloss: "Lip Gloss",
  LipsSpecularDensity: "Lip Specular Density",
  LipsSpecularScale: "Lip Specular Scale",
  LipsSpecularBrightness: "Lip Specular Brightness",
  LipsBumpIntensity: "Lip Texture Intensity",
  TattooDense: "Facial Mark Density",
  TattooRotate: "Facial Mark Rotation",
  TattooPosX: "Facial Mark Horizontal Pos",
  TattooPosY: "Facial Mark Vertical Pos",
  TattooScaleX: "Facial Mark Horizontal Scale",
  TattooScaleY: "Facial Mark Vertical Scale",
  LongBeardDense: "Beard Density",
  LongBeardRate: "Beard Ratio",
  BronzerDensity: "Contour / Bronzer Density",
  Tattoo2Dense: "Secondary Mark Density",
  Tattoo2Rotate: "Secondary Mark Rotation",
  Tattoo2PosX: "Secondary Mark Horizontal Pos",
  Tattoo2PosY: "Secondary Mark Vertical Pos",
  Tattoo2ScaleX: "Secondary Mark Horizontal Scale",
  Tattoo2ScaleY: "Secondary Mark Vertical Scale",
  SkinTypeIntensity: "Skin Type Intensity",
});

export function getControlDisplayName(ctrl, idx, lang = "vi") {
  const rawName = (ctrl?.name || ctrl?.field || "").replace(/_Abs$/, "");
  const dict = lang === "en" ? CONTROL_LABELS_EN : CONTROL_LABELS_VI;
  if (rawName && dict[rawName]) return dict[rawName];
  const structure = STRUCTURE_WEIGHT_REGEX.exec(rawName);
  if (structure) {
    return lang === "en" ? `Structure Weight ${structure[1]}` : `Trọng số cấu trúc ${structure[1]}`;
  }
  if (lang === "en") {
    return rawName || ctrl?.label || `Parameter #${idx + 1}`;
  }
  return ctrl?.label || ctrl?.name || ctrl?.field || `Thông số #${idx + 1}`;
}

function controlLabel(message, lang = "vi") {
  const name = (CONTROL_NAME_REGEX.exec(message) || [])[1]?.replace(/_Abs$/, "");
  const dict = lang === "en" ? CONTROL_LABELS_EN : CONTROL_LABELS_VI;
  if (name && dict[name]) return dict[name];
  const structure = STRUCTURE_WEIGHT_REGEX.exec(name || "");
  if (structure) {
    return lang === "en" ? "Structure Weight " + structure[1] : "Trọng số cấu trúc " + structure[1];
  }
  return lang === "en" ? "This parameter" : "Thông số này";
}

function warningText(warning, lang = "vi") {
  const message = typeof warning.message === "string" ? warning.message : "";
  const label = controlLabel(message, lang);
  switch (warning.code) {
    case "partial_compatibility":
      return lang === "en"
        ? "Converted 49 mapped makeup parameters. Base face model, styles, body sliders, and newer CN parameters may still differ between versions."
        : "Đã chuyển 49 thông số trang điểm có đối chiếu. Mẫu nền, kiểu dáng, cơ thể và các thông số mới vẫn có thể hiển thị khác giữa hai phiên bản.";
    case "face05_target_profile":
      return lang === "en"
        ? "Preserved 100% of facial slider values; body reset to Global default. Must be imported on a Female Model 05 character. In-game visual match is unverified."
        : "Giữ nguyên giá trị thanh trượt mặt; thân chuyển về mặc định Bản Global. Cần nhập trên nhân vật nữ dùng model 05. Chưa xác nhận kết quả trong game.";
    case "face02_target_profile":
      return lang === "en"
        ? "Preserved 100% of facial slider values; body reset to Global default. Must be imported on a Male Model 02 character. In-game visual match is unverified."
        : "Giữ nguyên giá trị thanh trượt mặt; thân chuyển về mặc định Bản Global. Cần nhập trên nhân vật nam dùng model 02. Chưa xác nhận kết quả trong game.";
    case "style_defaulted": {
      const m = STYLE_DEFAULTED_VI_REGEX.exec(message);
      if (lang === "en") {
        if (m) {
          return `Style ${m[1]} at slot ${m[2]} is not available in Global yet; replaced with default style ${m[3]} and reset this layer's sliders.`;
        }
        return "A CN makeup/tattoo style is not available in Global yet and was replaced with the default style.";
      }
      return message.replace(/\bVNG\b/g, "Bản Global");
    }
    case "unsupported_control":
      return lang === "en"
        ? `${label} has a newer value without a confirmed Global mapping. Original data was preserved.`
        : label +
            " có giá trị mới nhưng chưa xác định được cách đổi sang Bản Global. Công cụ giữ nguyên dữ liệu gốc.";
    case "china_only_control":
      return lang === "en"
        ? `${label} does not have a corresponding parameter in the Global Server yet. Original data was kept and may be ignored in-game.`
        : label +
            " chưa có thông số tương ứng trong Bản Global. Dữ liệu được giữ nguyên và có thể không được game áp dụng.";
    case "clamped_control":
      return lang === "en"
        ? `${label} was outside the Global Server's supported range and has been clamped to the nearest valid value.`
        : label +
            " nằm ngoài khoảng hỗ trợ của Bản Global và đã được giới hạn về giá trị gần nhất có thể biểu diễn.";
    case "array_compatibility": {
      const match = ARRAY_COMPAT_REGEX.exec(message);
      if (!match) {
        return lang === "en"
          ? "A data array exceeds the legacy client limit. The array was preserved as-is; the game may ignore extra values."
          : "Một mảng dữ liệu vượt giới hạn của phiên bản cũ. Công cụ giữ nguyên mảng; game có thể không sử dụng toàn bộ dữ liệu.";
      }
      if (lang === "en") {
        return `The ${match[1]} array has ${match[2]} values, exceeding the target client limit. The array was preserved; the game may not apply all values.`;
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
      if (lang === "en") {
        const detailEn = ids.length
          ? ` (IDs ${ids.slice(0, 16).join(", ")}${
              ids.length > 16 ? ` and ${ids.length - 16} more` : ""
            })`
          : "";
        return `Preserved unrecognized parameters${detailEn}. Their effect in the Global Server is unverified.`;
      }
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
      return lang === "en"
        ? "A public HTTPS URL is required to import converted data into the game. Local QR is for preview only; you can still download the raw payload."
        : "Để nhập dữ liệu đã chuyển đổi vào game, cần địa chỉ HTTPS công khai. QR cục bộ chỉ dùng để xem trước; bạn vẫn có thể tải dữ liệu.";
    default:
      if (lang === "en") {
        if (!VIETNAMESE_CHAR_REGEX.test(message) && message) return message;
        return "Additional compatibility notes apply to this preset. Please verify the appearance after importing in-game.";
      }
      return VIETNAMESE_CHAR_REGEX.test(message)
        ? message.replace(/\bVNG\b/g, "Bản Global")
        : "Máy chủ có lưu ý bổ sung về mức độ tương thích. Hãy kiểm tra diện mạo sau khi nhập trong game.";
  }
}

export function warningMessages(groups = [], lang = "vi") {
  const flatGroups = Array.isArray(groups) ? groups.flat(2) : [groups];
  return [
    ...new Set(
      flatGroups
        .map((x) => (typeof x === "string" ? { message: x } : x))
        .filter((x) => x && typeof x.message === "string" && x.message.trim())
        .map((w) => warningText(w, lang))
    ),
  ];
}

const LENS_LABELS_VI = Object.freeze({
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

const LENS_LABELS_EN = Object.freeze({
  FOV: "field of view (FOV)",
  DOF: "depth of field (DOF)",
  Bloom: "bloom",
  Exposure: "exposure",
  Contrast: "contrast",
  Saturation: "saturation",
  Focus: "focus",
  Vignette: "vignette",
  Temperature: "color temperature",
  Tint: "tint",
});

export function photoWarningMessages(conversion = {}, lang = "vi") {
  const messages = warningMessages(
    [Array.isArray(conversion?.warnings) ? conversion.warnings.slice(0, 3) : []],
    lang
  );
  const fields = (key) =>
    Array.isArray(conversion?.[key])
      ? conversion[key].filter((x) => typeof x === "string" && x)
      : [];
  const omitted = new Set(fields("omitted_fields"));
  if (omitted.size) {
    const parts = [];
    const has = (...keys) => keys.some((key) => omitted.has(key));
    if (lang === "en") {
      if (has("UGCLevelId", "UGCLevelWorkId")) parts.push("UGC custom scene");
      if (has("SceneID", "TargetPos")) parts.push("scene & camera coordinates");
      if (has("Direction", "MainPlayerDirection")) parts.push("character facing direction");
      if (has("ExpressionID", "ExpressionPauseTime", "DiyExpressionUrl")) {
        parts.push("poses & expressions");
      }
      if (has("LookAtPos")) parts.push("gaze target");
      messages.push(
        (parts.length
          ? `Not transferred: ${parts.join(", ")}. `
          : "Some parameters from the original preset were not transferred. ") +
          "See full details in the Technical Breakdown below."
      );
    } else {
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
  }
  const disabled = fields("disabled_lens_fields");
  if (disabled.length) {
    const lensDict = lang === "en" ? LENS_LABELS_EN : LENS_LABELS_VI;
    const fallbackLabel = lang === "en" ? "other lens effects" : "một số hiệu ứng khác";
    const labels = [
      ...new Set(disabled.map((key) => (Object.hasOwn(lensDict, key) ? lensDict[key] : fallbackLabel))),
    ];
    messages.push(
      lang === "en"
        ? `Effects absent in the source preset were disabled: ${labels.join(", ")}. You can re-enable and tweak them in-game.`
        : "Các hiệu ứng không có trong mã đã được tắt: " +
            labels.join(", ") +
            ". Bạn có thể bật lại và chỉnh trong game."
    );
  }
  if (fields("inherited_lighting_fields").length) {
    messages.push(
      lang === "en"
        ? "Some lighting settings absent in the source preset will use Global Server defaults; please check and adjust in-game if needed."
        : "Một số thiết lập ánh sáng không có trong mã sẽ dùng thiết lập ban đầu của Bản Global; hãy kiểm tra và chỉnh lại nếu cần."
    );
  }
  if (fields("suppressed_light_fields").length) {
    messages.push(
      lang === "en"
        ? "Lights turned off in the original preset are set to zero intensity to prevent the Global Server from auto-enabling them."
        : "Các đèn tắt trong mẫu gốc được giữ ở mức không phát sáng để hạn chế việc Bản Global tự bật lại."
    );
  }
  return messages;
}

export function faceModelNotice(conversion, lang = "vi") {
  if (
    conversion.model_changed === true &&
    conversion.source_face_type === "230face07" &&
    conversion.target_face_type === "230face02" &&
    conversion.face_parameters_preserved === true
  ) {
    return lang === "en"
      ? "CN Male 07 → Global Male 02. Preserved 100% of facial slider values; shape may differ slightly due to base model differences."
      : "Bản Trung nam07 → Bản Global nam02. Giữ nguyên 100% giá trị thanh trượt mặt; khác model nên hình dáng có thể khác.";
  }
  if (
    conversion.model_changed === true &&
    conversion.source_face_type === "233face07" &&
    conversion.target_face_type === "233face05" &&
    conversion.face_parameters_preserved === true
  ) {
    return lang === "en"
      ? "CN Female 07 → Global Female 05. Preserved 100% of facial slider values; shape may differ slightly due to base model differences."
      : "Bản Trung nữ07 → Bản Global nữ05. Giữ nguyên 100% giá trị thanh trượt mặt; khác model nên hình dáng có thể khác.";
  }
  return "";
}

export function compatibilitySummary(conversion = {}, resultOrData = {}, kind = "face", lang = "vi") {
  const result = unwrapResult(resultOrData);
  if (kind === "photo") {
    return lang === "en"
      ? "Transfers supported camera, weather, and lighting settings only; excludes UGC scenes, poses, and expressions. In-game parity is unverified."
      : "Chỉ chuyển các thiết lập chụp ảnh đã hỗ trợ; không kèm cảnh UGC, động tác hay biểu cảm. Chưa kiểm chứng độ giống trong game.";
  }
  if (isDye(kind)) {
    return lang === "en"
      ? "Colors may appear slightly different depending on garment materials and dye channels." +
          (result.in_game_verified === true ? "" : " Unverified in-game.")
      : "Màu có thể hiển thị khác tùy chất liệu và vùng nhuộm của vật phẩm." +
          (result.in_game_verified === true ? "" : " Chưa kiểm chứng trong game.");
  }
  const parts = [];
  const slots = (value) =>
    Array.isArray(value) ? value.filter((item) => item && Number.isInteger(item.slot)) : [];
  const replacements = slots(conversion.style_replacements);
  if (replacements.length) {
    parts.push(
      lang === "en"
        ? `${replacements.length} makeup style(s) reset to Global Server defaults.`
        : replacements.length + " kiểu trang điểm về mặc định Bản Global."
    );
  }
  const omitted = slots(conversion.omitted_style_slots);
  const skinTypes = omitted.filter((item) => item.slot === 22 && item.name === "SkinType");
  if (skinTypes.length) {
    parts.push(
      lang === "en" ? "Removed CN-exclusive skin layer." : "Bỏ lớp da riêng của Bản Trung."
    );
  }
  const otherLayers = omitted.length - skinTypes.length;
  if (otherLayers) {
    parts.push(
      lang === "en"
        ? `${otherLayers} CN-exclusive layer(s) omitted.`
        : otherLayers + " lớp riêng của Bản Trung đã được bỏ."
    );
  }
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
  if (materialFallback) {
    parts.push(
      lang === "en"
        ? "Skin surface detail uses Global Server default."
        : "Chi tiết bề mặt da dùng mặc định Bản Global."
    );
  }
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
    parts.push(
      lang === "en"
        ? "Eye reflection calibrated for Global Server."
        : "Phản quang mắt đã hiệu chuẩn gần đúng cho Bản Global."
    );
  }
  if (conversion.mode === "passthrough") {
    parts.push(
      lang === "en"
        ? "Source preset is 100% directly compatible with the Global Server (all original sliders preserved 1:1 without quantization)."
        : "Mẫu gốc tương thích trực tiếp 100% với Bản Global (giữ nguyên toàn bộ thông số gốc, không cần biến đổi thanh trượt)."
    );
  }
  if (kind !== "makeup" && conversion.body_policy === "vng_default") {
    parts.push(
      lang === "en"
        ? "Body sliders set to Global Server default."
        : "Thân về mặc định Bản Global."
    );
  }
  if (kind === "makeup") {
    parts.push(
      lang === "en"
        ? "Please preview the makeup in-game before saving."
        : "Hãy xem trước trang điểm trong game trước khi lưu."
    );
  } else if (result.in_game_verified !== true) {
    parts.push(lang === "en" ? "Unverified in-game." : "Chưa kiểm chứng trong game.");
  }
  return parts.join(" ");
}

export function expiryNote(resultOrData, lang = "vi") {
  const result = unwrapResult(resultOrData);
  const expires = result.expires_at ? new Date(result.expires_at) : null;
  const locale = lang === "en" ? "en-US" : "vi-VN";
  const date =
    expires && Number.isFinite(expires.getTime())
      ? new Intl.DateTimeFormat(locale, { dateStyle: "short", timeStyle: "short" }).format(expires)
      : null;
  if (result.delivery === "source") {
    if (lang === "en") {
      return (
        (date ? `Download link expires ${date}. ` : "") +
        "Original QR expiration is managed by NetEase."
      );
    }
    return (
      (date ? "Link tải trên trang hết hạn " + date + ". " : "") +
      "QR gốc do NetEase quản lý thời hạn."
    );
  }
  if (!date) return "";
  if (result.ready_for_game !== true && result.preview_qr_image_url) {
    return lang === "en"
      ? `Preview & payload links expire ${date}.`
      : "Link xem trước và tải dữ liệu hết hạn " + date + ".";
  }
  if (lang === "en") {
    return result.ready_for_game === true
      ? `QR expires ${date}. Re-convert anytime if expired.`
      : `Download link expires ${date}.`;
  }
  return result.ready_for_game === true
    ? "QR hết hạn " + date + ". Chuyển lại khi cần."
    : "Link tải dữ liệu hết hạn " + date + ".";
}

const KNOWN_ERRORS_VI = Object.freeze({
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
  qr_not_found:
    "Không tìm thấy mã QR hợp lệ trong ảnh. Hãy chọn ảnh rõ nét hơn hoặc dán link chia sẻ.",
});

const KNOWN_ERRORS_EN = Object.freeze({
  invalid_payload:
    "Invalid or out-of-range preset data. Please try again with an original CN share code or link.",
  unsupported_schema:
    "This data schema or game version is not supported yet. Conversion could not be completed.",
  unsupported_format:
    "Unsupported data format. Please try again with an original CN preset share link or QR image.",
  payload_too_large:
    "Preset data exceeds the maximum allowed size. Please check your source input.",
  request_too_large: "Uploaded request exceeds the 8 MB limit. Please choose a smaller QR image.",
  unsupported_dye_item:
    "This garment/hair item is not yet supported for dye conversion to the Global Server. Please try another preset.",
  wrong_dye_category:
    "The preset does not match this dye category. Please switch to the Dyeing tab and try again.",
  incompatible_dye_channels:
    "Dye channels between the source and target items are incompatible. Could not generate QR; please try another preset.",
  invalid_dye_mode: "Please select Default Item or Keep Original Item and try again.",
  qr_not_found:
    "No valid QR code found in the image. Please upload a clearer QR image or paste the share link.",
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

export function apiErrorMessage(error, kind = "face", lang = "vi") {
  const modeMap = getModeInfo(lang);
  if (kind === "photo" && PHOTO_ERROR_CODES.has(error?.code)) {
    return lang === "en"
      ? "Invalid or unsupported photo preset data. Please use a CN photo share link or QR screenshot."
      : "Dữ liệu chụp ảnh không hợp lệ hoặc chưa được hỗ trợ. Hãy dùng link thiết kế hoặc ảnh chứa QR chụp ảnh Bản Trung.";
  }
  if (isDye(kind) && DYE_ERROR_CODES.has(error?.code)) {
    const label = (modeMap[kind] || modeMap.dye).label;
    return lang === "en"
      ? `Invalid or unsupported ${label} data. Please verify the preset category and try again.`
      : "Dữ liệu " + label + " không hợp lệ hoặc chưa được hỗ trợ. Kiểm tra đúng loại mã rồi thử lại.";
  }
  const known = lang === "en" ? KNOWN_ERRORS_EN : KNOWN_ERRORS_VI;
  if (known[error?.code]) return known[error.code];
  if (lang === "en") {
    if (typeof error?.message === "string" && !VIETNAMESE_CHAR_REGEX.test(error.message)) {
      return error.message;
    }
    return "Unable to process this preset data. Please check your source code/image and try again.";
  }
  return typeof error?.message === "string" && VIETNAMESE_CHAR_REGEX.test(error.message)
    ? error.message
    : "Chưa thể xử lý dữ liệu này. Vui lòng kiểm tra mã nguồn và thử lại.";
}

export function formatValue(value, lang = "vi") {
  if (value === null || value === undefined) return "—";
  if (typeof value === "number") {
    return new Intl.NumberFormat(lang === "en" ? "en-US" : "vi-VN", {
      maximumFractionDigits: 6,
    }).format(value);
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
