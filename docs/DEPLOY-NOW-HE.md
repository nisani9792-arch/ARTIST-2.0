# פריסה מיידית ב-Render — תיקון `pm install`

## למה זה נכשל?

ב-Render מוגדר Build Command שגוי:
```
pm install && npm run build
```
זה **לא** מגיע מהקוד — זו הגדרה ידנית ב-Dashboard.

---

## פתרון מובטח (2 דקות) — Docker

1. [dashboard.render.com](https://dashboard.render.com) → השירות שלך
2. **Settings** → **Build & Deploy**
3. **Environment** → שנה מ-**Node** ל-**Docker**
4. **Dockerfile Path** → `Dockerfile`
5. **Docker Context** → `.` (נקודה)
6. **Start Command** — השאר ריק (Dockerfile מגדיר CMD)
7. **Build Command** — מתעלם ב-Docker, אפשר למחוק
8. **Environment Variables** — ודא:
   ```
   DATABASE_URL=...
   GEMINI_API_KEY=...
   GATE_SECRET=JUSIC
   TRUST_PROXY=1
   ```
9. **Manual Deploy** → Deploy latest commit

---

## חלופה — Node (תקן Build Command)

**Settings → Build Command** — מחק הכל והדבק **בדיוק**:

```
bash render-build.sh
```

או:

```
npm ci && npm run build
```

**אל תשתמש ב-`pm install`!**

---

## חלופה — Blueprint חדש

1. Render → **New +** → **Blueprint**
2. חבר `nisani9792-arch/ARTIST-2.0`
3. הוסף `DATABASE_URL` ו-`GEMINI_API_KEY`
4. Apply — יוצר שירות Docker אוטומטית

---

## אחרי פריסה מוצלחת

פתח את ה-URL → מסך כניסה JUSIC → הקלד `JUSIC` → שם מפעיל → Workspace
