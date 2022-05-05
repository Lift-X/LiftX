use ordered_float::OrderedFloat;

use crate::{*, equipment::{POUNDS, KILOGRAMS, EQUIPMENT_LIST}, exercises::{ExerciseEntry, SetEntry}};

/*#[tokio::test]
async fn test_rocket_and_handlers() {
    let rocket = launch_web().await;
    assert_eq!(rocket.is_ok(), true);
}
*/

#[test]
fn test_weight_from_string_lbs() {
    let weight = Weight::from_string("100lbs").unwrap();
    assert_eq!(weight.weight, 100.0);
    assert_eq!(WeightType::from_string(&weight.weight_unit).unwrap(), POUNDS);
}

#[test]
fn test_weight_from_string_kgs() {
    let weight = Weight::from_string("100kgs").unwrap();
    assert_eq!(weight.weight, 100.0);
    assert_eq!(WeightType::from_string(&weight.weight_unit).unwrap(), KILOGRAMS);
}

#[test]
fn test_weight_from_string_fail() {
    let weight = Weight::from_string("FAIL");
    assert_eq!(weight.is_err(), true);
}

#[test]
fn test_weight_to_kilograms() {
    let weight = Weight {
        weight: 45.0,
        weight_unit: "lbs".to_string(),
    };
    assert_eq!(
        OrderedFloat(weight.to_kilograms().unwrap()),
        OrderedFloat(20.411655)
    );
}

#[test]
fn test_weight_to_pounds() {
    let weight = Weight {
        weight: 25.0,
        weight_unit: "kgs".to_string(),
    };
    assert_eq!(
        OrderedFloat(weight.to_pounds().unwrap()),
        OrderedFloat(55.115574)
    );
}

#[test]
fn test_weight_type_from_string() {
    assert_eq!(WeightType::from_string("kgs").unwrap(), KILOGRAMS);
    assert_eq!(WeightType::from_string("lbs").unwrap(), POUNDS);
    assert_eq!(WeightType::from_string("ERROR").is_err(), true);
}

#[test]
fn test_parse_equipment() {
    for equipment in EQUIPMENT_LIST {
        assert_eq!(equipment.name.is_ascii(), true);
        match equipment.rep_multiplier {
            0 => assert_eq!(equipment.rep_multiplier, 0),
            1 => assert_eq!(equipment.rep_multiplier, 1),
            2 => assert_eq!(equipment.rep_multiplier, 2),
            3 => assert_eq!(equipment.rep_multiplier, 3),
            4 => assert_eq!(equipment.rep_multiplier, 4),
            _ => panic!("Invalid rep_multiplier!"),
        }
    }
}

#[test]
fn test_exercise_string_to_exercise() {
    let t = "Bench Press;8,135lbs,1.5;8,135lbs,1.5;8,135lbs,1.5";
    let e = ExerciseEntry::from_string(t);
    assert_eq!(e.exercise.name, "Bench Press");
    assert_eq!(
        e.exercise.muscle_sub_groups,
        [muscles::PectoralisMajor, muscles::PectoralisMinor]
    );
    assert_eq!(e.exercise.recommended_rep_range[0], 8);
    assert_eq!(e.exercise.recommended_rep_range[1], 12);
    assert_eq!(e.sets[0].reps, 8);
    assert_eq!(e.sets.len(), 3);
    assert_eq!(e.sets[0].weight.weight, 135.0);
    assert_eq!(WeightType::from_string(&e.sets[0].weight.weight_unit).unwrap(), equipment::POUNDS);
    assert_eq!(e.sets[0].reps_in_reserve, 1.5);
}

// Test conversion from a parseable string to a readable string
#[test]
fn test_string_parseable_exercise_to_summary() {
    let t = "Bench Press;8,135lbs,1.5;8,135lbs,1.5;8,135lbs,1.5;";
    let e = ExerciseEntry::from_string(t);
    assert_eq!(e.sets.len(), 3);
    assert_eq!(e.to_string_readable(), "Bench Press - 8 Reps (135lbs, 1.5RiR) - 8 Reps (135lbs, 1.5RiR) - 8 Reps (135lbs, 1.5RiR)");
}

#[test]
fn test_exercise_to_string() {
    let t = "Bench Press;8,135lbs,1.5;8,135lbs,1.5;8,135lbs,1.5";
    let bench_press = SetEntry {
        exercise: exercises::EXERCISE_BENCH_PRESS,
        reps: 8,
        weight: Weight {
            weight: 135.0,
            weight_unit: "lbs".to_string(),
        },
        reps_in_reserve: 1.5,
    };
    let mut bench_set = ExerciseEntry {
        exercise: exercises::EXERCISE_BENCH_PRESS,
        comments: String::from(""),
        sets: vec![bench_press.clone()],
    };
    for _i in 0..2 {
        bench_set.sets.push(bench_press.clone());
    }
    assert_eq!(bench_set.to_string(), t);
}

#[test]
fn test_user() {
    let user = database::User {
        name: "test".to_string(),
        email: "test@example.com".to_string(),
        password: "password".to_string(),
    };
    assert_eq!(user.name, "test");
    assert_eq!(user.email, "test@example.com");
    assert_eq!(user.password, "password");
}

#[test]
fn test_workout_id() {
    let time = std::time::UNIX_EPOCH
        .elapsed()
        .unwrap()
        .as_secs()
        .to_string();
    let uuid = uuid::Uuid::new_v4().to_string();
    let user = database::User {
        name: "test".to_string(),
        email: "test@example.com".to_string(),
        password: "password".to_string(),
    };
    let workout_id = database::WorkoutID {
        uuid: uuid.clone(),
        user,
        timestamp: time.clone(),
    };
    assert_eq!(workout_id.uuid, uuid);
    assert_eq!(workout_id.user.name, "test");
    assert_eq!(workout_id.timestamp, time);
}

#[test]
fn test_exercises() {
    for exercise in exercises::EXCERCISES_LIST {
        assert_eq!(exercise.name.is_ascii(), true);
        for muscles in exercise.muscle_sub_groups {
            assert_eq!(muscles.name.is_ascii(), true);
        }
        assert_eq!(exercise.recommended_rep_range[0] < exercise.recommended_rep_range[1], true);
    }
}