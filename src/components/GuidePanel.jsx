import React from "react";
import { GuideIcon } from "./Icons.jsx";

const GUIDE_CARDS_VI = [
  {
    step: "1",
    badge: "Cách A · Dán link / Mã",
    title: "Dán link chia sẻ hoặc mã mẫu từ Bản Trung",
    desc: "Trong thư viện mẫu của Bản Trung, sao chép link 163 hoặc chuỗi Thiết Kế có mã ID, dán vào ô Dán link / Mã trên Dung Hoa Các và nhấn Chuyển đổi.",
    image: "/guide/06-dan-link-china.jpg",
    alt: "Giao diện Dung Hoa Các ở tab Dán link / Mã với link mẫu Bản Trung và nút Chuyển đổi",
  },
  {
    step: "2",
    badge: "Cách B · Tải ảnh QR",
    title: "Chọn hoặc dán trực tiếp ảnh chứa mã QR",
    desc: "Chuyển sang tab Ảnh QR, kéo thả file ảnh, nhấn vào khung quét để chọn ảnh từ máy hoặc bấm Ctrl + V để dán trực tiếp ảnh chụp màn hình chứa mã QR Bản Trung.",
    image: "/guide/08-chon-anh-qr.jpg",
    alt: "Giao diện Dung Hoa Các ở tab Ảnh QR với khung tải và quét ảnh QR",
  },
  {
    step: "3",
    badge: "Giải mã & Đối chiếu",
    title: "Xem kết quả chuyển đổi Bản Trung → Bản Global",
    desc: "Hệ thống Dung Hoa Các tự động giải mã thông số Bản Trung, đối chiếu sang chuẩn Bản Global và khởi tạo thẻ mã QR kết quả kèm thông báo tương thích.",
    image: "/guide/09-bam-chuyen-qr.jpg",
    alt: "Giao diện Dung Hoa Các hiển thị thông báo Chuyển đổi hoàn tất Bản Trung sang Bản Global và thẻ QR",
  },
  {
    step: "4",
    badge: "Lưu QR & Nhập vào game",
    title: "Tải ảnh QR và nhập vào Bản Global",
    desc: "Nhấn Tải QR hoặc Sao chép link QR để lưu mã về máy, đồng thời xem bảng màu RGBA hoặc chi tiết đối chiếu thông số trước khi nhập vào Bản Global.",
    image: "/guide/10-tai-qr-vng.jpg",
    alt: "Thẻ tải mã QR Bản Global, nút Sao chép link QR và bảng chi tiết thông số kỹ thuật trên Dung Hoa Các",
  },
];

const GUIDE_CARDS_EN = [
  {
    step: "1",
    badge: "Method A · Paste Link / ID",
    title: "Paste a share link or preset ID from CN Server",
    desc: "From the CN Server preset gallery, copy the 163 share link or Design string with the preset ID, paste it into the Paste Link / ID tab on Dung Hoa Cac, and click Convert.",
    image: "/guide/06-dan-link-china.jpg",
    alt: "Dung Hoa Cac interface on the Paste Link / ID tab with a CN sample link and Convert button",
  },
  {
    step: "2",
    badge: "Method B · Upload QR Image",
    title: "Select or paste a screenshot containing a QR code",
    desc: "Switch to the QR Image tab, drag & drop an image file, click the scan box to browse, or press Ctrl + V anywhere to paste a screenshot containing a CN QR code.",
    image: "/guide/08-chon-anh-qr.jpg",
    alt: "Dung Hoa Cac interface on the QR Image tab with the QR upload and scan area",
  },
  {
    step: "3",
    badge: "Decode & Calibrate",
    title: "Review the CN Server → Global Server conversion result",
    desc: "Dung Hoa Cac automatically decodes the CN preset parameters, maps them to Global Server standards, and generates a ready-to-import QR card with compatibility notes.",
    image: "/guide/09-bam-chuyen-qr.jpg",
    alt: "Dung Hoa Cac interface displaying the completed CN to Global conversion banner and QR card",
  },
  {
    step: "4",
    badge: "Save QR & Import In-Game",
    title: "Download the QR image and import into Global Server",
    desc: "Click Download QR or Copy QR Link to save the code, and inspect the extracted RGBA color swatches or parameter breakdown before importing into the Global Server.",
    image: "/guide/10-tai-qr-vng.jpg",
    alt: "Global Server QR download card, Copy QR Link button, and technical parameter table on Dung Hoa Cac",
  },
];

