'use strict';
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const methods = [['wan','Ours (Wan2.1)'],['vrae','Ours (V-RAE)'],['gen3r','Gen3R'],['aether','Aether'],['fantasyworld','FantasyWorld']];
let cases = [], selectedCase = 'car', display = 'video', frame = 0, timer = null, playing = false, epoch = 0, seeking = 0;
let tableType = 'geometry';
let cloudScene='',cloudVisible=false,cloudPanes=[],cloudFrame=0,cloudPlaying=false,cloudTick,cloudGuard;
const cloudViews=new Map(),cloudReady=new Set();
let cloudPending=new Set(),cloudSource=null;
function cloudSend(pane,message){pane.contentWindow.postMessage(message,location.origin);}
function stopCloud(){cloudPlaying=false;clearTimeout(cloudTick);$('#cloudPlay').textContent='Play all 41 frames';}
function relayCloud(source,view){
  cloudSource=source;cloudViews.set(source,view);
  $('#cloudViewStatus').textContent=$('#cloudLinked').checked?`Linked to ${methods.find(m=>m[0]===source.dataset.method)[1]}`:'Independent viewpoints';
  if($('#cloudLinked').checked)cloudPanes.filter(p=>p!==source).forEach(p=>cloudSend(p,{type:'pointcloud-view-apply',mode:$('#cloudViewMode').value,view}));
}
function cloudSeek(value){
  clearTimeout(cloudTick);clearTimeout(cloudGuard);cloudFrame=value;
  $('#cloudFrameSlider').value=value+1;$('#cloudFrameLabel').textContent=String(value+1).padStart(2,'0')+' / 41';
  cloudPending=new Set(cloudPanes);$('#cloudStatus').textContent='Synchronizing all five frames...';
  cloudPanes.forEach(p=>cloudSend(p,{type:'pointcloud-frame',frame:value}));
  cloudGuard=setTimeout(()=>{stopCloud();$('#cloudStatus').textContent='A view is still loading. Playback paused; retry the frame or open that method separately.';},30000);
}
function renderCloud(){
  const record=currentCase();if(!record)return;
  if(!cloudVisible||cloudScene===record.id)return;
  stopCloud();clearTimeout(cloudGuard);cloudScene=record.id;cloudFrame=0;
  cloudViews.clear();cloudReady.clear();cloudPending.clear();cloudSource=null;
  $('#cloudFrameSlider').value=1;$('#cloudFrameLabel').textContent='01 / 41';
  $('#cloudPlay').disabled=true;$('#cloudFrameSlider').disabled=true;
  $('#cloudStatus').textContent='Loading five full-scene point clouds...';
  $('#cloudViewStatus').textContent='Waiting for all five views...';
  $('#cloudGrid').innerHTML=methods.map(([method,label])=>`<article class="cloud-card"><h4>${label}</h4><iframe data-method="${method}" src="scenes/${record.id}/${method}_full.html" title="${label}, ${record.dataset}, ${record.identity}, full point cloud" allow="fullscreen" allowfullscreen></iframe><a href="scenes/${record.id}/${method}_full.html" target="_blank" rel="noopener">Open full-size view ↗</a></article>`).join('');
  cloudPanes=$$('#cloudGrid iframe');
  cloudPanes.forEach(p=>p.addEventListener('load',()=>{
    // Compact only the embedded shell; original players and geometry stay intact.
    const style=p.contentDocument.createElement('style');
    style.textContent='html,body{height:auto;overflow:hidden}header{display:none}body{padding:0;display:block}.app{width:100%;height:auto;border:0;border-radius:0;grid-template-rows:auto auto}.stage{height:100vw;aspect-ratio:1}.stage>canvas{position:absolute;inset:0;width:100%;height:100%}.controls{display:flex;flex-wrap:wrap;padding:6px;gap:5px}.controls>#play,.controls>label:not(.sizeControl),.controls>.frame,.controls>#reset{display:none}.sizeControl{width:100%;font-size:10px}.sizeControl input{min-width:0}.recordControls{display:flex;flex-wrap:wrap;gap:4px;width:100%;justify-content:start}button,.downloadAction{font-size:10px;padding:5px}.badge{font-size:9px;left:5px;top:5px;padding:5px;pointer-events:none;max-width:calc(100% - 10px)}.help{display:none}.snapshotFloating{position:static;font-size:10px;padding:6px;box-shadow:none;order:3}.recordOverlay{font-size:10px;right:5px;bottom:5px}.snapshotDialog .actions{gap:5px}';
    p.contentDocument.head.append(style);
    style.textContent+='.recordControls,.snapshotFloating,.recordOverlay,.snapshotDialog{display:none!important}';
    style.textContent+='.controls>.snapshotFloating{position:static;font-size:10px;padding:6px;box-shadow:none}.stage>.recordOverlay{bottom:5px}';
    const doc=p.contentDocument,app=doc.querySelector('.app');
    const resize=new p.contentWindow.ResizeObserver(()=>{p.style.height=Math.ceil(app.getBoundingClientRect().height)+'px';});
    resize.observe(app);
    // The native PNG button is created after geometry loads; move it below the canvas.
    const moveSnapshot=()=>{
      const button=doc.querySelector('.snapshotFloating');
      if(!button)return false;
      doc.querySelector('.controls').append(button);return true;
    };
    if(!moveSnapshot()){
      const observer=new p.contentWindow.MutationObserver(()=>{if(moveSnapshot())observer.disconnect();});
      observer.observe(app,{childList:true,subtree:true});
    }
  }));
  cloudGuard=setTimeout(()=>{$('#cloudStatus').textContent=`${cloudReady.size}/5 loaded. Missing views may need more time or WebGL2; try their full-size links.`;},90000);
}
window.addEventListener('message',e=>{
  if(e.origin!==location.origin)return;
  const source=cloudPanes.find(p=>p.contentWindow===e.source);if(!source)return;
  if(e.data?.type==='pointcloud-view-ready'){
    cloudViews.set(source,e.data.view);
    if(cloudViews.size===5)relayCloud(cloudPanes[0],cloudViews.get(cloudPanes[0]));
  }else if(e.data?.type==='pointcloud-view-change')relayCloud(source,e.data.view);
  else if(e.data?.type==='pointcloud-ready'){
    cloudReady.add(source);
    if(e.data.frame===cloudFrame)cloudPending.delete(source);
    if(cloudReady.size===5&&cloudPending.size===0){
      clearTimeout(cloudGuard);$('#cloudPlay').disabled=false;$('#cloudFrameSlider').disabled=false;
      $('#cloudStatus').textContent='5 / 5 ready · full scene · no mask or depth filtering';
      if(cloudPlaying){clearTimeout(cloudTick);cloudTick=setTimeout(()=>cloudSeek((cloudFrame+1)%41),250);}
    }else $('#cloudStatus').textContent=`${cloudReady.size}/5 loaded · ${cloudPending.size} frames pending`;
  }
});
$('#cloudLinked').addEventListener('change',()=>{
  if($('#cloudLinked').checked&&cloudSource)cloudSend(cloudSource,{type:'pointcloud-view-request'});
  else $('#cloudViewStatus').textContent='Independent viewpoints';
});
$('#cloudViewMode').addEventListener('change',()=>{if(cloudSource&&$('#cloudLinked').checked)cloudSend(cloudSource,{type:'pointcloud-view-request'});});
$('#cloudAlign').addEventListener('click',()=>{if(cloudViews.size===5){$('#cloudLinked').checked=true;cloudSend(cloudPanes[0],{type:'pointcloud-view-request'});}});
$('#cloudReset').addEventListener('click',()=>{if(cloudViews.size===5){$('#cloudLinked').checked=true;cloudSend(cloudPanes[0],{type:'pointcloud-view-home'});}});
$('#cloudFrameSlider').addEventListener('input',()=>{stopCloud();cloudSeek(Number($('#cloudFrameSlider').value)-1);});
$('#cloudPlay').addEventListener('click',()=>{if(cloudPlaying)return stopCloud();cloudPlaying=true;$('#cloudPlay').textContent='Pause all frames';cloudSeek((cloudFrame+1)%41);});
document.addEventListener('visibilitychange',()=>{if(document.hidden)stopCloud();});
const cloudObserver=new IntersectionObserver(entries=>{if(entries.some(e=>e.isIntersecting)){cloudVisible=true;renderCloud();cloudObserver.disconnect();}},{rootMargin:'250px'});
cloudObserver.observe($('#pointcloud'));
$('#heroGeometryLink').addEventListener('click',()=>{selectedCase='car';renderCase();});

