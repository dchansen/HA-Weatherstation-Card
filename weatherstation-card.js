/**
 * Weather Station Card – v1.3.0
 *
 * Home Assistant Lovelace card in Mushroom style:
 *   • 16-point inline-SVG compass rose with red wind-direction arrow
 *   • Arrow and direction text can be inverted independently
 *   • Temperature, humidity, pressure
 *   • Wind speed, wind gusts, UV index
 *   • Current rain, rain over the last 24 h
 *   • Per-metric color thresholds for the chip icons (own editor tab)
 *   • UI labels localized via hass.language (en/de/da, falls back to en)
 *
 * Fully configurable via the visual editor.
 */

const LitElement =
  window.LitElement ||
  Object.getPrototypeOf(customElements.get("hui-masonry-view") || customElements.get("hui-view"));
const html = LitElement.prototype.html;
const css = LitElement.prototype.css;

/* ------------------------------------------------------------------ */
/*  Localization                                                       */
/* ------------------------------------------------------------------ */
/*
 * Bundled directly into the JS (rather than fetched as separate JSON
 * files) so the card keeps working as a single-file HACS resource with
 * no extra network request. To add a language, add a key here.
 */
const TRANSLATIONS = {
  en: {
    metrics: {
      temperature: "Temperature",
      humidity: "Humidity",
      pressure: "Pressure",
      wind_speed: "Wind",
      wind_gust: "Gusts",
      uv_index: "UV index",
      rain_current: "Rain",
      rain_24h: "Rain 24 h",
    },
    card: {
      wind_placeholder: "Wind",
      invalid_config: "Invalid configuration",
    },
    editor: {
      tab_entities: "Entities",
      tab_colors: "Colors",
      fields: {
        title: "Title",
        temperature: "Temperature",
        humidity: "Humidity",
        pressure: "Pressure",
        wind_speed: "Wind speed",
        wind_gust: "Wind gusts",
        wind_direction: "Wind direction (° or text)",
        wind_arrow_invert: "Invert arrow (shows direction wind blows to)",
        wind_text_invert: "Invert text/degrees (shows direction wind blows to)",
        uv_index: "UV index",
        rain_current: "Rain current (mm)",
        rain_24h: "Rain 24 h (mm)",
      },
      colors_hint:
        "The color applies from the given value upward (sorted ascending). Without thresholds the chip keeps its default color.",
      no_thresholds: "No thresholds – default color",
      add_threshold: "Add threshold",
      remove_threshold: "Remove threshold",
    },
  },
  de: {
    metrics: {
      temperature: "Temperatur",
      humidity: "Luftfeuchte",
      pressure: "Luftdruck",
      wind_speed: "Wind",
      wind_gust: "Böen",
      uv_index: "UV-Index",
      rain_current: "Regen",
      rain_24h: "Regen 24 h",
    },
    card: {
      wind_placeholder: "Wind",
      invalid_config: "Ungültige Konfiguration",
    },
    editor: {
      tab_entities: "Entitäten",
      tab_colors: "Farben",
      fields: {
        title: "Titel",
        temperature: "Temperatur",
        humidity: "Luftfeuchte",
        pressure: "Luftdruck",
        wind_speed: "Windgeschwindigkeit",
        wind_gust: "Windböen",
        wind_direction: "Windrichtung (° oder Text)",
        wind_arrow_invert: "Pfeil umkehren (zeigt Richtung, in die der Wind weht)",
        wind_text_invert: "Text/Grad umkehren (zeigt Richtung, in die der Wind weht)",
        uv_index: "UV-Index",
        rain_current: "Regen aktuell (mm)",
        rain_24h: "Regen 24 h (mm)",
      },
      colors_hint:
        "Die Farbe gilt ab dem angegebenen Wert aufwärts (aufsteigend sortiert). Ohne Schwellen bleibt die Standardfarbe erhalten.",
      no_thresholds: "Keine Schwellen – Standardfarbe",
      add_threshold: "Schwelle hinzufügen",
      remove_threshold: "Schwelle entfernen",
    },
  },
  da: {
    metrics: {
      temperature: "Temperatur",
      humidity: "Luftfugtighed",
      pressure: "Lufttryk",
      wind_speed: "Vind",
      wind_gust: "Vindstød",
      uv_index: "UV-indeks",
      rain_current: "Regn",
      rain_24h: "Regn 24 t",
    },
    card: {
      wind_placeholder: "Vind",
      invalid_config: "Ugyldig konfiguration",
    },
    editor: {
      tab_entities: "Enheder",
      tab_colors: "Farver",
      fields: {
        title: "Titel",
        temperature: "Temperatur",
        humidity: "Luftfugtighed",
        pressure: "Lufttryk",
        wind_speed: "Vindhastighed",
        wind_gust: "Vindstød",
        wind_direction: "Vindretning (° eller tekst)",
        wind_arrow_invert: "Vend pil (viser retningen vinden blæser hen mod)",
        wind_text_invert: "Vend tekst/grader (viser retningen vinden blæser hen mod)",
        uv_index: "UV-indeks",
        rain_current: "Regn nu (mm)",
        rain_24h: "Regn 24 t (mm)",
      },
      colors_hint:
        "Farven gælder fra den angivne værdi og opefter (sorteret stigende). Uden tærskler bruges standardfarven.",
      no_thresholds: "Ingen tærskler – standardfarve",
      add_threshold: "Tilføj tærskel",
      remove_threshold: "Fjern tærskel",
    },
  },
};

