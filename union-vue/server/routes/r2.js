import { Router } from "express";
import { generateR2Key, presignUpload, presignDownload } from "../lib/r2.js";
import { getUserFromToken, getProfile, canAccessSubscriberContent } from "../lib/supabase.js";

const router = Router();

const ALLOWED_KINDS = ["video-lessons", "collective-readings"];
const ALLOWED_TYPES = ["video/mp4", "video/webm", "video/quicktime"];
const ALLOWED_ASPECTS = ["desktop", "vertical"];

function bearerToken(req) {
  const auth = req.headers.authorization ?? "";
  return auth.startsWith("Bearer ") ? auth.slice(7) : null;
}

/**
 * POST /api/r2/presign-upload
 * Admin-only. Returns { key, uploadUrl } for a fresh R2 object.
 * Body: { filename, contentType, kind, aspect }
 *   aspect: "desktop" (16:9) | "vertical" (9:16)
 */
router.post("/presign-upload", async (req, res) => {
  const token = bearerToken(req);
  if (!token) return res.status(401).json({ error: "Not authenticated" });

  const user = await getUserFromToken(token);
  if (!user) return res.status(401).json({ error: "Invalid token" });

  const profile = await getProfile(user.id);
  if (profile?.role !== "admin") return res.status(403).json({ error: "Admin only" });

  const { filename, contentType, kind = "video-lessons", aspect = "desktop" } = req.body;

  if (!filename?.trim()) return res.status(400).json({ error: "Missing filename" });
  if (!ALLOWED_TYPES.includes(contentType)) {
    return res.status(400).json({ error: `contentType must be one of: ${ALLOWED_TYPES.join(", ")}` });
  }
  if (!ALLOWED_KINDS.includes(kind)) {
    return res.status(400).json({ error: `kind must be one of: ${ALLOWED_KINDS.join(", ")}` });
  }
  if (!ALLOWED_ASPECTS.includes(aspect)) {
    return res.status(400).json({ error: `aspect must be "desktop" or "vertical"` });
  }

  const key = generateR2Key(kind, aspect, filename.trim());
  const uploadUrl = await presignUpload({ key, contentType });
  return res.json({ key, uploadUrl });
});

/**
 * GET /api/r2/presign-download?lessonId=&kind=video-lessons&aspect=desktop
 * Subscriber/admin-only. Returns { url } — 1-hour signed GET URL.
 * aspect: "desktop" → reads video_r2_key
 * aspect: "vertical" → reads video_r2_key_vertical
 */
router.get("/presign-download", async (req, res) => {
  const token = bearerToken(req);
  if (!token) return res.status(401).json({ error: "Not authenticated" });

  const user = await getUserFromToken(token);
  if (!user) return res.status(401).json({ error: "Invalid token" });

  const profile = await getProfile(user.id);
  if (!canAccessSubscriberContent(profile)) {
    return res.status(403).json({ error: "Subscription required" });
  }

  const { lessonId, kind = "video-lessons", aspect = "desktop" } = req.query;

  if (!lessonId) return res.status(400).json({ error: "Missing lessonId" });
  if (!ALLOWED_KINDS.includes(kind)) {
    return res.status(400).json({ error: `kind must be one of: ${ALLOWED_KINDS.join(", ")}` });
  }
  if (!ALLOWED_ASPECTS.includes(aspect)) {
    return res.status(400).json({ error: `aspect must be "desktop" or "vertical"` });
  }

  const { getAdminClient } = await import("../lib/supabase.js");
  const supabase = getAdminClient();
  const table = kind === "video-lessons" ? "video_lessons" : "collective_readings";

  const { data: row } = await supabase
    .from(table)
    .select("video_r2_key, video_r2_key_vertical, is_published")
    .eq("id", lessonId)
    .maybeSingle();

  if (!row) return res.status(404).json({ error: "Not found" });
  if (profile.role !== "admin" && !row.is_published) {
    return res.status(404).json({ error: "Not found" });
  }

  const r2Key = aspect === "vertical" ? row.video_r2_key_vertical : row.video_r2_key;
  if (!r2Key) {
    return res.status(404).json({ error: `No ${aspect} video for this lesson` });
  }

  const url = await presignDownload({ key: r2Key });
  return res.json({ url });
});

export default router;
