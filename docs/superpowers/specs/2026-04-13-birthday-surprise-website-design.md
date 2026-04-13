# Meglepetés Szülinapi Weboldal — Apukádnak

**Dátum:** 2026-04-13
**Határidő:** 2026-04-20 (8 nap)
**Hosting:** GitHub Pages (statikus oldal)

---

## Összefoglaló

Egy interaktív meglepetés weboldal, ahol a felhasználó (Apu) egy építészeti tervrajz (blueprint) stílusú házat fedez fel. Minden szoba zárt — egy minijáték megnyerésével oldható fel. A feloldott szobák kiszínesednek a tervrajzon, és megjelenik bennük a meglepetés tartalom. Ha mind a 11 szobát feloldja, megnyílik a 12. titkos szoba (A Széf) a nagy finálé-val.

**Célközönség:** Egyetlen személy (Apu), privát link.
**Hangulat:** Elegáns + játékos — letisztult, meleg családias érzés, modern animációkkal és fun elemekkel.

---

## Vizuális koncepció — Blueprint Ház

### Kiindulási állapot
- Kék "blueprint" háttér rácsozattal
- Szobák szaggatott fehér vonalakkal rajzolva
- Monospace betűtípus, méretezések (pl. "3.5m x 4m") mint igazi tervrajzon
- Minden szoba halványan, lakat ikonnal
- Az egész oldal úgy néz ki mint egy építészeti alaprajz

### Felfedezés közben
- Feloldott szobák kiszínesednek (egyedi szín mindegyiknek)
- Kapnak ikont, nevet, fénylő keretet, enyhe glow effektet
- Smooth CSS animáció a blueprint → színes átmenethez
- A zárt szobák továbbra is tervrajz stílusban maradnak
- Progress bar mutatja az összesített haladást

### Végállapot
- Az egész ház kiszínesedett, életre kelt
- A Széf (12. szoba) megnyílik
- Konfetti animáció + összesítő meglepetés oldal

---

## Szobák (12 db)

