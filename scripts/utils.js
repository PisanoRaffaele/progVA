
const vwToPx = (vw) => (vw * window.innerWidth) / 100;

const vhToPx = (vh) => (vh * window.innerHeight) / 100;

const teamLogos = {
  "Mercedes": "assets/logos/mercedes.png",
  "Red Bull Racing": "assets/logos/redbull.png",
  "Ferrari": "assets/logos/ferrari.png",
  "McLaren": "assets/logos/mclaren.png",
  "Alpine": "assets/logos/alpine.png",
  "Aston Martin": "assets/logos/astonmartin.png",
  "Haas F1 Team": "assets/logos/haas.png",
  "Williams": "assets/logos/williams.png",
  "Kick Sauber": "assets/logos/kicksauber.svg",
  "Racing Bulls": "assets/logos/VisaCashAppRB.webp"
};

const driverFlags = {
	"VER": "assets/flags/netherlands.png",
	"GAS": "assets/flags/france.png",
	"ANT": "assets/flags/italy.png",
	"ALO": "assets/flags/spain.png",
	"LEC": "assets/flags/monaco.png",
	"STR": "assets/flags/canada.png",
	"TSU": "assets/flags/japan.png",
	"ALB": "assets/flags/united-kingdom.png",
	"HUL": "assets/flags/germany.png",
	"LAW": "assets/flags/new-zealand.png",
	"OCO": "assets/flags/france.png",
	"NOR": "assets/flags/united-kingdom.png",
	"HAM": "assets/flags/united-kingdom.png",
	"BOR": "assets/flags/brazil.png",
	"RUS": "assets/flags/united-kingdom.png",
	"PIA": "assets/flags/australia.png",
	"BEA": "assets/flags/united-kingdom.png",
	"SAI": "assets/flags/spain.png",
	"HAD": "assets/flags/france.png",
	"DOO": "assets/flags/australia.png",
	"COL": "assets/flags/argentina.png"
};

const DriverTextMap = {
	"VER": "Max Verstappen (VER)",
	"GAS": "Pierre Gasly (GAS)",
	"ANT": "Kimi Antonelli (ANT)",
	"ALO": "Fernando Alonso (ALO)",
	"LEC": "Charles Leclerc (LEC)",
	"STR": "Lance Stroll (STR)",
	"TSU": "Yuki Tsunoda (TSU)",
	"ALB": "Alexander Albon (ALB)",
	"HUL": "Niko Hülkenberg (HUL)",
	"LAW": "Liam Lawson (LAW)",
	"OCO": "Esteban Ocon (OCO)",
	"NOR": "Lando Norris (NOR)",
	"HAM": "Lewis Hamilton (HAM)",
	"BOR": "Gabriel Bortoleto (BOR)",
	"RUS": "George Russell (RUS)",
	"PIA": "Oscar Piastri (PIA)",
	"BEA": "Oliver Bearman (BEA)",
	"SAI": "Carlos Sainz (SAI)",
	"HAD": "Isack Hadjar (HAD)",
	"DOO": "Jack Doohan (DOO)",
	"COL": "Franco Colapinto (COL)"
};

const trackFlags = {
	"Melbourne": "assets/flags/australia.png",
	"Shanghai": "assets/flags/china.png",
	"Suzuka": "assets/flags/japan.png",
	"Sakhir": "assets/flags/bahrain.png",
	"Jeddah": "assets/flags/saudi-arabia.png",
	"Miami": "assets/flags/united-states.png",
	"Imola": "assets/flags/italy.png",
	"Monaco": "assets/flags/monaco.png",
	"Barcelona": "assets/flags/spain.png",
	"Montréal": "assets/flags/canada.png",
	"Spielberg": "assets/flags/austria.png"
}

const tyresImgs = {
	"SOFT": "assets/logos/soft.png",
	"MEDIUM": "assets/logos/medium.png",
	"HARD": "assets/logos/hard.png",
	"INTERMEDIATE": "assets/logos/intermediate.png",
	"WET": "assets/logos/wet.png"
};

const tyresTextMap = {
	"SOFT": "Soft",
	"MEDIUM": "Medium",
	"HARD": "Hard",
	"INTERMEDIATE": "Intermediate",
	"WET": "Wet"
};

const weatherIcons = {
	"0": "assets/sun.png",
	"1": "assets/rainy.png",
};

const WeatherTextMap = {
	"0": "Clear",
	"1": "Rainy",
};

const tempTextMap = {
	"0": "Very Cold (<=15°C)",
	"1": "Cold (16–25°C)",
	"2": "Mild (26–35°C)",
	"3": "Hot (36–45°C)",
	"4": "Very Hot (45+°C)"
};

const mapVars = {
	"LapTime_norm": "Lap Time* (s)",
	"LapNumber": "Lap #",
	"TyreLife": "TyreLife (laps)",
	"TrackTemp": "TrackTemp (°C)",
	"Rainfall": "Wheather",
	"Driver": 'Driver',
	"Track": 'Track',
	"Compound": 'Tyre',
};

const mapVars2 = {
	"LapTime_norm": "Lap Time*",
	"LapNumber": "Lap #",
	"TyreLife": "TyreLife",
	"TrackTemp": "TrackTemp",
	"Rainfall": "Wheather",
	"Driver": 'Driver',
	"Track": 'Track',
	"Compound": 'Tyre',
};


const pcAxisMap = {
	'HARD' : 'Hard',
	'INTERMEDIATE' : 'Inter',
	'MEDIUM' : 'Medium',
	'SOFT' : 'Soft',
	'WET' : 'Wet',
}

const pcAxisMapCaps = {
	'HARD' : 'HARD',
	'INTERMEDIATE' : 'INTER',
	'MEDIUM' : 'MEDIUM',
	'SOFT' : 'SOFT',
	'WET' : 'WET',
}

const teamColorMap = {
  "Mercedes": "#27F4D2",
  "Red Bull Racing": "#363dc6ff",
  "Ferrari": "#E80020",
  "McLaren": "#FF8000",
  "Alpine": "#ccc900ff",
  "Aston Martin": "#229971",
  "Haas F1 Team": "#77797aff",
  "Williams": "#ffffffff",
  "Kick Sauber": "#7b3b24ff",
  "Racing Bulls": "#b12cd2"
};

const trackColorMap = {
	"Melbourne": "#d22c2c",
	"Shanghai": "#d2902c",
	"Suzuka": "#b1d22c",
	"Sakhir": "#b12cd2",
	"Jeddah": "#2cd26e",
	"Miami": "#2cd2d2",
	"Imola": "#ffffffff",
	"Monaco": "#4d2cd2",
}


const teamStringMap = {
  "Mercedes": "Mercedes",
  "Red Bull Racing": "Red Bull",
  "Ferrari": "Ferrari",
  "McLaren": "McLaren",
  "Alpine": "Alpine",
  "Aston Martin": "Aston Martin",
  "Haas F1 Team": "Haas",
  "Williams": "Williams",
  "Kick Sauber": "Sauber",
  "Racing Bulls": "Racing Bulls"
};
