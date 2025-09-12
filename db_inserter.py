import os
import json
import psycopg2

def main():
    db_host = os.environ.get("DB_HOST")
    db_user = os.environ.get("DB_USER")
    db_password = os.environ.get("DB_PASSWORD")
    db_name = os.environ.get("DB_NAME")
    db_port = os.environ.get("DB_PORT", 5432)

    conn = psycopg2.connect(
        host=db_host,
        user=db_user,
        password=db_password,
        dbname=db_name,
        port=db_port,
        sslmode="require" # rds
    )
    cur = conn.cursor()

    with open("players.json", "r", encoding="utf-8") as f:
        data = json.load(f)

    players = data.get("players", [])

    cur.execute("""
    CREATE TABLE IF NOT EXISTS players (
      id INT PRIMARY KEY,
      firstname TEXT NOT NULL,
      lastname TEXT NOT NULL,
      shortname TEXT NOT NULL,
      sex CHAR(1) NOT NULL,
      rank INT,
      points INT,
      weight INT,
      height INT,
      age INT,
      last JSONB,
      countrycode TEXT,
      countrypicture TEXT,
      picture TEXT
    );
    """)

    for p in players:
        cur.execute("""
        INSERT INTO players
          (id, firstname, lastname, shortname, sex, rank, points, weight, height, age, last, countrycode, countrypicture, picture)
        VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
        ON CONFLICT (id) DO NOTHING
        """, (
            p["id"], p["firstname"], p["lastname"], p["shortname"], p["sex"],
            p["data"]["rank"], p["data"]["points"], p["data"]["weight"], p["data"]["height"],
            p["data"]["age"], json.dumps(p["data"]["last"]),
            p["country"]["code"], p["country"]["picture"], p["picture"]
        ))

    conn.commit()
    cur.close()
    conn.close()
    print("Insert terminé avec succès.")

if __name__ == "__main__":
    main()
