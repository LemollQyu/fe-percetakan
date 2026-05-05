(()=>{var e={};e.id=576,e.ids=[576],e.modules={2934:e=>{"use strict";e.exports=require("next/dist/client/components/action-async-storage.external.js")},4580:e=>{"use strict";e.exports=require("next/dist/client/components/request-async-storage.external.js")},5869:e=>{"use strict";e.exports=require("next/dist/client/components/static-generation-async-storage.external.js")},399:e=>{"use strict";e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},4352:(e,t,a)=>{"use strict";a.r(t),a.d(t,{GlobalError:()=>i.a,__next_app__:()=>u,originalPathname:()=>c,pages:()=>p,routeModule:()=>h,tree:()=>d}),a(712),a(6072),a(2029),a(5866);var n=a(3191),r=a(8716),s=a(7922),i=a.n(s),o=a(5231),l={};for(let e in o)0>["default","tree","pages","GlobalError","originalPathname","__next_app__","routeModule"].indexOf(e)&&(l[e]=()=>o[e]);a.d(t,l);let d=["",{children:["admin",{children:["queue",{children:["__PAGE__",{},{page:[()=>Promise.resolve().then(a.bind(a,712)),"C:\\Users\\USER\\Desktop\\annnss\\fe-management-percetakan-main\\src\\app\\admin\\queue\\page.tsx"]}]},{}]},{layout:[()=>Promise.resolve().then(a.bind(a,6072)),"C:\\Users\\USER\\Desktop\\annnss\\fe-management-percetakan-main\\src\\app\\admin\\layout.tsx"]}]},{layout:[()=>Promise.resolve().then(a.bind(a,2029)),"C:\\Users\\USER\\Desktop\\annnss\\fe-management-percetakan-main\\src\\app\\layout.tsx"],"not-found":[()=>Promise.resolve().then(a.t.bind(a,5866,23)),"next/dist/client/components/not-found-error"]}],p=["C:\\Users\\USER\\Desktop\\annnss\\fe-management-percetakan-main\\src\\app\\admin\\queue\\page.tsx"],c="/admin/queue/page",u={require:a,loadChunk:()=>Promise.resolve()},h=new n.AppPageRouteModule({definition:{kind:r.x.APP_PAGE,page:"/admin/queue/page",pathname:"/admin/queue",bundlePath:"",filename:"",appPaths:[]},userland:{loaderTree:d}})},7017:(e,t,a)=>{Promise.resolve().then(a.bind(a,6948))},8580:(e,t,a)=>{"use strict";a.d(t,{vO:()=>c,LV:()=>o,gK:()=>d,FU:()=>p,ze:()=>r,YU:()=>i,AU:()=>s.A,QL:()=>u,c6:()=>l});var n=a(8069);async function r(e){let{token:t,status:a,page:r=1,limit:s=10}=e,i=new URLSearchParams;a&&i.set("status",a),i.set("page",String(r)),i.set("limit",String(s));let o=i.toString(),l=`/api/v1/i/my-orders${o?`?${o}`:""}`;return(0,n.u2)(l,{method:"GET",token:t})}var s=a(5798);async function i(e){let{code:t,token:a}=e,r=`/api/v1/i/order?code=${encodeURIComponent(t)}`;return(0,n.u2)(r,{method:"GET",token:a})}async function o(e,t){let a=`order_${Math.random().toString(36).substring(2,10).toUpperCase()}_${Date.now()}`;return(0,n.u2)("/api/v1/i/order",{method:"POST",body:JSON.stringify(e),token:t,headers:{"Idempotency-Key":a}})}async function l({order_id:e,file:t,token:a}){let r=new FormData;return r.append("file_order",t),console.log("FormData entries:"),r.forEach((e,t)=>{console.log(t,e)}),(0,n.u2)(`/api/v1/i/upload-file/order/${e}`,{method:"POST",body:r,token:a})}async function d({code:e,token:t}){return(0,n.u2)(`/api/v1/i/order-not-file/${e}`,{method:"DELETE",token:t})}async function p({code_order:e,token:t}){return(0,n.u2)(`/api/v1/admin/order/${e}/finished`,{method:"POST",token:t})}async function c({code:e,token:t}){return(0,n.u2)(`/api/v1/i/order/${e}/completed`,{method:"POST",token:t})}async function u(e){let{token:t,type:a,date:r,page:s=1,limit:i=10}=e,o=new URLSearchParams;o.set("type",a),o.set("date",r),o.set("page",String(s)),o.set("limit",String(i));let l=`/api/v1/admin/reports?${o.toString()}`;return(0,n.u2)(l,{method:"GET",token:t})}},6948:(e,t,a)=>{"use strict";a.r(t),a.d(t,{default:()=>h});var n=a(326),r=a(7577),s=a(8580),i=a(6208),o=a(5047);let l="http://localhost:8082",d=process.env.NEXT_PUBLIC_WS_URL||"ws://localhost:8082";async function p(e,t,a){await fetch(`${l}/api/v1/admin/order/${t}/timer/${e}`,{method:"POST",headers:{Authorization:`Bearer ${a}`}})}async function c(e,t,a){await fetch(`${l}/api/v1/admin/order/${e}/timer/add`,{method:"POST",headers:{Authorization:`Bearer ${a}`,"Content-Type":"application/json"},body:JSON.stringify({add_seconds:t})})}function u(e){if(e<=0)return"00:00";let t=Math.floor(e/3600),a=String(Math.floor(e%3600/60)).padStart(2,"0"),n=String(e%60).padStart(2,"0");return t>0?`${t}:${a}:${n}`:`${a}:${n}`}function h(){let[e,t]=(0,r.useState)("antrian"),[a,l]=(0,r.useState)([]),[h,x]=(0,r.useState)([]),[m,f]=(0,r.useState)(""),[b,g]=(0,r.useState)(null),[w,y]=(0,r.useState)(!1),j=(0,o.useRouter)(),[k,v]=(0,r.useState)({}),q=(0,r.useRef)({}),S=(0,r.useRef)({}),[N,_]=(0,r.useState)({}),[P,$]=(0,r.useState)(null),[C,z]=(0,r.useState)(null),[D,U]=(0,r.useState)(""),T=async()=>{y(!0);let e=(0,i.LP)();if(!e){y(!1);return}let[t,a]=await Promise.all([(0,s.AU)({status:"Paid",page:1,limit:50,token:e}),(0,s.AU)({status:"On_progress",page:1,limit:50,token:e})]),n=(e,t)=>new Date(e.updated_at).getTime()-new Date(t.updated_at).getTime();l(t.data.sort(n)),x(a.data.sort(n)),y(!1)},M=e=>{if(q.current[e])return;let t=new WebSocket(`${d}/ws/orders/${e}`);q.current[e]=t,t.onmessage=t=>{E(e,JSON.parse(t.data))},t.onerror=()=>console.error(`WS error for ${e}`),t.onclose=()=>{delete q.current[e]}},E=(e,t)=>{let a={status:t.timer_status,remainingSeconds:t.remaining_seconds,startedAt:t.started_at};v(t=>({...t,[e]:a})),"running"===t.timer_status?L(e,t.remaining_seconds,t.started_at):(R(e),_(a=>({...a,[e]:t.remaining_seconds})))},L=(e,t,a)=>{R(e);let n=a?new Date(a).getTime():Date.now(),r=()=>{let a=Math.max(t-Math.floor((Date.now()-n)/1e3),0);_(t=>({...t,[e]:a}))};r(),S.current[e]=setInterval(r,1e3)},R=e=>{S.current[e]&&(clearInterval(S.current[e]),delete S.current[e])},A=async()=>{if(!P)return;let e=(0,i.LP)();e&&(M(P),await p("start",P,e),$(null))},O=async()=>{if(!C)return;let e=(0,i.LP)();if(!e)return;let t=60*parseInt(D);t&&!(t<=0)&&(await c(C,t,e),z(null),U(""))},I=("antrian"===e?a:h).filter(e=>`${e.user.name} ${e.order_code.code} ${e.service_name_snapshot}`.toLowerCase().includes(m.toLowerCase())),B=e=>{let t=new Date(e);return{date:t.toLocaleDateString("id-ID",{day:"2-digit",month:"short",year:"numeric"}),time:t.toLocaleTimeString("id-ID",{hour:"2-digit",minute:"2-digit"})}},F=e=>{t(e),f(""),g(null)},G=e=>{if(!e||e<=0)return"-";let t=Math.floor(e/60),a=e%60;return 0===t?`${a}m`:0===a?`${t}h`:`${t}h ${a}m`},W=e=>{let t=e.order_code.code,a=k[t],r=N[t];if(!a||"idle"===a.status)return n.jsx("span",{style:{fontFamily:"monospace",fontSize:"11px",color:"#6366f1"},children:G(e.estimated_duration)});let s=r??a.remainingSeconds,i=s<=60;return"paused"===a.status?(0,n.jsxs)("span",{title:"Klik untuk tambah durasi",onClick:()=>{z(t),U("")},style:{fontFamily:"monospace",fontSize:"12px",fontWeight:700,color:"#f59e0b",cursor:"pointer",textDecoration:"underline dotted",userSelect:"none"},children:[u(s)," ⏸"]}):n.jsx("span",{style:{fontFamily:"monospace",fontSize:"12px",fontWeight:700,color:i?"#ef4444":"#10b981",animation:i?"pulse 1s infinite":void 0},children:u(s)})};return(0,n.jsxs)(n.Fragment,{children:[n.jsx("style",{children:`
        .queue-wrap {
          font-family: system-ui, sans-serif;
          padding: 24px;
          max-width: 1280px;
          margin: 0 auto;
        }
        .queue-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 16px;
          flex-wrap: wrap;
          gap: 12px;
        }
        .queue-title { display: flex; align-items: center; gap: 10px; }
        .queue-title-icon {
          width: 36px; height: 36px; background: black;
          border-radius: 10px; display: flex;
          align-items: center; justify-content: center;
        }
        .queue-title-icon svg {
          width: 18px; height: 18px; fill: none;
          stroke: #fff; stroke-width: 1.8;
          stroke-linecap: round; stroke-linejoin: round;
        }
        .queue-title h1 {
          font-size: 17px; font-weight: 600; color: #111;
          letter-spacing: -0.3px; margin: 0;
        }
        .queue-title span { font-size: 11px; color: #666; display: block; margin-top: 1px; }
        .queue-controls { display: flex; align-items: center; gap: 8px; }
        .btn-refresh {
          display: flex; align-items: center; gap: 6px;
          padding: 7px 14px; background: black; color: #fff;
          border: none; border-radius: 8px;
          font-family: system-ui, sans-serif; font-size: 12px;
          font-weight: 500; cursor: pointer; transition: all 0.2s; white-space: nowrap;
        }
        .btn-refresh:hover:not(:disabled) { background: #333; transform: translateY(-1px); box-shadow: 0 4px 12px rgba(0,0,0,0.18); }
        .btn-refresh:disabled { opacity: 0.5; cursor: not-allowed; }
        .btn-refresh svg { width: 13px; height: 13px; stroke: currentColor; fill: none; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
        .btn-refresh.spinning svg { animation: spin 0.7s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.5; } }
        .search-wrap { position: relative; }
        .search-wrap svg { position: absolute; left: 10px; top: 50%; transform: translateY(-50%); width: 13px; height: 13px; stroke: #9ca3af; fill: none; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; pointer-events: none; }
        .search-input { font-family: system-ui, sans-serif; font-size: 12px; padding: 7px 12px 7px 30px; border: 1.5px solid #e5e7eb; border-radius: 8px; width: 220px; color: #111; background: #fff; transition: all 0.2s; outline: none; }
        .search-input::placeholder { color: #b0b5c9; }
        .search-input:focus { border-color: #111; box-shadow: 0 0 0 3px rgba(0,0,0,0.07); }
        .queue-tabs { display: flex; margin-bottom: 14px; border-bottom: 1.5px solid #e5e7eb; }
        .tab-btn { display: flex; align-items: center; gap: 6px; padding: 8px 16px; font-family: system-ui, sans-serif; font-size: 12px; font-weight: 500; color: #888; background: none; border: none; border-bottom: 2px solid transparent; margin-bottom: -1.5px; cursor: pointer; transition: all 0.15s; white-space: nowrap; }
        .tab-btn:hover { color: #111; }
        .tab-btn.active { color: #111; border-bottom-color: #111; }
        .tab-pill { font-size: 10px; font-weight: 600; padding: 1px 7px; border-radius: 20px; background: #f3f4f6; color: #666; transition: all 0.15s; }
        .tab-btn.active .tab-pill { background: #111; color: #fff; }
        .queue-badge { font-size: 11px; font-weight: 500; color: #444; background: #f3f4f6; border-radius: 6px; padding: 3px 8px; margin-bottom: 12px; display: inline-block; }
        .queue-table-wrap { border-radius: 14px; border: 1.5px solid #eaedf5; overflow: hidden; box-shadow: 0 2px 16px rgba(0,0,0,0.05); }
        .queue-table { width: 100%; border-collapse: collapse; font-size: 11.5px; table-layout: fixed; }
        .queue-table thead { background: black; }
        .queue-table thead th { padding: 10px 12px; text-align: left; font-size: 9.5px; font-weight: 500; letter-spacing: 0.8px; text-transform: uppercase; color: #fff; white-space: nowrap; }
        .queue-table thead th:first-child { width: 36px; text-align: center; }
        .queue-table tbody tr { border-bottom: 1px solid #f0f2f8; transition: background 0.15s; }
        .queue-table tbody tr:last-child { border-bottom: none; }
        .queue-table tbody tr:hover { background: #fafafa; }
        .queue-table tbody tr.selected { background: #f5f5f5; border-left: 3px solid #111; }
        .queue-table tbody tr.selected td:first-child { padding-left: 9px; }
        .queue-table td { padding: 9px 12px; color: #111; vertical-align: middle; word-break: break-word; white-space: normal; line-height: 1.5; }
        .td-no { text-align: center; font-family: monospace; font-size: 10px; font-weight: 500; color: #9ca3af; }
        .td-user { font-weight: 500; color: #111; word-break: break-word; white-space: normal; }
        .td-service { color: #444; word-break: break-word; white-space: normal; line-height: 1.5; }
        .td-amount { font-family: monospace; font-size: 11px; font-weight: 500; color: #111; white-space: nowrap; }
        .td-qty { font-family: monospace; font-size: 11px; text-align: center; color: #111; }
        .status-badge { display: inline-flex; align-items: center; gap: 4px; padding: 3px 8px; border-radius: 20px; font-size: 10px; font-weight: 500; white-space: nowrap; }
        .status-badge::before { content: ''; width: 5px; height: 5px; border-radius: 50%; display: inline-block; }
        .status-paid { background: #ecfdf5; color: #059669; }
        .status-paid::before { background: #10b981; }
        .status-progress { background: #eff6ff; color: #2563eb; }
        .status-progress::before { background: #3b82f6; }
        .td-code { font-family: monospace; font-size: 10.5px; font-weight: 500; color: #6366f1; letter-spacing: 0.3px; word-break: break-all; }
        .date-cell { display: flex; flex-direction: column; gap: 2px; }
        .date-cell .d-date { font-size: 10.5px; color: #111; font-weight: 500; white-space: nowrap; }
        .date-cell .d-time { font-family: monospace; font-size: 10px; color: #6b7280; white-space: nowrap; }
        .queue-table thead th:nth-child(1) { width: 36px; text-align: center; }
        .queue-table thead th:nth-child(2) { width: 140px; }
        .queue-table thead th:nth-child(3) { width: 200px; }
        .queue-table thead th:nth-child(4) { width: 120px; }
        .queue-table thead th:nth-child(5) { width: 44px; text-align: center; }
        .queue-table thead th:nth-child(6) { width: 110px; }
        .queue-table thead th:nth-child(7) { width: 130px; }
        .queue-table thead th:nth-child(8) { width: 110px; }
        .queue-table thead th:nth-child(9) { width: 110px; }
        .queue-table thead th:nth-child(10) { width: 100px; }
        .queue-table thead th:nth-child(11) { width: 150px; }
        .queue-empty { text-align: center; padding: 48px 24px; color: #9ca3af; }
        .queue-empty svg { width: 32px; height: 32px; stroke: #d1d5db; fill: none; stroke-width: 1.5; stroke-linecap: round; stroke-linejoin: round; margin: 0 auto 10px; display: block; }
        .queue-empty p { font-size: 13px; margin: 0; }

        /* POPUP OVERLAY */
        .popup-overlay {
          position: fixed; inset: 0; background: rgba(0,0,0,0.35);
          display: flex; align-items: center; justify-content: center;
          z-index: 9999; backdrop-filter: blur(2px);
        }
        .popup-box {
          background: #fff; border-radius: 16px;
          padding: 28px 28px 24px;
          box-shadow: 0 20px 60px rgba(0,0,0,0.18);
          min-width: 320px; max-width: 400px; width: 100%;
          animation: popIn 0.18s ease;
        }
        @keyframes popIn { from { transform: scale(0.92); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        .popup-title { font-size: 15px; font-weight: 700; color: #111; margin: 0 0 6px; }
        .popup-sub { font-size: 12px; color: #666; margin: 0 0 20px; line-height: 1.5; }
        .popup-actions { display: flex; gap: 8px; justify-content: flex-end; }
        .popup-btn-cancel { padding: 8px 16px; background: #f3f4f6; color: #444; border: none; border-radius: 8px; font-size: 12px; font-weight: 600; cursor: pointer; font-family: system-ui, sans-serif; }
        .popup-btn-ok { padding: 8px 16px; background: #111; color: #fff; border: none; border-radius: 8px; font-size: 12px; font-weight: 600; cursor: pointer; font-family: system-ui, sans-serif; }
        .popup-btn-ok:hover { background: #333; }
        .popup-input { width: 100%; box-sizing: border-box; padding: 9px 12px; border: 1.5px solid #e5e7eb; border-radius: 8px; font-size: 13px; font-family: system-ui, sans-serif; color: #111; outline: none; margin-bottom: 16px; }
        .popup-input:focus { border-color: #111; box-shadow: 0 0 0 3px rgba(0,0,0,0.07); }
      `}),P&&n.jsx("div",{className:"popup-overlay",onClick:()=>$(null),children:(0,n.jsxs)("div",{className:"popup-box",onClick:e=>e.stopPropagation(),children:[n.jsx("p",{className:"popup-title",children:"Ingin mengerjakan progress ini?"}),(0,n.jsxs)("p",{className:"popup-sub",children:["Timer akan mulai berjalan untuk order"," ",n.jsx("strong",{children:P}),". Pastikan sudah siap sebelum memulai."]}),(0,n.jsxs)("div",{className:"popup-actions",children:[n.jsx("button",{className:"popup-btn-cancel",onClick:()=>$(null),children:"Batal"}),n.jsx("button",{className:"popup-btn-ok",onClick:A,children:"Ya, Mulai"})]})]})}),C&&n.jsx("div",{className:"popup-overlay",onClick:()=>z(null),children:(0,n.jsxs)("div",{className:"popup-box",onClick:e=>e.stopPropagation(),children:[n.jsx("p",{className:"popup-title",children:"Tambah Durasi"}),(0,n.jsxs)("p",{className:"popup-sub",children:["Masukkan durasi tambahan (menit) untuk order"," ",n.jsx("strong",{children:C}),"."]}),n.jsx("input",{className:"popup-input",type:"number",min:1,placeholder:"Contoh: 30",value:D,onChange:e=>U(e.target.value),autoFocus:!0}),(0,n.jsxs)("div",{className:"popup-actions",children:[n.jsx("button",{className:"popup-btn-cancel",onClick:()=>z(null),children:"Batal"}),n.jsx("button",{className:"popup-btn-ok",onClick:O,children:"Tambahkan"})]})]})}),(0,n.jsxs)("div",{className:"queue-wrap",children:[(0,n.jsxs)("div",{className:"queue-header",children:[(0,n.jsxs)("div",{className:"queue-title",children:[n.jsx("div",{className:"queue-title-icon",children:(0,n.jsxs)("svg",{viewBox:"0 0 24 24",children:[n.jsx("rect",{x:"3",y:"3",width:"18",height:"18",rx:"2"}),n.jsx("path",{d:"M7 7h10M7 12h10M7 17h6"})]})}),(0,n.jsxs)("div",{children:[n.jsx("h1",{children:"Manajemen Pesanan"}),n.jsx("span",{children:"Antrian & proses pengerjaan"})]})]}),(0,n.jsxs)("div",{className:"queue-controls",children:[(0,n.jsxs)("button",{onClick:T,disabled:w,className:`btn-refresh ${w?"spinning":""}`,children:[(0,n.jsxs)("svg",{viewBox:"0 0 24 24",children:[n.jsx("path",{d:"M21 2v6h-6"}),n.jsx("path",{d:"M3 12a9 9 0 0 1 15-6.7L21 8"}),n.jsx("path",{d:"M3 22v-6h6"}),n.jsx("path",{d:"M21 12a9 9 0 0 1-15 6.7L3 16"})]}),w?"Memuat...":"Refresh"]}),(0,n.jsxs)("div",{className:"search-wrap",children:[(0,n.jsxs)("svg",{viewBox:"0 0 24 24",children:[n.jsx("circle",{cx:"11",cy:"11",r:"8"}),n.jsx("path",{d:"m21 21-4.35-4.35"})]}),n.jsx("input",{type:"text",placeholder:"Cari nama / kode order...",value:m,onChange:e=>{f(e.target.value),g(null)},className:"search-input"})]})]})]}),(0,n.jsxs)("div",{className:"queue-tabs",children:[(0,n.jsxs)("button",{className:`tab-btn ${"antrian"===e?"active":""}`,onClick:()=>F("antrian"),children:["Antrian ",n.jsx("span",{className:"tab-pill",children:a.length})]}),(0,n.jsxs)("button",{className:`tab-btn ${"proses"===e?"active":""}`,onClick:()=>F("proses"),children:["Proses ",n.jsx("span",{className:"tab-pill",children:h.length})]})]}),(0,n.jsxs)("div",{className:"queue-badge",children:[I.length," pesanan ditemukan"]}),(0,n.jsxs)("div",{className:"queue-table-wrap",children:[(0,n.jsxs)("table",{className:"queue-table",children:[n.jsx("thead",{children:(0,n.jsxs)("tr",{children:[n.jsx("th",{children:"#"}),n.jsx("th",{children:"User"}),n.jsx("th",{children:"Layanan"}),n.jsx("th",{children:"Total"}),n.jsx("th",{children:"Qty"}),n.jsx("th",{children:"Status"}),n.jsx("th",{children:"Kode Order"}),n.jsx("th",{children:"Dibuat"}),n.jsx("th",{children:"antrian"===e?"Dibayar":"Dikonfirmasi"}),"proses"===e&&n.jsx("th",{children:"Estimasi"}),"proses"===e&&n.jsx("th",{children:"Aksi"})]})}),n.jsx("tbody",{children:I.map((t,a)=>{let r=B(t.created_at),s=B(t.updated_at),i=b===t.id;return(0,n.jsxs)("tr",{onClick:()=>{"proses"!==e&&(g(t.id),j.push(`/admin/kelola/orders/${t.order_code.code}`))},className:i?"selected":"",style:{cursor:"proses"===e?"default":"pointer"},children:[n.jsx("td",{className:"td-no",children:a+1}),n.jsx("td",{className:"td-user",children:t.user.name}),n.jsx("td",{className:"td-service",children:t.service_name_snapshot}),(0,n.jsxs)("td",{className:"td-amount",children:["Rp ",t.total_price_snapshot.toLocaleString("id-ID")]}),n.jsx("td",{className:"td-qty",children:t.quantity}),n.jsx("td",{children:n.jsx("span",{className:`status-badge ${"antrian"===e?"status-paid":"status-progress"}`,children:t.status})}),n.jsx("td",{className:"td-code",children:t.order_code.code}),n.jsx("td",{children:(0,n.jsxs)("div",{className:"date-cell",children:[n.jsx("span",{className:"d-date",children:r.date}),n.jsx("span",{className:"d-time",children:r.time})]})}),n.jsx("td",{children:(0,n.jsxs)("div",{className:"date-cell",children:[n.jsx("span",{className:"d-date",children:s.date}),n.jsx("span",{className:"d-time",children:s.time})]})}),"proses"===e&&n.jsx("td",{onClick:e=>e.stopPropagation(),children:W(t)}),"proses"===e&&n.jsx("td",{onClick:e=>e.stopPropagation(),children:n.jsx("div",{style:{display:"flex",gap:"6px"},children:n.jsx("button",{style:{background:"#f3f4f6",color:"#111",border:"none",borderRadius:"7px",padding:"5px 12px",fontSize:"11px",fontWeight:600,cursor:"pointer",fontFamily:"system-ui, sans-serif",whiteSpace:"nowrap"},onClick:()=>{g(t.id),j.push(`/admin/kelola/orders/${t.order_code.code}`)},children:"View"})})})]},t.id)})})]}),0===I.length&&(0,n.jsxs)("div",{className:"queue-empty",children:[(0,n.jsxs)("svg",{viewBox:"0 0 24 24",children:[n.jsx("path",{d:"M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"}),n.jsx("rect",{x:"9",y:"3",width:"6",height:"4",rx:"1"})]}),n.jsx("p",{children:"Tidak ada pesanan ditemukan"})]})]})]})]})}},712:(e,t,a)=>{"use strict";a.r(t),a.d(t,{default:()=>n});let n=(0,a(8570).createProxy)(String.raw`C:\Users\USER\Desktop\annnss\fe-management-percetakan-main\src\app\admin\queue\page.tsx#default`)}};var t=require("../../../webpack-runtime.js");t.C(e);var a=e=>t(t.s=e),n=t.X(0,[276,471,496,95,883],()=>a(4352));module.exports=n})();