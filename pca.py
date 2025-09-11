"""
Servizio Flask che:
- riceve dati dal front-end (JSON),
- applica preprocessing (one-hot per Compound, opzionale per Rainfall),
- esegue StandardScaler + PCA (2 componenti) con sklearn,
- espone endpoint /pca per la proiezione e /kmeans per clustering in 2D,
- mantiene in memoria un dizionario cluster_color_map { id: hex_color } aggiornato ad ogni k-means.

Nota: il salvataggio è in-memory (volatile). Per persistenza usare DB / storage.
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.decomposition import PCA
from sklearn.cluster import KMeans
from sklearn.metrics import silhouette_score
import matplotlib.pyplot as plt
import colorsys
import hashlib

app = Flask(__name__)
CORS(app)  # abilita richieste da frontend in sviluppo

cluster_color_map = {} # id cluster -> colore
ids_cluster_map = {} # id punto -> id cluster

def _generate_n_colors(n):
	colors = []
	for i in range(n):
		h = i / max(1, n)
		l = 0.5
		s = 0.65
		r, g, b = colorsys.hls_to_rgb(h, l, s)
		colors.append('#{:02x}{:02x}{:02x}'.format(int(r*255), int(g*255), int(b*255)))
	return colors


def preprocess_dataframe(df, features, one_hot_rainfall=False):
	"""
	Input:
	  - df: pandas.DataFrame con i dati originali
	  - features: lista di colonne da considerare (es. ["LapNumber","TyreLife","Rainfall","TrackTemp","LapTime_norm","Compound"])
	  - one_hot_rainfall: se True tratta Rainfall come categorical e one-hot; altrimenti lo lascia come numerico 0/1
	Output:
	  - (X, ids, feature_names)
		- X: numpy array n x d pronto per scaler/PCA
		- ids: array degli id originali (se colonna 'id' presente, altrimenti index)
		- feature_names: lista di nomi colonne finali (utile per debug)
	Cosa fa:
	  - Seleziona colonne, gestisce one-hot, converte tipi numerici
	"""
	df2 = df.copy()

	ids = df2['id'].astype(str).values if 'id' in df2.columns else df2.index.astype(str).values

	df_sel = df2[features].copy()

	df_sel = df_sel.dropna()
	ids = df2.loc[df_sel.index].get('id', df_sel.index).astype(str).values

	final_cols = []
	parts = []

	# Compound: one-hot
	enc = OneHotEncoder(sparse_output=False, drop=None)
	comp_vals = df_sel[['Compound']].astype(str).values
	comp_enc = enc.fit_transform(comp_vals)
	comp_names = [f"Compound__{c}" for c in enc.categories_[0]]
	parts.append(pd.DataFrame(comp_enc, index=df_sel.index, columns=comp_names))
	final_cols.extend(comp_names)

	# Rainfall: one-hot o numerico
	if one_hot_rainfall:
		enc = OneHotEncoder(sparse_output=False)
		rain_enc = enc.fit_transform(df_sel[['Rainfall']].astype(str))
		rain_names = [f"Rainfall__{c}" for c in enc.categories_[0]]
		parts.append(pd.DataFrame(rain_enc, index=df_sel.index, columns=rain_names))
		final_cols.extend(rain_names)
	else:
		parts.append(df_sel[['Rainfall']].astype(float))
		final_cols.append('Rainfall')

	# Altre colonne numeriche (escludi Compound e Rainfall che abbiamo già gestito)
	for col in df_sel.columns:
		if col in ('Compound','Rainfall'):
			continue
		# tentiamo conversione numerica
		try:
			series = pd.to_numeric(df_sel[col], errors='coerce')
			parts.append(series.to_frame())
			final_cols.append(col)
		except Exception:
			# se non numerico lo ignoro (per PCA non sensato)
			pass

	if len(parts) == 0:
		raise ValueError("No usable columns after preprocessing. Check features and data.")

	Xdf = pd.concat(parts, axis=1)
	# drop rows with any NaN
	Xdf = Xdf.dropna()
	ids = df2.loc[Xdf.index].get('id', Xdf.index).astype(str).values

	X = Xdf.values.astype(float)
	return X, ids, list(Xdf.columns)


@app.route('/pca', methods=['POST'])
def api_pca():
    """
    PCA API con log per debug.
    """

    try:
        payload = request.get_json(force=True)
    except Exception as e:
        print("Errore parsing JSON:", e)
        return jsonify({"error": f"Failed to parse JSON: {str(e)}"}), 400

    data = payload.get('data', [])
    features = payload.get('features', ["LapNumber","TyreLife","Rainfall","TrackTemp","LapTime_norm","Compound"])
    one_hot_rainfall = payload.get('one_hot_rainfall', False)
    do_scale = payload.get('scale', True)

    if not isinstance(data, list) or len(data) == 0:
        print("No data sent!")
        return jsonify({"error": "No data sent"}), 400

    df = pd.DataFrame(data)
    print("DataFrame head:\n", df.head())

    try:
        X, ids, feature_names = preprocess_dataframe(df, features, one_hot_rainfall=one_hot_rainfall)
        print("Preprocessing done. X shape:", X.shape, "IDs length:", len(ids), "Feature names:", feature_names)
    except Exception as e:
        print("Errore in preprocess_dataframe:", e)
        return jsonify({"error": f"Preprocessing failed: {str(e)}"}), 400

    try:
        if do_scale:
            scaler = StandardScaler()
            Xs = scaler.fit_transform(X)
            print("Scaling applied")
        else:
            Xs = X
            print("Scaling skipped")

        pca = PCA(n_components=2)
        proj = pca.fit_transform(Xs)
        print("PCA applied. Shape of projected data:", proj.shape)
    except Exception as e:
        print("Errore durante scaling/PCA:", e)
        return jsonify({"error": f"PCA failed: {str(e)}"}), 400

    projected = []
    for i, idval in enumerate(ids):
        projected.append({
            "id": str(idval),
            "x": float(proj[i,0]),
            "y": float(proj[i,1]),
            "orig": df.loc[df.index[i], :].to_dict()
        })

    resp = {
        "projected": projected,
        "explained_variance_ratio": pca.explained_variance_ratio_.tolist(),
        "components": pca.components_.tolist(),
        "feature_names": feature_names
    }

    print("Returning response with", len(projected), "points")
    return jsonify(resp), 200



@app.route('/kmeans', methods=['POST'])
def api_kmeans():
	"""
	POST /kmeans
	Input (JSON):
	  {
		"projected": [ {"id": id, "x": x1, "y": y1}, ... ],
		"k": 3,
		"persist": true   # opzionale: se true aggiorna cluster_color_map globale
	  }
	Output (JSON):
	  {
		"labels": [0,1,0,...],
		"centers": [ {x,y}, ... ],
		"silhouette": 0.45,
		"cluster_color_map": { id1: "#rrggbb", id2: "#rrggbb", ... }
	  }
	Cosa fa:
	  - Riceve punti proiettati (2D), esegue KMeans in 2D (sklearn),
	  - calcola silhouette score,
	  - genera palette colori e aggiorna (se persist) il dizionario server-side cluster_color_map,
	  - restituisce mapping id -> colore aggiornato.
	"""
	payload = request.get_json(force=True)
	projected = payload.get('projected')
	k = int(payload.get('k', 3))
	persist = bool(payload.get('persist', True))

	if not projected or not isinstance(projected, list):
		return jsonify({"error": "projected points required"}), 400

	pts = np.array([[p.get('x', 0), p.get('y', 0)] for p in projected], dtype=float)
	ids = [str(p.get('id')) for p in projected]

	if pts.shape[0] == 0:
		return jsonify({"error": "no points"}), 400

	if k <= 0 or k > pts.shape[0]:
		return jsonify({"error": "invalid k"}), 400

	km = KMeans(n_clusters=k, random_state=42, n_init=10)
	labels = km.fit_predict(pts)
	centers = km.cluster_centers_.tolist()

	# silhouette (se possibile)
	try:
		sil = float(silhouette_score(pts, labels))
	except Exception:
		sil = None

	# assegna colori
	colors = _generate_n_colors(k)
	local_map = {}
	for idx, idv in enumerate(ids):
		lab = int(labels[idx])
		color = colors[lab]
		local_map[idv] = color
		if persist:
			ids_cluster_map[idv] = lab
	if persist:
		for lab in range(k):
			cluster_color_map[lab] = colors[lab]
	resp = {
		"labels": labels.tolist(),
		"centers": [{"x": float(c[0]), "y": float(c[1])} for c in centers],
		"silhouette": sil,
		"cluster_color_map": local_map if not persist else {k:v for k,v in cluster_color_map.items()},
		"ids_cluster_map": ids_cluster_map if persist else {}
	}
	return jsonify(resp), 200


@app.route('/cluster_map', methods=['GET'])
def api_cluster_map():
	"""
	GET /cluster_map
	Output JSON: corrente mappa id -> color
	"""
	return jsonify({
		"cluster_color_map": {k:v for k,v in cluster_color_map.items()},
		"ids_cluster_map": ids_cluster_map
	}), 200

if __name__ == '__main__':
	app.run(debug=True, port=5000)