const FALLBACK_LANG = "en";

/**
 * Look up a dot-path translation key (e.g. "editor.tab_colors") for the
 * given HA frontend language, falling back to English, then to the key
 * itself if nothing matches.
 */
function localize(hassOrLang, path) {
  const lang =
    (typeof hassOrLang === "string" ? hassOrLang : hassOrLang?.language) ||
    FALLBACK_LANG;
  const lookup = (l) =>
    path
      .split(".")
      .reduce((o, k) => (o && typeof o === "object" ? o[k] : undefined), TRANSLATIONS[l]);
  return lookup(lang) ?? lookup(FALLBACK_LANG) ?? path;
}

/* ------------------------------------------------------------------ */
/*  Helper functions                                                   */
/* ------------------------------------------------------------------ */

const COMPASS_16 = [
  "N", "NNO", "NO", "ONO", "O", "OSO", "SO", "SSO",
  "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW",
];

const TEXT_TO_DEG = {
  N: 0, NNO: 22.5, NNE: 22.5, NO: 45, NE: 45, ONO: 67.5, ENE: 67.5,
  O: 90, E: 90, OSO: 112.5, ESE: 112.5, SO: 135, SE: 135, SSO: 157.5, SSE: 157.5,
  S: 180, SSW: 202.5, SW: 225, WSW: 247.5,
  W: 270, WNW: 292.5, NW: 315, NNW: 337.5,
};

/**
 * Parse a wind-direction state into a 0–360° value (no inversion applied).
 * @param {*} raw  entity state (degrees or text label)
 * @returns {number|null}
 */
function parseDirection(raw) {
  if (raw === undefined || raw === null || raw === "") return null;
  const num = Number(raw);
  if (!isNaN(num)) return ((num % 360) + 360) % 360;
  const key = String(raw).trim().toUpperCase();
  const deg = TEXT_TO_DEG[key];
  return deg === undefined ? null : deg;
}

/** Add 180° when `invert` is true. Passes null/NaN through untouched. */
function invertDeg(deg, invert) {
  if (deg === null || deg === undefined || isNaN(deg)) return deg;
  return invert ? (deg + 180) % 360 : deg;
}

function degToCompass(deg) {
  if (deg === null || deg === undefined || isNaN(deg)) return "–";
  const idx = Math.round((deg % 360) / 22.5) % 16;
  return COMPASS_16[idx];
}

function fmt(value, digits = 0) {
  if (value === undefined || value === null || value === "" || isNaN(value)) return "–";
  return Number(value).toFixed(digits);
}

/**
 * Resolve an icon color from ascending value thresholds.
 * Each threshold's color applies FROM its value upward. Anything below the
 * lowest threshold uses the lowest threshold's color, so the whole range is
 * covered. With no thresholds the static fallback color is used.
 */
