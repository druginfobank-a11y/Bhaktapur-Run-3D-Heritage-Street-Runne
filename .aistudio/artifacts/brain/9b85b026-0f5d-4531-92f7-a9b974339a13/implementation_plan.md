# Bhaktapur Run: 3D Heritage Street Runner with Live Google Maps Route Extraction

**Bhaktapur Run** is a high-fidelity 3D Temple Run–inspired action runner set in the historic brick-paved streets and pagoda squares of Bhaktapur, Nepal. It combines a physically based Three.js 3D engine with live Google Maps Platform route extraction so players run along real street geometries connecting iconic heritage landmarks like Bhaktapur Durbar Square, Taumadhi Square (Nyatapola Temple), Pottery Square, and Dattatreya Square.

---

### User Review & Critical Decisions

> [!IMPORTANT]
> The following core design and gameplay choices have been locked in based on your selections:

- **Confirmed Decision 1 — Google Maps Integration**: **Live Street Route Extraction with Real Landmark Checkpoints & Mini-Map**. The game uses the Google Maps JavaScript API (`@vis.gl/react-google-maps`) and the modern `Route.computeRoutes()` API to extract real walking/running street polylines, turn angles, and waypoint coordinates across Bhaktapur's heritage corridors, synchronizing your 3D runner's progress and turn intersections with a live interactive Google Maps mini-map.
- **Confirmed Decision 2 — Cultural Obstacles & Collectibles**: **Full Heritage Hazard & Treasure Suite**, combining:
  - *Pottery & Architecture*: Clay pottery stalls, stone temple guardian statues (Singha/Malla lions), and low carved *Jhya* wooden roof overhangs.
  - *Festival & Ritual*: Rolling Bisket Jatra chariot hazards, low-hanging bronze temple bells, and classic Temple Run–style oil fire braziers and broken brick alley gaps.
  - *Collectibles*: Ancient Newa Malla coins, *Juju Dhau* (King Curd) clay bowls, and brass *Sukunda* oil lamps for power-up meters.
- **Confirmed Decision 3 — Game Modes & Progression**: **Endless Heritage Run + Landmark Route Mode with Unlockable Runners**, allowing players to either sprint infinitely through looping heritage street networks or complete real point-to-point Google Maps routes between Bhaktapur squares to unlock new runners and upgrade heritage power-ups.

---

### 1. Overview & Core Concept

- **What It Does**: Delivers a Temple Run–level 3D third-person chase experience through Bhaktapur's traditional red-brick (*Dachi Appa*) alleys, tiered pagoda temples, and bustling squares. Real street segments, turn bearings, and landmark distances fetched from Google Maps dynamically drive the 3D street generator—when the real street turns sharp left toward Taumadhi Square or winds past Pottery Square, the 3D corridor spawns a corresponding temple courtyard intersection and landmark checkpoint.
- **Target Audience / Persona**: Action-arcade gamers and cultural explorers who want visceral, high-speed 3D runner mechanics grounded in authentic Nepali Newa architecture and real-world geography.
- **Key Value**: Fuses responsive 3-lane + turn-intersection 3D parkour (jump, slide, lane-switch, 90° corner turns, chaser pursuit) with live geospatial street extraction from Google Maps.

---

### 2. User Experience & Visual Design

- **Key User Flows**:
  1. **Heritage Lobby & Route Selection**: Players land on an atmospheric 3D live preview of Nyatapola Temple and Durbar Square at golden hour. From the sleek bottom dock or route drawer, they choose **Endless Heritage Run** or **Landmark Route Mode** (selecting real Bhaktapur start/destination landmarks or clicking custom waypoints on the interactive Google Map to compute a live street route via `Route.computeRoutes()`).
  2. **Active 3D Street Run & Live Mini-Map**: As the run begins, the camera smoothly damps into a dynamic third-person chase perspective behind the runner, pursued by stone guardian spirits after any stumble. A crisp top-left HUD displays distance, Newa Coins, Juju Dhau multiplier, and current Bhaktapur street name, while a compact corner Google Maps mini-map tracks the player's real-time `lat/lng` marker advancing along the extracted street polyline toward the next landmark checkpoint.
  3. **Intersections, Hazards & Power-Ups**: Players switch across 3 lanes (`A/D` or `Left/Right` or swipe), jump over broken brick gaps, fire traps, and rolling Bisket Jatra chariot wheels (`W/Up/Space`), and slide beneath low carved timber *Jhya* lintels and hanging bronze temple bells (`S/Down`). At real Google Maps street turns, players execute timed corner turns.
  4. **Run Summary & Runner Sanctum (Unlockables)**: Completing a Landmark Route or finishing an Endless Run displays a route telemetry summary (real distance covered in Bhaktapur, checkpoints reached, coins collected) and lets players unlock characters (e.g., *Newa Heritage Explorer*, *Pottery Artisan*, *Lakhey Mask Dancer*, *Royal Malla Courier*) and upgrade power-ups (*Sukunda Magnet*, *Garuda Shield*, *Juju Dhau Surge*).

