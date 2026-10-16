/* Separate application examples from the five-method benchmark comparison. */
(()=>{
 'use strict';
 const $=s=>document.querySelector(s),buttons=[...document.querySelectorAll('[data-application]')];
 let records=[],group='driving',selected='',visible=false,loaded='',version=0,pane=null,ready=false;
 let playing=false,timer=0,guard=0,current=0,requested=null,busy=false,ack=null;
 function stop(){playing=false;clearTimeout(timer);$('#applicationPlay').textContent='Play all 49 frames';}
 function record(){return records.find(r=>r.id===selected);}
 function fail(message){stop();$('#applicationStatus').textContent=message;}
 function compactPlayer(p){
  const doc=p.contentDocument,app=doc.querySelector('.app');if(!app)return;
  const style=doc.createElement('style');
  style.textContent='html,body{height:auto;overflow:hidden}body{display:block;padding:0}header{display:none}.app{width:100%;height:auto;border:0;border-radius:0;grid-template-rows:auto auto}.stage{height:100vw;aspect-ratio:1}.stage>canvas{position:absolute;inset:0;width:100%;height:100%}.controls{display:flex;flex-wrap:wrap;padding:8px;gap:7px}.controls>#play,.controls>label:not(.sizeControl),.controls>.frame{display:none}.sizeControl{width:100%;font-size:11px}.sizeControl input{min-width:0}.recordControls{display:flex;flex-wrap:wrap;gap:5px;width:100%;justify-content:start}button,.downloadAction{font-size:11px;padding:6px}.badge{font-size:9px;max-width:calc(100% - 10px);left:5px;top:5px;padding:5px;pointer-events:none}.help{display:none}.controls>.snapshotFloating{position:static;order:3;font-size:11px;padding:6px;box-shadow:none}.stage>.recordOverlay{bottom:5px;font-size:10px}';
  doc.head.append(style);
  style.textContent+='.recordControls,.snapshotFloating,.recordOverlay,.snapshotDialog{display:none!important}';
  style.textContent+='.stage>canvas{transform:scaleX(-1)}';
  style.textContent+='html,body{height:100%;padding:0!important}.app{position:relative;display:block;height:100vw!important}.app>header{display:none!important}.stage{position:absolute;inset:0;height:100%;width:100%}.controls{position:absolute;bottom:0;left:0;right:0;z-index:3;max-height:70%;overflow:auto;background:#101719ed}.controls[hidden]{display:none!important}.application-tools{position:absolute;right:7px;top:7px;z-index:4;background:#101719e6}.badge{max-width:calc(100% - 90px)}';
  const controls=doc.querySelector('.controls');
  controls.id='applicationTools';controls.hidden=true;
  const toggle=doc.createElement('button');toggle.className='application-tools';toggle.textContent='Controls';
  toggle.setAttribute('aria-controls',controls.id);toggle.setAttribute('aria-expanded','false');
  toggle.addEventListener('click',()=>{controls.hidden=!controls.hidden;toggle.setAttribute('aria-expanded',String(!controls.hidden));toggle.textContent=controls.hidden?'Controls':'Close';});
  app.append(toggle);
  const skyToggle=doc.querySelector('#hideSky')?.closest('label');
  if(skyToggle){skyToggle.classList.add('sky-toggle');doc.querySelector('.controls').prepend(skyToggle);style.textContent+='.controls>label.sky-toggle{display:flex;width:100%;margin:0!important;font-size:11px;pointer-events:auto}';}
  const move=()=>{const b=doc.querySelector('.snapshotFloating');if(!b)return false;doc.querySelector('.controls').append(b);return true;};
  if(!move()){const observer=new p.contentWindow.MutationObserver(()=>{if(move())observer.disconnect();});observer.observe(app,{subtree:true,childList:true});}
 }
 function seekVideo(video,time){
  return new Promise((resolve,reject)=>{
   let guard;
   const done=()=>{clearTimeout(guard);video.removeEventListener('seeked',done);video.removeEventListener('loadedmetadata',seek);resolve();};
   const seek=()=>{if(Math.abs(video.currentTime-time)<.001&&!video.seeking)return done();video.addEventListener('seeked',done,{once:true});video.currentTime=time;};
   guard=setTimeout(()=>{video.removeEventListener('seeked',done);video.removeEventListener('loadedmetadata',seek);reject(Error('Video frame timed out; retry playback.'));},20000);
   if(video.readyState>=1)seek();else video.addEventListener('loadedmetadata',seek,{once:true});
  });
 }
 async function pump(){
  if(busy||!ready||requested===null)return;
  const token=version;busy=true;
  try{
   while(requested!==null&&token===version){
    const index=requested;requested=null;
    const r=record(),p=pane;
    const geometry=new Promise((resolve,reject)=>{
     const timeout=setTimeout(()=>{if(ack?.version===token)ack=null;reject(Error('Point cloud timed out; open the standalone viewer or retry.'));},30000);
     ack={version:token,frame:index,resolve:()=>{clearTimeout(timeout);resolve();},reject:()=>{clearTimeout(timeout);reject(Error('Scene changed'));}};
    });
    p.contentWindow.postMessage({type:'pointcloud-frame',frame:index},location.origin);
    await Promise.all([geometry,...['rgb','depth'].map(kind=>{
     const times=r.videos[kind],step=index<48?times[index+1]-times[index]:times[48]-times[47];
     return seekVideo($('#applicationGrid video[data-kind="'+kind+'"]'),times[index]+step/2);
    })]);
    if(token!==version)return;
    current=index;$('#applicationFrame').value=index+1;$('#applicationFrameLabel').textContent=String(index+1).padStart(2,'0')+' / 49';
    $('#applicationStatus').textContent=r.sky_mask_default?'Synchronized · sky mask available under Controls':'Synchronized · full scene, no mask';
   }
  }catch(error){if(token===version)fail(error.message);}
  finally{if(token===version){busy=false;if(playing)timer=setTimeout(()=>request((current+1)%49),180);}}
 }
 function request(index){clearTimeout(timer);requested=index;pump();}
 function render(){
  const r=record();if(!r)return;
  $('#applicationCases').querySelectorAll('button').forEach(b=>{const active=b.dataset.case===selected;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));});
  $('#applicationWeights').textContent=r.generator+' + Bridge94K';
  if(!visible||loaded===selected)return;
  stop();clearTimeout(guard);version++;ack?.reject();ack=null;requested=null;busy=false;ready=false;current=0;loaded=selected;
  $('#applicationPlay').disabled=true;$('#applicationFrame').disabled=true;$('#applicationFrame').value=1;$('#applicationFrameLabel').textContent='01 / 49';
  $('#applicationStatus').textContent='Loading archived video, depth and geometry...';
  $('#applicationGrid').innerHTML=['rgb','depth'].map(kind=>`<article class="application-card"><h4>${kind==='rgb'?'Generated video':'Bridge depth'}</h4><video data-kind="${kind}" muted playsinline preload="metadata" src="${r.base}/${kind}.mp4" poster="${r.base}/${kind}.jpg" aria-label="${r.title}, ${kind}"></video><a href="${r.base}/${kind}.mp4" target="_blank" rel="noopener">Open video ↗</a></article>`).join('')+`<article class="application-card application-geometry"><h4>${r.sky_mask_default?'Point cloud / sky mask on by default':'Full-scene point cloud'}</h4><iframe title="${r.title}, point cloud" src="${r.base}/player.html" allow="fullscreen" allowfullscreen></iframe><a href="${r.base}/player.html" target="_blank" rel="noopener">Open full-size 3D ↗</a></article>`;
  pane=$('#applicationGrid iframe');const mounted=pane;mounted.addEventListener('load',()=>{if(pane===mounted)compactPlayer(mounted);});
  $('#applicationGrid').querySelectorAll('video').forEach(v=>v.addEventListener('error',()=>fail('A video could not load. Try its standalone link.')));
  guard=setTimeout(()=>fail('Geometry is still loading. WebGL2 is required; try the standalone 3D view.'),90000);
 }
 function chooseGroup(value){
  group=value;const subset=records.filter(r=>r.group===group);
  buttons.forEach(b=>{const active=b.dataset.application===group;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));});
  $('#applicationCases').replaceChildren(...subset.map(r=>{const b=document.createElement('button');b.type='button';b.dataset.case=r.id;b.textContent=r.title;b.addEventListener('click',()=>{selected=r.id;render();});return b;}));
  selected=subset[0]?.id||'';render();
 }
 window.addEventListener('message',e=>{
  if(e.origin!==location.origin||e.source!==pane?.contentWindow||e.data?.type!=='pointcloud-ready')return;
  if(!ready){ready=true;clearTimeout(guard);$('#applicationPlay').disabled=false;$('#applicationFrame').disabled=false;request(0);return;}
  if(ack&&ack.version===version&&ack.frame===e.data.frame){const pending=ack;ack=null;pending.resolve();}
 });
 buttons.forEach(b=>b.addEventListener('click',()=>chooseGroup(b.dataset.application)));
 $('#applicationFrame').addEventListener('input',()=>{stop();request(Number($('#applicationFrame').value)-1);});
 $('#applicationPlay').addEventListener('click',()=>{if(playing)return stop();playing=true;$('#applicationPlay').textContent='Pause all frames';request((current+1)%49);});
 document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();});
 const observer=new IntersectionObserver(entries=>{if(entries.some(e=>e.isIntersecting)){visible=true;render();observer.disconnect();}},{rootMargin:'180px'});
 observer.observe($('#applications'));
 fetch('applications.json').then(r=>{if(!r.ok)throw Error('Application manifest unavailable');return r.json();}).then(data=>{records=data;chooseGroup('driving');}).catch(e=>fail(e.message));
})();
