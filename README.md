# Weather Station Card

A Home Assistant Lovelace card in **Mushroom style** showing a 16-point compass rose with a wind-direction arrow plus configurable chips for **temperature, humidity, pressure, wind speed, wind gusts, current rain and rain over the last 24 hours**.

![Weather Station Card screenshot](screenshot.png)

## Features

- **16-point compass rose** drawn as inline SVG — no images, no external assets
- **Red wind-direction arrow** that rotates smoothly to the current heading
- **Seven sensor chips** in Mushroom style — temperature, humidity, pressure, wind, gusts, rain, rain 24 h. Each is optional; unconfigured chips are hidden automatically
- **Visual editor** with entity selectors for every field — no YAML required
- **Wind direction input** accepts either a degree value (0–360) **or** a text label (`N`, `NE`/`NO`, `E`/`O`, `SE`/`SO`, …). Both English and German abbreviations are recognised
- **Units auto-detected** from each entity's `unit_of_measurement` attribute, with fallbacks (`°C` / `%` / `hPa` / `km/h` / `mm`)
- **Click any chip** (or the compass) to open the entity's more-info dialog
- **Responsive** — 2-column chip grid on wide cards, single column on narrow screens
- Uses Home Assistant theme variables, so it inherits your light/dark theme automatically

> The visible labels on the card and the editor are currently in **German**
> (Temperatur, Luftfeuchte, Wind, Böen, Regen, …). A multilingual switch is on
> the roadmap. Until then, override individual labels by configuring different
> `friendly_name`s on your sensors and reading them in the More-Info dialog, or
> fork the card and adjust the strings in `_renderChips` / `_label`.

## Installation

Install via **HACS** (Home Assistant Community Store). HACS will place the card
under `/hacsfiles/` automatically — there is no `/local/` install path for this
card.

1. In Home Assistant, open **HACS → Frontend → ⋮ menu → Custom repositories**
2. Add this repository URL with category **Dashboard**
3. Search for "Weather Station Card" in HACS and install
4. HACS usually registers the Lovelace resource automatically. If not, add it
   manually under **Settings → Dashboards → Resources**:
   ```yaml
   url: /hacsfiles/HA-Weatherstation-Card/weatherstation-card.js
   type: module
   ```
5. Hard-reload your browser (Ctrl+F5) after install

> **Don't have HACS yet?** See <https://hacs.xyz/> for the one-time HACS setup.
> Once installed, follow the steps above.

## Quick Start

Minimal — only the four most common values:

```yaml
type: custom:weatherstation-card
title: Weather
temperature: sensor.outdoor_temperature
humidity: sensor.outdoor_humidity
pressure: sensor.outdoor_pressure
wind_speed: sensor.wind_speed
```

Full configuration with compass and rain:

```yaml
type: custom:weatherstation-card
title: Weather Station
temperature: sensor.outdoor_temperature
humidity: sensor.outdoor_humidity
pressure: sensor.outdoor_pressure
wind_speed: sensor.wind_speed
wind_gust: sensor.wind_gust
wind_direction: sensor.wind_direction   # degrees 0–360 OR text (N, NE, ...)
rain_current: sensor.rain_current        # in mm
rain_24h: sensor.rain_24h                # in mm
```

Everything is also editable through the visual editor — no YAML knowledge required.

## Options

| Option           | Type     | Description                                                               |
| ---------------- | -------- | ------------------------------------------------------------------------- |
| `title`          | string   | Card title shown above the compass (default `"Weather Station"`)          |
| `temperature`    | entity   | Sensor reporting current temperature                                      |
| `humidity`       | entity   | Sensor reporting relative humidity                                        |
| `pressure`       | entity   | Sensor reporting atmospheric pressure                                     |
| `wind_speed`     | entity   | Sensor reporting wind speed                                               |
| `wind_gust`      | entity   | Sensor reporting wind gust speed                                          |
| `wind_direction` | entity   | Sensor reporting wind direction (degrees `0`–`360` **or** text like `NE`) |
| `rain_current`   | entity   | Sensor reporting current rain amount (mm)                                 |
| `rain_24h`       | entity   | Sensor reporting rain over the last 24 h (mm)                             |

Leave any option blank to hide that chip.

### Wind direction conventions

The red arrow points in the direction indicated by the sensor value. Most
Home Assistant weather integrations report wind direction as the direction
the wind is *coming from* — that's what the card displays as-is.

If your sensor reports "where the wind is going to" instead, wrap it in a
template sensor:

```yaml
template:
  - sensor:
      - name: "Wind Direction From"
        unit_of_measurement: "°"
        state: >
          {{ (states('sensor.wind_direction_to') | float + 180) % 360 }}
```

### Accepted text labels for wind direction

`N`, `NNO`/`NNE`, `NO`/`NE`, `ONO`/`ENE`, `O`/`E`, `OSO`/`ESE`, `SO`/`SE`, `SSO`/`SSE`, `S`, `SSW`, `SW`, `WSW`, `W`, `WNW`, `NW`, `NNW`. Case is ignored.

## Compatibility

- Home Assistant 2024.x and newer (tested on 2026.x)
- Any browser with native CSS `aspect-ratio` and `color-mix` support — i.e. Chrome / Edge / Firefox / Safari from 2023 onward
- Inherits look from your active HA theme (Mushroom / Mushroom Strategy / vanilla — all fine)

## License

MIT — see [LICENSE](LICENSE).
