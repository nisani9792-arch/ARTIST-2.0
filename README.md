# ARTIST 2.0

CRM מסך יחיד לניהול חתימות אומנים — RTL, M3 Expressive, Drag & Drop, Gemini AI.

## דרישות

- Node.js 20+
- חשבון [Neon](https://neon.tech) (PostgreSQL)
- מפתח [Google Gemini API](https://aistudio.google.com/apikey)

## התקנה

```bash
cd "ARTIST 2.0"
npm install
cp .env.example .env
# ערוך .env והדבק DATABASE_URL ו-GEMINI_API_KEY
npm run db:push
npm run dev
```

פתח [http://localhost:3000](http://localhost:3000)

## משתני סביבה

**מסמך מלא לפריסה:** [docs/ENV-VARS-HE.md](docs/ENV-VARS-HE.md)

| משתנה | חובה | תיאור |
|--------|------|--------|
| `DATABASE_URL` | כן | Connection string מ-Neon |
| `GEMINI_API_KEY` | מומלץ | מפתח Google AI |
| `GEMINI_MODEL` | לא | ברירת מחדל: `gemini-2.0-flash` |

## פיצ'רים

- **מסך יחיד** — ללא ניווט בין דפים
- **שני אזורים** — לא חתומים (תיקייה) וחתומים, עם גרירה ביניהם
- **כרטיס מינימלי** — שם, סטטוס, מטפל, תאריך פעולה אחרונה
- **יצירה מהירה** — הקלד שם ב-top bar ולחץ Enter
- **חיפוש מיידי** — לפי שם או גורם מטפל
- **בחירה מרובה** — שינוי מטפל לכמה אומנים
- **AI** — הדגשת אומנים "תקועים" + פקודות בעברית

## פקודות

```bash
npm run dev        # פיתוח
npm run build      # בנייה
npm run db:push    # סנכרון סכימה ל-Neon
npm run db:studio  # Drizzle Studio
```

## דחיפה ל-GitHub

```bash
git init
git add .
git commit -m "Initial ARTIST 2.0: single-screen M3 CRM"
gh repo create ARTIST-2.0 --public --source=. --remote=origin
git branch -M main
git push -u origin main
```

אם ה-repo כבר קיים:

```bash
git remote add origin https://github.com/<USER>/ARTIST-2.0.git
git push -u origin main
```

## סכימת DB

טבלה `artists`:

- `id` (uuid)
- `name` (text)
- `is_signed` (boolean)
- `handler_name` (text, ברירת מחדל: לא שויך)
- `last_action_timestamp` (timestamptz)
