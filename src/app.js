import { matchTemplate } from './matcher.js';
import { toMonoAtRate } from './audio.js';
import { applyEdits } from './editing.js';
import { encodeWav, downloadBlob, writeWavToDirectory } from './export.js';
import { History } from './history.js';
import { playBuffer } from './preview.js';

const $ = id => document.getElementById(id);
const state = { context:null, ref:null, projects:[], selected:null, matches:[], abort:null, player:null, selectedHit:null, outputDirectory:null };
const error = message => { $('errors').textContent = message || ''; };
const formatTime = seconds => `${seconds.toFixed(3)} s`;
const formatScore = score => `${(score*100).toFixed(1)}%`;
const ctx = async () => {
  const AC=window.AudioContext||window.webkitAudioContext;
  if(!AC) throw new Error('当前浏览器不支持 Web Audio API');
  if(!state.context) state.context=new AC();
  if(state.context.state==='suspended') await state.context.resume();
  return state.context;
};
const decode = async file => {
  const context=await ctx();
  try { return await context.decodeAudioData(await file.arrayBuffer()); }
  catch { throw new Error(`无法解码 ${file.name}；请尝试 WAV 或浏览器支持的音频格式`); }
};
const bufferToClip = buffer => ({sampleRate:buffer.sampleRate,channels:Array.from({length:buffer.numberOfChannels},(_,i)=>new Float32Array(buffer.getChannelData(i)))});
const sourceAudio = project => ({sampleRate:project.buffer.sampleRate,channels:Array.from({length:project.buffer.numberOfChannels},(_,i)=>project.buffer.getChannelData(i)),length:project.buffer.length,duration:project.buffer.duration});
const currentAudio = project => applyEdits(sourceAudio(project),project.history.current.operations);
function buttonStatus(){
  $('scan').disabled=!state.ref||!state.projects.length;
  const p=state.selected;
  $('playTarget').disabled=!p;
  $('previewEdit').disabled=!p;
  $('applyEdit').disabled=!p||!state.matches.some(m=>m.visible&&m.accepted);
  $('undo').disabled=!p||!p.history.canUndo;
  $('redo').disabled=!p||!p.history.canRedo;
  $('reset').disabled=!p;
  $('export').disabled=!p;
}
function setSelected(project){state.selected=project;state.matches=project?.matches||[];state.selectedHit=null;renderMatches();drawWave();buttonStatus();}
function drawWave(){
  const canvas=$('wave'),c=canvas.getContext('2d'),p=state.selected;
  c.clearRect(0,0,canvas.width,canvas.height);c.fillStyle='#0b121c';c.fillRect(0,0,canvas.width,canvas.height);
  if(!p){$('waveEnd').textContent='0.00 s';return;}
  const duration=p.buffer.duration;if(!Number.isFinite(duration)||duration<=0){$('waveEnd').textContent='0.00 s';return;}
  const data=p.buffer.getChannelData(0), width=canvas.width,height=canvas.height, mid=height/2;
  $('waveEnd').textContent=`${duration.toFixed(2)} s`;
  c.strokeStyle='#29415c';c.lineWidth=1;c.beginPath();c.moveTo(0,mid);c.lineTo(width,mid);c.stroke();
  const bucket=Math.max(1,Math.ceil(data.length/width));
  for(let x=0;x<width;x++){let min=1,max=-1;const begin=x*bucket;for(let j=begin;j<Math.min(data.length,begin+bucket);j++){const v=data[j];if(v<min)min=v;if(v>max)max=v;}c.strokeStyle='#6fa8ff';c.beginPath();c.moveTo(x,mid-max*mid*.88);c.lineTo(x,mid-min*mid*.88);c.stroke();}
  for(const m of p.matches){if(!m.visible)continue;const x=m.start/duration*width,w=Math.max(2,(m.end-m.start)/duration*width);c.fillStyle=m.accepted?'#53d7b42a':'#ff889526';c.fillRect(x,0,w,height);c.strokeStyle=m.accepted?'#57d8b5':'#ff8895';c.strokeRect(x,0,w,height);}
}
function renderTargets(){
 const el=$('targets'),select=$('targetSelect');el.replaceChildren();select.replaceChildren();
 if(!state.projects.length){el.textContent='尚无目标音频';select.add(new Option('选择目标文件',''));return;}
 state.projects.forEach((p,i)=>{const div=document.createElement('div');div.className='target-option';div.style.marginTop='5px';div.textContent=`${i+1}. ${p.file.name} · ${p.buffer.duration.toFixed(1)} 秒`;el.append(div);const o=new Option(p.file.name,String(i));select.add(o);});
 if(state.selected)select.value=String(state.projects.indexOf(state.selected));
 $('batchResults').innerHTML=state.projects.map((p,i)=>`<div class="match"><span>#${i+1}</span><span>${escapeHtml(p.file.name)}</span><span class="pill">${p.matches.length} 命中</span><button data-open="${i}">查看</button></div>`).join('');
 document.querySelectorAll('[data-open]').forEach(b=>b.onclick=()=>setSelected(state.projects[Number(b.dataset.open)]));
}
function escapeHtml(text){const d=document.createElement('div');d.textContent=text;return d.innerHTML;}
function renderMatches(){
 const root=$('matches'),p=state.selected;
 if(!p){root.innerHTML='<div class="empty">选择目标文件以查看匹配结果</div>';$('hitCount').textContent='0 个匹配';return;}
 const threshold=Number($('threshold').value)/100;
 for(const m of p.matches)m.visible=m.score>=threshold;
 const shown=p.matches.filter(m=>m.visible);$('hitCount').textContent=`${shown.length} / ${p.matches.length} 个候选`;
 if(!shown.length){root.innerHTML='<div class="empty">没有达到阈值的命中；可降低分数阈值或重新扫描。</div>';drawWave();return;}
 root.innerHTML=shown.map((m,i)=>`<div class="match"><span class="score">${formatScore(m.score)}</span><span><b>${formatTime(m.start)}</b> — ${formatTime(m.end)}<br><small>${m.polarity<0?'反相相关':'波形相关'} · ${m.accepted?'已接受':'已排除'}</small></span><label class="toggle"><input data-accept="${m.id}" type="checkbox" ${m.accepted?'checked':''}>接受</label><span class="m-actions"><button data-play="${m.id}">▶ 试听</button> <button data-select="${m.id}">定位</button></span></div>`).join('');
 root.querySelectorAll('[data-accept]').forEach(el=>el.onchange=()=>{const m=p.matches.find(x=>x.id===el.dataset.accept);m.accepted=el.checked;buttonStatus();drawWave();renderMatches();});
 root.querySelectorAll('[data-play]').forEach(el=>el.onclick=()=>playRange(p,p.matches.find(x=>x.id===el.dataset.play)));
 root.querySelectorAll('[data-select]').forEach(el=>el.onclick=()=>{state.selectedHit=p.matches.find(x=>x.id===el.dataset.select);$('selectedTime').textContent=`选中 ${formatTime(state.selectedHit.start)} — ${formatTime(state.selectedHit.end)}`;playRange(p,state.selectedHit);});
 drawWave();buttonStatus();
}
function stopPlayer(){if(state.player){try{state.player.stop();}catch{}state.player=null;}}
async function playRange(project,match=null,edited=false){stopPlayer();try{const context=await ctx();let buffer;if(edited){const audio=currentAudio(project);buffer=context.createBuffer(audio.channels.length,audio.length,audio.sampleRate);audio.channels.forEach((ch,i)=>buffer.copyToChannel(ch,i));}else buffer=project.buffer;const start=match?match.start:0,end=match?match.end:buffer.duration;state.player=playBuffer(context,buffer,{start,end});state.player.onended=()=>state.player=null;}catch(e){error(e.message);}}
function renderProgress(p,message){$('progress').style.width=`${Math.round(p*100)}%`;$('scanStatus').textContent=message;}

