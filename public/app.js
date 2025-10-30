const app=document.getElementById('app');
document.getElementById('year').textContent=new Date().getFullYear();
const views={
  home:()=>`<section class="card"><h2>Welcome to Rigsta</h2><p>Free starter app.</p></section>`,
 tools: () => `
  <section class="card">
    <h2>Rigsta Load Calculator (Pro)</h2>

    <form id="calc-form" class="grid" style="margin-bottom:12px">
      <div>
        <label>Units</label>
        <select id="units">
          <option value="metric" selected>Metric (kg, m, m/s)</option>
          <option value="imperial">Imperial (lb, ft, mph)</option>
        </select>
      </div>

      <div>
        <label>Total Load (excl. rigging)</label>
        <input type="number" id="load" placeholder="e.g. 2000" min="0" step="0.001">
      </div>

      <div>
        <label>Rigging Weight</label>
        <input type="number" id="rigWeight" placeholder="e.g. 50" min="0" step="0.001">
      </div>

      <div>
        <label>Number of Sling Legs</label>
        <select id="legs">
          <option value="2" selected>2</option>
          <option value="3">3</option>
          <option value="4">4</option>
        </select>
      </div>

      <div>
        <label>Hitch Type</label>
        <select id="hitch">
          <option value="vertical" selected>Vertical</option>
          <option value="choker">Choker</option>
          <option value="basket">Basket</option>
        </select>
      </div>

      <div>
        <label>Sling Angle (° from horizontal)</label>
        <input type="number" id="angle" placeholder="e.g. 45" min="0" max="89" step="0.1">
      </div>

      <div>
        <label>Choker Reduction (0.70–0.90)</label>
        <input type="number" id="chokerRed" value="0.80" min="0.5" max="1" step="0.01">
      </div>

      <div>
        <label>D/d Ratio (sheave dia / rope dia)</label>
        <input type="number" id="Dd" placeholder="e.g. 20" min="1" step="0.1">
      </div>

      <div>
        <label>Dynamic Factor (DF)</label>
        <input type="number" id="DF" value="1.10" min="1" max="2" step="0.01">
      </div>

      <div>
        <label>Projected Area (wind)</label>
        <input type="number" id="area" placeholder="e.g. 2.5">
      </div>

      <div>
        <label>Wind Speed</label>
        <input type="number" id="wind" placeholder="e.g. 10">
      </div>

      <div>
        <label>COG offset (two-point lift) — distance to Point A</label>
        <input type="number" id="d1" placeholder="e.g. 1.2">
      </div>

      <div>
        <label>COG offset — distance to Point B</label>
        <input type="number" id="d2" placeholder="e.g. 1.0">
      </div>

      <div>
        <label>Manual multi-crane share A (%)</label>
        <input type="number" id="shareA" placeholder="e.g. 60" min="0" max="100">
      </div>

      <div>
        <label>Manual multi-crane share B (%)</label>
        <input type="number" id="shareB" placeholder="e.g. 40" min="0" max="100">
      </div>

      <div>
        <label>Target WLL per leg (for Pass/Fail)</label>
        <input type="number" id="targetWLL" placeholder="e.g. 1000" min="0" step="0.001">
      </div>

      <div style="align-self:end">
        <button type="submit" class="btn-primary">Calculate</button>
      </div>
    </form>

    <div class="card" style="margin:12px 0">
      <details>
        <summary>Help & assumptions</summary>
        <ul style="margin-top:8px">
          <li>Angle Factor AF = 1 / cos(θ), θ = angle from horizontal.</li>
          <li>Basket baseline ≈ 2× vertical leg capacity before angles; choker reduction default 0.80 (edit if manufacturer specifies).</li>
          <li>D/d efficiency uses a simplified table; enter your value for a conservative multiplier.</li>
          <li>Wind load (Metric): F = 0.613 × C<sub>d</sub> × A × V² (N). Imperial: F = 0.00256 × C<sub>d</sub> × A × V² (lbf). Uses C<sub>d</sub>=1.2 if not specified.</li>
          <li>COG two-point: vertical share ∝ opposite span (d2 vs d1), then angle factors apply.</li>
          <li>DF (&gt;1) inflates resultant to account for dynamics.</li>
        </ul>
      </details>
    </div>

    <div id="results" class="card" style="display:none">
      <h3>Results</h3>
      <div id="res-summary"></div>
      <hr/>
      <div id="res-legs"></div>
      <hr/>
      <div id="res-warnings"></div>
      <button id="printPdf" class="btn-primary" style="margin-top:8px">Print / Save PDF</button>
    </div>
  </section>
`,


  ar:()=>`<section class="card"><h2>AR Check</h2><p>Tests for WebXR support.</p></section>`,
  offline:()=>`<section class="card"><h2>Offline Mode</h2><p>Works offline.</p></section>`,
  about:()=>`<section class="card"><h2>About</h2><p>Rigsta Starter.</p></section>`
};
function render(v='home'){app.innerHTML=views[v]();}
document.querySelectorAll('nav button').forEach(b=>{
  b.addEventListener('click',()=>{document.querySelectorAll('nav button').forEach(x=>x.classList.remove('active'));b.classList.add('active');render(b.dataset.view);});
});
render('home');
// ====================== Rigsta Calc Engine ======================
(function(){
  const g = 9.80665; // m/s^2 (for any future mass->force conversions if needed)

  // D/d efficiency (very simplified, conservative multipliers)
  // You can refine this table to your rope manufacturer’s data.
  function ddEfficiency(Dd){
    if (!Dd || Dd <= 1) return 0.6;
    if (Dd < 8)  return 0.7;
    if (Dd < 12) return 0.8;
    if (Dd < 16) return 0.9;
    return 1.0;
  }

  // Angle factor AF = 1/cos(theta)
  function angleFactor(deg){
    const rad = deg * Math.PI / 180;
    if (deg >= 89.9) return Infinity;
    return 1/Math.cos(rad);
  }

  // Hitch multiplier (baseline before angle factor)
  function hitchMultiplier(hitch, chokerRed){
    if (hitch === 'basket') return 2.0;
    if (hitch === 'choker') return Math.max(0.5, Math.min(1, chokerRed || 0.8));
    return 1.0; // vertical
  }

  // Wind force (projected area). Default Cd=1.2 if not provided.
  function windForce({units, area, wind, Cd=1.2}){
    if (!area || !wind) return 0;
    if (units === 'imperial'){
      // F(lbf) = 0.00256 * Cd * A(ft^2) * V(mph)^2
      return 0.00256 * Cd * area * wind * wind;
    }
    // Metric: F(N) = 0.613 * Cd * A(m^2) * V(m/s)^2
    return 0.613 * Cd * area * wind * wind;
  }

  // Convert helpers
  const toLb = kg => kg*2.2046226218;
  const toKg = lb => lb/2.2046226218;

  // Build a line of warning HTML
  function warn(txt){ return `<div style="color:#ffb703">⚠️ ${txt}</div>`; }
  function ok(txt){ return `<div style="color:#28c76f">✅ ${txt}</div>`; }

  // Core compute
  function compute(inputs){
    const {
      units, load, rigWeight, legs, hitch, angle, chokerRed, Dd, DF,
      area, wind, d1, d2, shareA, shareB, targetWLL
    } = inputs;

    // Normalize: work internally in kilograms-force (kgf) for weights, and newtons for wind if metric; convert at the end.
    // For simplicity, treat numeric entries as "kg" or "lb" depending on units.
    let baseLoadKg = units==='imperial' ? toKg(load||0) : (load||0);
    let rigKg      = units==='imperial' ? toKg(rigWeight||0) : (rigWeight||0);
    let totalKg    = baseLoadKg + rigKg;

    // Add wind load as equivalent weight (very simplified):
    // Convert wind force to kgf: kgf = N / g, and lbf is already a force so convert to kgf.
    let windKgf = 0;
    if (area && wind){
      if (units==='imperial'){
        const F_lbf = windForce({units, area, wind});  // lbf
        windKgf = toKg(F_lbf); // 1 lbf ≈ 0.45359237 kgf
      } else {
        const F_N = windForce({units, area, wind});    // N
        windKgf = F_N / g; // to kgf
      }
    }

    // Dynamic factor
    const DFv = Math.max(1, DF || 1);

    // Apply hitch multiplier (baseline) and angle factor
    const AF = angleFactor(angle||0);
    const HM = hitchMultiplier(hitch, chokerRed);

    // Two-point COG share (if d1 & d2 provided and legs>=2):
    // Vertical share A = W * (d2 / (d1+d2)), B = W * (d1 / (d1+d2))
    // Then expand to legs proportionally (for 2-leg primary case; for 3/4 legs we distribute equally by group)
    let verticalShares = null;
    if ((d1>0 || d2>0) && (legs>=2)){
      const sum = (d1||0)+(d2||0);
      if (sum>0){
        const WA = totalKg * (d2/sum);
        const WB = totalKg * (d1/sum);
        verticalShares = {A: WA, B: WB};
      }
    }

    // Manual multi-crane percentage (optional)
    let craneShare = null;
    if ((shareA||shareB) && (shareA+shareB>0)){
      const sA = shareA||0, sB = shareB||0, sTot = sA+sB;
      craneShare = {
        A: (totalKg * (sA/sTot)),
        B: (totalKg * (sB/sTot))
      };
    }

    // Effective working weight incl. wind & DF
    const effectiveKg = (totalKg + windKgf) * DFv;

    // D/d efficiency
    const Edd = ddEfficiency(Dd||0);

    // Calculate per-leg required WLL (kgf) — base scenarios:
    // If we have a 2-point COG share, compute two groups first, then per-leg tension = (vertical share / group legs / HM) * AF / Edd
    // Else evenly distribute vertically: (effectiveKg / legs / HM) * AF / Edd
    const legResults = [];

    function perLegReqWLL(vertShareKg, legCountInGroup){
      const basePerLeg = (vertShareKg / Math.max(1, legCountInGroup)) / Math.max(0.0001, HM);
      const tension = basePerLeg * AF / Math.max(0.0001, Edd);
      return tension; // kgf
    }

    if (verticalShares && legs===2){
      // A and B one leg each
      legResults.push({label:'Leg A', reqKgf: perLegReqWLL((verticalShares.A + windKgf*0.5)*DFv, 1)});
      legResults.push({label:'Leg B', reqKgf: perLegReqWLL((verticalShares.B + windKgf*0.5)*DFv, 1)});
    } else if (verticalShares && (legs===4)){
      // A & B are two-leg groups
      legResults.push({label:'Leg A1', reqKgf: perLegReqWLL((verticalShares.A + windKgf*0.5)*DFv, 2)});
      legResults.push({label:'Leg A2', reqKgf: perLegReqWLL((verticalShares.A + windKgf*0.5)*DFv, 2)});
      legResults.push({label:'Leg B1', reqKgf: perLegReqWLL((verticalShares.B + windKgf*0.5)*DFv, 2)});
      legResults.push({label:'Leg B2', reqKgf: perLegReqWLL((verticalShares.B + windKgf*0.5)*DFv, 2)});
    } else {
      // Even share among legs
      const perLegKgf = perLegReqWLL(effectiveKg, legs);
      for (let i=1;i<=legs;i++) legResults.push({label:`Leg ${i}`, reqKgf: perLegKgf});
    }

    // Multi-crane share (informational)
    let cranes = null;
    if (craneShare){
      cranes = {
        A_kg: craneShare.A * DFv,
        B_kg: craneShare.B * DFv
      };
    }

    // Pass/Fail vs Target WLL per leg
    const tgtKgf = units==='imperial' ? toKg(targetWLL||0) : (targetWLL||0);
    const checks = legResults.map(L => ({
      label: L.label,
      req: units==='imperial' ? toLb(L.reqKgf) : L.reqKgf,
      pass: tgtKgf ? (L.reqKgf <= tgtKgf) : null
    }));

    // Build summary strings in chosen units
    const toUnit = (kg)=> units==='imperial' ? toLb(kg) : kg;
    const uMass = units==='imperial' ? 'lb' : 'kg';
    const uArea = units==='imperial' ? 'ft²' : 'm²';
    const uWind = units==='imperial' ? 'mph' : 'm/s';

    return {
      summary: {
        units,
        total: toUnit(totalKg),
        windEq: toUnit(windKgf),
        DF: DFv,
        HM, AF, Edd
      },
      shares: {
        verticalShares: verticalShares ? {
          A: toUnit(verticalShares.A), B: toUnit(verticalShares.B)
        } : null,
        cranes: cranes ? {
          A: toUnit(cranes.A_kg), B: toUnit(cranes.B_kg)
        } : null
      },
      legs: checks,
      unitsLabel: {uMass, uArea, uWind}
    };
  }

  // Wire up UI
  document.addEventListener('submit', (e)=>{
    if (e.target.id !== 'calc-form') return;
    e.preventDefault();

    // Read inputs
    const val = id => parseFloat(document.getElementById(id).value);
    const sval = id => document.getElementById(id).value;

    const inputs = {
      units: sval('units'),
      load: val('load'),
      rigWeight: val('rigWeight'),
      legs: parseInt(sval('legs'),10),
      hitch: sval('hitch'),
      angle: val('angle'),
      chokerRed: val('chokerRed'),
      Dd: val('Dd'),
      DF: val('DF'),
      area: val('area'),
      wind: val('wind'),
      d1: val('d1'),
      d2: val('d2'),
      shareA: val('shareA'),
      shareB: val('shareB'),
      targetWLL: val('targetWLL')
    };

    const out = compute(inputs);

    // Render results
    const res = document.getElementById('results');
    const s = out.summary, sh = out.shares;
    const sumEl = document.getElementById('res-summary');
    sumEl.innerHTML = `
      <div class="grid">
        <div><b>Total (incl. rigging):</b> ${s.total.toFixed(2)} ${out.unitsLabel.uMass}</div>
        <div><b>Wind equiv. weight:</b> ${s.windEq.toFixed(2)} ${out.unitsLabel.uMass}</div>
        <div><b>Dynamic Factor (DF):</b> ${s.DF.toFixed(2)}</div>
        <div><b>Hitch Multiplier (HM):</b> ${s.HM.toFixed(2)}</div>
        <div><b>Angle Factor (AF):</b> ${s.AF===Infinity?'∞':s.AF.toFixed(3)}</div>
        <div><b>D/d Efficiency:</b> ${s.Edd.toFixed(2)}</div>
      </div>
      ${sh.verticalShares ? `<div style="margin-top:8px"><b>COG Vertical Shares:</b> A=${sh.verticalShares.A.toFixed(2)} ${out.unitsLabel.uMass}, B=${sh.verticalShares.B.toFixed(2)} ${out.unitsLabel.uMass}</div>`:''}
      ${sh.cranes ? `<div><b>Multi-crane Load (with DF):</b> A=${sh.cranes.A.toFixed(2)} ${out.unitsLabel.uMass}, B=${sh.cranes.B.toFixed(2)} ${out.unitsLabel.uMass}</div>`:''}
    `;

    const legsEl = document.getElementById('res-legs');
    legsEl.innerHTML = out.legs.map(L=>{
      const pf = (L.pass===null) ? '' : (L.pass ? '✅ OK' : '⚠️ OVER');
      return `<div>${L.label}: <b>${L.req.toFixed(2)} ${out.unitsLabel.uMass}</b> ${pf}</div>`;
    }).join('');

    const warnEl = document.getElementById('res-warnings');
    const warnings = [];
    if (s.AF>2) warnings.push('Very steep sling angle — tension grows rapidly. Consider increasing angle or using spreader.');
    if (s.Edd<1) warnings.push('D/d ratio reduces capacity. Verify manufacturer’s sheave requirements.');
    if (!document.getElementById('targetWLL').value) warnings.push('Enter a Target WLL per leg to see Pass/Fail.');
    warnEl.innerHTML = warnings.length ? warnings.map(w=>`<div style="color:#ffb703">⚠️ ${w}</div>`).join('') : `<div style="color:#28c76f">No warnings at this time.</div>`;

    res.style.display = 'block';
  });

  // Print/PDF
  document.addEventListener('click',(e)=>{
    if (e.target && e.target.id==='printPdf') {
      window.print();
    }
  });
})();


if('serviceWorker'in navigator){window.addEventListener('load',()=>navigator.serviceWorker.register('/sw.js'));}