function resolveColor(thresholds, value, fallback) {
  if (!Array.isArray(thresholds) || thresholds.length === 0) return fallback;
  const num = Number(value);
  if (value === undefined || value === null || value === "" || isNaN(num)) return fallback;
  const sorted = thresholds
    .filter((t) => t && t.color != null && t.color !== "" && !isNaN(Number(t.value)))
    .map((t) => ({ value: Number(t.value), color: t.color }))
    .sort((a, b) => a.value - b.value);
  if (sorted.length === 0) return fallback;
  let col = sorted[0].color;
  for (const t of sorted) {
    if (num >= t.value) col = t.color;
  }
  return col;
}

/* Shared metric definitions (key → unit / default color / icon).
 * Labels are no longer hardcoded here — they're looked up via
 * localize(hass, `metrics.${key}`) at render time so they follow
 * hass.language. */
const METRICS = [
  { key: "temperature",  unit: "°C",   def: "#ef5350", icon: "mdi:thermometer",            digits: 1 },
  { key: "humidity",     unit: "%",    def: "#42a5f5", icon: "mdi:water-percent",          digits: 0 },
  { key: "pressure",     unit: "hPa",  def: "#ab47bc", icon: "mdi:gauge",                  digits: 0 },
  { key: "wind_speed",   unit: "km/h", def: "#26c6da", icon: "mdi:weather-windy",          digits: 0 },
  { key: "wind_gust",    unit: "km/h", def: "#26a69a", icon: "mdi:weather-windy-variant",  digits: 0 },
  { key: "uv_index",     unit: "",     def: "#ffa726", icon: "mdi:weather-sunny",          digits: 0 },
  { key: "rain_current", unit: "mm",   def: "#5c6bc0", icon: "mdi:weather-pouring",        digits: 1 },
  { key: "rain_24h",     unit: "mm",   def: "#3949ab", icon: "mdi:weather-rainy",          digits: 1 },
];

/* ------------------------------------------------------------------ */
/*  Hauptkarte                                                         */
/* ------------------------------------------------------------------ */

class WeatherStationCard extends LitElement {
  static get properties() {
    return { hass: {}, _config: {} };
  }

  static getConfigElement() {
    return document.createElement("weatherstation-card-editor");
  }

  static getStubConfig(hass) {
    const findFirst = (deviceClass) => {
      if (!hass) return "";
      return (
        Object.keys(hass.states).find(
          (e) => hass.states[e].attributes?.device_class === deviceClass
        ) || ""
      );
    };
    return {
      title: "Weather Station",
      temperature: findFirst("temperature"),
      humidity: findFirst("humidity"),
      pressure: findFirst("pressure"),
      wind_speed: findFirst("wind_speed"),
      wind_gust: "",
      wind_direction: "",
      wind_arrow_invert: false,
      wind_text_invert: false,
      uv_index: "",
      rain_current: "",
      rain_24h: "",
      color_thresholds: {},
    };
  }

  setConfig(config) {
    if (!config) throw new Error(localize(FALLBACK_LANG, "card.invalid_config"));
    const merged = {
      title: "Weather Station",
      temperature: "",
      humidity: "",
      pressure: "",
      wind_speed: "",
      wind_gust: "",
      wind_direction: "",
      wind_arrow_invert: false,
      wind_text_invert: false,
      uv_index: "",
      rain_current: "",
      rain_24h: "",
      color_thresholds: {},
      ...config,
    };
    // Backward compat: legacy single toggle → apply to both arrow and text
    if (config.wind_direction_invert !== undefined) {
      if (config.wind_arrow_invert === undefined)
        merged.wind_arrow_invert = config.wind_direction_invert;
      if (config.wind_text_invert === undefined)
        merged.wind_text_invert = config.wind_direction_invert;
    }
    delete merged.wind_direction_invert;
    this._config = merged;
  }

  getCardSize() {
    return 6;
  }

  _state(entityId) {
    if (!entityId || !this.hass) return undefined;
    return this.hass.states[entityId]?.state;
  }

  _unit(entityId, fallback) {
    if (!entityId || !this.hass) return fallback;
    return this.hass.states[entityId]?.attributes?.unit_of_measurement || fallback;
  }

