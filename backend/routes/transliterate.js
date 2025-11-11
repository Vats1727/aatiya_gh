import express from 'express';

const router = express.Router();

// POST /api/transliterate
// Body: { text: string }
// Returns: { success: true, text: '<transliterated>' }
router.post('/', async (req, res) => {
  try {
    const { text } = req.body || {};
    if (!text || typeof text !== 'string') return res.status(400).json({ success: false, error: 'text is required' });

    const url = `https://inputtools.google.com/request?text=${encodeURIComponent(String(text))}&itc=hi-t-i0-und&num=1`;
    const resp = await fetch(url, { method: 'GET' });
    if (!resp.ok) {
      return res.status(502).json({ success: false, error: 'Upstream transliteration failed', status: resp.status });
    }
    const json = await resp.json();
    // Try to extract Devanagari text
    const joined = JSON.stringify(json);
    const match = joined.match(/[\u0900-\u097F\uA8E0-\uA8FF]+/g);
    if (match && match.length) {
      return res.json({ success: true, text: match.join(' ') });
    }
    if (Array.isArray(json) && json[0] === 'SUCCESS' && json[1] && json[1][0]) {
      const candidates = json[1][0][1];
      if (Array.isArray(candidates) && candidates[0] && candidates[0][0]) {
        return res.json({ success: true, text: candidates[0][0] });
      }
    }

    // Fallback: return original text
    return res.json({ success: true, text });
  } catch (err) {
    console.error('POST /api/transliterate error:', err);
    return res.status(500).json({ success: false, error: String(err) });
  }
});

export default router;
