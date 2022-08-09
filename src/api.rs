use std::collections::HashMap;

use rocket::{post, response::Redirect, State};
use rocket_auth::{Auth, Error, Signup, User};
use rocket_db_pools::Connection;
use rocket_governor::RocketGovernor;
use serde::{Deserialize, Serialize};
use serde_json::json;
use sqlx::{Row, SqlitePool};
use uuid::Uuid;

use crate::{
    cache::CacheableResponse,
    database::{self, get_exercises, get_settings, get_workouts, Db},
    equipment::Weight,
    error::LiftXError,
    exercises::WorkoutEntry,
    RateLimitGuard,
};

#[derive(Debug, Serialize, Deserialize)]
struct GraphVolumeEntry {
    date: String,
    volume: Weight,
}

#[derive(Debug, Serialize, Deserialize)]
struct GraphExerciseTopEntry {
    date: String,
    weight: Weight,
}

#[derive(Debug, Serialize, Deserialize)]
struct GraphExerciseTop {
    name: String,
    entries: Vec<GraphExerciseTopEntry>,
    count: usize,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct GraphExerciseList {
    pub data: Vec<u32>,
    pub labels: Vec<String>,
}

impl GraphExerciseList {
    pub fn new() -> Self {
        GraphExerciseList {
            data: vec![],
            labels: vec![],
        }
    }
}

#[get("/workouts/<id>/json")]
pub async fn workout_json(
    id: String,
    mut db: Connection<Db>,
    user: Option<User>,
    _limitguard: RocketGovernor<'_, RateLimitGuard>,
) -> Result<CacheableResponse<serde_json::Value>, serde_json::Value> {
    match user {
        Some(user) => {
            // Query the database via ID, return data column
            let wrap_data = sqlx::query("SELECT * FROM workout WHERE id = ? AND user = ?")
                .bind(id)
                .bind(user.name())
                .fetch_one(&mut *db);
            // If workout doesn't exist, 404.
            match wrap_data.await {
                Ok(wrap_data) => {
                    let data: WorkoutEntry;
                    let json: serde_json::Value;
                    {
                        let str: &str = wrap_data.try_get("data").unwrap();
                        data = WorkoutEntry::from_json(str);
                        json = json!(data);
                    }
                    let result = CacheableResponse {
                        data: json,
                        cache_control: "max-age=86400".to_string(),
                    };
                    Ok(result)
                }
                Err(_) => Err(LiftXError::LIFTX_ERROR_NOT_FOUND.into()),
            }
        }
        None => Err(LiftXError::LIFTX_ERROR_NOT_LOGGED_IN.into()),
    }
}

#[get("/workouts/<id>/delete")]
pub async fn workout_delete(
    id: String,
    mut db: Connection<Db>,
    user: Option<User>,
    _limitguard: RocketGovernor<'_, RateLimitGuard>,
) -> Result<serde_json::Value, serde_json::Value> {
    match user {
        Some(user) => {
            // Query the database via ID, delete
            let query = sqlx::query("DELETE FROM workout WHERE id = ? AND user = ?")
                .bind(id)
                .bind(user.name())
                .fetch_one(&mut *db);
            match query.await {
                Ok(_) => Ok(serde_json::json!({ "success": "Workout deleted" })),
                Err(_) => Err(LiftXError::LIFTX_ERROR_WORKOUT_NOT_FOUND.into()),
            }
        }
        None => Err(LiftXError::LIFTX_ERROR_NOT_LOGGED_IN.into()),
    }
}

#[post("/workouts/json", format = "json", data = "<data>")]
pub async fn post_workout_json(
    data: rocket::serde::json::Json<WorkoutEntry>,
    conn: &State<SqlitePool>,
    _limitguard: RocketGovernor<'_, RateLimitGuard>,
) -> rocket::response::Redirect {
    // "Unwrap" Json<WorkoutEntry> to WorkoutEntry
    let val: WorkoutEntry = data.into_inner();
    // Generate UUID
    let uuid: Uuid = Uuid::new_v4();
    debug!("Creating workoutentry with {}", uuid);
    let result = crate::database::insert_workout(uuid, val, &**conn).await;
    match result {
        Ok(()) => Redirect::to(format!("/workouts/{}", uuid)),
        Err(_) => Redirect::to("/404"),
    }
}

#[post("/register", data = "<form>")]
pub async fn post_register(
    form: rocket::form::Form<Signup>,
    auth: Auth<'_>,
    _limitguard: RocketGovernor<'_, RateLimitGuard>,
) -> Result<Redirect, serde_json::Value> {
    let form_proc = &form.into_inner();
    let result = auth.signup(form_proc).await;
    match result {
        Ok(_) => {
            auth.login(&form_proc.into()).await.unwrap();
            Ok(Redirect::to("/home"))
        }
        Err(e) => {
            warn!("{e}");
            if e.to_string()
                == "SqlxError: error returned from database: UNIQUE constraint failed: users.name".to_string()
            {
                Err(LiftXError::LIFTX_ERROR_USERNAME_EXISTS.into())
            } else {
                Err(json!({
                    "error": LiftXError::Custom { message: e.to_string() }
                }))
            }
        }
    }
}

#[post("/login", data = "<form>")]
pub async fn post_login(
    form: rocket::form::Form<Signup>,
    auth: Auth<'_>,
    _limitguard: RocketGovernor<'_, RateLimitGuard>,
) -> Result<Redirect, Error> {
    let result = auth.login(&form.into_inner().into()).await;
    match result {
        Ok(_) => Ok(Redirect::to("/home")),
        Err(e) => Err(e),
    }
}

#[get("/user")]
pub fn get_current_user(
    user: Option<User>,
    _limitguard: RocketGovernor<'_, RateLimitGuard>,
) -> Result<CacheableResponse<serde_json::Value>, serde_json::Value> {
    match user {
        Some(user) => Ok(CacheableResponse {
            data: serde_json::json!({ "name": user.name() }),
            cache_control: "private max-age=10".to_string(),
        }),
        None => Err(LiftXError::LIFTX_ERROR_NOT_LOGGED_IN.into()),
    }
}

#[get("/user/workouts")]
pub async fn get_user_workouts(
    user: Option<User>,
    conn: &State<SqlitePool>,
    _limitguard: RocketGovernor<'_, RateLimitGuard>,
) -> Result<CacheableResponse<serde_json::Value>, serde_json::Value> {
    match user {
        Some(user) => {
            let workouts = get_workouts(conn, user.name().to_string(), None, None).await;
            match workouts {
                Ok(workouts) => Ok(CacheableResponse {
                    data: serde_json::json!({ "workouts": workouts }),
                    cache_control: "private max-age=10".to_string(),
                }),
                Err(workouts) => Err(workouts),
            }
        }
        None => Err(LiftXError::LIFTX_ERROR_NOT_LOGGED_IN.into()),
    }
}

#[get("/user/workouts/<limit>")]
pub async fn get_user_workouts_dynamic(
    user: Option<User>,
    conn: &State<SqlitePool>,
    limit: usize,
    _limitguard: RocketGovernor<'_, RateLimitGuard>,
) -> Result<CacheableResponse<serde_json::Value>, serde_json::Value> {
    match user {
        Some(user) => {
            let workouts = get_workouts(conn, user.name().to_string(), Some(limit.try_into().unwrap_or(1)), None).await;
            match workouts {
                Ok(workouts) => Ok(CacheableResponse {
                    data: serde_json::json!({ "workouts": workouts }),
                    cache_control: "private max-age=10".to_string(),
                }),
                Err(workouts) => Err(workouts),
            }
        }
        None => Err(LiftXError::LIFTX_ERROR_NOT_LOGGED_IN.into()),
    }
}

#[get("/user/workouts/recent/<days>")]
pub async fn get_user_workouts_recent(
    user: Option<User>,
    conn: &State<SqlitePool>,
    days: usize,
    _limitguard: RocketGovernor<'_, RateLimitGuard>,
) -> Result<CacheableResponse<serde_json::Value>, serde_json::Value> {
    match user {
        Some(user) => {
            let workouts = get_workouts(conn, user.name().to_string(), None, Some(days as u64)).await;
            match workouts {
                Ok(workouts) => Ok(CacheableResponse {
                    data: serde_json::json!({ "workouts": workouts }),
                    cache_control: "private max-age=10".to_string(),
                }),
                Err(workouts) => Err(workouts),
            }
        }
        None => Err(LiftXError::LIFTX_ERROR_NOT_LOGGED_IN.into()),
    }
}

#[get("/graphs/exercises")]
pub async fn get_exercises_list(
    user: Option<User>,
    conn: &State<SqlitePool>,
    _limitguard: RocketGovernor<'_, RateLimitGuard>,
) -> Result<CacheableResponse<serde_json::Value>, serde_json::Value> {
    match user {
        Some(user) => {
            let exercises = get_exercises(conn, user.name().to_string()).await;
            match exercises {
                Ok(exercises) => Ok(CacheableResponse {
                    data: serde_json::json!({ "labels": exercises.labels, "datasets": [{ "data": exercises.data, "backgroundColor": "rgba(165,11,0,0.9)", "borderColor": "rgba(247,18,2)","label": "Most Frequented Exercises" }]}),
                    cache_control: "private max-age=10".to_string(),
                }),
                Err(exercises) => Err(exercises),
            }
        }
        None => Err(LiftXError::LIFTX_ERROR_NOT_LOGGED_IN.into()),
    }
}

#[get("/graphs/volume/<days>")]
pub async fn get_graph_volume(
    user: Option<User>,
    conn: &State<SqlitePool>,
    days: usize,
    _limitguard: RocketGovernor<'_, RateLimitGuard>,
) -> Result<CacheableResponse<serde_json::Value>, serde_json::Value> {
    match user {
        Some(user) => {
            let volume: Vec<GraphVolumeEntry>;
            let wrap_data = get_workouts(conn, user.name().to_string(), None, Some(days as u64)).await;
            match wrap_data {
                Ok(data) => {
                    volume = data
                        .iter()
                        .map(|workout| GraphVolumeEntry {
                            date: crate::util::timestamp_to_iso8601(workout.start_time.try_into().unwrap()),
                            volume: workout.volume.clone(),
                        })
                        .collect();
                    Ok(CacheableResponse {
                        data: serde_json::json!({ "volume": volume }),
                        cache_control: "private max-age=10".to_string(),
                    })
                }
                Err(data) => Err(data),
            }
        }
        None => Err(LiftXError::LIFTX_ERROR_NOT_LOGGED_IN.into()),
    }
}

#[get("/graphs/frequent/<limit>")]
pub async fn get_graph_frequent(
    user: Option<User>,
    conn: &State<SqlitePool>,
    limit: usize,
    _limitguard: RocketGovernor<'_, RateLimitGuard>,
) -> Result<serde_json::Value, serde_json::Value> {
    match user {
        Some(user) => {
            let mut top: HashMap<String, GraphExerciseTop> = HashMap::new();
            let wrap_data = get_workouts(conn, user.name().to_string(), None, None).await;
            match wrap_data {
                Ok(data) => {
                    for workout in data {
                        for exercise in workout.exercises {
                            let mut count = top.entry(exercise.exercise.clone()).or_insert(GraphExerciseTop {
                                count: 0,
                                entries: Vec::new(),
                                name: exercise.exercise,
                            });
                            count.count += 1;
                            // parse sets and find the highest weight
                            let mut highest_weight: Weight = Weight {
                                weight: 0.0,
                                weight_unit: "lbs".to_string(),
                            };
                            for set in exercise.sets {
                                if set.weight.weight > highest_weight.weight {
                                    highest_weight.weight = set.weight.weight;
                                }
                            }
                            count.entries.push(GraphExerciseTopEntry {
                                date: crate::util::timestamp_to_iso8601(workout.start_time.try_into().unwrap()),
                                weight: highest_weight,
                            });
                        }
                    }
                    // sort the top exercises by count
                    let mut top_sorted: Vec<_> = top.iter().map(|(_, v)| v.clone()).collect();
                    top_sorted.sort_by(|a, b| b.count.cmp(&a.count));
                    // Take only the top N exercises
                    top_sorted.truncate(limit);
                    Ok(serde_json::json!({ "top": top_sorted }))
                }
                Err(data) => Err(data),
            }
        }
        None => Err(LiftXError::LIFTX_ERROR_NOT_LOGGED_IN.into()),
    }
}

#[get("/user/settings")]
pub async fn get_user_settings(
    user: Option<User>,
    conn: &State<SqlitePool>,
    _limitguard: RocketGovernor<'_, RateLimitGuard>,
) -> Result<serde_json::Value, serde_json::Value> {
    match user {
        Some(user) => {
            let settings = get_settings(conn, user.name().to_string()).await;
            match settings {
                Ok(settings) => Ok(serde_json::json!({ "settings": settings })),
                _ => Err(serde_json::json!({"error": "Invalid settings!"})),
            }
        }
        None => Err(LiftXError::LIFTX_ERROR_NOT_LOGGED_IN.into()),
    }
}

#[get("/user/delete")]
pub async fn delete_user(auth: Auth<'_>, conn: &State<SqlitePool>) -> Result<serde_json::Value, serde_json::Value> {
    let user = auth.get_user();
    match user.await {
        Some(user) => {
            {
                let result = auth.delete().await;
                if let Err(err) = result {
                    return Err(serde_json::json!({
                        "error": "Failed to delete user".to_string(),
                        "message": err.to_string()
                    }));
                }
                let result = database::delete_user_data(user.name(), conn).await;
                if let Err(err) = result {
                    return Err(serde_json::json!({
                        "error": "Failed to delete user".to_string(),
                        "message": err.to_string()
                    }));
                }
            }
            return Ok(serde_json::json!({
                "success": "User deleted"
            }));
        }
        None => {
            return Err(LiftXError::LIFTX_ERROR_NOT_LOGGED_IN.into());
        }
    }
}