  _onMore(entityId) {
    if (!entityId) return;
    const event = new Event("hass-more-info", { bubbles: true, composed: true });
    event.detail = { entityId };
    this.dispatchEvent(event);
  }

  /* -------------------- Kompassrose (16-Punkt) --------------------
   *
   * Wichtig: Das gesamte SVG wird in EINEM html-Template erzeugt – keine
   * verschachtelten html``-Aufrufe innerhalb des <svg>, weil lit-html sonst
   * die inneren Fragmente im HTML-Namespace erstellt und der Browser sie
   * nicht als SVG-Elemente rendert.
   */

  _renderRose(dirDeg) {
    const hasDir = dirDeg !== null;
    const safeDir = hasDir ? dirDeg : 0;

    return html`
      <svg viewBox="-120 -120 240 240" class="rose-svg" xmlns="http://www.w3.org/2000/svg">
        <g class="rose">
          <!-- 4 lange Spitzen (N/O/S/W) -->
          <g transform="rotate(0)">
            <polygon class="spike-light" points="0,-92 -9,0 0,0"></polygon>
            <polygon class="spike-dark"  points="0,-92 9,0 0,0"></polygon>
          </g>
          <g transform="rotate(90)">
            <polygon class="spike-light" points="0,-92 -9,0 0,0"></polygon>
            <polygon class="spike-dark"  points="0,-92 9,0 0,0"></polygon>
          </g>
          <g transform="rotate(180)">
            <polygon class="spike-light" points="0,-92 -9,0 0,0"></polygon>
            <polygon class="spike-dark"  points="0,-92 9,0 0,0"></polygon>
          </g>
          <g transform="rotate(270)">
            <polygon class="spike-light" points="0,-92 -9,0 0,0"></polygon>
            <polygon class="spike-dark"  points="0,-92 9,0 0,0"></polygon>
          </g>
          <!-- 4 mittlere Spitzen (NO/SO/SW/NW) -->
          <g transform="rotate(45)">
            <polygon class="spike-light" points="0,-72 -7,0 0,0"></polygon>
            <polygon class="spike-dark"  points="0,-72 7,0 0,0"></polygon>
          </g>
          <g transform="rotate(135)">
            <polygon class="spike-light" points="0,-72 -7,0 0,0"></polygon>
            <polygon class="spike-dark"  points="0,-72 7,0 0,0"></polygon>
          </g>
          <g transform="rotate(225)">
            <polygon class="spike-light" points="0,-72 -7,0 0,0"></polygon>
            <polygon class="spike-dark"  points="0,-72 7,0 0,0"></polygon>
          </g>
          <g transform="rotate(315)">
            <polygon class="spike-light" points="0,-72 -7,0 0,0"></polygon>
            <polygon class="spike-dark"  points="0,-72 7,0 0,0"></polygon>
          </g>
          <!-- 8 kurze Spitzen -->
          <g transform="rotate(22.5)">
            <polygon class="spike-light" points="0,-50 -4.5,0 0,0"></polygon>
            <polygon class="spike-dark"  points="0,-50 4.5,0 0,0"></polygon>
          </g>
          <g transform="rotate(67.5)">
            <polygon class="spike-light" points="0,-50 -4.5,0 0,0"></polygon>
            <polygon class="spike-dark"  points="0,-50 4.5,0 0,0"></polygon>
          </g>
          <g transform="rotate(112.5)">
            <polygon class="spike-light" points="0,-50 -4.5,0 0,0"></polygon>
            <polygon class="spike-dark"  points="0,-50 4.5,0 0,0"></polygon>
          </g>
          <g transform="rotate(157.5)">
            <polygon class="spike-light" points="0,-50 -4.5,0 0,0"></polygon>
            <polygon class="spike-dark"  points="0,-50 4.5,0 0,0"></polygon>
          </g>
          <g transform="rotate(202.5)">
            <polygon class="spike-light" points="0,-50 -4.5,0 0,0"></polygon>
            <polygon class="spike-dark"  points="0,-50 4.5,0 0,0"></polygon>
          </g>
          <g transform="rotate(247.5)">
            <polygon class="spike-light" points="0,-50 -4.5,0 0,0"></polygon>
            <polygon class="spike-dark"  points="0,-50 4.5,0 0,0"></polygon>
          </g>
          <g transform="rotate(292.5)">
            <polygon class="spike-light" points="0,-50 -4.5,0 0,0"></polygon>
            <polygon class="spike-dark"  points="0,-50 4.5,0 0,0"></polygon>
          </g>
          <g transform="rotate(337.5)">
            <polygon class="spike-light" points="0,-50 -4.5,0 0,0"></polygon>
            <polygon class="spike-dark"  points="0,-50 4.5,0 0,0"></polygon>
          </g>
        </g>

        <text x="0"    y="-102" class="lbl-main">N</text>
        <text x="106"  y="6"    class="lbl-main">O</text>
        <text x="0"    y="114"  class="lbl-main">S</text>
        <text x="-106" y="6"    class="lbl-main">W</text>
        <text x="80"   y="-76"  class="lbl-ord">NO</text>
        <text x="80"   y="86"   class="lbl-ord">SO</text>
        <text x="-80"  y="86"   class="lbl-ord">SW</text>
        <text x="-80"  y="-76"  class="lbl-ord">NW</text>

        <g class="wind-arrow"
           transform="rotate(${safeDir})"
           style="opacity:${hasDir ? 1 : 0}">
          <polygon class="arrow-head" points="0,-95 11,12 0,2 -11,12"></polygon>
          <line class="arrow-tail" x1="0" y1="12" x2="0" y2="48"></line>
        </g>

        <circle class="hub" cx="0" cy="0" r="7"></circle>
      </svg>
    `;
  }