function selectButtons(selector, key, value) {
  $$(selector).forEach(b => {const on=b.dataset[key]===value;b.classList.toggle('active',on);b.setAttribute('aria-pressed',String(on));});
}
function stopFrames() { playing=false;clearTimeout(timer);$('#playFrames').textContent='▶ Play frames'; }
function currentCase() { return cases.find(c=>c.id===selectedCase); }
function renderCaseChoices(record) {
  $$('.case-tabs [data-case]').forEach(button=>{
    const on=cases.find(c=>c.id===button.dataset.case)?.dataset===record.dataset;
    button.classList.toggle('active',on);button.setAttribute('aria-pressed',String(on));
  });
  const siblings=cases.filter(c=>c.dataset===record.dataset), container=$('#benchmarkCases');
  container.hidden=siblings.length<2;container.replaceChildren();
  for(const candidate of siblings){
    const button=document.createElement('button');
    button.dataset.case=candidate.id;
    button.textContent=candidate.identity.split(' / ').slice(0,2).join(' / ');
    button.title=candidate.identity;
    const on=candidate.id===record.id;
    button.classList.toggle('active',on);button.setAttribute('aria-pressed',String(on));
    button.addEventListener('click',()=>{selectedCase=candidate.id;renderCase();});
    container.append(button);
  }
  const url=new URL(location.href);url.searchParams.set('case',record.id);
  history.replaceState(null,'',url);
}
function setFrame(value) {
  const record=currentCase(), request=++seeking;
  if(!record) return Promise.resolve();
  frame=value;$('#frameSlider').value=value+1;$('#frameLabel').textContent=String(value+1).padStart(2,'0')+' / 41';
  return Promise.all($$('#methodGrid video').map(video => new Promise(resolve => {
    const time=record.videos[video.dataset.method].times[value];
    let guard;
    const finish=()=>{clearTimeout(guard);video.removeEventListener('seeked',finish);video.removeEventListener('loadedmetadata',seek);resolve();};
    const seek=()=>{if(request!==seeking)return finish();if(Math.abs(video.currentTime-time)<.0001)return finish();video.addEventListener('seeked',finish,{once:true});try{video.currentTime=time;}catch(error){$('#mediaStatus').textContent='Could not seek this video: '+error.message;finish();}};
    guard=setTimeout(()=>{if(request===seeking)$('#mediaStatus').textContent='One or more clips are still loading. Try scrubbing again.';finish();},10000);
    if(video.readyState>=1)seek();else video.addEventListener('loadedmetadata',seek,{once:true});
  })));
}
async function playTick(token) {
  if(!playing||token!==epoch)return;
  await setFrame(frame);
  if(!playing||token!==epoch)return;
  timer=setTimeout(()=>{frame=(frame+1)%41;playTick(token);},140);
}
function renderCase() {
  stopFrames();epoch++;seeking++;frame=0;
  const record=currentCase();if(!record)return;
  renderCloud();
  if(display==='depth'&&!record.has_depth)display='video';
  renderCaseChoices(record);selectButtons('[data-display]','display',display);
  $('[data-display="depth"]').disabled=!record.has_depth;
  $('[data-display="depth"]').title=record.has_depth?'Show archived raw depth renderings':'No selected raw-depth stills are packaged for this scene';
  $('#viewerLink').href=`scenes/${record.id}/comparison.html`;
  $('#videoControls').hidden=display!=='video';$('#depthControls').hidden=display!=='depth';
  $('#mediaStatus').textContent='';$('#frameSlider').value=1;$('#frameLabel').textContent='01 / 41';
  const contrast=$('#depthMapping').value==='contrast';
  $('#methodGrid').innerHTML=methods.map(([method,label])=>{
    const base=`scenes/${record.id}/${method}`,ours=['wan','vrae'].includes(method);
    const content=display==='video'?`<video muted playsinline preload="metadata" data-method="${method}" poster="${base}_poster.jpg" src="${base}.mp4" aria-label="${label}, ${record.dataset}, generated clip"></video><div class="video-state"><span>${ours?'Latent Bridge':'Baseline'}</span><span>${record.videos[method].frames} frames</span></div>`:
      `<img src="${base}_rgb.png" alt="${label} RGB frame ${record.depth_frame}" width="560" height="560"><div class="depth-label">Generated RGB · frame ${record.depth_frame}</div><img src="${base}_depth${contrast?'_contrast':''}.png" alt="${label} depth frame ${record.depth_frame}" width="560" height="560"><div class="depth-label">${contrast?'Independent contrast mapping':'Shared linear display range'}</div>`;
    return `<article class="method-card ${ours?'ours':''}"><h4>${label}${ours?'<span>OURS</span>':''}</h4>${content}</article>`;
  }).join('');
  $$('#methodGrid video').forEach(v=>v.addEventListener('error',()=>{$('#mediaStatus').textContent='A video could not be loaded. Use the 3D viewer or retry the page.';}));
  $$('#methodGrid img').forEach(i=>i.addEventListener('error',()=>{$('#mediaStatus').textContent='A selected image is unavailable; no substitute result is shown.';}));
}
$$('[data-case]').forEach(b=>b.addEventListener('click',()=>{selectedCase=b.dataset.case;renderCase();}));
$$('[data-display]').forEach(b=>b.addEventListener('click',()=>{display=b.dataset.display;renderCase();}));
$('#depthMapping').addEventListener('change',renderCase);
$('#frameSlider').addEventListener('input',()=>{stopFrames();setFrame(Number($('#frameSlider').value)-1);});
$('#playFrames').addEventListener('click',()=>{if(playing)return stopFrames();if(!currentCase())return;playing=true;$('#playFrames').textContent='Ⅱ Pause frames';playTick(epoch);});
document.addEventListener('visibilitychange',()=>{if(document.hidden)stopFrames();});

