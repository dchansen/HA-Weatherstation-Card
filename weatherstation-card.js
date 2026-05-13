/**
 * Weather Station Card – v1.0.0
 *
 * Home Assistant Lovelace card in Mushroom style:
 *   • 16-point inline-SVG compass rose with red wind-direction arrow
 *   • Temperature, humidity, pressure
 *   • Wind speed, wind gusts
 *   • Current rain, rain over the last 24 h
 *
 * Fully configurable via the visual editor.
 */

const LitElement =
  window.LitElement ||
  Object.getPrototypeOf(customElements.get("hui-masonry-view") || customElements.get("hui-view"));
const html = LitElement.prototype.html;
const css = LitElement.prototype.css;

/* ------------------------------------------------------------------ */
/*  Hilfsfunktionen                                                    */
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

function parseDirection(raw) {
  if (raw === undefined || raw === null || raw === "") return null;
  const num = Number(raw);
  if (!isNaN(num)) return ((num % 360) + 360) % 360;
  const key = String(raw).trim().toUpperCase();
  return TEXT_TO_DEG[key] ?? null;
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
      rain_current: "",
      rain_24h: "",
    };
  }

  setConfig(config) {
    if (!config) throw new Error("Ungültige Konfiguration");
    this._config = {
      title: "Weather Station",
      temperature: "",
      humidity: "",
      pressure: "",
      wind_speed: "",
      wind_gust: "",
      wind_direction: "",
      rain_current: "",
      rain_24h: "",
      ...config,
    };
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
    const dirDeg = parseDirection(this._state(c.wind_direction));

    const chips = [
      {
        entity: c.temperature,
        icon: "mdi:thermometer",
        label: "Temperatur",
        value: this._state(c.temperature),
        unit: this._unit(c.temperature, "°C"),
        color: "#ef5350",
        digits: 1,
      },
      {
        entity: c.humidity,
        icon: "mdi:water-percent",
        label: "Luftfeuchte",
        value: this._state(c.humidity),
        unit: this._unit(c.humidity, "%"),
        color: "#42a5f5",
        digits: 0,
      },
      {
        entity: c.pressure,
        icon: "mdi:gauge",
        label: "Luftdruck",
        value: this._state(c.pressure),
        unit: this._unit(c.pressure, "hPa"),
        color: "#ab47bc",
        digits: 0,
      },
      {
        entity: c.wind_speed,
        icon: "mdi:weather-windy",
        label: "Wind",
        value: this._state(c.wind_speed),
        unit: this._unit(c.wind_speed, "km/h"),
        color: "#26c6da",
        digits: 0,
      },
      {
        entity: c.wind_gust,
        icon: "mdi:weather-windy-variant",
        label: "Böen",
        value: this._state(c.wind_gust),
        unit: this._unit(c.wind_gust, "km/h"),
        color: "#26a69a",
        digits: 0,
      },
      {
        entity: c.rain_current,
        icon: "mdi:weather-pouring",
        label: "Regen",
        value: this._state(c.rain_current),
        unit: this._unit(c.rain_current, "mm"),
        color: "#5c6bc0",
        digits: 1,
      },
      {
        entity: c.rain_24h,
        icon: "mdi:weather-rainy",
        label: "Regen 24 h",
        value: this._state(c.rain_24h),
        unit: this._unit(c.rain_24h, "mm"),
        color: "#3949ab",
        digits: 1,
      },
    ].filter((ch) => ch.entity);

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
            ${this._renderRose(dirDeg)}
            <div class="compass-caption">
              <span class="dir">${dirDeg !== null ? degToCompass(dirDeg) : "Wind"}</span>
              ${dirDeg !== null
                ? html`<span class="deg">${fmt(dirDeg, 0)}°</span>`
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
/*  UI-Editor                                                          */
/* ------------------------------------------------------------------ */

class WeatherStationCardEditor extends LitElement {
  static get properties() {
    return { hass: {}, _config: {} };
  }

  setConfig(config) {
    this._config = { ...config };
  }

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
      { name: "rain_current", ...ent() },
      { name: "rain_24h", ...ent() },
    ];
  }

  _label(s) {
    return (
      {
        title: "Titel",
        temperature: "Temperatur",
        humidity: "Luftfeuchte",
        pressure: "Luftdruck",
        wind_speed: "Windgeschwindigkeit",
        wind_gust: "Windböen",
        wind_direction: "Windrichtung (° oder Text)",
        rain_current: "Regen aktuell (mm)",
        rain_24h: "Regen 24 h (mm)",
      }[s.name] || s.name
    );
  }

  render() {
    if (!this.hass || !this._config) return html``;
    return html`
      <ha-form
        .hass=${this.hass}
        .data=${this._config}
        .schema=${this._schema()}
        .computeLabel=${(s) => this._label(s)}
        @value-changed=${this._valueChanged}
      ></ha-form>
    `;
  }

  _valueChanged(ev) {
    const newConfig = ev.detail.value;
    this._config = newConfig;
    this.dispatchEvent(
      new CustomEvent("config-changed", {
        detail: { config: newConfig },
        bubbles: true,
        composed: true,
      })
    );
  }

  static get styles() {
    return css`
      ha-form {
        display: block;
        padding: 8px 0;
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
    "Mushroom-style weather card: compass rose with wind arrow, temperature, humidity, pressure, wind, gusts, rain.",
  preview: true,
});

console.info(
  "%c WEATHERSTATION-CARD %c v1.0.0 ",
  "color:white;background:#03a9f4;font-weight:700;border-radius:4px 0 0 4px;padding:2px 6px",
  "color:#03a9f4;background:white;font-weight:700;border-radius:0 4px 4px 0;padding:2px 6px;border:1px solid #03a9f4"
);