  /* -------------------- Mushroom-Chip -------------------- */

  _chip({ entity, icon, label, value, unit, color, digits = 0 }) {
    return html`
      <div class="chip" @click=${() => this._onMore(entity)}>
        <div class="shape" style="--chip-color:${color}">
          <ha-icon icon="${icon}"></ha-icon>
        </div>
        <div class="info">
          <div class="primary">
            ${value === "–" ? value : fmt(value, digits)}<span class="unit">${unit}</span>
          </div>
          <div class="secondary">${label}</div>
        </div>
      </div>
    `;
  }

  render() {
    if (!this._config || !this.hass) return html``;

    const c = this._config;
    const ct = c.color_thresholds || {};
    const baseDeg = parseDirection(this._state(c.wind_direction));
    const arrowDeg = invertDeg(baseDeg, !!c.wind_arrow_invert);
    const textDeg = invertDeg(baseDeg, !!c.wind_text_invert);

    const chips = METRICS.filter((m) => c[m.key]).map((m) => {
      const value = this._state(c[m.key]);
      return {
        entity: c[m.key],
        icon: m.icon,
        label: localize(this.hass, `metrics.${m.key}`),
        value,
        unit: this._unit(c[m.key], m.unit),
        color: resolveColor(ct[m.key], value, m.def),
        digits: m.digits,
      };
    });

    return html`
      <ha-card>
        ${c.title
          ? html`<div class="header">${c.title}</div>`
          : ""}
        <div class="body">
          <div
            class="compass"
            @click=${() =>
              this._onMore(c.wind_direction || c.wind_speed)}
          >
            ${this._renderRose(arrowDeg)}
            <div class="compass-caption">
              <span class="dir">${textDeg !== null ? degToCompass(textDeg) : localize(this.hass, "card.wind_placeholder")}</span>
              ${textDeg !== null
                ? html`<span class="deg">${fmt(textDeg, 0)}°</span>`
                : ""}
            </div>
          </div>

          <div class="chips">
            ${chips.map((ch) => this._chip(ch))}
          </div>
        </div>
      </ha-card>
    `;
  }

