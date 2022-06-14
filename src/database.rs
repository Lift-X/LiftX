use crate::error::WlrsError;
use crate::exercises::ExerciseList;
use crate::exercises::WorkoutEntry;
use rocket_db_pools::Database;
use serde::{Deserialize, Serialize};
use serde_json::json;
use sqlx::{Pool, Row, Sqlite, SqlitePool};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ThemeOptions {
    Light,
    Dark,
}

impl ThemeOptions {
    pub fn to_string(&self) -> String {
        match self {
            ThemeOptions::Light => "light".to_string(),
            ThemeOptions::Dark => "dark".to_string(),
        }
    }

    pub fn from_string(s: &str) -> Self {
        match s.to_lowercase().as_str() {
            "dark" => ThemeOptions::Dark,
            "light" => ThemeOptions::Light,
            _ => ThemeOptions::Dark, // default to dark if invalid
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UserSettings {
    pub user: String,
    pub updated: u64,
    pub language: String,
    pub theme: ThemeOptions,
    pub show_graph_exercise: bool,
    pub show_graph_volume: bool,
    pub show_graph_weight: bool,
    pub show_graph_workout_frequency: bool,
}

impl UserSettings {
    pub fn default() -> UserSettings {
        UserSettings {
            user: "".to_string(),
            updated: std::time::UNIX_EPOCH.elapsed().unwrap().as_secs(),
            language: "en-US".to_string(),
            theme: ThemeOptions::Dark,
            show_graph_exercise: true,
            show_graph_volume: true,
            show_graph_weight: true,
            show_graph_workout_frequency: true,
        }
    }

    pub fn from_json(json: &str) -> Result<UserSettings, Box<dyn std::error::Error>> {
        Ok(serde_json::from_str(json)?)
    }
}

#[derive(Database)]
#[database("sqlite_db")]
pub struct Db(sqlx::sqlite::SqlitePool);

pub async fn create_connection() -> Result<SqlitePool, Box<dyn std::error::Error>> {
    let pool: Pool<Sqlite> = SqlitePool::connect("data.db").await?;
    Ok(pool)
}

pub async fn build_tables(conn: &SqlitePool) {
    // Workout Table
    sqlx::query("CREATE TABLE if not exists workout (id TINYTEXT PRIMARY KEY, created int, user TINYTEXT, data MEDIUMTEXT)")
        .execute(conn)
        .await
        .unwrap();

    // User settings table
    // TODO: Integrate into rocket_auth
    sqlx::query("CREATE TABLE if not exists settings (user TINYTEXT PRIMARY KEY, updated int, data MEDIUMTEXT)")
        .execute(conn)
        .await
        .unwrap();

    // User Table
    let users: rocket_auth::Users = conn.clone().into();
    users.create_table().await.unwrap();
}

pub async fn insert_workout(
    uuid: uuid::Uuid,
    mut exercise: WorkoutEntry,
    conn: &SqlitePool,
) -> Result<(), Box<dyn std::error::Error>> {
    // Have to stringify, but also requires a Uuid type.. TODO: Fix this
    let stringed: &String = &uuid.to_string();
    let created: u32 = std::time::UNIX_EPOCH.elapsed()?.as_secs() as u32;
    let user: String = exercise.user.clone();
    let data: String = exercise.to_json(uuid).to_string();
    sqlx::query!(
        "INSERT INTO WORKOUT (id, created, user,data) VALUES (?, ?, ?, ?)",
        stringed,
        created,
        user,
        data
    )
    .execute(conn)
    .await?;
    Ok(())
}

/// Get all workouts (for a certain user) from the database.
/// Optionally provide a max number of workouts to return
pub async fn get_workouts(
    conn: &SqlitePool,
    user: String,
    mut limit: Option<i16>,
    recent_days: Option<u64>,
) -> Result<Vec<WorkoutEntry>, serde_json::Value> {
    // If a limit is provided, use it. Else provide the latest 1000 workouts
    if limit.is_none() {
        limit = Some(1000)
    }

    // fyi: Cannot take `recent_days` as a SQL query, as the `created` column is not the start of the workout
    let wrap_data =
        sqlx::query("SELECT * FROM workout WHERE user = ? ORDER BY created DESC LIMIT ?")
            .bind(user)
            .bind(limit)
            .fetch_all(conn);

    match wrap_data.await {
        Ok(wrap_data) => {
            let mut workouts: Vec<WorkoutEntry> = Vec::new();
            for row in wrap_data {
                let str: &str = row.get("data");
                let json: serde_json::Value = serde_json::from_str(str).unwrap();
                let w = WorkoutEntry::from_json(&json.to_string());
                // TODO: Might be expensive if we have a lot of workouts, perhaps move  the match statement up a level.
                match recent_days {
                    Some(days) => {
                        if w.start_time
                            > std::time::UNIX_EPOCH.elapsed().unwrap().as_secs() - (days * 86400)
                        {
                            workouts.push(w);
                        }
                    }
                    None => workouts.push(w),
                }
            }
            // Sort workouts in descending order (latest to oldest workout)
            workouts.sort_unstable_by(|a, b| b.start_time.cmp(&a.start_time));
            Ok(workouts)
        }
        // If workout doesn't exist, 404.
        Err(_) => Err(serde_json::json!({
            "error": WlrsError::WLRS_ERROR_NOT_FOUND
        })),
    }
}

/// Build a list of exercises a user has done.
/// This returns a hashmap with the key as the exercise name and the value as the number of times the user has done that exercise.
pub async fn get_exercises(
    conn: &SqlitePool,
    user: String,
) -> Result<Vec<ExerciseList>, serde_json::Value> {
    let wrap_data = sqlx::query("SELECT * FROM workout WHERE user = ?")
        .bind(user)
        .fetch_all(conn);

    match wrap_data.await {
        Ok(wrap_data) => {
            let mut exercises_list: Vec<ExerciseList> = Vec::new();
            {
                for row in wrap_data {
                    let str: &str = row.get("data");
                    let json: serde_json::Value = serde_json::from_str(str).unwrap();
                    let w = WorkoutEntry::from_json(&json.to_string());
                    /*for exercise in w.exercises {
                        let count = exercises_list.entry(exercise.exercise).or_insert(0);
                        *count += 1;
                    }*/
                    for exercise in w.exercises {
                        // convert exercise name to kebab case
                        let exercise_name = crate::util::string_capital_case(&exercise.exercise);
                        let count: Option<&mut ExerciseList> =
                            exercises_list.iter_mut().find(|x| x.name == exercise_name);
                        match count {
                            Some(count) => {
                                count.count += 1;
                            }
                            None => {
                                let new_exercise = ExerciseList {
                                    name: exercise_name,
                                    count: 1,
                                };
                                exercises_list.push(new_exercise);
                            }
                        }
                    }
                }
            }
            exercises_list.sort_unstable_by(|a, b| b.count.cmp(&a.count));
            Ok(exercises_list)
        }
        Err(_) => Err(serde_json::json!({
            "error": WlrsError::WLRS_ERROR_NOT_FOUND
        })),
    }
}

pub async fn get_settings(
    conn: &SqlitePool,
    user: String,
) -> Result<UserSettings, serde_json::Value> {
    let wrap_data = sqlx::query("SELECT * FROM settings WHERE user = ?")
        .bind(&user)
        .fetch_one(conn);

    match wrap_data.await {
        Ok(wrap_data) => {
            let str: &str = wrap_data.get("data");
            let json: serde_json::Value = serde_json::from_str(str).unwrap();
            let mut settings: UserSettings = UserSettings::from_json(&json.to_string()).unwrap();
            settings.user = user;
            Ok(settings)
        }
        Err(_) => {
            // create new settings
            insert_settings(conn, user).await.unwrap();
            Ok(UserSettings::default())
        }
    }
}

pub async fn insert_settings(
    conn: &SqlitePool,
    user: String,
) -> Result<(), Box<dyn std::error::Error>> {
    let data: String = json!(UserSettings::default()).to_string();
    let time: i64 = std::time::UNIX_EPOCH
        .elapsed()
        .unwrap()
        .as_secs()
        .try_into()
        .unwrap();
    sqlx::query!(
        "INSERT INTO settings (user, updated, data) VALUES (?, ?, ?)",
        user,
        time,
        data
    )
    .execute(conn)
    .await?;
    Ok(())
}