- **Visual Identity & Theme**:
  - *Aesthetic Direction*: **Golden-Hour Newa Terracotta & Obsidian HUD** — rich, physically based 3D textures evoking hand-kilned *Dachi Appa* red bricks, dark carved Sal timber, and hammered brass roofs, contrasted against a razor-sharp dark obsidian UI overlay (`#0B0A0E`).
  - *Color Palette & Mood*:
    - `--background`: Deep Himalayan dusk obsidian (`#0D0B10`) for HUD surfaces (`rgba(13, 11, 16, 0.82)`).
    - `--primary`: Terracotta Vermilion (`#D94E28`) and Temple Gold (`#F59E0B`) for primary CTAs, score counters, and coin highlights.
    - `--accent`: Peacock Turquoise (`#06B6D4`) for active Google Maps route polylines, checkpoint beacons, and shield aura states.
    - *3D Atmosphere*: Warm golden-hour directional sunlight (`#FFE4B5`), cool Himalayan sky/terracotta ground hemisphere fill (`#7CA5B8` / `#5C3324`), and horizon-matched exponential distance fog (`THREE.FogExp2`).
  - *Typography & Hierarchy*:
    - **Display / Game Headers**: `Cinzel` (paired with `Chakra Petch` for high-speed distance/multiplier counters) to evoke ancient stone inscriptions with arcade clarity.
    - **Body & Controls**: `Plus Jakarta Sans` for crisp legibility across route selectors and upgrade cards.
    - **Telemetry & Coordinates**: `JetBrains Mono` with `tabular-nums` for live score, meter distance, speed (m/s), and real-time GPS coordinates.
  - *Component Styling & Layout*:
    - Full-viewport (`100vw × 100vh`) unobstructed 3D WebGL canvas.
    - Semantic DOM HUD layered cleanly at the perimeter: Top-left score/coin/checkpoint telemetry, Top-right interactive Google Maps mini-map with route polyline and runner pin (`AdvancedMarkerElement`), and a **Collapsible Bottom Control Dock** (`▾ Hide HUD / Cinema Mode`) housing mode selection, route planner, runner sanctum, camera toggle, and audio synth controls.

- **Interactive Feedback & Motion**:
  - Frame-rate independent exponential camera damping (`THREE.MathUtils.damp`), dynamic FOV widening during *Juju Dhau* speed surges, camera banking on lane switches and 90° street turns, particle bursts when collecting coins or *Sukunda* lamps, and procedural Web Audio API sound effects (temple bell chimes, terracotta footsteps, coin pickups, chariot rumbles).

---

### 3. Key Product Decisions & Trade-Offs

- **Decision 1: Real Google Maps Route Extraction Driving Procedural 3D Track Geometry**
  - *Chosen Approach*: Use `@vis.gl/react-google-maps` and the modern `Route.computeRoutes()` API (`useMapsLibrary('routes')`) to compute real walking routes between Bhaktapur heritage landmarks (e.g., Durbar Square `27.6722° N, 85.4278° E` → Taumadhi Square → Pottery Square → Tachupal/Dattatreya Square). We decode the returned path coordinates into bearing segments, lengths, and turn angles, which feed the 3D track spawner and sync 1:1 with the live 2D/satellite Google Maps mini-map.
  - *Why*: Purely random endless runners lack geographic authenticity, while raw 3D map tiles alone do not provide tight 60 FPS 3-lane Temple Run collision mechanics, overhang slides, and pit traps. Bridging real Google Maps route polylines with a custom Three.js Newa architectural track generator gives both authentic street topology and responsive arcade gameplay.
  - *Alternatives Considered*: Legacy `DirectionsService` (deprecated and disabled; avoided in favor of `Route.computeRoutes()`).

- **Decision 2: 100% Procedural Multi-Part 3D Models & PBR Textures (Zero External Asset 404s)**
  - *Chosen Approach*: Every 3D structure (5-tiered Nyatapola-style pagodas, carved wooden *Jhya* windows, stone lion guardians, Bisket Jatra chariots, pottery wheels, fire braziers, and the articulated runner character) is constructed as a composite 3–12 part `THREE.Group` with procedural `CanvasTexture` albedo/bump maps (`SRGBColorSpace` + max anisotropy) and `RoomEnvironment` PBR reflections.
  - *Why*: Ensures instant loading, zero broken external `.glb` or texture URLs, and crisp visual fidelity at 60 FPS.