  static get styles() {
    return css`
      ha-card {
        padding: 0;
        overflow: hidden;
        border-radius: var(--ha-card-border-radius, 14px);
      }
      .header {
        padding: 14px 18px 6px;
        font-size: 1.05em;
        font-weight: 500;
        color: var(--primary-text-color);
      }
      .body {
        display: grid;
        grid-template-columns: minmax(170px, 42%) 1fr;
        gap: 16px;
        padding: 12px 16px 16px;
        align-items: center;
      }
      @media (max-width: 480px) {
        .body {
          grid-template-columns: 1fr;
        }
      }

      /* ---------- Kompass ---------- */
      .compass {
        display: flex;
        flex-direction: column;
        align-items: center;
        cursor: pointer;
        user-select: none;
      }
      .rose-svg {
        width: 100%;
        max-width: 220px;
        aspect-ratio: 1 / 1;
      }
      .spike-light {
        fill: var(--card-background-color, #ffffff);
        stroke: #8a8a8a;
        stroke-width: 0.6;
        stroke-linejoin: miter;
      }
      .spike-dark {
        fill: #b8b8b8;
        stroke: #8a8a8a;
        stroke-width: 0.6;
        stroke-linejoin: miter;
      }
      .lbl-main {
        fill: var(--primary-text-color);
        font-size: 18px;
        font-weight: 500;
        text-anchor: middle;
        dominant-baseline: middle;
      }
      .lbl-ord {
        fill: var(--primary-text-color);
        font-size: 12px;
        font-weight: 500;
        text-anchor: middle;
        dominant-baseline: middle;
      }
      .arrow-head {
        fill: #e53935;
        stroke: #b71c1c;
        stroke-width: 0.8;
        stroke-linejoin: round;
        filter: drop-shadow(0 1px 1.2px rgba(0, 0, 0, 0.35));
      }
      .arrow-tail {
        stroke: #b71c1c;
        stroke-width: 3;
        stroke-linecap: round;
        opacity: 0.55;
      }
      .hub {
        fill: #424242;
        stroke: #ffffff;
        stroke-width: 1.5;
      }
      .wind-arrow {
        transition: transform 800ms ease;
        transform-origin: 0 0;
      }
      .compass-caption {
        margin-top: 4px;
        display: flex;
        gap: 6px;
        align-items: baseline;
      }
      .compass-caption .dir {
        font-weight: 600;
        font-size: 1.05em;
      }
      .compass-caption .deg {
        font-size: 0.85em;
        color: var(--secondary-text-color);
      }

      /* ---------- Mushroom-Chips ---------- */
      .chips {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 8px 10px;
      }
      @media (max-width: 360px) {
        .chips {
          grid-template-columns: 1fr;
        }
      }
      .chip {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 6px 8px;
        border-radius: 12px;
        cursor: pointer;
        transition: background-color 150ms ease;
      }
      .chip:hover {
        background-color: var(--ha-card-background, rgba(0, 0, 0, 0.04));
      }
      .shape {
        flex: 0 0 auto;
        width: 38px;
        height: 38px;
        border-radius: 50%;
        display: grid;
        place-items: center;
        background-color: color-mix(in srgb, var(--chip-color) 22%, transparent);
      }
      .shape ha-icon {
        --mdc-icon-size: 22px;
        color: var(--chip-color);
      }
      .info {
        display: flex;
        flex-direction: column;
        line-height: 1.15;
        min-width: 0;
      }
      .primary {
        font-weight: 600;
        font-size: 1em;
        font-variant-numeric: tabular-nums;
        color: var(--primary-text-color);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .unit {
        margin-left: 3px;
        font-size: 0.78em;
        font-weight: 500;
        color: var(--secondary-text-color);
      }
      .secondary {
        font-size: 0.78em;
        color: var(--secondary-text-color);
      }
    `;
  }
}

/* ------------------------------------------------------------------ */
/*  UI-Editor (Reiter: Entitäten / Farben)                             */
/* ------------------------------------------------------------------ */

class WeatherStationCardEditor extends LitElement {
  static get properties() {
    return { hass: {}, _config: {}, _tab: {} };
  }

  setConfig(config) {
    this._config = { ...config };
    if (!this._tab) this._tab = "entities";
  }

  /* ---- Entitäten-Reiter ---- */

