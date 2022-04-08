#[derive(Debug)]
pub struct WeightType {
    pub long_name: &'static str,
    pub short_name: &'static str,
}

pub const Kilograms: WeightType = WeightType {
    long_name: "Kilograms",
    short_name: "kgs",
};

pub const Pounds: WeightType = WeightType {
    long_name: "Pounds",
    short_name: "lbs",
};
