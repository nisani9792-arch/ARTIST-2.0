# משתני סביבה — ARTIST 2.0

מסמך זה מפרט את כל משתני הסביבה שיש להגדיר בפלטפורמת הפריסה (Render, Vercel וכו') או בקובץ `.env` מקומי.

> **אבטחה:** לעולם אל תעלה את `.env` ל-GitHub. השתמש ב-`.env.example` כתבנית בלבד.

---

## משתנים חובה

### `DATABASE_URL`

| | |
|---|---|
| **תיאור** | מחרוזת חיבור ל-PostgreSQL ב-Neon |
| **דוגמה** | `postgresql://USER:PASSWORD@ep-xxxx.region.aws.neon.tech/neondb?sslmode=require` |
| **איפה להשיג** | [Neon Console](https://console.neon.tech) → Project → Connection string → **Pooled connection** |
| **שימוש** | כל שאילתות האומנים, עדכוני סטטוס, אישור אודו |

---

### `GEMINI_API_KEY`

| | |
|---|---|
| **תיאור** | מפתח API ל-Google Gemini (המלצות AI + פקודות בעברית) |
| **דוגמה** | `AIzaSy...` |
| **איפה להשיג** | [Google AI Studio](https://aistudio.google.com/apikey) |
| **שימוש** | `/api/ai/suggestions`, `/api/ai/command` |
| **הערה** | בלי מפתח — האפליקציה עובדת, אך שכבת ה-AI מושבתת |

---

## משתנים אופציונליים

### `GEMINI_MODEL`

| | |
|---|---|
| **תיאור** | דגם Gemini לשימוש |
| **ברירת מחדל** | `gemini-2.0-flash` |
| **חלופות** | `gemini-1.5-flash`, `gemini-1.5-pro` |

### `NODE_VERSION` (Render)

| | |
|---|---|
| **תיאור** | גרסת Node בשרת הפריסה |
| **מומלץ** | `22` |

### `PORT` (מקומי בלבד)

| | |
|---|---|
| **תיאור** | פורט שרת הפיתוח |
| **ברירת מחדל** | `3000` (Next.js) |

---

## תבנית להדבקה ב-Render / Vercel

העתק ללוח ומלא את הערכים האמיתיים בלוח הבקרה של ספק הפריסה:

```env
DATABASE_URL=postgresql://USER:PASSWORD@HOST/neondb?sslmode=require
GEMINI_API_KEY=your-gemini-api-key-here
GEMINI_MODEL=gemini-2.0-flash
```

---

## Render — שלבי פריסה

1. צור **Web Service** חדש מ-GitHub repo `ARTIST-2.0`
2. **Build Command:** `npm ci && npm run db:push && npm run build`
3. **Start Command:** `npm run start`
4. **Health Check Path:** `/api/health`
5. הוסף את משתני הסביבה מהטבלה למעלה
6. לאחר הפריסה הראשונה, הרץ מקומית (או ב-Shell של Render):
   ```bash
   py -3 scripts/migrate-odoo.py
   ```
   (מוסיף עמודת `is_odoo_approved` אם חסרה)

---

## מקומי — `.env`

```bash
cp .env.example .env
# ערוך .env והדבק את הערכים
npm install
npm run db:push
npm run dev
```

---

## סיכום מהיר

| משתנה | חובה? | תפקיד |
|--------|--------|--------|
| `DATABASE_URL` | כן | Neon PostgreSQL |
| `GEMINI_API_KEY` | מומלץ | AI — תקועים ופקודות |
| `GEMINI_MODEL` | לא | בחירת דגם Gemini |
| `NODE_VERSION` | לא | גרסת Node בפריסה |
