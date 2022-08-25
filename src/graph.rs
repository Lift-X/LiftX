use crate::{
    cache::CacheableResponse,
    database::{get_exercises, get_workouts},
    equipment::Weight,
    error::LiftXError,
    RateLimitGuard, SqlitePool,
};
use rocket::State;
use rocket_auth::User;
use rocket_governor::RocketGovernor;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

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
