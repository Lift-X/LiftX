use crate::equipment::{Weight, WeightType};
use serde::{Deserialize, Serialize};
use serde_json::json;
use skytable::types::{FromSkyhashBytes, IntoSkyhashBytes};
use uuid::Uuid;

/// "Set" as in a set of reps, not the verb "set"
#[derive(Debug, Clone, Deserialize, Serialize, PartialEq)]
pub struct SetEntry {
    pub reps: u32,
    pub weight: Weight,
    pub reps_in_reserve: f32, // how many more reps you feel you could've done
}

/// `ExerciseEntry` is a collection of Set Entries
#[derive(Debug, Clone, Deserialize, Serialize, PartialEq)]
pub struct ExerciseEntry {
    pub exercise: String,
    pub comments: String,
    pub sets: Vec<SetEntry>,
}

/// `WorkoutEntry` is a collection of exercise entries
#[derive(Debug, Clone, Deserialize, Serialize, PartialEq)]
pub struct WorkoutEntry {
    pub uuid: String,
    pub title: String,
    pub start_time: u64,
    pub end_time: u64,
    pub exercises: Vec<ExerciseEntry>,
    pub user: String,
    /// Total volume of the workout in the form of a `Weight`
    pub volume: Weight,
}

/// Used for adding to db
impl IntoSkyhashBytes for WorkoutEntry {
    fn as_bytes(&self) -> Vec<u8> {
        serde_json::to_string(self).unwrap().into_bytes()
    }
}

/// Used for getting from db
impl FromSkyhashBytes for WorkoutEntry {
    fn from_element(element: skytable::Element) -> skytable::SkyResult<Self> {
        // Build json as string
        let json: String = element.try_element_into()?;
        // Convert back into `WorkoutEntry`
        match serde_json::from_str(&json) {
            Ok(v) => Ok(v),
            Err(e) => Err(skytable::error::Error::ParseError(e.to_string())),
        }
    }
}
/// `ExerciseList` is a list of exercises, used for the frontend
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct ExerciseList {
    pub name: String,
    pub count: i32,
}

impl ExerciseEntry {
    // Absolutely scuffed, feel free to PR :D
    pub fn from_string(string: &str) -> ExerciseEntry {
        // iter over string, separated by;
        let split = string.split_terminator(';').collect::<Vec<_>>();

        let mut gen_vec: Vec<SetEntry> = Vec::new();
        for set in split[1..].iter() {
            let proc_set = set.split_terminator(',').collect::<Vec<_>>();
            let gen_set = SetEntry {
                reps: proc_set[0].parse::<u32>().unwrap(),
                weight: Weight::from_string(proc_set[1]).expect("Invalid weight"),
                reps_in_reserve: proc_set[2].parse::<f32>().unwrap(),
            };
            gen_vec.push(gen_set);
        }
        ExerciseEntry {
            exercise: split[0].to_string(),
            comments: split[1].to_string(),
            sets: gen_vec,
        }
    }

    pub fn to_string_summary(&self) -> String {
        let mut stringified_exercise: String = self.exercise.clone();
        for set in &self.sets {
            let a = format!(
                " - {}x{}{},{}RiR",
                set.reps,
                set.weight.weight,
                WeightType::from_string(&set.weight.weight_unit)
                    .expect("Invalid Weight Type!")
                    .short_name,
                set.reps_in_reserve
            );
            stringified_exercise.push_str(&a);
        }
        return stringified_exercise.trim().to_string();
    }

    pub fn to_json(&self) -> serde_json::Value {
        json! {self}
    }

    pub fn from_json(string: &str) -> ExerciseEntry {
        serde_json::from_str(string).unwrap()
    }
}

impl std::fmt::Display for ExerciseEntry {
    fn fmt(&self, f: &mut std::fmt::Formatter) -> std::fmt::Result {
        let mut stringified_exercise: String = self.exercise.clone();
        for set in &self.sets {
            let a: String = format!(
                ";{},{}{},{}",
                set.reps,
                set.weight.weight,
                WeightType::from_string(&set.weight.weight_unit)
                    .expect("Invalid Weight Type!")
                    .short_name,
                set.reps_in_reserve
            );
            stringified_exercise.push_str(&a);
        }
        write!(f, "{}", stringified_exercise)
    }
}

impl WorkoutEntry {
    pub fn to_json(&mut self, uuid: Uuid) -> serde_json::Value {
        self.uuid = uuid.to_string();
        json! {self}
    }

    pub fn from_json(string: &str) -> WorkoutEntry {
        let workout: WorkoutEntry = serde_json::from_str(string).unwrap();
        workout
    }

    pub fn default() -> Self {
        WorkoutEntry {
            uuid: "".to_string(),
            title: "".to_string(),
            start_time: 0,
            end_time: 0,
            exercises: vec![],
            user: "".to_string(),
            volume: Weight::default(),
        }
    }
}
