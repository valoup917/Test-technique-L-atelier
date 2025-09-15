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

    cur.execute("""
    ALTER TABLE players
    ALTER COLUMN rank  SET NOT NULL,
    ALTER COLUMN points SET NOT NULL,
    ALTER COLUMN weight SET NOT NULL,
    ALTER COLUMN height SET NOT NULL,
    ALTER COLUMN age   SET NOT NULL,
    ALTER COLUMN last  SET NOT NULL,
    ALTER COLUMN countrycode SET NOT NULL,
    ALTER COLUMN countrypicture SET NOT NULL,
    ALTER COLUMN picture SET NOT NULL;

    ALTER TABLE players
    ADD CONSTRAINT players_sex_chk    CHECK (sex IN ('M','F')),
    ADD CONSTRAINT players_rank_chk   CHECK (rank >= 1),
    ADD CONSTRAINT players_points_chk CHECK (points >= 0),
    ADD CONSTRAINT players_weight_chk CHECK (weight > 0),         -- grammes
    ADD CONSTRAINT players_height_chk CHECK (height > 0),         -- cm
    ADD CONSTRAINT players_age_chk    CHECK (age > 0),
    ADD CONSTRAINT players_countrycode_chk CHECK (char_length(countrycode)=3 AND countrycode = upper(countrycode)),
    ADD CONSTRAINT players_last_type_chk   CHECK (jsonb_typeof(last) = 'array'),
    ADD CONSTRAINT players_last_values_chk CHECK (NOT jsonb_path_exists(last, '$[*] ? (@ != 0 && @ != 1)'));


    ALTER TABLE players
    ADD CONSTRAINT players_shortname_uk UNIQUE (shortname);

    CREATE INDEX IF NOT EXISTS players_rank_points_idx ON players (rank ASC, points DESC);

    ALTER TABLE players
    ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now(),
    ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

    CREATE OR REPLACE FUNCTION set_updated_at() RETURNS trigger AS $$
    BEGIN NEW.updated_at = now(); RETURN NEW; END; $$ LANGUAGE plpgsql;
    DROP TRIGGER IF EXISTS trg_players_updated_at ON players;
    CREATE TRIGGER trg_players_updated_at BEFORE UPDATE ON players FOR EACH ROW EXECUTE FUNCTION set_updated_at();
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
