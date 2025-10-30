const app=document.getElementById('app');
document.getElementById('year').textContent=new Date().getFullYear();
const views={
  home:()=>`<section class="card"><h2>Welcome to Rigsta</h2><p>Free starter app.</p></section>`,
  tools: () => `
  <section class="card">
    <h2>Load Calculator</h2>
    <form id="calc-form" class="grid">
      <div>
        <label>Total Load (kg)</label>
        <input type="number" id="total-load" placeholder="e.g. 2000" required>
      </div>
      <div>
        <label>Number of Legs</label>
        <select id="legs">
          <option value="2">2</option>
          <option value="3">3</option>
          <option value="4">4</option>
        </select>
      </div>
      <div>
        <label>Sling Angle (° from horizontal)</label>
        <input type="number" id="angle" placeholder="e.g. 45" required>
      </div>
      <button type="submit" class="btn-primary">Calculate</button>
    </form>

    <div id="calc-result" class="card" style="margin-top:16px; display:none;">
      <h3>Results</h3>
      <p><strong>Angle Factor:</strong> <span id="angle-factor"></span></p>
      <p><strong>Load per Leg:</strong> <span id="load-per-leg"></span> kg</p>
      <p id="warning" style="color:#ffb703;font-weight:bold;"></p>
      <button id="pdf-btn" class="btn-primary">Download PDF Report</button>
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
if('serviceWorker'in navigator){window.addEventListener('load',()=>navigator.serviceWorker.register('/sw.js'));}
