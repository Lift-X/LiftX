use serde::{Deserialize, Serialize};
use std::fmt;

#[allow(non_camel_case_types)]
#[derive(Debug, Serialize, Deserialize)]
pub enum LiftXError {
    LIFTX_ERROR_NOT_LOGGED_IN,
    LIFTX_ERROR_NOT_FOUND,
    LIFTX_ERROR_WORKOUT_NOT_FOUND,
    LIFTX_ERROR_INVALID_TYPE,
    LIFTX_ERROR_USERNAME_EXISTS,
    Custom { message: String },
}

impl fmt::Display for LiftXError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::LIFTX_ERROR_NOT_FOUND => f.write_str("Not found!"),
            Self::LIFTX_ERROR_WORKOUT_NOT_FOUND => f.write_str("Workout not found!"),
            Self::LIFTX_ERROR_NOT_LOGGED_IN => f.write_str("Not logged in!"),
            Self::LIFTX_ERROR_INVALID_TYPE => f.write_str("Invalid type found!"),
            Self::LIFTX_ERROR_USERNAME_EXISTS => f.write_str("Username already exists!"),
            Self::Custom {
                message,
            } => write!(f, "{message}"),
        }
    }
}

impl std::error::Error for LiftXError {}

impl From<LiftXError> for serde_json::Value {
    fn from(error: LiftXError) -> serde_json::Value {
        serde_json::json!({
            "error": "Backend Error",
            "message": error.to_string(),
        })
    }
}
