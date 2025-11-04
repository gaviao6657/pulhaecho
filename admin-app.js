import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged, createUserWithEmailAndPassword } from 'https://www.gstatic.com/firebasejs/12.5.0/firebase-auth.js';
import { getFirestore, collection, addDoc, getDocs, doc, setDoc, deleteDoc, getDoc } from 'https://www.gstatic.com/firebasejs/12.5.0/firebase-firestore.js';

const auth = window._firebase.auth;
const db = window._firebase.db;
const supabase = window._supabase;

async function uploadToSupabase(file, folder){
  const name = Date.now() + "-" + (file.name || "file");
  const path = `${folder}/${name}`;
  const { data, error } = await supabase.storage.from('beats').upload(path, file, { cacheControl: '3600', upsert: false });
  if(error) throw error;
  const publicUrl = supabase.storage.from('beats').getPublicUrl(path).data.publicUrl;
  return publicUrl;
}

document.getElementById('login-btn').onclick = async ()=>{
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  try{ await signInWithEmailAndPassword(auth, email, password); }catch(e){ document.getElementById('auth-msg').innerText = 'Login error: '+e.message; }
};

document.getElementById('logout-btn').onclick = async ()=>{ await signOut(auth); };
document.getElementById('create-admin').onclick = async ()=>{ const email=document.getElementById('email').value; const password=document.getElementById('password').value; try{ await createUserWithEmailAndPassword(auth,email,password); document.getElementById('auth-msg').innerText='Admin created. Now login.'; }catch(e){ document.getElementById('auth-msg').innerText='Create error: '+e.message; } };

onAuthStateChanged(auth, user=>{ if(user) loadAdminData(); else console.log('not logged'); });

async function saveDesign(){
  let coverFile = document.getElementById('cover-file').files[0];
  let bgFile = document.getElementById('bg-file').files[0];
  let coverUrl = document.getElementById('cover-url').value;
  let bgUrl = document.getElementById('bg-url').value;
  try{
    if(coverFile) coverUrl = await uploadToSupabase(coverFile,'covers');
    if(bgFile) bgUrl = await uploadToSupabase(bgFile,'backgrounds');
    await setDoc(doc(db,'design','main'), { cover: coverUrl||'', bg: bgUrl||'' });
    document.getElementById('design-msg').innerText='Design saved.';
  }catch(e){ document.getElementById('design-msg').innerText = 'Design error: '+e.message; }
}
document.getElementById('save-design').onclick = saveDesign;

async function loadCategories(){
  const snap = await getDocs(collection(db,'categories'));
  const list=document.getElementById('cat-list'); const sel=document.getElementById('beat-cat'); list.innerHTML=''; sel.innerHTML='';
  snap.forEach(d=>{ const name=d.data().name; const li=document.createElement('li'); li.innerText=name; list.appendChild(li); const opt=document.createElement('option'); opt.value=name; opt.innerText=name; sel.appendChild(opt); });
}
document.getElementById('add-cat').onclick = async ()=>{ const name=document.getElementById('new-cat').value; if(!name) return alert('Enter name'); await addDoc(collection(db,'categories'), { name }); await loadCategories(); };

async function loadBeatsList(){
  const snap = await getDocs(collection(db,'beats')); const ul=document.getElementById('beats-list'); ul.innerHTML='';
  snap.forEach(d=>{ const data=d.data(); const li=document.createElement('li'); li.innerHTML=`${data.title} [${data.category}] <button onclick="window.deleteBeat('${d.id}')">Delete</button>`; ul.appendChild(li); });
}

window.deleteBeat = async function(id){ await deleteDoc(doc(db,'beats',id)); await loadBeatsList(); };

document.getElementById('add-beat-btn').onclick = async ()=>{
  const title=document.getElementById('beat-title').value; const desc=document.getElementById('beat-desc').value; const price=document.getElementById('beat-price').value||0;
  const category=document.getElementById('beat-cat').value; const gumlink=document.getElementById('gum-link').value;
  let thumbUrl=document.getElementById('thumb-url').value; let mp3Url=document.getElementById('mp3-url').value;
  const thumbFile=document.getElementById('thumb-file').files[0]; const mp3File=document.getElementById('mp3-file').files[0];
  try{ if(thumbFile) thumbUrl=await uploadToSupabase(thumbFile,'thumbnails'); if(mp3File) mp3Url=await uploadToSupabase(mp3File,'mp3s'); await addDoc(collection(db,'beats'), { title, desc, price, category, thumb:thumbUrl||'', url:mp3Url||'', buy:gumlink||'' }); await loadBeatsList(); alert('Beat added'); }catch(e){ alert('Error: '+e.message); }
};

document.getElementById('create-pack-btn').onclick = async ()=>{ const name=document.getElementById('pack-name').value; await addDoc(collection(db,'packs'), { name, beats:[] }); loadPacks(); };

async function loadPacks(){ const snap = await getDocs(collection(db,'packs')); const ul=document.getElementById('packs-list'); ul.innerHTML=''; snap.forEach(d=>{ const data=d.data(); const li=document.createElement('li'); li.innerText=data.name + ' ('+(data.beats||[]).length+' items)'; ul.appendChild(li); }); }

document.getElementById('refresh-stats').onclick = async ()=>{ const snap=await getDocs(collection(db,'stats')); let out=''; snap.forEach(d=>{ out+=JSON.stringify(d.data())+'\n'; }); document.getElementById('stats-output').innerText=out; };

async function loadAdminData(){ await loadCategories(); await loadBeatsList(); await loadPacks(); }
