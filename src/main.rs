// clippy
#![allow(clippy::dead_code)]

#[macro_use]
extern crate rocket;

pub mod database;
pub mod equipment;
mod exercises;
pub mod handlers;
pub mod muscles;

use equipment::WeightType;
use rocket_db_pools::Database;
use sqlx::ConnectOptions;

use crate::{database::create_connection, equipment::Weight, handlers::hello};

use exercises::*;

// Global Preference for weight, implement configuration later
const GLOBAL_WEIGHT_UNIT: WeightType = equipment::POUNDS;

#[launch]
async fn rocket() -> _ {
    let bench_press = SetEntry {
        exercise: EXERCISE_BENCH_PRESS,
        reps: 8,
        weight: Weight {
            weight: 135.0,
            weight_unit: GLOBAL_WEIGHT_UNIT,
        },
        reps_in_reserve: 1.5,
    };
    let mut bench_set = ExerciseEntry {
        exercise: EXERCISE_BENCH_PRESS,
        sets: vec![bench_press],
        comments: String::from(""),
    };
    for i in 0..2 {
        bench_set.sets.push(bench_press);
    }
    /*println!(
        "{} was done for {} reps with {}{} and {} reps in reserve",
        bench_press.exercise.name,
        bench_press.reps,
        bench_press.weight,
        GLOBAL_WEIGHT_UNIT.short_name,
        bench_press.reps_in_reserve
    );*/
    println!("{}", exercises::exercise_to_string_summary(&bench_set));
    let stringed_bench = exercises::exercise_to_string_summary(&bench_set);

    // connect to DB
    let mut conn =
        <sqlx::sqlite::SqliteConnectOptions as std::str::FromStr>::from_str("sqlite://data.db")
            .unwrap()
            .create_if_missing(true)
            .connect()
            .await
            .unwrap();

    //28fcad1c-0f5b-49d1-8d5c-2286f15ff99a

    // EX: Create workout table
    /*sqlx::query!("CREATE TABLE workout (id TINYTEXT PRIMARY KEY, date char(10), user TINYTEXT, data MEDIUMTEXT, comments TEXT)")
    .execute(&mut conn)
    .await
    .unwrap();*/

    // EX: Create workout entry
    /*sqlx::query!(
        "INSERT INTO workout (id, date, user, data, comments) VALUES ('28fcad1c-0f5b-49d1-8d5c-2286f15ff99a', '2020-01-01', 'John Doe', 'Bench Press - 8 Reps (135lbs, 1.5RiR) - 8 Reps (135lbs, 1.5RiR) - 8 Reps (135lbs, 1.5RiR)', 'comment')",
    ).execute(&mut conn).await.unwrap();*/

    // launch web server
    let shield = rocket::shield::Shield::default()
        .enable(rocket::shield::Referrer::NoReferrer)
        .enable(rocket::shield::XssFilter::EnableBlock);
    rocket::build()
        .attach(shield)
        .attach(database::Db::init())
        .mount("/", routes![hello])
}
