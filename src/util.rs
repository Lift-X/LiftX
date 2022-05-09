use chrono::{DateTime, NaiveDateTime, Utc};

pub fn timestamp_to_iso8601(timestamp: u64) -> String {
    let datetime: DateTime<Utc> = chrono::DateTime::from_utc(
        NaiveDateTime::from_timestamp(timestamp.try_into().unwrap(), 0),
        Utc,
    );
    datetime.format("%Y-%m-%d %H:%M:%S").to_string()
}
