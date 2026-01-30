// Parse JSON output from Agent -> flatten fields for Connect2 (WordPress)

const base = $json;

// 1) lấy raw string từ agent
let raw = base.output ?? base.text ?? base.content ?? "";
if (typeof raw !== "string") raw = JSON.stringify(raw);

// 2) làm sạch wrapper hay gặp: ```json ... ```, chữ "json" đầu dòng
raw = raw.replace(/```json/gi, "```").replace(/```/g, "").trim();
raw = raw.replace(/^\s*json\s*/i, "").trim();

// 3) cắt đúng khối JSON
const firstBrace = raw.indexOf("{");
const lastBrace = raw.lastIndexOf("}");
if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
  return [{ json: { ...base, error: "Không tìm thấy JSON", raw } }];
}

let jsonString = raw.slice(firstBrace, lastBrace + 1);
// remove control chars
jsonString = jsonString.replace(/[\u0000-\u001F\u007F-\u009F]/g, "");

try {
  let parsed = JSON.parse(jsonString);

  // (phòng hờ) nếu agent trả dạng { post:[{...}] } thì lấy post[0]
  if (parsed?.post?.[0]) parsed = parsed.post[0];

  // 4) đảm bảo các field WP nằm ở root cho Connect2
  const out = {
    ...base,
    ...parsed,

    // chuẩn hóa các field hay dùng
    title: parsed.title ?? base.title,
    slug: parsed.slug ?? (parsed.url ? String(parsed.url).split("/").pop() : base.slug),
    status: parsed.status ?? base.status ?? "draft",
    content: parsed.content ?? base.content,
    excerpt: parsed.excerpt ?? base.excerpt,
    categories: parsed.categories ?? base.categories,
    meta: parsed.meta ?? base.meta,

    // giữ raw để debug nếu cần
    _raw_agent_output: raw,
  };

  return [{ json: out }];
} catch (e) {
  return [{ json: { ...base, error: "Lỗi parse JSON", msg: e.message, raw } }];
}
