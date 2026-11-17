# Datheon Full Stack Web Development Internship

Three front-end web applications built with plain HTML, CSS and JavaScript (ES6+). No frameworks, build tools or servers are needed.

## Projects

| # | Project | What it does | Data source |
|---|---------|--------------|-------------|
| 1 | [E-commerce Storefront](task-1-ecommerce-storefront/) | Product cards with ratings, prices and badges. Category filter, search, slide-out cart with quantity controls, tax and shipping totals, simulated checkout. | [FakeStoreAPI](https://fakestoreapi.com/products) |
| 2 | [Task Manager](task-2-task-manager/) | Create, edit, delete and complete tasks. Categories, due dates, All / Active / Completed filters, search, drag-and-drop ordering. | Browser `localStorage` |
| 3 | [Weather Dashboard](task-3-weather-app/) | Search any city for current temperature, conditions, humidity, wind, pressure and a 5-day forecast. Background changes with the weather and time of day. | [Open-Meteo](https://open-meteo.com/) (no API key needed) |

## Run locally

1. Clone the repository.
2. Open `index.html` in a browser, or open any project's `index.html` directly.
3. Projects 1 and 3 call public APIs, so they need an internet connection.

Optional local server:

```bash
python -m http.server 8000
# then visit http://localhost:8000
```

## Folder structure

```
Datheon_Full_Stack_Web_Development_Internship/
├── README.md
├── index.html                      # links to all three projects
├── task-1-ecommerce-storefront/
│   ├── index.html
│   ├── style.css
│   └── script.js
├── task-2-task-manager/
│   ├── index.html
│   ├── style.css
│   └── script.js
└── task-3-weather-app/
    ├── index.html
    ├── style.css
    └── script.js
```

## Key features

- **Storefront:** `addToCart()`, `removeFromCart()`, `updateQuantity()` and `calculateTotal()`; cart saved in `localStorage`; loading skeletons and an offline fallback if the API fails.
- **Task manager:** `saveToLocalStorage()` and `loadFromLocalStorage()`; completion animation; input validation.
- **Weather dashboard:** async/await with `try/catch`; loading spinner; separate messages for unknown cities, timeouts and network errors; °C/°F toggle.
- **All projects:** responsive layout, keyboard focus styles, light and dark mode, reduced-motion support.

## Technologies

HTML5, CSS3 (Grid, Flexbox, custom properties, transitions), JavaScript (ES6+, Fetch API, async/await, DOM manipulation, `localStorage`).