const names=['Aether','FantasyWorld','Gen3R','Ours (Wan2.1)','Ours (V-RAE)'];
const geometry={
 co3d:[[.6982,.5437,.6209,181.33],[.5939,.3698,.4818,448.63],[.3820,.1796,.2808,189.57],[.3536,.1833,.2685,70.09],[.3231,.2093,.2662,165.57]],
 wild:[[.0591,.1340,.0965,181.33],[.0440,.1258,.0849,448.63],[.0247,.1129,.0688,189.57],[.0189,.1209,.0699,70.09],[.0237,.1076,.0657,165.57]]
};
// Rows follow the paper, not historical example-specific metrics.
const videoMetrics={
 co3d:[[13.9595,.5689,.5942,90.64,92.13,38.46],[12.0307,.4807,.6741,89.08,91.27,46.20],[16.5289,.6027,.4405,94.79,96.05,45.20],[17.0388,.6166,.4121,95.42,96.41,46.73],[16.3780,.6025,.4303,94.91,95.99,47.84]],
 wild:[[12.4790,.4466,.5660,95.82,95.94,52.60],[12.9733,.4385,.5116,97.07,96.72,59.41],[15.2252,.5075,.4025,98.38,98.20,56.58],[16.1703,.5412,.3394,98.44,98.24,59.67],[16.5769,.5516,.3217,97.87,97.60,56.85]],
 dl3dv:[[12.9066,.4211,.5576,93.93,94.90,46.21],[12.1378,.3633,.5944,95.09,95.85,47.60],[14.5473,.4234,.4477,94.09,95.28,47.32],[14.8615,.4453,.4169,95.22,95.90,50.96],[14.7968,.4448,.4351,94.75,95.62,48.25]],
 re10k:[[16.5257,.5865,.3439,98.82,98.60,47.21],[14.4308,.5353,.4776,97.89,97.84,50.98],[19.9467,.6781,.2115,99.31,99.08,49.82],[20.0350,.6917,.2125,99.25,99.22,49.02],[17.5092,.6384,.3028,98.42,97.79,47.61]]
};
function renderTable() {
  const isGeo=tableType==='geometry',select=$('#metricDataset');
  select.closest('label').hidden=isGeo;
  [...select.options].forEach(o=>o.disabled=false);
  $('#metricsTable').classList.toggle('combined-geometry',isGeo);
  const data=isGeo?geometry.co3d.map((row,i)=>[...row.slice(0,3),...geometry.wild[i].slice(0,3),row[3]]):videoMetrics[select.value];
  const heads=['Method','PSNR ↑','SSIM ↑','LPIPS ↓','I2V Subject ↑','I2V Background ↑','Imaging quality ↑'];
  $('#metricsTable caption').textContent=isGeo?'Geometry, Table 1: Co3Dv2 and WildRGB-D':'Video generation, Table 2: '+select.selectedOptions[0].text;
  $('#metricsTable thead').innerHTML=isGeo?
    '<tr><th scope="col" rowspan="2">Method</th><th scope="colgroup" colspan="3" class="dataset-group group-start">Co3Dv2 <small>300 sequences</small></th><th scope="colgroup" colspan="3" class="dataset-group group-start">WildRGB-D <small>158 sequences</small></th><th scope="col" rowspan="2" class="group-start">End-to-end<br>latency ↓</th></tr><tr>'+['Accuracy ↓','Completeness ↓','CD ↓','Accuracy ↓','Completeness ↓','CD ↓'].map((x,i)=>`<th scope="col" class="${i%3===0?'group-start':''}">${x}</th>`).join('')+'</tr>':
    '<tr>'+heads.map(x=>`<th scope="col">${x}</th>`).join('')+'</tr>';
  const best=data[0].map((_,i)=>Math[isGeo||i===2?'min':'max'](...data.map(row=>row[i])));
  $('#metricsTable tbody').innerHTML=data.map((row,i)=>`<tr class="${i>=3?'ours':''}"><td class="method-name">${names[i]}${i>=3?'<em>OURS</em>':''}</td>${row.map((x,j)=>`<td class="${x===best[j]?'best':''} ${isGeo&&j%3===0?'group-start':''}"><span>${x.toFixed(isGeo?(j===6?2:4):(j<3?4:2))}${isGeo&&j===6?' s':''}</span></td>`).join('')}</tr>`).join('');
  $('#metricNote').textContent=isGeo?'Paper Table 1. Geometry distances in meters as reported; lower is better. Green marks the best value per column. End-to-end latency is the paper’s system-level timing, not a separate dataset-specific measurement.':'Paper Table 2. All video results at 560 × 560. I2V Subject, I2V Background and Imaging Quality are multiplied by 100. Higher is better except LPIPS. Dataset counts: Co3Dv2 300, WildRGB-D 158, DL3DV 140, RealEstate10K 300.';
}
$$('[data-table]').forEach(b=>b.addEventListener('click',()=>{tableType=b.dataset.table;selectButtons('[data-table]','table',tableType);renderTable();}));
$('#metricDataset').addEventListener('change',renderTable);renderTable();
$('#copyCitation').addEventListener('click',async()=>{try{await navigator.clipboard.writeText($('#bibtex').textContent);$('#copyStatus').textContent='BibTeX copied.';}catch{const range=document.createRange();range.selectNodeContents($('#bibtex'));const selection=window.getSelection();selection.removeAllRanges();selection.addRange(range);$('#copyStatus').textContent='Clipboard unavailable. Citation selected; press Command/Ctrl+C.';}});
fetch('cases.json').then(r=>{if(!r.ok)throw Error('Case manifest '+r.status);return r.json();}).then(data=>{cases=data;const requested=new URLSearchParams(location.search).get('case');if(cases.some(c=>c.id===requested))selectedCase=requested;renderCase();}).catch(error=>{$('#mediaStatus').textContent='Could not load the case list: '+error.message;});
