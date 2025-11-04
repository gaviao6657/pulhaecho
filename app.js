// Main app script - uses Firebase Firestore and Supabase Storage
import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.5.0/firebase-app.js';
import { getAuth, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/12.5.0/firebase-auth.js';
import { getFirestore, collection, getDocs, doc, getDoc, setDoc, updateDoc } from 'https://www.gstatic.com/firebasejs/12.5.0/firebase-firestore.js';
const firebaseConfig = {"apiKey": "AIzaSyDaY10T--JVF6Py9LemZjNNHJPNvQ2ipaA", "authDomain": "pulhaecho.firebaseapp.com", "projectId": "pulhaecho", "storageBucket": "pulhaecho.firebasestorage.app", "messagingSenderId": "1034735567733", "appId": "1:1034735567733:web:6f8e8801f0a38548f93050"};
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
let supabaseClient = null;
if(window.supabase) supabaseClient = window.supabase;
// Load design
async function loadDesign(){
  try{
    const dref = doc(db,'design','main');
    const snap = await getDoc(dref);
    if(snap && snap.exists()){
      const data=snap.data();
      if(data.cover) document.getElementById('cover-img').src=data.cover;
      if(data.bg) document.body.style.backgroundImage = 'url('+data.bg+')';
    }
  }catch(e){console.warn('design',e.message);}
}
// Load categories
async function loadCategories(){
  const snap = await getDocs(collection(db,'categories'));
  const sel = document.getElementById('category-select'); sel.innerHTML='';
  snap.forEach(d=>{ sel.innerHTML += '<option value="'+d.data().name+'">'+d.data().name+'</option>'; });
}
// Render beats
async function renderBeats(){
  const cat = document.getElementById('category-select').value;
  const grid = document.getElementById('beat-grid'); grid.innerHTML='Loading...';
  const snap = await getDocs(collection(db,'beats'));
  const arr = []; snap.forEach(d=>{ const data=d.data(); data._id=d.id; arr.push(data); });
  const filtered = arr.filter(b=>b.category===cat);
  grid.innerHTML='';
  filtered.forEach(b=>{
    const card=document.createElement('div'); card.className='beat-card';
    const img=document.createElement('img'); img.className='beat-thumb'; img.src=b.thumb||'https://via.placeholder.com/120';
    const inner=document.createElement('div');
    inner.innerHTML='<h3>'+b.title+'</h3><p>'+b.desc+'</p><p><b>'+b.price+'€</b></p>';
    const waveId = 'wave-'+b._id; const waveDiv=document.createElement('div'); waveDiv.id=waveId; waveDiv.style.height='60px'; inner.appendChild(waveDiv);
    const buy = document.createElement('a'); buy.className='btn'; buy.href=b.buy||'#'; buy.target='_blank'; buy.innerText='Buy';
    const dl = document.createElement('button'); dl.className='primary'; dl.innerText='Download'; dl.onclick=()=>downloadSingle(b);
    inner.appendChild(buy); inner.appendChild(dl);
    card.appendChild(img); card.appendChild(inner); grid.appendChild(card);
    const ws = WaveSurfer.create({ container:'#'+waveId, waveColor:'#ddd', progressColor:'#ffb300', height:60, barWidth:2 });
    ws.load(b.url);
    ws.on('play',()=>{ incrementStat('plays', b._id); });
  });
}
async function incrementStat(type,id){
  try{ const sref=doc(db,'stats',id); const snap=await getDoc(sref); if(snap.exists()){ const data=snap.data(); const obj={}; obj[type]=(data[type]||0)+1; await updateDoc(sref,obj); } else { await setDoc(sref,{ plays:0,views:0,downloads:0, [type]:1 }); } }catch(e){console.warn(e.message);}
}
async function downloadSingle(b){
  try{
    const res = await fetch(b.url); const blob = await res.blob();
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = b.title+'.mp3'; document.body.appendChild(a); a.click(); a.remove();
    await incrementStat('downloads', b._id);
  }catch(e){ alert('Download failed: '+e.message); }
}
document.getElementById('refresh').onclick = ()=>renderBeats();
document.getElementById('download-pack').onclick = ()=>{ (async ()=>{ await downloadPackOfCategory(); })(); };
async function downloadPackOfCategory(){
  const cat = document.getElementById('category-select').value;
  const snap = await getDocs(collection(db,'beats')); const arr=[]; snap.forEach(d=>{ const data=d.data(); data._id=d.id; arr.push(data); });
  const filtered = arr.filter(b=>b.category===cat);
  if(filtered.length===0) return alert('No beats');
  const zip = new JSZip(); const folder = zip.folder(cat.replace(/\s+/g,'_'));
  for(const b of filtered){ const res = await fetch(b.url); const blob = await res.blob(); folder.file(b.title+'.mp3', blob); await incrementStat('downloads', b._id); }
  const content = await zip.generateAsync({type:'blob'});
  const a = document.createElement('a'); a.href = URL.createObjectURL(content); a.download = cat+'_pack.zip'; document.body.appendChild(a); a.click(); a.remove();
}
async function init(){ await loadDesign(); await loadCategories(); await renderBeats(); }
init();
