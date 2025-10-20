# 🏎️ Exploring Lap Performance and Tyre Degradation in Formula 1 through Visual Analytics

![Python](https://img.shields.io/badge/Python-3.10%2B-blue?logo=python)
![Plotly](https://img.shields.io/badge/Plotly-Dash-orange?logo=plotly)
![FastF1](https://img.shields.io/badge/Data-FastF1-lightgrey?logo=formula1)

## 📊 Overview  
This project presents an **interactive visual analytics dashboard** designed to explore Formula 1 lap data, focusing on **lap performance**, **tyre degradation**, and **team strategies**.  
Developed as part of a university *Visual Analytics* project, the system transforms raw race telemetry into meaningful visual insights, helping users discover performance patterns and strategic trends across races.

---

## 🧠 Goals  
- Provide an intuitive and interactive tool for exploring **Formula 1 lap-level data**.  
- Analyze **tyre compound performance**, **driver behavior**, and **team consistency** under different race and weather conditions.  
- Enable **filtering**, **highlighting**, and **coordinated visualizations** for in-depth comparative analysis.

---

## 🗂️ Dataset  
The dataset comes from the **[FastF1 API](https://docs.fastf1.dev/)**, containing detailed telemetry from the **2025 Formula 1 season** (up to the Austrian GP).  
After cleaning and filtering invalid laps (Safety Car, flags, etc.), the dataset includes **~9,900 valid laps** described by 10 main features:

- `Driver` — who completed the lap  
- `Team` — constructor team  
- `Track` — circuit name  
- `LapTime` / `LapTime_norm` — absolute and normalized times  
- `Compound` — tyre compound (Soft, Medium, Hard)  
- `TyreLife` — laps completed on current tyre set  
- `TrackTemp` — track temperature (°C)  
- `Rainfall` — binary indicator (rain/dry)

Normalization ensures fair comparisons across circuits of different lengths.

---

## 💡 Key Features  
- **Dynamic Filtering:** by driver, team, track, tyre, weather, and race phase.  
- **Coordinated Visualizations:** all charts are linked — interactions update across views.  
- **Visualization Components:**  
  - 📊 *Boxplot* — normalized lap time distributions per driver  
  - 🧭 *Parallel Coordinates* — multidimensional analysis  
  - 🔍 *SPLOM* — scatterplot matrix of key variables  
  - 🧮 *PCA Scatter Plot* — clustering & dimensionality reduction  
  - 🛞 *Tyre Wear Plot* — regression-based degradation trends  
  - 📋 *Data Table* — sortable and interactive

---

## 🔍 Main Insights  
- **Tyre performance improves with use:** for hard compounds, reduced fuel load compensates for wear.  
- **Medium vs. Hard compounds:** mediums dominate early race phases, hards excel later.  
- **Temperature sensitivity:**  
  - 🥶 *Red Bull* performs better in cold conditions  
  - 🔥 *Ferrari* gains pace in warmer races  
- **Driver patterns:**  
  - *Hamilton* — stronger pace on hards in second half of races  
  - *Leclerc* — faster on hards early on, slower later  

---

## ⚙️ Implementation  
Developed in **Python**, combining data analytics and interactive visualization using:  
- `FastF1`  
- `Pandas`  
- `Plotly` / `Dash`  
- `Scikit-learn` (for PCA & clustering)

---

## 🚀 How to Run  

1. **Clone the repository**
   ```bash
   git clone https://github.com/<your-username>/F1-Visual-Analytics.git
   cd F1-Visual-Analytics
