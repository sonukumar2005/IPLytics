// IPL Team colors, abbreviations, and metadata
export const TEAM_DATA = {
    "Mumbai Indians": {
        abbr: "MI",
        color: "#004BA0",
        accent: "#D4AF37",
        gradient: "from-blue-900 to-blue-700",
    },
    "Chennai Super Kings": {
        abbr: "CSK",
        color: "#F9CD05",
        accent: "#E8A900",
        gradient: "from-yellow-600 to-yellow-400",
    },
    "Royal Challengers Bangalore": {
        abbr: "RCB",
        color: "#EC1C24",
        accent: "#000000",
        gradient: "from-red-800 to-red-600",
    },
    "Kolkata Knight Riders": {
        abbr: "KKR",
        color: "#3A225D",
        accent: "#B3A123",
        gradient: "from-purple-900 to-purple-700",
    },
    "Delhi Capitals": {
        abbr: "DC",
        color: "#17479E",
        accent: "#EF1B23",
        gradient: "from-blue-800 to-red-700",
    },
    "Sunrisers Hyderabad": {
        abbr: "SRH",
        color: "#F7A721",
        accent: "#000000",
        gradient: "from-orange-600 to-orange-400",
    },
    "Punjab Kings": {
        abbr: "PBKS",
        color: "#D71920",
        accent: "#A7A9AC",
        gradient: "from-red-700 to-red-500",
    },
    "Kings XI Punjab": {
        abbr: "KXIP",
        color: "#D71920",
        accent: "#A7A9AC",
        gradient: "from-red-700 to-red-500",
    },
    "Rajasthan Royals": {
        abbr: "RR",
        color: "#E83F92",
        accent: "#2D4FA2",
        gradient: "from-pink-700 to-pink-500",
    },
    "Gujarat Titans": {
        abbr: "GT",
        color: "#1C1C1C",
        accent: "#A8C8E8",
        gradient: "from-slate-700 to-slate-500",
    },
    "Lucknow Super Giants": {
        abbr: "LSG",
        color: "#A7CEDF",
        accent: "#1F2540",
        gradient: "from-cyan-700 to-cyan-500",
    },
    "Rising Pune Supergiant": {
        abbr: "RPS",
        color: "#5C3470",
        accent: "#D89C27",
        gradient: "from-purple-700 to-purple-500",
    },
    "Rising Pune Supergiants": {
        abbr: "RPS",
        color: "#5C3470",
        accent: "#D89C27",
        gradient: "from-purple-700 to-purple-500",
    },
    "Deccan Chargers": {
        abbr: "DC",
        color: "#000000",
        accent: "#F5A623",
        gradient: "from-gray-800 to-gray-600",
    },
    "Kochi Tuskers Kerala": {
        abbr: "KTK",
        color: "#FF7722",
        accent: "#FFFFFF",
        gradient: "from-orange-700 to-orange-500",
    },
    "Pune Warriors": {
        abbr: "PW",
        color: "#005DA0",
        accent: "#FFFFFF",
        gradient: "from-blue-700 to-blue-500",
    },
    "Delhi Daredevils": {
        abbr: "DD",
        color: "#17479E",
        accent: "#EF1B23",
        gradient: "from-blue-700 to-red-600",
    },
};

export const IPL_WINNERS = {
    2008: "Rajasthan Royals",
    2009: "Deccan Chargers",
    2010: "Chennai Super Kings",
    2011: "Chennai Super Kings",
    2012: "Kolkata Knight Riders",
    2013: "Mumbai Indians",
    2014: "Kolkata Knight Riders",
    2015: "Mumbai Indians",
    2016: "Sunrisers Hyderabad",
    2017: "Mumbai Indians",
    2018: "Chennai Super Kings",
    2019: "Mumbai Indians",
    2020: "Mumbai Indians",
    2021: "Chennai Super Kings",
    2022: "Gujarat Titans",
    2023: "Chennai Super Kings",
    2024: "Kolkata Knight Riders",
    2025: "TBD",
};

export const getTeamData = (name) =>
    TEAM_DATA[name] || {
        abbr: name?.substring(0, 3).toUpperCase() || "IPL",
        color: "#eab308",
        accent: "#ffffff",
        gradient: "from-yellow-600 to-yellow-400",
    };

export const getLogoPath = (teamName) =>
    `/logos/${teamName?.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}.png`;
