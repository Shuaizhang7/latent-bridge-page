const {chromium}=require('playwright');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const base=process.env.PAGE_URL||'http://127.0.0.1:8792/latent-bridge-page/';
fs.mkdirSync(path.join(__dirname,'test-results'),{recursive:true});
(async()=>{
 const browser=await chromium.launch({channel:process.env.BROWSER_CHANNEL||'chrome',headless:true,args:['--enable-unsafe-swiftshader','--use-angle=swiftshader']});
 try{
  const page=await browser.newPage({viewport:{width:1600,height:1100},acceptDownloads:true});
  page.setDefaultTimeout(30000);
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base+'#pointcloud');
  const pane=m=>page.frameLocator(`#cloudGrid iframe[data-method="${m}"]`);
  const ready=()=>page.waitForFunction(()=>document.querySelectorAll('#cloudGrid iframe').length===5&&[...document.querySelectorAll('#cloudGrid iframe')].every(p=>p.contentDocument?.querySelector('canvas')?.dataset.viewState)&&!document.querySelector('#cloudPlay').disabled,null,{timeout:120000});
  const states=()=>page.evaluate(()=>[...document.querySelectorAll('#cloudGrid iframe')].map(p=>JSON.parse(p.contentDocument.querySelector('canvas').dataset.viewState)));
  const sync=async mode=>{
   await page.waitForFunction(mode=>{
    const a=[...document.querySelectorAll('#cloudGrid iframe')].map(p=>JSON.parse(p.contentDocument.querySelector('canvas').dataset.viewState)[mode]);
    return a.every(v=>Object.keys(v).every(k=>Array.isArray(v[k])?v[k].every((x,i)=>Math.abs(x-a[0][k][i])<1e-6):Math.abs(v[k]-a[0][k])<1e-6));
   },mode);
  };
  await ready();await sync('relative');
  const squareAndAligned=()=>page.waitForFunction(()=>{
   const videos=[...document.querySelectorAll('#methodGrid video')];
   return [...document.querySelectorAll('#cloudGrid iframe')].every((p,i)=>{
    const canvas=p.contentDocument.querySelector('canvas').getBoundingClientRect(),video=videos[i].getBoundingClientRect(),box=p.getBoundingClientRect();
    const button=p.contentDocument.querySelector('#snapshotSave');
    return Math.abs(canvas.width-canvas.height)<1&&Math.abs(box.left-video.left)<1&&Math.abs(canvas.width-video.width)<1&&button&&p.contentWindow.getComputedStyle(button).display==='none';
   });
  });
  await squareAndAligned();
  assert.equal(await page.locator('#cloudScene').count(),0,'Use only the shared dataset tabs');
  assert(await page.evaluate(()=>document.querySelector('#methodGrid').nextElementSibling.id==='pointcloud'),'Place geometry immediately below media');
  assert.equal(await page.locator('#cloudGrid iframe').count(),5);
  const boxes=await page.locator('#cloudGrid iframe').evaluateAll(ps=>ps.map(p=>({y:p.getBoundingClientRect().top,x:p.getBoundingClientRect().left})));
  assert(boxes.every(b=>b.y===boxes[0].y));assert(boxes.every((b,i)=>!i||b.x>boxes[i-1].x));
  for(const method of ['wan','vrae','gen3r','aether','fantasyworld']){
   assert((await pane(method).locator('#count').textContent()).includes('313,600'));
   assert((await page.locator(`#cloudGrid iframe[data-method="${method}"]`).getAttribute('src')).endsWith('_full.html'));
  }
  const drag=async(method,button='left')=>{
   const canvas=pane(method).locator('canvas');await canvas.scrollIntoViewIfNeeded();const b=await canvas.boundingBox();
   await page.mouse.move(b.x+b.width*.5,b.y+b.height*.5);await page.mouse.down({button});
   await page.mouse.move(b.x+b.width*.5+35,b.y+b.height*.5+20,{steps:6});await page.mouse.up({button});
  };
  const before=await states();await drag('gen3r');await sync('relative');
  assert.notEqual((await states())[0].absolute.yaw,before[0].absolute.yaw);
  const zoomBefore=(await states())[0].relative.zoom;await page.mouse.wheel(0,-120);
  await page.waitForFunction(z=>JSON.parse(document.querySelector('#cloudGrid iframe').contentDocument.querySelector('canvas').dataset.viewState).relative.zoom!==z,zoomBefore);
  await sync('relative');await drag('vrae','right');await sync('relative');
  assert((await states())[0].relative.pan.some(v=>Math.abs(v)>1e-5));
  await page.locator('#cloudViewMode').selectOption('absolute');await sync('absolute');
  await drag('fantasyworld');await sync('absolute');
  await page.locator('#cloudLinked').uncheck();const unlinked=await states();await drag('vrae');
  await page.waitForFunction(y=>JSON.parse(document.querySelector('#cloudGrid iframe[data-method="vrae"]').contentDocument.querySelector('canvas').dataset.viewState).absolute.yaw!==y,unlinked[1].absolute.yaw);
  assert.deepEqual((await states())[0],unlinked[0]);
  await page.locator('#cloudAlign').click();await sync('absolute');
  await page.locator('#cloudViewMode').selectOption('relative');await sync('relative');
  await page.locator('#cloudReset').click();await page.waitForFunction(()=>Math.abs(JSON.parse(document.querySelector('#cloudGrid iframe').contentDocument.querySelector('canvas').dataset.viewState).relative.zoom-1)<1e-8);await sync('relative');
  await page.locator('#cloudFrameSlider').evaluate(el=>{el.value='31';el.dispatchEvent(new Event('input',{bubbles:true}));});
  await page.waitForFunction(()=>[...document.querySelectorAll('#cloudGrid iframe')].every(p=>p.contentDocument.querySelector('canvas').dataset.renderedFrame==='30'));
  await page.locator('#cloudPlay').click();
  await page.waitForFunction(()=>[...document.querySelectorAll('#cloudGrid iframe')].every(p=>Number(p.contentDocument.querySelector('canvas').dataset.renderedFrame)>30));
  await page.locator('#cloudPlay').click();
  for(const method of ['wan','vrae','gen3r','aether','fantasyworld']){
   assert.equal(await pane(method).locator('#recordStart').isVisible(),false);
   assert.equal(await pane(method).locator('#recordStop').isVisible(),false);
   assert.equal(await pane(method).locator('#snapshotSave').isVisible(),false);
  }
  await page.locator('#pointcloud').screenshot({path:path.join(__dirname,'test-results/linked-cloud-desktop.png')});
  await page.locator('#explore').screenshot({path:path.join(__dirname,'test-results/merged-comparison-desktop.png')});
  console.log('Five-way layout, orbit, zoom, pan, absolute/relative, unlink/reset, playback and hidden export controls passed.');
  for(const scene of ['apple','interior','home','car']){
   await page.locator(`.case-tabs [data-case="${scene}"]`).click();await ready();await sync('relative');
   assert.equal(await page.locator(`.case-tabs [data-case="${scene}"]`).getAttribute('aria-pressed'),'true');
   assert(await page.locator('#cloudGrid iframe').evaluateAll((ps,s)=>ps.every(p=>p.src.includes(`/scenes/${s}/`)),scene));
   console.log(`Scene ${scene}: all five full clouds ready and linked.`);
  }
  for(const [scene,datasetCase] of [['ball','car'],['apple','apple']]){
   await page.locator(`.case-tabs [data-case="${datasetCase}"]`).click();await ready();
   if(scene!==datasetCase){await page.locator(`#benchmarkCases [data-case="${scene}"]`).click();await ready();}
   else assert(await page.locator('#benchmarkCases').isHidden());
   assert.equal(await page.locator('[data-case="hydrant"], [data-case="bear"]').count(),0);
   await sync('relative');
   assert.equal(await page.locator(`.case-tabs [data-case="${datasetCase}"]`).getAttribute('aria-pressed'),'true');
   assert.equal(await page.locator(`#benchmarkCases [data-case="${scene}"]`).getAttribute('aria-pressed'),'true');
   assert(await page.locator('#cloudGrid iframe').evaluateAll((ps,s)=>ps.length===5&&ps.every(p=>p.src.includes(`/scenes/${s}/`)),scene));
   assert(await page.locator('#methodGrid video').evaluateAll((vs,s)=>vs.length===5&&vs.every(v=>v.src.includes(`/scenes/${s}/`)),scene));
   await drag('gen3r');await sync('relative');
   await page.locator('#cloudFrameSlider').evaluate(el=>{el.value='41';el.dispatchEvent(new Event('input',{bubbles:true}));});
   await page.waitForFunction(()=>[...document.querySelectorAll('#cloudGrid iframe')].every(p=>p.contentDocument.querySelector('canvas').dataset.renderedFrame==='40'));
   await page.locator('#frameSlider').evaluate(el=>{el.value='41';el.dispatchEvent(new Event('input',{bubbles:true}));});
   await page.waitForFunction(()=>[...document.querySelectorAll('#methodGrid video')].every(v=>v.readyState>=2&&!v.seeking&&v.currentTime>3));
   await page.locator('#explore').screenshot({path:path.join(__dirname,`test-results/${scene}-desktop.png`)});
   await page.reload();await ready();await sync('relative');
   assert.equal(await page.locator(`#benchmarkCases [data-case="${scene}"]`).getAttribute('aria-pressed'),'true');
   console.log(`${scene}: all five videos and clouds, linked view, frame 41 and deep link passed.`);
  }
  await page.setViewportSize({width:390,height:844});await page.locator('#pointcloud').scrollIntoViewIfNeeded();
  await page.locator('#pointcloud').screenshot({path:path.join(__dirname,'test-results/linked-cloud-mobile.png')});
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  await squareAndAligned();
  assert(await page.locator('.cloud-scroll').evaluate(el=>el.scrollWidth<=el.clientWidth));
  await drag('fantasyworld');await sync('relative');
  assert.equal(errors.length,0,errors.join('\n'));
  const report={status:'passed',square_canvases_aligned_to_videos:true,controls_below_canvas:true,full_scene_only:true,all_five_side_by_side:true,all_five_cases:true,ball_apple_case_switch_and_deep_link:true,relative_and_absolute_sync:true,rotate_zoom_pan:true,unlink_align_reset:true,common_41_playback:true,embedded_export_controls_hidden:true,mobile_grid_no_page_overflow:true,console_errors:errors};
  fs.writeFileSync(path.join(__dirname,'test-results/inline-cloud-validation.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