---

### 4. Technical Architecture & Data Strategy *(Technical Reference)*

- **Architecture & Component Diagram**:

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                        Bhaktapur Run Application Shell                       │
│  ┌────────────────────────────────────┐  ┌────────────────────────────────┐  │
│  │  Google Maps Platform Provider     │  │  Game State & Progression      │  │
│  │  (@vis.gl/react-google-maps)       │  │  (Mode, Score, Coins, Runners, │  │
│  │  • Route.computeRoutes() Extractor │  │   Upgrades, Active Checkpoint) │  │
│  │  • Live Street Polyline & Headings │  └───────────────┬────────────────┘  │
│  └─────────────────┬──────────────────┘                  │                   │
│                    ▼                                     ▼                   │
│  ┌────────────────────────────────────────────────────────────────────────┐  │
│  │               Extracted Bhaktapur Street Segment Queue                 │  │
│  │   [ Segment Distance (m), Bearing (deg), Turn Angle, Landmark Meta ]   │  │
│  └─────────────────┬─────────────────────────────────────┬────────────────┘  │
│                    ▼                                     ▼                   │
│  ┌────────────────────────────────────┐  ┌────────────────────────────────┐  │
│  │   Three.js 3D WebGL Game Engine    │  │   Semantic DOM HUD & Overlays  │  │
│  │  • Studio PBR + RoomEnvironment    │  │  • Top-Left Score & Street Bar │  │
│  │  • 3-Lane + 90° Turn Track Spawner │  │  • Top-Right Live Google Map   │  │
│  │  • Multi-Part Pagodas & Row Houses │  │    Mini-Map + AdvancedMarkers  │  │
│  │  • Articulated Runner & Chasers    │  │  • Collapsible Bottom Dock:    │  │
│  │  • Hazards: Chariots, Bells, Gaps, │  │    Route Builder, Runners,     │  │
│  │    Pottery Stalls, Fire Traps      │  │    Upgrades, Camera & Audio    │  │
│  └────────────────────────────────────┘  └────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────────────┘
```

- **Data Model & State**:
  - `ExtractedRouteData`: Contains `originLandmark`, `destinationLandmark`, `waypoints`, `pathCoordinates` (`{lat, lng}[]`), `streetSegments` (distance in meters, compass bearing, turn direction `'STRAIGHT' | 'LEFT' | 'RIGHT'`, street/locality label), and `totalDistanceMeters`.
  - `GameSessionState`: Tracks `mode` (`'ENDLESS' | 'LANDMARK_ROUTE'`), `status` (`'MENU' | 'RUNNING' | 'PAUSED' | 'GAME_OVER' | 'VICTORY'`), `score`, `coins`, `jujuDhauCount`, `distanceMeters`, `speed`, `currentSegmentIndex`, `currentLatLng` (interpolated along the extracted Google Maps polyline), `activePowerUps` (`MAGNET`, `SHIELD`, `SURGE`), and `stumbleState` (guardian chaser proximity).
  - `PlayerProfileState` (persisted in `localStorage`): Tracks total accumulated Malla Coins, unlocked runners (`explorer`, `artisan`, `lakhey`, `courier`), power-up upgrade levels (1–5), and completed Bhaktapur heritage routes.

- **Interactive Component & State Mapping**:
  - **Live Map & Route Extractor Drawer**: Allows selecting curated Bhaktapur Heritage Trails (e.g., *Royal Durbar to Nyatapola Sprint*, *Pottery Square to Dattatreya Heritage Loop*, *Full Bhaktapur Grand Circuit*) or clicking custom start/end points on the interactive Google Map. Calls `Route.computeRoutes()` with `travelMode: 'WALK'`, renders the route polyline on the map, and builds the 3D segment queue.
  - **3D Runner Controls & Collision Loop**: Handles keyboard (`WASD` / Arrow keys / `Space`), touch swipes, and on-screen controls for lane switching (`-1, 0, +1`), jumping (`jumpVelocity`), sliding (`slideTimer`), and 90° intersection turns. Updates player `lat/lng` along the Google Maps route in real time as meters advance.
  - **Runner Sanctum & Power-Up Shop Modal**: Deducts collected Malla Coins to unlock characters (immediately updating the 3D character mesh colors, headgear, and trail aura) and upgrade power-up durations.
  - **Collapsible Bottom Dock**: Toggles between expanded control tabs (`Run Mode`, `Google Map Route`, `Runners & Shop`, `Camera & Audio`) and collapsed `Cinema / Zen Mode` (`H` key or toggle button) for 100% unobstructed 3D gameplay.