$('refPick').addEventListener('click',()=>$('refFile').click());
$('targetPick').addEventListener('click',()=>$('targetFiles').click());
$('folderPick').addEventListener('click',()=>$('targetFolder').click());


$('refFile').onchange=async e=>{const f=e.target.files[0];e.target.value='';if(!f)return;error('');try{const b=await decode(f);if(b.duration>30)throw new Error('参考模板最长 30 秒；请先裁剪成较短片段');state.ref={file:f,buffer:b,...toMonoAtRate(b)};$('refName').textContent=`${f.name} · ${b.duration.toFixed(2)} 秒 · ${b.numberOfChannels} 声道`;$('refPlay').disabled=false;buttonStatus();}catch(err){error(err.message);}};
$('refPlay').onclick=()=>state.ref&&playRange({buffer:state.ref.buffer},null);
async function addTargets(fileList){error('');for(const file of fileList){if(state.projects.some(p=>p.file===file))continue;try{const buffer=await decode(file);if(buffer.duration>600)throw new Error('单个音频最长 10 分钟');const samples=toMonoAtRate(buffer);state.projects.push({file,buffer,samples:samples.samples,sampleRate:samples.sampleRate,matches:[],history:new History({operations:[],labels:[]})});}catch(err){error(`${$('errors').textContent}${$('errors').textContent?'\n':''}${file.name}：${err.message}`);}}renderTargets();if(!state.selected&&state.projects.length)setSelected(state.projects[0]);buttonStatus();}
$('targetFiles').onchange=e=>{addTargets(e.target.files);e.target.value='';};$('targetFolder').onchange=e=>{addTargets(e.target.files);e.target.value='';};$('targetSelect').onchange=e=>{const p=state.projects[Number(e.target.value)];if(p)setSelected(p);};
$('threshold').oninput=e=>{$('thresholdText').textContent=`${e.target.value}%`;$('thresholdNum').value=e.target.value;if(state.projects.some(p=>p.matches.length)){$('scanStatus').textContent='阈值已变更；请重新扫描以更新候选。';}renderMatches();};$('thresholdNum').onchange=e=>{const v=Math.max(40,Math.min(99,Number(e.target.value)||40));$('threshold').value=v;$('thresholdText').textContent=`${v}%`;if(state.projects.some(p=>p.matches.length))$('scanStatus').textContent='阈值已变更；请重新扫描以更新候选。';renderMatches();};
$('scan').onclick=async()=>{if(!state.ref||!state.projects.length)return;state.abort=new AbortController();$('cancel').disabled=false;$('scan').disabled=true;error('');try{for(let idx=0;idx<state.projects.length;idx++){const p=state.projects[idx];renderProgress(0,`扫描 ${idx+1}/${state.projects.length}：${p.file.name}`);p.matches=await matchTemplate(state.ref.samples,p.samples,{sampleRate:p.sampleRate,threshold:Number($('threshold').value)/100,maxMatches:Number($('maxHits').value)||100,minGapSeconds:Number($('gap').value)||0,signal:state.abort.signal,onProgress:x=>renderProgress((idx+x)/state.projects.length,`扫描 ${idx+1}/${state.projects.length}：${p.file.name} · ${Math.round(x*100)}%`)});p.matches.forEach(m=>m.accepted=$('acceptAll').checked);if(p===state.selected)renderMatches();renderTargets();}renderProgress(1,`扫描完成：${state.projects.reduce((a,p)=>a+p.matches.length,0)} 个候选`);}catch(e){if(e.name!=='AbortError')error(e.message);else $('scanStatus').textContent='扫描已取消';}finally{state.abort=null;$('cancel').disabled=true;buttonStatus();}};
$('cancel').onclick=()=>state.abort?.abort();
$('playTarget').onclick=()=>state.selected&&playRange(state.selected);$('previewEdit').onclick=()=>state.selected&&playRange(state.selected,null,true);
$('wave').onclick=e=>{if(!state.selected)return;const r=e.currentTarget.getBoundingClientRect(),time=(e.clientX-r.left)/r.width*state.selected.buffer.duration;$('selectedTime').textContent=`定位 ${formatTime(time)}`;playRange(state.selected,{start:Math.max(0,time-1),end:Math.min(state.selected.buffer.duration,time+2)});};
function commitOps(ops,label){const p=state.selected;const previous=p.history.current;const allOps=[...previous.operations,...ops];applyEdits(sourceAudio(p),allOps);const snapshot={operations:allOps,labels:[...previous.labels,label]};p.history.push(snapshot);$('editStatus').textContent=`已应用：${label} · 当前 ${currentAudio(p).duration.toFixed(3)} 秒`;renderTargets();drawWave();buttonStatus();}
$('applyEdit').onclick=async()=>{const p=state.selected;if(!p)return;const matches=p.matches.filter(m=>m.visible&&m.accepted&&($('editScope').value==='accepted'||m===state.selectedHit));if(!matches.length){error('请先选中或接受至少一个命中');return;}error('');try{const type=$('editType').value,seconds=Number($('editSeconds').value),file=$('editAudio').files[0];let clip=null;if(['insert-audio','insert-after-audio','replace'].includes(type)){if(!file)throw new Error('此编辑动作需要选择插入/替换音频');const b=await decode(file);clip=bufferToClip(b);const sr=p.buffer.sampleRate;if(b.sampleRate!==sr)throw new Error(`编辑音频采样率 ${b.sampleRate} 与目标 ${sr} 不同；请先转换成相同采样率`);}const ops=[];for(const m of matches){if(type==='insert-silence')ops.push({type,start:m.start,duration:seconds});else if(type==='insert-after-silence')ops.push({type:'insert-silence',start:m.end,duration:seconds});else if(type==='insert-audio')ops.push({type,start:m.start,clip});else if(type==='insert-after-audio')ops.push({type:'insert-audio',start:m.end,clip});else if(type==='replace')ops.push({type,start:m.start,end:m.end,clip});else if(type==='delete')ops.push({type,start:m.start,end:m.end});}commitOps(ops,`${type} × ${matches.length}`);}catch(e){error(e.message);}};
$('edgeApply').onclick=async()=>{const p=state.selected;if(!p){error('请先选择目标文件');return;}try{let prependClip=null,appendClip=null;const a=$('headAudio').files[0],b=$('tailAudio').files[0];if(a){const d=await decode(a);if(d.sampleRate!==p.buffer.sampleRate)throw new Error('片头音频采样率需与目标相同');prependClip=bufferToClip(d);}if(b){const d=await decode(b);if(d.sampleRate!==p.buffer.sampleRate)throw new Error('片尾音频采样率需与目标相同');appendClip=bufferToClip(d);}const ops=[];const hs=Number($('headSilence').value)||0,ts=Number($('tailSilence').value)||0;if(hs)ops.push({type:'insert-silence',start:0,duration:hs});if(prependClip)ops.push({type:'insert-audio',start:0,clip:prependClip});const end=p.buffer.duration;if(appendClip)ops.push({type:'insert-audio',start:end,clip:appendClip});if(ts)ops.push({type:'insert-silence',start:end,duration:ts});commitOps(ops,'全局首尾补音');}catch(e){error(e.message);}};
$('undo').onclick=()=>{const p=state.selected;if(p?.history.canUndo){p.history.undo();commitView('已撤销');}};$('redo').onclick=()=>{const p=state.selected;if(p?.history.canRedo){p.history.redo();commitView('已重做');}};$('reset').onclick=()=>{const p=state.selected;if(p){p.history.reset({operations:[],labels:[]});commitView('已重置为原始音频');}};
function commitView(msg){const p=state.selected;$('editStatus').textContent=msg;drawWave();buttonStatus();}
$('chooseOutput').addEventListener('click',async()=>{if(!window.showDirectoryPicker){$('outputFolder').textContent='此浏览器不支持选择输出目录，将使用下载方式。';return;}try{state.outputDirectory=await window.showDirectoryPicker({mode:'readwrite'});$('outputFolder').textContent=`已选择输出文件夹：${state.outputDirectory.name}`;}catch(e){if(e.name!=='AbortError')error(`无法选择文件夹：${e.message}`);}});
$('export').addEventListener('click',async()=>{try{const p=state.selected;if(!p)throw new Error('请先导入目标音频');const blob=encodeWav(currentAudio(p));const filename=`${p.file.name.replace(/\.[^.]+$/,'')}_edited.wav`;if(state.outputDirectory){await writeWavToDirectory(state.outputDirectory,filename,blob);$('editStatus').textContent=`已保存到 ${state.outputDirectory.name}/${filename}`;}else downloadBlob(blob,filename);}catch(e){error(e.message);}});
