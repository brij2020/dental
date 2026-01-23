import type { StateCities } from "@/Components/bookAppointments/types";
import { State, City } from "country-state-city";

const states: string[] = State.getStatesOfCountry("IN").map((s) => s.name);

const stateCities: StateCities = {};
State.getStatesOfCountry("IN").forEach((state) => {
  const cities = City.getCitiesOfState("IN", state.isoCode).map((c) => c.name);
  stateCities[state.name] = cities;
});

export { states, stateCities };
