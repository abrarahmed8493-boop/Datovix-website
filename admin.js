// Uses the same public Supabase browser credentials as app.js. RLS protects the data.
const SUPABASE_URL="YOUR_SUPABASE_PROJECT_URL";
const SUPABASE_ANON_KEY="YOUR_SUPABASE_PUBLISHABLE_OR_ANON_KEY";
const client=SUPABASE_URL.startsWith("https://")&&!SUPABASE_URL.includes("YOUR_")&&!SUPABASE_ANON_KEY.includes("YOUR_")?window.supabase.createClient(SUPABASE_URL,SUPABASE_ANON_KEY):null;
const $=id=>document.getElementById(id);let rows=[];
function note(el,text,kind="error"){el.className=`form-message ${kind}`;el.textContent=text;}
async function refresh(){
 const {data,error}=await client.from("enquiries").select("*").order("created_at",{ascending:false});
 if(error){note($("adminMessage"),error.message);return;}rows=data||[];
 $("totalCount").textContent=rows.length;$("newCount").textContent=rows.filter(x=>x.status==="New").length;$("convertedCount").textContent=rows.filter(x=>x.status==="Converted").length;render();
}
function render(){
 const q=$("searchInput").value.toLowerCase(),s=$("statusFilter").value;
 const filtered=rows.filter(r=>(!s||r.status===s)&&[r.full_name,r.company_name,r.email,r.reference_code].join(" ").toLowerCase().includes(q));
 $("enquiryRows").innerHTML=filtered.length?filtered.map(r=>`<tr><td><b>${esc(r.reference_code)}</b><small>${new Date(r.created_at).toLocaleString()}</small></td><td>${esc(r.full_name)}<small>${esc(r.company_name||"")}</small><small>${esc(r.email)}</small></td><td>${esc((r.services||[]).join(", "))}</td><td>${esc(r.industry||"—")}</td><td><select data-status="${r.id}">${["New","Contacted","In Discussion","Converted","Rejected"].map(x=>`<option ${r.status===x?"selected":""}>${x}</option>`).join("")}</select></td><td><button class="small-action" data-detail="${r.id}">View</button></td></tr>`).join(""):'<tr><td colspan="6">No enquiries found.</td></tr>';
}
function esc(v){return String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
$("loginForm").addEventListener("submit",async e=>{e.preventDefault();if(!client){note($("loginMessage"),"Configure Supabase URL and publishable key in admin.js.");return;}const fd=new FormData(e.currentTarget);const {error}=await client.auth.signInWithPassword({email:fd.get("email"),password:fd.get("password")});if(error){note($("loginMessage"),error.message);return;}await showDashboard();});
async function showDashboard(){const {data:{user}}=await client.auth.getUser();if(!user)return;$("loginPanel").hidden=true;$("dashboardPanel").hidden=false;await refresh();}
$("logoutButton").addEventListener("click",async()=>{await client.auth.signOut();$("dashboardPanel").hidden=true;$("loginPanel").hidden=false;});
$("searchInput").addEventListener("input",render);$("statusFilter").addEventListener("change",render);
$("enquiryRows").addEventListener("change",async e=>{const id=e.target.dataset.status;if(!id)return;const {error}=await client.from("enquiries").update({status:e.target.value}).eq("id",id);if(error){note($("adminMessage"),error.message);return;}await refresh();});
$("enquiryRows").addEventListener("click",async e=>{const id=e.target.dataset.detail;if(!id)return;const r=rows.find(x=>x.id===id);let extra=`Reference: ${r.reference_code}\nName: ${r.full_name}\nCompany: ${r.company_name||""}\nEmail: ${r.email}\nPhone: ${r.phone||""}\nIndustry: ${r.industry||""}\nServices: ${(r.services||[]).join(", ")}\nBudget: ${r.budget||""}\nDescription: ${r.description}\nStatus: ${r.status}`;if(r.attachment_path){const {data,error}=await client.storage.from("enquiry-files").createSignedUrl(r.attachment_path,60);if(!error&&data?.signedUrl)extra+="\n\nAttachment download link (valid 60 seconds):\n"+data.signedUrl;}alert(extra);});
$("exportButton").addEventListener("click",()=>{const cols=["reference_code","created_at","full_name","company_name","email","phone","industry","company_size","services","budget","description","status"];const csv=[cols.join(","),...rows.map(r=>cols.map(k=>'"'+String(Array.isArray(r[k])?r[k].join("; "):r[k]??"").replace(/"/g,'""')+'"').join(","))].join("\n");const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([csv],{type:"text/csv"}));a.download="datovix-enquiries.csv";a.click();URL.revokeObjectURL(a.href);});
if(client){client.auth.getSession().then(({data})=>{if(data.session)showDashboard();});}
