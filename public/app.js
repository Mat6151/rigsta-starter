const app=document.getElementById('app');
document.getElementById('year').textContent=new Date().getFullYear();
const views={
  home:()=>`<section class="card"><h2>Welcome to Rigsta</h2><p>Free starter app.</p></section>`,
  tools:()=>`<section class="card"><h2>Load Calculator</h2><p>Demo calculator here.</p></section>`,
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