export function GuidePanel({ onSelectMode, lang = "vi" }) {
  const isEn = lang === "en";
  const cards = isEn ? GUIDE_CARDS_EN : GUIDE_CARDS_VI;

  return (
    <section
      className="animate-tab-enter relative rounded-2xl border border-[#f2d08b]/30 bg-[#122636]/85 backdrop-blur-xl p-5 sm:p-7 shadow-[0_24px_60px_rgba(3,10,18,0.55)]"
      aria-labelledby="guide-title"
    >
      <div className="flex flex-wrap items-center justify-between gap-4 pb-5 mb-6 border-b border-[#f2d08b]/20">
        <div>
          <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-[#5ce1d6] mb-1.5">
            <GuideIcon className="w-4 h-4 text-[#f5d48f]" />
            {isEn ? "Dung Hoa Cac Handbook" : "Cẩm Nang Dung Hoa Các"}
          </span>
          <h2 id="guide-title" className="text-2xl sm:text-3xl font-bold text-[#fdfbf7] tracking-tight">
            {isEn
              ? "How to Convert CN Server → Global Server Presets"
              : "Hướng dẫn chuyển mã Bản Trung → Bản Global"}
          </h2>
          <p className="text-sm text-[#d4e3ee] mt-1">
            {isEn
              ? "Follow the steps below to convert face sculpting, makeup, outfit/hair dye, and studio photo presets to the Global Server."
              : "Làm theo từng bước dưới đây để chuyển đổi dữ liệu khuôn mặt, trang điểm, màu nhuộm và chụp ảnh sang Bản Global."}
          </p>
        </div>
        <button
          type="button"
          onClick={() => onSelectMode("face")}
          className="inline-flex items-center gap-2 rounded-xl border border-[#f5d48f]/40 bg-[#f5d48f]/12 px-4 py-2.5 text-xs font-bold text-[#f5d48f] hover:bg-[#f5d48f]/22 hover:border-[#f5d48f]/70 active:scale-95 transition cursor-pointer"
        >
          {isEn ? "Back to Converter" : "Quay lại công cụ chuyển mã"}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {cards.map((card) => (
          <article
            key={card.step}
            className="group rounded-xl border border-[#f2d08b]/25 bg-[#0c1b27]/80 p-4 sm:p-5 transition duration-300 hover:-translate-y-1 hover:border-[#5ce1d6]/55 hover:shadow-[0_14px_34px_rgba(3,10,18,0.5)]"
          >
            <div className="flex items-center gap-2.5 mb-2">
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-gradient-to-br from-[#f5d48f] to-[#d9a44e] text-[#0c1821] text-xs font-extrabold shadow">
                {card.step}
              </span>
              <span className="text-xs font-bold uppercase tracking-wider text-[#5ce1d6]">
                {card.badge}
              </span>
            </div>
            <h3 className="text-lg font-bold text-[#fdfbf7] mb-1.5">{card.title}</h3>
            <p className="text-sm text-[#d4e3ee] leading-relaxed mb-3.5">{card.desc}</p>
            <div className="overflow-hidden rounded-lg border border-[#f2d08b]/25 bg-[#07111a]">
              <img
                src={card.image}
                alt={card.alt}
                width="1364"
                height="912"
                loading="lazy"
                decoding="async"
                className="w-full h-auto object-cover transition duration-500 group-hover:scale-[1.02]"
              />
            </div>
          </article>
        ))}

        <article className="rounded-xl border border-[#f2d08b]/25 bg-[#0c1b27]/80 p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2.5 mb-2">
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-gradient-to-br from-[#5ce1d6] to-[#1b7a82] text-[#07131d] text-xs font-extrabold">
                5
              </span>
              <span className="text-xs font-bold uppercase tracking-wider text-[#f5d48f]">
                {isEn ? "Dyeing · Hair · Top · Bottom" : "Nhuộm màu · Tóc · Áo · Quần"}
              </span>
            </div>
            <h3 className="text-lg font-bold text-[#fdfbf7] mb-2">
              {isEn
                ? "Import Outfit Dye Presets & RGBA Color Palette"
                : "Nhập mã nhuộm trang phục & bảng màu RGBA"}
            </h3>
            {isEn ? (
              <p className="text-sm text-[#d4e3ee] leading-relaxed">
                Open the <strong className="text-[#f5d48f]">Dyeing</strong> tab — the system automatically detects{" "}
                <strong className="text-[#f5d48f]">Hair Dye</strong>,{" "}
                <strong className="text-[#f5d48f]">Top Dye</strong>, or{" "}
                <strong className="text-[#f5d48f]">Bottom Dye</strong> presets. Choose{" "}
                <strong className="text-[#5ce1d6]">Default Item</strong> if your character does not own the original garment yet, or{" "}
                <strong className="text-[#5ce1d6]">Keep Original Item</strong> if you already own that exact hairstyle/outfit on the Global Server. You can also copy individual RGBA hex codes for manual tuning.
              </p>
            ) : (
              <p className="text-sm text-[#d4e3ee] leading-relaxed">
                Mở mục <strong className="text-[#f5d48f]">Nhuộm màu</strong> rồi chọn phân loại{" "}
                <strong className="text-[#f5d48f]">Màu tóc</strong>,{" "}
                <strong className="text-[#f5d48f]">Màu áo</strong> hoặc{" "}
                <strong className="text-[#f5d48f]">Màu quần</strong>. Chọn chế độ{" "}
                <strong className="text-[#5ce1d6]">Mẫu mặc định</strong> nếu nhân vật của bạn chưa sở hữu vật phẩm gốc, hoặc{" "}
                <strong className="text-[#5ce1d6]">Giữ mẫu gốc</strong> nếu đã có đúng kiểu tóc/trang phục đó trong Bản Global. Ngoài QR, bạn cũng có thể sao chép từng mã màu RGBA để tinh chỉnh thủ công.
              </p>
            )}
          </div>
          <div className="mt-4 pt-3 border-t border-[#f2d08b]/15 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => onSelectMode("dye")}
              className="rounded-lg border border-[#5ce1d6]/35 bg-[#5ce1d6]/10 px-3.5 py-1.5 text-xs font-semibold text-[#5ce1d6] hover:bg-[#5ce1d6]/20 transition cursor-pointer"
            >
              {isEn ? "Open Dyeing (Hair · Top · Bottom)" : "Mở Nhuộm màu (Tóc · Áo · Quần)"}
            </button>
          </div>
        </article>

        <article className="rounded-xl border border-[#f2d08b]/25 bg-[#0c1b27]/80 p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2.5 mb-2">
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-gradient-to-br from-[#5ce1d6] to-[#1b7a82] text-[#07131d] text-xs font-extrabold">
                6
              </span>
              <span className="text-xs font-bold uppercase tracking-wider text-[#f5d48f]">
                {isEn ? "Photo Mode · Studio / Film Crew" : "Chụp ảnh · Đoàn phim"}
              </span>
            </div>
            <h3 className="text-lg font-bold text-[#fdfbf7] mb-2">
              {isEn
                ? "Import Photo QR into Studio / Film Crew Mode"
                : "Nhập QR chụp ảnh vào giao diện Đoàn phim"}
            </h3>
            {isEn ? (
              <p className="text-sm text-[#d4e3ee] leading-relaxed">
                Select <strong className="text-[#f5d48f]">Photo Mode</strong> to convert camera angles, lens settings, weather, and lighting from the CN Server into a QR code ready for the{" "}
                <strong className="text-[#5ce1d6]">Studio / Film Crew</strong> menu in the Global Server. Custom UGC scenes, actions, and facial expressions are clearly listed in the technical breakdown.
              </p>
            ) : (
              <p className="text-sm text-[#d4e3ee] leading-relaxed">
                Chọn phân mục <strong className="text-[#f5d48f]">Chụp ảnh</strong> để chuyển mã thiết kế góc máy, ống kính, thời tiết và ánh sáng từ Bản Trung sang QR dùng trong mục{" "}
                <strong className="text-[#5ce1d6]">Đoàn phim</strong> của Bản Global. Các thông số cảnh UGC riêng, động tác và biểu cảm sẽ được liệt kê rõ trong bảng chi tiết chuyển đổi.
              </p>
            )}
          </div>
          <div className="mt-4 pt-3 border-t border-[#f2d08b]/15">
            <button
              type="button"
              onClick={() => onSelectMode("photo")}
              className="rounded-lg border border-[#f5d48f]/40 bg-[#f5d48f]/12 px-3.5 py-1.5 text-xs font-semibold text-[#f5d48f] hover:bg-[#f5d48f]/22 transition cursor-pointer"
            >
              {isEn ? "Open Photo Mode" : "Mở Chụp ảnh"}
            </button>
          </div>
        </article>
      </div>
    </section>
  );
}
