# תיקון פריסה ב-Render — שגיאת `pm install`

## הבעיה

ב-Render מוגדר Build Command שגוי:
```
pm install && npm run build   ❌
```
במקום:
```
npm ci && npm run build       ✅
```

השגיאה **לא בקוד** — היא בהגדרות השירות ב-Render Dashboard.

---

## פתרון מומלץ (Docker) — עוקף את Build Command

1. Render Dashboard → השירות שלך → **Settings**
2. **Environment** → שנה מ-**Node** ל-**Docker**
3. **Dockerfile Path:** `Dockerfile` (ברירת מחדל)
4. שמור → **Manual Deploy**

ב-Docker, Render **לא מריץ** את `pm install` — הוא בונה לפי `Dockerfile` בלבד.

---

## פתרון חלופי (Node)

אם נשארים ב-Node, עדכן **Build Command** ל:
```
npm run build
```
או:
```
bash render-build.sh
```

**Start Command:**
```
npm run start
```

---

## פתרון Blueprint (IaC)

1. Render → **New +** → **Blueprint**
2. חבר את `nisani9792-arch/ARTIST-2.0`
3. Render יקרא את `render.yaml` עם הגדרות נכונות
4. הוסף `DATABASE_URL` ו-`GEMINI_API_KEY` במסך ה-Blueprint

---

## משתני סביבה (חובה)

ראה [ENV-VARS-HE.md](./ENV-VARS-HE.md)