  _schema() {
    const ent = (domains = ["sensor", "input_number"]) => ({
      selector: { entity: { domain: domains } },
    });
    return [
      { name: "title", selector: { text: {} } },
      { name: "temperature", ...ent() },
      { name: "humidity", ...ent() },
      { name: "pressure", ...ent() },
      { name: "wind_speed", ...ent() },
      { name: "wind_gust", ...ent() },
      { name: "wind_direction", ...ent(["sensor", "input_number", "input_text"]) },
      { name: "wind_arrow_invert", selector: { boolean: {} } },
      { name: "wind_text_invert", selector: { boolean: {} } },
      { name: "uv_index", ...ent() },
      { name: "rain_current", ...ent() },
      { name: "rain_24h", ...ent() },
    ];
  }

  _label(s) {
    return localize(this.hass, `editor.fields.${s.name}`);
  }

  _valueChanged(ev) {
    const newConfig = { ...this._config, ...ev.detail.value };
    this._config = newConfig;
    this._emit(newConfig);
  }

  /* ---- Farben-Reiter ---- */

  _thresholds(key) {
    const ct = this._config.color_thresholds || {};
    return Array.isArray(ct[key]) ? ct[key] : [];
  }

  _commitThresholds(key, arr) {
    const ct = { ...(this._config.color_thresholds || {}) };
    if (arr.length === 0) delete ct[key];
    else ct[key] = arr;
    const newConfig = { ...this._config, color_thresholds: ct };
    this._config = newConfig;
    this._emit(newConfig);
  }

  _addRow(key) {
    this._commitThresholds(key, [
      ...this._thresholds(key),
      { value: 0, color: "#03a9f4" },
    ]);
  }

  _removeRow(key, idx) {
    this._commitThresholds(
      key,
      this._thresholds(key).filter((_, i) => i !== idx)
    );
  }

  _setField(key, idx, field, raw) {
    const arr = this._thresholds(key).map((t, i) => {
      if (i !== idx) return t;
      if (field === "value") {
        const num = parseFloat(raw);
        return { ...t, value: isNaN(num) ? 0 : num };
      }
      return { ...t, color: raw };
    });
    this._commitThresholds(key, arr);
  }

  _renderColors() {
    return html`
      <div class="hint">${localize(this.hass, "editor.colors_hint")}</div>
      <!-- Note: the bold "ab"/"upward" emphasis from the original German
           text was dropped — translation strings are kept as plain text
           rather than embedding HTML, which is the safer i18n pattern
           (translators shouldn't need to handle markup). -->
      ${METRICS.map((m) => {
        const list = this._thresholds(m.key);
        const metricLabel = localize(this.hass, `metrics.${m.key}`);
        return html`
          <div class="metric">
            <div class="metric-head">
              ${metricLabel}${m.unit ? html` <span class="mu">(${m.unit})</span>` : ""}
            </div>
            ${list.length === 0
              ? html`<div class="empty">${localize(this.hass, "editor.no_thresholds")}</div>`
              : list.map(
                  (t, i) => html`
                    <div class="trow">
                      <input
                        class="tval"
                        type="number"
                        step="any"
                        .value=${String(t.value ?? "")}
                        @change=${(e) =>
                          this._setField(m.key, i, "value", e.target.value)}
                      />
                      <input
                        class="tcol"
                        type="color"
                        .value=${t.color || "#03a9f4"}
                        @change=${(e) =>
                          this._setField(m.key, i, "color", e.target.value)}
                      />
                      <button
                        class="ticon"
                        title="${localize(this.hass, "editor.remove_threshold")}"
                        @click=${() => this._removeRow(m.key, i)}
                      >
                        <ha-icon icon="mdi:delete"></ha-icon>
                      </button>
                    </div>
                  `
                )}
            <button class="tadd" @click=${() => this._addRow(m.key)}>
              <ha-icon icon="mdi:plus"></ha-icon> ${localize(this.hass, "editor.add_threshold")}
            </button>
          </div>
        `;
      })}
    `;
  }

  /* ---- gemeinsam ---- */

  _emit(config) {
    this.dispatchEvent(
      new CustomEvent("config-changed", {
        detail: { config },
        bubbles: true,
        composed: true,
      })
    );
  }

  _setTab(t) {
    this._tab = t;
  }

