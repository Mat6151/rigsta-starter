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
// Load Calculator Logic
document.addEventListener('submit', e => {
  if (e.target.id === 'calc-form') {
    e.preventDefault();
    const total = parseFloat(document.getElementById('total-load').value);
    const legs = parseInt(document.getElementById('legs').value);
    const angle = parseFloat(document.getElementById('angle').value);

    if (!total || !legs || !angle) return;

    const radians = angle * Math.PI / 180;
    const angleFactor = 1 / Math.cos(radians);
    const perLeg = (total / legs) * angleFactor;

    document.getElementById('angle-factor').textContent = angleFactor.toFixed(2);
    document.getElementById('load-per-leg').textContent = perLeg.toFixed(0);
    const warning = document.getElementById('warning');
    warning.textContent = perLeg > 1000 ? '⚠️ Over recommended SWL (1000 kg per leg)' : '';
    document.getElementById('calc-result').style.display = 'block';
  }
});

// Basic PDF export using browser print
document.addEventListener('click', e => {
  if (e.target.id === 'pdf-btn') {
    window.print();
  }
});

if('serviceWorker'in navigator){window.addEventListener('load',()=>navigator.serviceWorker.register('/sw.js'));}
