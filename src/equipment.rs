use crate::error::LiftXError;
use serde::{Deserialize, Serialize};

/// Either `KILOGRAMS` or `POUNDS`.
/// Contains a long and short name for the weight unit
/// Strings below can't be indirectly deserialized for some reason. I've tried a bunch of stuff :/
/// For now in indirect use cases the type will be a string and converted back to a `WeightUnit`
#[derive(PartialEq, Debug, Clone, Copy, Eq, Deserialize, Serialize)]
pub struct WeightType<'a> {
    #[serde(borrow)]
    pub long_name: &'a str,
    #[serde(borrow)]
    pub short_name: &'a str,
}

pub const KILOGRAMS: WeightType = WeightType {
    long_name: "Kilograms",
    short_name: "kgs",
};

pub const POUNDS: WeightType = WeightType {
    long_name: "Pounds",
    short_name: "lbs",
};

#[derive(PartialEq, Debug, Clone, Serialize, Deserialize, PartialOrd)]
pub struct Weight {
    pub weight: f32,
    pub weight_unit: String,
}

impl Weight {
    pub fn from_string(string: &str) -> Result<Weight, LiftXError> {
        // collect only alphabetical characters
        let split: String = string.matches(char::is_alphabetic).collect::<String>();
        match split.as_ref() {
            "kgs" => Ok(Weight {
                weight: string.split_terminator("kgs").collect::<Vec<_>>()[0]
                    .parse::<f32>()
                    .unwrap_or(0.0),
                weight_unit: "kgs".to_string(),
            }),
            "lbs" => Ok(Weight {
                weight: string.split_terminator("lbs").collect::<Vec<_>>()[0]
                    .parse::<f32>()
                    .unwrap_or(0.0),
                weight_unit: "lbs".to_string(),
            }),
            _ => Err(LiftXError::LIFTX_ERROR_INVALID_TYPE),
        }
    }

    pub fn to_kilograms(&self) -> Result<f32, LiftXError> {
        match self.weight_unit.as_str() {
            "kgs" => Ok(self.weight),
            "lbs" => Ok(self.weight * 0.453_592_37),
            _ => Err(LiftXError::LIFTX_ERROR_INVALID_TYPE),
        }
    }

    pub fn to_pounds(&self) -> Result<f32, LiftXError> {
        match self.weight_unit.as_str() {
            "kgs" => Ok(self.weight * 2.204_623),
            "lbs" => Ok(self.weight),
            _ => Err(LiftXError::LIFTX_ERROR_INVALID_TYPE),
        }
    }

    pub fn default() -> Weight {
        Weight {
            weight: 0.0,
            weight_unit: "lbs".to_string(),
        }
    }
}

impl WeightType<'_> {
    pub fn from_string(string: &str) -> Result<WeightType, LiftXError> {
        match string {
            "kgs" => Ok(KILOGRAMS),
            "lbs" => Ok(POUNDS),
            _ => Err(LiftXError::LIFTX_ERROR_INVALID_TYPE),
        }
    }
}
