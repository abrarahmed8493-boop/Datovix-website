// DATOVIX website frontend. Add your Supabase Project URL and publishable/anon key below.
// Never put a Supabase service_role or secret key in browser JavaScript.
const SUPABASE_URL = "YOUR_SUPABASE_PROJECT_URL";
const SUPABASE_ANON_KEY = "YOUR_SUPABASE_PUBLISHABLE_OR_ANON_KEY";
const hasSupabaseConfig = SUPABASE_URL.startsWith("https://") && !SUPABASE_URL.includes("YOUR_") && !SUPABASE_ANON_KEY.includes("YOUR_");
const db = hasSupabaseConfig && window.supabase ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;

const services = [
 ["▦","Excel Dashboard Development","Turn spreadsheets into clear, interactive reports that make key metrics easy to monitor."],
 ["▤","Power BI Dashboard Development","Connect your business data and explore performance through interactive visual dashboards."],
 ["↗","Sales and Revenue Analytics","Understand sales trends, revenue drivers, product performance and growth opportunities."],
 ["▣","Inventory and Stock Analysis","Monitor stock movement, identify slow-moving items and improve inventory visibility."],
 ["⚙","Production Analytics","Track output, production trends, operational performance and potential bottlenecks."],
 ["◎","Customer Behaviour Analysis","Explore customer patterns, buying behaviour and retention opportunities."],
 ["◫","Business Performance Reporting","Bring important business KPIs together in consistent, easy-to-read reports."],
 ["⌁","Data Cleaning and Transformation","Prepare inconsistent data for reliable analysis and reporting."],
 ["⟳","Automated Reporting Solutions","Reduce repetitive manual reporting with structured, repeatable workflows."]
];
const serviceGrid=document.getElementById("serviceGrid");
serviceGrid.innerHTML=services.map(([icon,title,desc])=>`<article class="service-card"><div class="service-icon">${icon}</div><h3>${title}</h3><p>${desc}</p><a href="#enquiry" data-service="${title}">Discuss this service ↗</a></article>`).join("");
const serviceChecks=document.getElementById("serviceChecks");
serviceChecks.innerHTML=services.map(([,title])=>`<label><input type="checkbox" name="services" value="${title}"> ${title}</label>`).join("");
serviceGrid.addEventListener("click",e=>{const link=e.target.closest("[data-service]");if(!link)return;const checkbox=[...document.querySelectorAll('input[name="services"]')].find(x=>x.value===link.dataset.service);if(checkbox)checkbox.checked=true;});
document.getElementById("menuToggle").addEventListener("click",()=>document.getElementById("mainNav").classList.toggle("open"));
document.querySelectorAll("#mainNav a").forEach(a=>a.addEventListener("click",()=>document.getElementById("mainNav").classList.remove("open")));

const form=document.getElementById("enquiryForm"), message=document.getElementById("formMessage");
form.addEventListener("submit",async e=>{
 e.preventDefault(); message.className="form-message"; message.textContent="";
 const fd=new FormData(form);
 const chosen=fd.getAll("services");
 if(!chosen.length){message.className="form-message error";message.textContent="Please select at least one service.";return;}
 const file=form.elements.attachment.files[0];
 if(file && file.size>5*1024*1024){message.className="form-message error";message.textContent="Please upload a file smaller than 5 MB.";return;}
 const submit=form.querySelector("button[type=submit]");submit.disabled=true;submit.textContent="Submitting…";
 try{
   if(!db) throw new Error("The website database is not configured yet. Please add your Supabase URL and publishable key in app.js.");
   let filePath=null;
   if(file){
     const safeName=file.name.replace(/[^a-zA-Z0-9._-]/g,"_");
     filePath=`${crypto.randomUUID()}/${safeName}`;
     const {error:uploadError}=await db.storage.from("enquiry-files").upload(filePath,file,{upsert:false});
     if(uploadError)throw uploadError;
   }
   const payload={
     full_name:fd.get("full_name").trim(),company_name:fd.get("company_name").trim()||null,
     email:fd.get("email").trim().toLowerCase(),phone:fd.get("phone").trim()||null,
     industry:fd.get("industry")||null,company_size:fd.get("company_size")||null,
     services:chosen,data_method:fd.get("data_method")||null,budget:fd.get("budget")||null,
     description:fd.get("description").trim(),attachment_path:filePath,
     contact_method:fd.get("contact_method"),consent:true,status:"New"
   };
   const {data,error}=await db.from("enquiries").insert(payload).select("reference_code").single();
   if(error)throw error;
   message.className="form-message success";
   message.textContent=`Thank you. Your enquiry was received. Reference: ${data.reference_code}.`;
   form.reset();
 }catch(err){
   message.className="form-message error";
   message.textContent=err.message||"Something went wrong. Please email abrarahmed8493@gmail.com.";
 }finally{submit.disabled=false;submit.innerHTML='Submit Enquiry <b>↗</b>';}
});
