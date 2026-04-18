import axios from 'axios';

const BASE_URL = "http://localhost:8080/api";

const api = axios.create({
    baseURL: BASE_URL,
    timeout: 10000,
});

// ==================== YEARS / SEASONS ====================

export const fetchYears = () => api.get("/years").then(res => res.data);

export const fetchSeasons = () => api.get("/seasons").then(res => res.data);

// ==================== POINTS TABLE ====================

export const fetchPointsTable = (year) =>
    api.get(`/points-table/${year}`).then(res => res.data);

// ==================== TEAM MATCHES ====================

export const fetchTeamMatches = (team, year) =>
    api.get(`/team-matches/${encodeURIComponent(team)}/${year}`).then(res => res.data);

// ==================== MATCH DETAILS ====================

export const fetchMatchDetails = (id) =>
    api.get(`/match/${id}`).then(res => res.data);

// ==================== HEAD TO HEAD ====================

export const fetchHeadToHead = (team1, team2) =>
    api.get('/head-to-head', { params: { team1, team2 } }).then(res => res.data);

// ==================== VENUES ====================

export const fetchVenues = () =>
    api.get("/venues").then(res => res.data);

export const fetchVenuesList = () =>
    api.get("/venues-list").then(res => res.data);

// ==================== TEAMS ====================

export const fetchTeams = () => api.get("/teams").then(res => res.data);

// ==================== CHARTS ====================

export const fetchLeagueStats = (year) =>
    api.get(`/league-stats/${year}`).then(res => res.data);

// ==================== LIVE ====================

export const fetchLiveMatch = () => api.get("/live-match").then(res => res.data);

export const fetchLiveHybrid = () => api.get("/live-hybrid").then(res => res.data);

// ==================== ML PREDICTION ====================

export const predictMatchResult = (data) =>
    api.post("/predict", data).then(res => res.data);

// ==================== API CALL ========================
export const fetchLiveMatches = () =>
    api.get("/live-matches").then(res => res.data);