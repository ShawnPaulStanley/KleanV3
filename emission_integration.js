(function() {
  // Helpers to estimate payload and weekly waste CO2 using existing global data structures
  function estimateAveragePayloadFromWasteData() {
    try {
      const wasteData = window.wasteData || [];
      const selectedPoints = window.selectedPoints || [];
      let totalKg = 0;
      let count = 0;

      wasteData.forEach(entry => {
        if (entry && entry.weight && !isNaN(entry.weight)) {
          totalKg += parseFloat(entry.weight);
          count++;
        } else if (entry && entry.automatic && entry.capacity) {
          const assumedFullKg = entry.estimated_full_kg || 50;
          const cap = entry.capacity || 100;
          totalKg += (assumedFullKg * (cap / 100));
          count++;
        }
      });

      if (count === 0 && selectedPoints.length > 1) {
        const defaultPerStop = 1.0;
        return defaultPerStop * (selectedPoints.length - 1) / 2;
      }

      const avgPerStop = count > 0 ? totalKg / count : 0;
      const avgPayloadKg = avgPerStop * (selectedPoints.length - 1) / 2;
      return Math.max(0, parseFloat(avgPayloadKg.toFixed(1)));
    } catch (e) {
      console.error('estimateAveragePayloadFromWasteData error', e);
      return 0;
    }
  }

  function estimateWeeklyWasteCO2() {
    try {
      // Try to use existing getWeeklyData() if present
      const week = (typeof window.getWeeklyData === 'function') ? window.getWeeklyData() : (function() {
        const data = { food:0, plastic:0, misc:0 };
        (window.wasteData || []).forEach(e => {
          if (!e || !e.type) return;
          if (e.type === 'food') data.food += (parseFloat(e.weight) || 0);
          else if (e.type === 'plastic') data.plastic += (parseFloat(e.weight) || 0);
          else data.misc += (parseFloat(e.weight) || 0);
        });
        return data;
      })();

      const EFs = { food: 2.5, plastic: 1.8, misc: 0.5 };
      const co2_food = (week.food || 0) * EFs.food;
      const co2_plastic = (week.plastic || 0) * EFs.plastic;
      const co2_misc = (week.misc || 0) * EFs.misc;
      return { total_kg: co2_food + co2_plastic + co2_misc, breakdown: { food: co2_food, plastic: co2_plastic, misc: co2_misc } };
    } catch (e) {
      console.error('estimateWeeklyWasteCO2 error', e);
      return { total_kg:0, breakdown: {} };
    }
  }

  function updateWeeklyStats() {
    try {
      const weekData = (typeof window.getWeeklyData === 'function') ? window.getWeeklyData() : (function(){
        const d = { food:0, plastic:0, misc:0 };
        (window.wasteData || []).forEach(e=>{ if (!e || !e.type) return; if (e.type==='food') d.food += (parseFloat(e.weight)||0); else if (e.type==='plastic') d.plastic += (parseFloat(e.weight)||0); else d.misc += (parseFloat(e.weight)||0); });
        return d;
      })();

      const weeklyFoodEl = document.getElementById('weekly-food');
      const weeklyPlasticEl = document.getElementById('weekly-plastic');
      const weeklyMiscEl = document.getElementById('weekly-misc');

      if (weeklyFoodEl) weeklyFoodEl.textContent = `${(weekData.food||0).toFixed(1)} kg`;
      if (weeklyPlasticEl) weeklyPlasticEl.textContent = `${(weekData.plastic||0).toFixed(1)} kg`;
      if (weeklyMiscEl) weeklyMiscEl.textContent = `${(weekData.misc||0).toFixed(1)} kg`;

      const wasteCO2 = estimateWeeklyWasteCO2();
      const weeklyCo2El = document.getElementById('weekly-co2');
      if (weeklyCo2El) weeklyCo2El.textContent = `${wasteCO2.total_kg.toFixed(1)} kg CO₂e (waste embodied)`;
    } catch (e) {
      console.error('updateWeeklyStats error', e);
    }
  }

  // Wrap existing updateRouteInfo to add emission calculation after routes are updated
  const originalUpdateRouteInfo = window.updateRouteInfo;
  window.updateRouteInfo = function(data) {
    try {
      if (typeof originalUpdateRouteInfo === 'function') {
        originalUpdateRouteInfo(data);
      }

      // compute distance from route data passed in (if available)
      let totalDistance = 0;
      if (data && data.features && data.features[0] && data.features[0].properties && data.features[0].properties.segments) {
        const segments = data.features[0].properties.segments || [];
        segments.forEach(s => { totalDistance += (s.distance || 0); });
      }

      const distanceKm = totalDistance > 100 ? (totalDistance / 1000) : totalDistance;
      const stops = Math.max(0, (window.selectedPoints ? window.selectedPoints.length - 1 : 0));
      const avgPayloadKg = estimateAveragePayloadFromWasteData();

      if (window.Emission && typeof window.Emission.estimateRouteEmissions === 'function') {
        const emissionResult = window.Emission.estimateRouteEmissions({ distanceKm: parseFloat(distanceKm.toFixed(2)), stops, avgPayloadKg, vehicleKey: 'medium_truck' });

        const co2El = document.getElementById('co2-emissions');
        if (co2El) co2El.textContent = `${emissionResult.co2_kg.toFixed(1)} kg CO₂ (est)`;

        const fuelEl = document.getElementById('fuel-liters');
        if (fuelEl) fuelEl.textContent = `${emissionResult.liters.toFixed(2)} L (est)`;
      }

    } catch (e) {
      console.error('emission_integration updateRouteInfo error', e);
      if (typeof originalUpdateRouteInfo === 'function') originalUpdateRouteInfo(data);
    }

    // Update weekly stats too
    try { updateWeeklyStats(); } catch (e) { console.error(e); }
  };

  // Export helpers to global so other code can call them
  window.estimateAveragePayloadFromWasteData = estimateAveragePayloadFromWasteData;
  window.estimateWeeklyWasteCO2 = estimateWeeklyWasteCO2;
  window.updateWeeklyStats = updateWeeklyStats;

  // Run initial weekly stats once DOM ready
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', updateWeeklyStats);
  else updateWeeklyStats();

})();
