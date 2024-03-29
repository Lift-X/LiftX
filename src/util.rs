use chrono::{DateTime, NaiveDateTime, Utc};
pub fn timestamp_to_iso8601(timestamp: i64) -> String {
    let datetime: DateTime<Utc> = chrono::DateTime::from_utc(NaiveDateTime::from_timestamp(timestamp, 0), Utc);
    datetime.format("%Y-%m-%d %H:%M").to_string()
}

pub fn string_capital_case(word: &str) -> String {
    // Convert a string to "Capital Case"
    let mut result: String = String::new();
    let split = word.split_whitespace();
    for word in split {
        result.push_str(&word.chars().next().unwrap().to_uppercase().to_string());
        result.push_str(&word.chars().skip(1).collect::<String>());
        result.push(' ');
    }
    result.pop();
    result
}

/// Epley formula
pub fn one_rep_max(weight: f32, reps: f32) -> u16 {
    let orm: u16 = (weight * (1.0 + (reps as f32 / 30.0))).round() as u16; // TODO: remove `as` statement
   orm
}
