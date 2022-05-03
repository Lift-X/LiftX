# WLRS [![codecov](https://codecov.io/gh/Zusier/wlrs/branch/main/graph/badge.svg?token=JQX7FH4WL5)](https://codecov.io/gh/Zusier/wlrs)

First time trying to make a "full stack" web application. Goal is to track workouts

Never taken a class on "advanced data structures" so feel free to scold me on how I should do it

## TODO

- [x] Make impl for WorkoutEntry so we can parse after retrieving from DB
- [ ] Json for data stuff
- [ ] HTML + CSS Templating
- [ ] Switch from sqlite DB once stuff is working great. (Using sqlite because my dev environment changes frequently)

## Challenges

- Data Types and storage, how do prod-level projects store this type of data?
  - json might work.. need to figure out how to deserialize &strs with no lifetimes??? :(