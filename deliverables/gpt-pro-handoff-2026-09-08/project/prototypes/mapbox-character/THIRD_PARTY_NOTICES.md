# Third-party components and services

This file records the third-party components used by the Mapbox character prototype. It is a draft for the hackathon submission disclosure and should be updated if the implementation changes.

## Mapbox GL JS and Mapbox Standard

- Component: Mapbox GL JS 3.30.0
- Service and data: Mapbox Standard style, including Mapbox-hosted map data and 3D objects
- Provider: Mapbox, Inc.
- Purpose: interactive basemap, labels, 3D buildings, landmarks, facades, trees, and camera rendering
- Terms: [Mapbox Terms of Service](https://www.mapbox.com/legal/tos/) and incorporated product terms
- Modification: application code configures the standard style and adds an independent Three.js custom layer; the Mapbox SDK is not modified
- Attribution: the Mapbox logo and the Mapbox/OpenStreetMap attribution control remain visible in the map view

## Three.js

- Component: Three.js 0.180.0
- Copyright: Three.js authors
- License: MIT
- Purpose: load and animate the GLB character inside the Mapbox custom 3D layer
- Modification: none to the library

## Super Basic Human Model w/ Animations

- Author: George Blackwell
- Source: [Super Basic Human Model w/ Animations](https://georgeblackwell.itch.io/basic-human-mesh)
- License: [Creative Commons Attribution 4.0 International](https://creativecommons.org/licenses/by/4.0/)
- Purpose: temporary character used to verify scale, visibility, and walking animation
- Changes: converted from the distributed Blender source to GLB, applied its Mirror modifier so both sides are included, assigned a neutral prototype material, and recolored at runtime; the included `Walk` animation is used
- Local notice: [`public/models/basic-human/ATTRIBUTION.md`](public/models/basic-human/ATTRIBUTION.md)

## Vite

- Component: Vite 7.3.6
- License: MIT
- Purpose: local development and production bundling
- Modification: none