  render() {
    if (!this.hass || !this._config) return html``;
    const tab = this._tab || "entities";
    return html`
      <div class="tabs">
        <button
          class="tab ${tab === "entities" ? "active" : ""}"
          @click=${() => this._setTab("entities")}
        >
          ${localize(this.hass, "editor.tab_entities")}
        </button>
        <button
          class="tab ${tab === "colors" ? "active" : ""}"
          @click=${() => this._setTab("colors")}
        >
          ${localize(this.hass, "editor.tab_colors")}
        </button>
      </div>
      ${tab === "entities"
        ? html`
            <ha-form
              .hass=${this.hass}
              .data=${this._config}
              .schema=${this._schema()}
              .computeLabel=${(s) => this._label(s)}
              @value-changed=${this._valueChanged}
            ></ha-form>
          `
        : this._renderColors()}
    `;
  }

  static get styles() {
    return css`
      ha-form {
        display: block;
        padding: 8px 0;
      }
      .tabs {
        display: flex;
        gap: 4px;
        border-bottom: 1px solid var(--divider-color);
        margin-bottom: 8px;
      }
      .tab {
        appearance: none;
        border: none;
        background: none;
        cursor: pointer;
        padding: 10px 16px;
        font: inherit;
        color: var(--secondary-text-color);
        border-bottom: 2px solid transparent;
      }
      .tab.active {
        color: var(--primary-color);
        border-bottom-color: var(--primary-color);
        font-weight: 600;
      }
      .hint {
        font-size: 0.85em;
        color: var(--secondary-text-color);
        margin: 4px 0 12px;
        line-height: 1.4;
      }
      .metric {
        padding: 10px 0;
        border-bottom: 1px solid var(--divider-color);
      }
      .metric:last-child {
        border-bottom: none;
      }
      .metric-head {
        font-weight: 600;
        margin-bottom: 6px;
        color: var(--primary-text-color);
      }
      .mu {
        color: var(--secondary-text-color);
        font-weight: 400;
        font-size: 0.85em;
      }
      .empty {
        font-size: 0.8em;
        color: var(--secondary-text-color);
        margin-bottom: 6px;
      }
      .trow {
        display: grid;
        grid-template-columns: 1fr 48px 40px;
        gap: 8px;
        align-items: center;
        margin-bottom: 6px;
      }
      .tval {
        padding: 8px;
        border: 1px solid var(--divider-color);
        border-radius: 6px;
        background: var(--card-background-color);
        color: var(--primary-text-color);
        font: inherit;
        width: 100%;
        box-sizing: border-box;
      }
      .tcol {
        width: 48px;
        height: 36px;
        padding: 0;
        border: 1px solid var(--divider-color);
        border-radius: 6px;
        background: none;
        cursor: pointer;
      }
      .ticon,
      .tadd {
        appearance: none;
        border: none;
        cursor: pointer;
        font: inherit;
        display: inline-flex;
        align-items: center;
        gap: 6px;
        background: none;
        color: var(--secondary-text-color);
      }
      .ticon {
        justify-content: center;
      }
      .tadd {
        margin-top: 4px;
        padding: 6px 0;
        color: var(--primary-color);
      }
      .ticon ha-icon,
      .tadd ha-icon {
        --mdc-icon-size: 20px;
      }
    `;
  }
}

/* ------------------------------------------------------------------ */
/*  Registrierung                                                      */
/* ------------------------------------------------------------------ */

customElements.define("weatherstation-card", WeatherStationCard);
customElements.define("weatherstation-card-editor", WeatherStationCardEditor);

window.customCards = window.customCards || [];
window.customCards.push({
  type: "weatherstation-card",
  name: "Weather Station",
  description:
    "Mushroom-style weather card: compass rose with wind arrow, temperature, humidity, pressure, wind, gusts, UV, rain — with per-metric color thresholds.",
  preview: true,
});

console.info(
  "%c WEATHERSTATION-CARD %c v1.2.0 ",
  "color:white;background:#03a9f4;font-weight:700;border-radius:4px 0 0 4px;padding:2px 6px",
  "color:#03a9f4;background:white;font-weight:700;border-radius:0 4px 4px 0;padding:2px 6px;border:1px solid #03a9f4"
);