### 1. Hangok Terme
- **Minijáték:** Dallam-felismerő — rövid zenei részlet szól, ki kell választani melyik dal
- **Tartalom:** Közös kedvenc dalok lejátszólista (beágyazott lejátszó vagy linkek)
- **Szín:** Arany (#f6ad55)

### 2. Emlékek Kamrája
- **Minijáték:** Memóriajáték — kártyapárok megtalálása családi fotókkal
- **Tartalom:** Fotógaléria kedvenc családi emlékekből
- **Szín:** Zöld (#68d391)

### 3. A Nagy Világjáró
- **Minijáték:** Térkép-kvíz — "Hol voltunk nyaralni 20XX-ben?" kérdések
- **Tartalom:** Interaktív térkép (Leaflet.js) közös utazások helyszíneivel, fotókkal, sztorikkal
- **Szín:** Piros (#fc8181)

### 4. Agytornaterem
- **Minijáték:** Kvíz apukádról — személyes kérdések ("Hány éves korában...", "Mi a kedvenc...")
- **Tartalom:** Vicces eredmény kiértékelés + családi fun facts
- **Szín:** Kék (#63b3ed)

### 5. Titkos Levelesláda
- **Minijáték:** Puzzle — egy családi fotót kell kirakni (drag&drop darabok)
- **Tartalom:** Szöveges üzenetek családtagoktól
- **Szín:** Lila (#b794f4)

### 6. Moziterem
- **Minijáték:** Torta-készítő kattintós játék (összetevőket kell sorban hozzáadni)
- **Tartalom:** Videó üzenetek (beágyazott videók)
- **Szín:** Rózsaszín (#f687b3)

### 7. Időkapszula
- **Minijáték:** Sorba rendezés — családi eseményeket időrendbe kell rakni (drag&drop)
- **Tartalom:** Idővonal apukád életéből, mérföldkövekkel és fotókkal
- **Szín:** Türkiz (#4fd1c5)

### 8. Kalandorok Klubja
- **Minijáték:** Képfelismerő — elmosódott/részlet fotókból kell kitalálni hol voltak
- **Tartalom:** Közös kaland emlékek (gokart, szabadulószoba, vidámpark) fotókkal és sztorikkal
- **Szín:** Narancs (#ed8936)

### 9. Ajándékraktár
- **Minijáték:** Kaparós sorsjegy effekt — "kaparni" kell az egérrel/ujjal a kuponokat
- **Tartalom:** Beváltható kuponok (pl. "Mosogatok helyetted", "Főzök amit kérsz", stb.)
- **Szín:** Arany-sárga (#ecc94b)

### 10. A Furcsa Konyha
- **Minijáték:** Összetevő-keverő — random összetevőket kell összekeverni, vicces étel nevek generálódnak
- **Tartalom:** Gyűjtemény furcsán hangzó de finom receptekből
- **Szín:** Zöld (#48bb78)

### 11. Kockagyár
- **Minijáték:** Virtuális Lego építő — drag&drop kockákat kell egymásra rakni, egyszerű építmény
- **Tartalom:** Kész építmény megjelenítése + gratulálás
- **Szín:** Piros (#f56565)

### 12. A Széf (Titkos szoba)
- **Feloldás:** Automatikusan megnyílik ha mind a 11 szoba kész
- **Tartalom:** Nagy finale — konfetti animáció, összesítő üzenet, az egész ház teljes fényben
- **Szín:** Arany gradient

---

## Navigáció és flow

1. **Főoldal betöltés** → Blueprint tervrajz jelenik meg az összes szobával
2. **Zárt szobára kattintás** → Minijáték nézet nyílik meg (overlay vagy új view)
3. **Minijáték sikeres** → Animált átmenet: szoba kiszínesedik a tervrajzon
4. **Feloldott szobára kattintás** → Tartalom nézet (fotók, videók, üzenetek, stb.)
5. **Vissza gomb** → Visszatérés a ház tervrajzhoz
6. **Mind feloldva** → A Széf automatikusan megnyílik, finale

### Progress mentés
- **localStorage** tárolja melyik szobák vannak feloldva
- Apukád bezárhatja a böngészőt és folytathatja később
- Nincs szükség bejelentkezésre vagy szerverre

---

## Tech Stack

| Réteg | Technológia | Miért |
|-------|-------------|-------|
| Markup | HTML5 | Egyszerű, natív |
| Stílus | CSS3 (custom properties, animations, grid) | Blueprint stílus, smooth átmenetek |
| Logika | Vanilla JavaScript (ES6+) | Nincs build step, gyors fejlesztés |
| Térkép | Leaflet.js (CDN) | Interaktív térkép az Utazószobához |
| Grafika | Canvas API | Minijátékok (Lego építő, memória) |
| Animáció | CSS @keyframes + JS | Konfetti, kiszínesedés, glow |
| Tárolás | localStorage | Progress mentés |
| Hosting | GitHub Pages | Ingyenes, egyszerű deploy |

### Fájlstruktúra

```
index.html              — Főoldal (blueprint ház)
css/
  style.css             — Globális stílusok, blueprint téma
  animations.css        — Animációk (kiszínesedés, konfetti)
  rooms.css             — Szoba-specifikus stílusok
js/
  app.js                — Fő alkalmazás logika, navigáció
  progress.js           — localStorage kezelés, progress tracking
  rooms/
    hangok-terme.js     — Dallam-felismerő minijáték
    emlekek-kamraja.js  — Memóriajáték
    vilagjaro.js        — Térkép-kvíz
    agytornaterem.js    — Kvíz
    leveleslada.js      — Puzzle kirakó
    moziterem.js        — Torta-készítő
    idokapszula.js      — Sorba rendezés
    kalandorok.js       — Képfelismerő
    ajandekraktar.js    — Kaparós sorsjegy
    furcsa-konyha.js    — Összetevő-keverő
    kockagyar.js        — Lego építő
    a-szef.js           — Finale
assets/
  photos/               — Családi fotók
  audio/                — Zenei részletek
  video/                — Videó üzenetek
```

---

## Reszponzivitás

- **Desktop:** 3-4 oszlopos szoba rács a tervrajzon
- **Tablet:** 2-3 oszlopos rács
- **Mobil:** 2 oszlopos rács, minijátékok touch-optimalizáltak
- A minijátékoknak működniük kell érintőképernyőn is (apukád valószínűleg telefonon nyitja meg)

---

## Hibakezelés

- Ha egy minijátékban elakad → "Segítség" gomb (tippek) + "Átugrom" gomb (5 sikertelen próba után)
- Ha localStorage nem elérhető → az oldal továbbra is működik, de nem menti a progresst (figyelmeztetés jelenik meg)
- Ha egy média fájl nem tölt be → fallback placeholder szöveggel

---

## Korlátok és feltételezések

- A tartalom (fotók, videók, szövegek, receptek, kuponok) a felhasználótól jön — a rendszer helyőrzőkkel készül, amiket könnyű cserélni
- A zenei dallam-felismerő rövid, jogdíjmentes részleteket használ, vagy a felhasználó saját felvételeit
- A videók vagy beágyazott (YouTube unlisted) vagy helyi fájlok
- GitHub Pages fájlméret korlát: max 1GB repo, max 100MB fájl — a videókat YouTube-on érdemes tárolni
