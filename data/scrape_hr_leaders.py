import pandas as pd

url = "https://en.wikipedia.org/wiki/List_of_Major_League_Baseball_annual_home_run_leaders"
tables = pd.read_html(url)

# Use the table that includes year, winner, and HR
df = tables[1]

# Clean and rename columns
df = df[['Year', 'Winner(s)', 'HR']]
df.columns = ['yearID', 'player', 'HR']

# Remove any rows where yearID isn't a year (like headers or notes)
df = df[df['yearID'].apply(lambda x: str(x).isdigit())]

# Optional: convert HR to int
df['HR'] = pd.to_numeric(df['HR'], errors='coerce')

# Save to CSV
df.to_csv("top_hr_leaders_wiki.csv", index=False)
print("Saved top_hr_leaders_wiki.csv")
