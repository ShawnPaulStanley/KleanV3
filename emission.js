// Lightweight emission estimator for KleanV3
// Exposes `window.Emission` with a simple API:
//   Emission.estimateRouteEmissions({distanceKm, stops, avgPayloadKg, vehicleKey})

const Emission = (function() {
  // Vehicle profiles (editable)
  const VEHICLES = {
    small_van: { name: 'Small Van', baseLper100km: 9.0, capacityKg: 1000, fuel: 'diesel' },
    medium_truck: { name: 'Medium Truck', baseLper100km: 18.0, capacityKg: 5000, fuel: 'diesel' },
    electric_truck: { name: 'Electric Truck', baseLper100km: 0.0, capacityKg: 4000, fuel: 'electric' }
  };

  // Emission factors - default values (kg CO2 equivalent)
  const EF = {
    diesel: { co2_per_l: 2.68 },
    gasoline: { co2_per_l: 2.31 },
    electric: { co2_per_kwh: 0.45 } // placeholder for grid intensity (kgCO2/kWh)
  };

  // Tuning parameters (tweak in production)
  const ALPHA_PAYLOAD = 0.15; // fractional fuel increase per 100% payload
  const STOP_PENALTY_L = 0.05; // liters per stop (urban stop/start penalty)

  function estimateFuelFromDistance(distanceKm, vehicleKey='medium_truck', avgPayloadKg=0, stops=0) {
    const v = VEHICLES[vehicleKey] || VEHICLES.medium_truck;
    const payloadFraction = v.capacityKg ? Math.min(1, avgPayloadKg / v.capacityKg) : 0;
    const baseLperKm = v.baseLper100km / 100;
    const adjustedLperKm = baseLperKm * (1 + ALPHA_PAYLOAD * payloadFraction);
    const liters = adjustedLperKm * distanceKm + STOP_PENALTY_L * stops;
    return { liters, payloadFraction, vehicle: v };
  }

  function litersToCO2(liters, fuelType='diesel') {
    if (fuelType === 'electric') {
      return { co2_kg: 0 }; // electric handled externally if needed
    }
    const ef = EF[fuelType] || EF.diesel;
    return { co2_kg: liters * (ef.co2_per_l || 0) };
  }

  function estimateRouteEmissions({ distanceKm=0, stops=0, avgPayloadKg=0, vehicleKey='medium_truck' } = {}) {
    const fuel = estimateFuelFromDistance(distanceKm, vehicleKey, avgPayloadKg, stops);
    const co2 = litersToCO2(fuel.liters, VEHICLES[vehicleKey]?.fuel);
    return {
      distanceKm,
      liters: fuel.liters,
      co2_kg: co2.co2_kg,
      co2_per_km: distanceKm > 0 ? co2.co2_kg / distanceKm : 0,
      payloadFraction: fuel.payloadFraction,
      vehicle: fuel.vehicle
    };
  }

  return {
    estimateRouteEmissions,
    VEHICLES,
    EF
  };
})();

window.Emission = Emission;
