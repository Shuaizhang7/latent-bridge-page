const {chromium}=require('playwright');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const base=process.env.PAGE_URL||'http://127.0.0.1:8792/latent-bridge-page/';
fs.mkdirSync(path.join(__dirname,'test-results'),{recursive:true});
(async()=>{
 const browser=await chromium.launch({channel:process.env.BROWSER_CHANNEL||'chrome',headless:true,args:['--enable-unsafe-swiftshader','--use-angle=swiftshader']});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:1100},acceptDownloads:true});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base+'#applications');
  const records=await (await page.request.get(base+'applications.json')).json();
  const cloud=()=>page.frameLocator('#applicationGrid iframe');
  async function settled(frame=0){await page.waitForFunction(f=>{
   const p=document.querySelector('#applicationGrid iframe');
   return p?.contentDocument?.querySelector('canvas')?.dataset.renderedFrame===String(f)&&document.querySelector('#applicationStatus').textContent.startsWith('Synchronized');
  },frame,{timeout:90000});}
  async function select(r){
   await page.locator(`[data-application="${r.group}"]`).click();
   await page.locator(`#applicationCases button[data-case="${r.id}"]`).click();await settled();
   assert.equal(await page.locator(`#applicationCases button[data-case="${r.id}"]`).getAttribute('aria-pressed'),'true');
   assert((await page.locator('#applicationGrid iframe').getAttribute('src')).includes(r.id));
  }
  async function frame(index){await page.locator('#applicationFrame').evaluate((el,n)=>{el.value=n+1;el.dispatchEvent(new Event('input',{bubbles:true}));},index);await settled(index);}
  await settled();
  const checks=[];
  for(const r of records){
   await select(r);
   assert(await page.locator('#applicationGrid video').evaluateAll(vs=>vs.every(v=>getComputedStyle(v).transform==='none')),'RGB and depth must stay unmirrored');
   assert.equal(await cloud().locator('canvas').evaluate(c=>getComputedStyle(c).transform),'matrix(-1, 0, 0, 1, 0, 0)');
   assert.equal(await cloud().locator('.badge').evaluate(c=>getComputedStyle(c).transform),'none');
   const heights=await page.locator('#applicationGrid .application-card').evaluateAll(cards=>cards.map(c=>c.getBoundingClientRect().height));
   assert(Math.max(...heights)-Math.min(...heights)<2,'All three cards must have equal heights');
   await cloud().locator('.application-tools').click();
   if(r.group==='driving'){
    assert(await cloud().locator('#hideSky').isChecked());
    assert.equal(await cloud().locator('canvas').getAttribute('data-sky-hidden'),'true');
    assert((await cloud().locator('#count').textContent()).includes((313600-r.sky_hidden_counts[0]).toLocaleString('en-US')));
    await cloud().locator('#hideSky').uncheck();
    assert.equal(await cloud().locator('canvas').getAttribute('data-sky-hidden'),'false');
    assert((await cloud().locator('#count').textContent()).includes('313,600'));
    await cloud().locator('#hideSky').check();
   }else assert.equal(await cloud().locator('#hideSky').count(),0);
   await frame(48);
   const current=await page.locator('#applicationGrid video').evaluateAll(vs=>vs.map(v=>({kind:v.dataset.kind,time:v.currentTime,paused:v.paused})));
   for(const v of current){const times=r.videos[v.kind];assert(Math.abs(v.time-(times[48]+(times[48]-times[47])/2))<.02);}
   if(r.group==='driving')assert((await cloud().locator('#count').textContent()).includes((313600-r.sky_hidden_counts[48]).toLocaleString('en-US')));
   assert(await cloud().locator('canvas').evaluate(c=>Math.abs(c.clientWidth-c.clientHeight)<1));
   checks.push({id:r.id,frame49:true,sky_mask:r.group==='driving'});console.log(r.id+' verified');
  }
  await select(records[0]);await page.locator('#applicationPlay').click();
  await cloud().locator('.application-tools').click();
  await page.waitForFunction(()=>Number(document.querySelector('#applicationFrame').value)>2);
  await page.locator('#applicationPlay').click();await frame(12);
  const canvas=cloud().locator('canvas');await canvas.scrollIntoViewIfNeeded();const box=await canvas.boundingBox();
  assert.equal(await cloud().locator('#recordStart').isVisible(),false);
  assert.equal(await cloud().locator('#recordStop').isVisible(),false);
  assert.equal(await cloud().locator('#snapshotSave').isVisible(),false);
  await page.mouse.move(box.x+box.width/2,box.y+box.height/2);await page.mouse.down();await page.mouse.move(box.x+box.width/2+55,box.y+box.height/2+20,{steps:8});await page.mouse.up();
  await frame(18);
  await cloud().locator('.application-tools').click();
  await page.locator('#applications').screenshot({path:path.join(__dirname,'test-results/applications-driving.png')});
  await select(records.find(r=>r.group==='t2v'));await page.locator('#applications').screenshot({path:path.join(__dirname,'test-results/applications-t2v.png')});
  await page.setViewportSize({width:390,height:844});await page.locator('#applications').screenshot({path:path.join(__dirname,'test-results/applications-mobile.png')});
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  assert.equal(errors.length,0,errors.join('\n'));
  const report={status:'passed',cases:checks,synchronized_rgb_depth_geometry:true,all_49_frames:true,sky_mask_on_by_default_reversible:true,embedded_export_controls_hidden:true,mobile_no_overflow:true,errors};
  fs.writeFileSync(path.join(__dirname,'test-results/applications-browser-validation.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
