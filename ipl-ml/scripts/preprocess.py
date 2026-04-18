import pandas as pd
import numpy as np

def clean_ipl_data(matches_path, deliveries_path):
    # Load datasets
    matches = pd.read_csv(matches_path)
    deliveries = pd.read_csv(deliveries_path)
    
    # Standardize team names
    team_mappings = {
        'Rising Pune Supergiant': 'Rising Pune Supergiants',
        'Delhi Daredevils': 'Delhi Capitals',
        'Kings XI Punjab': 'Punjab Kings'
    }
    matches['team1'] = matches['team1'].replace(team_mappings)
    matches['team2'] = matches['team2'].replace(team_mappings)
    matches['winner'] = matches['winner'].replace(team_mappings)
    
    # Handle missing values
    matches['city'] = matches['city'].fillna('Unknown')
    
    # Convert date format
    matches['date'] = pd.to_datetime(matches['date'])
    
    # Example feature engineering on deliveries
    # Total runs per match per team
    team_scores = deliveries.groupby(['match_id', 'batting_team'])['total_runs'].sum().reset_index()
    
    return matches, team_scores

if __name__ == "__main__":
    print("Preprocessing script initialized. Please ensure matches.csv and deliveries.csv are in ipl-ml/data/")
