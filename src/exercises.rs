use serde::Serialize;
use serde_json::json;

use crate::equipment::{self, EquipmentType, Weight};

#[derive(Debug, Copy, Clone, Serialize)]
pub struct Exercise {
    pub name: &'static str,
    pub muscle_sub_groups: &'static [&'static str], // https://stackoverflow.com/questions/42764016/creating-a-static-const-vecstring
    pub recommended_rep_range: [u32; 2],
    pub equipment: &'static EquipmentType,
}

// "Set" as in a set of reps, not the verb "set"
#[derive(Debug, Clone, Serialize)]
pub struct SetEntry<'a> {
    pub exercise: Exercise,
    pub reps: u32,
    pub weight: Weight<'a>,
    pub reps_in_reserve: f32, // how many more reps you feel you could've done
}

// ExerciseEntry is a set of sets
#[derive(Debug, Clone, Serialize)]
pub struct ExerciseEntry<'a> {
    pub exercise: Exercise,
    pub comments: String,
    pub sets: Vec<SetEntry<'a>>,
}

// Absolutely scuffed, feel free to PR :D
impl ExerciseEntry<'_> {
    pub fn from_string(string: &str) -> ExerciseEntry {
        // iter over string, separated by;
        let split = string.split_terminator(';').collect::<Vec<_>>();
        let mut gen_set_entry: ExerciseEntry = ExerciseEntry {
            exercise: Exercise {
                name: "",
                muscle_sub_groups: &[],
                recommended_rep_range: [0, 0],
                equipment: &equipment::NONE,
            },
            comments: "".to_string(),
            sets: vec![],
        };

        // iterate over excercises, see if "split[0]" is in the name of an exercise
        // could be very taxing as list of exercises grows.. maybe use a hashmap?
        for excercise in EXCERCISES_LIST {
            let mut gen_vec = Vec::new();
            if excercise.name == split[0] {
                for set in split[1..].iter() {
                    let proc_set = set.split_terminator(',').collect::<Vec<_>>();
                    let gen_set = SetEntry {
                        exercise: excercise,
                        reps: proc_set[0].parse::<u32>().unwrap(),
                        weight: Weight::from_string(proc_set[1]),
                        reps_in_reserve: proc_set[2].parse::<f32>().unwrap(),
                    };
                    gen_vec.push(gen_set);
                }
                gen_set_entry = ExerciseEntry {
                    exercise: excercise,
                    comments: split[1].to_string(),
                    sets: gen_vec,
                };
                break;
            }
        }
        gen_set_entry
    }

    pub fn to_string(&self) -> String {
        let mut stringified_exercise = self.exercise.name.to_string();
        for set in self.sets.iter() {
            let _a = format!(
                ";{},{}{},{}",
                set.reps, set.weight.weight, set.weight.weight_unit.short_name, set.reps_in_reserve
            );
            stringified_exercise.push_str(&_a);
        }
        return stringified_exercise.trim().to_string();
    }

    pub fn to_string_readable(&self) -> String {
        let mut stringified_exercise = self.exercise.name.to_string();
        for set in self.sets.iter() {
            let _a = format!(
                " - {} Reps ({}{}, {}RiR)",
                set.reps, set.weight.weight, set.weight.weight_unit.short_name, set.reps_in_reserve
            );
            stringified_exercise.push_str(&_a);
        }
        return stringified_exercise.trim().to_string();
    }

    pub fn to_json(&self) -> String {
        json!(self).to_string()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_exercise_string_to_exercise() {
        let t = "Bench Press;8,135lbs,1.5;8,135lbs,1.5;8,135lbs,1.5";
        let e = ExerciseEntry::from_string(t);
        assert_eq!(e.exercise.name, "Bench Press");
        assert_eq!(
            e.exercise.muscle_sub_groups,
            &["Pectoralis Major", "Pectoralis Minor"]
        );
        assert_eq!(e.exercise.recommended_rep_range[0], 8);
        assert_eq!(e.exercise.recommended_rep_range[1], 12);
        assert_eq!(e.sets[0].reps, 8);
        assert_eq!(e.sets.len(), 3);
        assert_eq!(e.sets[0].weight.weight, 135.0);
        assert_eq!(e.sets[0].weight.weight_unit, &equipment::POUNDS);
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

}

// WorkoutEntry is a set of exercise entries
#[derive(Debug, Clone)]
pub struct WorkoutEntry<'a> {
    pub date: String,
    pub exercises: Vec<ExerciseEntry<'a>>,
    pub comments: String,
    pub user: String,
}

pub const EXCERCISES_LIST: [Exercise; 2] = [EXERCISE_BENCH_PRESS, EXERCISE_DUMBBELL_BENCH_PRESS];

pub const EXERCISE_BENCH_PRESS: Exercise = Exercise {
    name: "Bench Press",
    muscle_sub_groups: &["Pectoralis Major", "Pectoralis Minor"],
    recommended_rep_range: [8, 12],
    equipment: &equipment::BARBELL,
};

pub const EXERCISE_DUMBBELL_BENCH_PRESS: Exercise = Exercise {
    name: "Dumbbell Bench Press",
    muscle_sub_groups: &["Pectoralis Major", "Pectoralis Minor"],
    recommended_rep_range: [8, 12],
    equipment: &equipment::DUMBBELLS,
};
