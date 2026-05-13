# Changelog

## [v1.0.0] - 2026-05-13

Initial public release.

### Features

- 16-point compass rose drawn as inline SVG with a rotating red wind-direction arrow
- Seven configurable sensor chips in Mushroom style: temperature, humidity, pressure, wind speed, wind gusts, current rain, rain last 24 h
- Visual editor (`ha-form` based) with `entity` selectors for every sensor — no YAML required
- Wind direction accepts either degree values (0–360) or text labels (`N`, `NO`/`NE`, `O`/`E`, … in German or English)
- Units auto-detected from each entity's `unit_of_measurement` attribute, with sensible fallbacks (°C / % / hPa / km/h / mm)
- Click on the compass or any chip opens the entity's more-info dialog
- Empty entity fields are hidden automatically
- Responsive layout — switches from 2-column chip grid to single column on narrow screens
