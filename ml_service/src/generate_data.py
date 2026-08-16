import os
import pandas as pd
import numpy as np

def generate_synthetic_data(num_samples=5000, random_seed=42):
    np.random.seed(random_seed)
    
    # Generate features
    base_price = np.random.choice([40, 50, 60, 80], size=num_samples)
    total_slots = np.random.choice([50, 100, 150, 200], size=num_samples)
    
    # Occupancy rate (percentage of occupied slots, normally distributed with clip)
    occupancy_rate = np.clip(np.random.normal(0.55, 0.25, size=num_samples), 0.0, 1.0)
    occupied_slots = np.round(occupancy_rate * total_slots).astype(int)
    available_slots = total_slots - occupied_slots
    
    # Time features
    hour = np.random.randint(0, 24, size=num_samples)
    day_of_week = np.random.randint(0, 7, size=num_samples) # 0=Sunday, 6=Saturday
    
    # Categorical/Boolean contextual features
    weather = np.random.choice(['clear', 'rainy', 'stormy'], size=num_samples, p=[0.7, 0.2, 0.1])
    is_holiday = np.random.choice([0, 1], size=num_samples, p=[0.95, 0.05])
    nearby_event = np.random.choice([0, 1], size=num_samples, p=[0.9, 0.1])
    
    # Calculate target: demand_score (0 - 100) based on Drivix heuristics + noise
    demand_score = occupancy_rate * 50
    
    # Hour effect (peaks at 9-12 and 17-20)
    peak_hours = ((hour >= 9) & (hour <= 12)) | ((hour >= 17) & (hour <= 20))
    night_hours = (hour >= 0) & (hour <= 6)
    demand_score += np.where(peak_hours, 25, 0)
    demand_score += np.where(night_hours, -15, 0)
    
    # Weekend effect
    is_weekend = (day_of_week == 0) | (day_of_week == 6)
    demand_score += np.where(is_weekend, 10, 0)
    
    # Holiday & event effects
    demand_score += np.where(is_holiday == 1, 15, 0)
    demand_score += np.where(nearby_event == 1, 20, 0)
    
    # Weather effect
    demand_score += np.where(weather == 'rainy', 8, 0)
    demand_score += np.where(weather == 'stormy', 12, 0)
    
    # Add random Gaussian noise to simulate real-world variance
    noise = np.random.normal(0, 5, size=num_samples)
    demand_score += noise
    
    # Clip and round demand_score to [0, 100]
    demand_score = np.clip(np.round(demand_score), 0, 100).astype(int)
    
    # Create DataFrame
    df = pd.DataFrame({
        'base_price': base_price,
        'total_slots': total_slots,
        'occupied_slots': occupied_slots,
        'available_slots': available_slots,
        'occupancy_rate': np.round(occupancy_rate, 4),
        'hour': hour,
        'day_of_week': day_of_week,
        'weather': weather,
        'is_holiday': is_holiday,
        'nearby_event': nearby_event,
        'demand_score': demand_score
    })
    
    return df

if __name__ == "__main__":
    print("Generating synthetic Drivix pricing dataset...")
    df = generate_synthetic_data(num_samples=5000)
    
    # Ensure directory exists
    os.makedirs("data/raw", exist_ok=True)
    
    output_path = "data/raw/drivix_pricing_dataset.csv"
    df.to_csv(output_path, index=False)
    print(f"Dataset successfully created with {len(df)} samples and saved to: {output_path}")
