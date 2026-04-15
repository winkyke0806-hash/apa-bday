/* ═══ BIRTHDAY CATCH ═══ */
const canvas=document.getElementById('game'),ctx=canvas.getContext('2d');
function resize(){canvas.width=innerWidth;canvas.height=innerHeight;}
window.addEventListener('resize',resize);resize();

let audioCtx;function initAudio(){if(!audioCtx)audioCtx=new(window.AudioContext||window.webkitAudioContext)();}
function beep(f,d,t='sine',v=0.06){if(!audioCtx)return;const o=audioCtx.createOscillator(),g=audioCtx.createGain();o.type=t;o.frequency.value=f;g.gain.value=v;g.gain.exponentialRampToValueAtTime(0.001,audioCtx.currentTime+d);o.connect(g);g.connect(audioCtx.destination);o.start();o.stop(audioCtx.currentTime+d);}

const ITEMS=[
  {emoji:'🎁',pts:10,color:'#e94560'},{emoji:'🎂',pts:15,color:'#ec4899'},{emoji:'⭐',pts:20,color:'#f6ad55'},
  {emoji:'🧁',pts:8,color:'#a855f7'},{emoji:'🎈',pts:12,color:'#3b82f6'},{emoji:'🍬',pts:5,color:'#22c55e'},
];
const BOMB={emoji:'💣',pts:-30,color:'#555'};
const TRAY_W=100,TRAY_H=16;

let tray={x:0},items=[],particles=[],floats=[];
let score=0,lives=3,timer=60,gameActive=false,frameCount=0,spawnRate=40;
let highScore=parseInt(localStorage.getItem('catch-high')||'0');

canvas.addEventListener('mousemove',e=>tray.x=e.clientX);
canvas.addEventListener('touchmove',e=>{e.preventDefault();tray.x=e.touches[0].clientX;});

function update(){
  if(!gameActive)return;
  frameCount++;
  const w=canvas.width,h=canvas.height;
  const trayY=h-50;

  // Timer
  if(frameCount%60===0){timer--;document.getElementById('hud-time').textContent=timer;if(timer<=0)endGame();}

  // Spawn
  spawnRate=Math.max(15,40-Math.floor(frameCount/300));
  if(frameCount%spawnRate===0){
    const isBomb=Math.random()<0.15;
    const item=isBomb?BOMB:ITEMS[Math.floor(Math.random()*ITEMS.length)];
    items.push({...item,x:30+Math.random()*(w-60),y:-20,vy:2+Math.random()*2+frameCount*0.001,rot:Math.random()*0.5-0.25});
  }

  // Move items
  items.forEach(it=>{it.y+=it.vy;it.rot+=0.02;
    // Catch
    if(it.y+15>trayY&&it.y<trayY+TRAY_H&&Math.abs(it.x-tray.x)<TRAY_W/2+15){
      it.caught=true;
      score+=it.pts;if(score<0)score=0;
      if(it.pts<0){lives--;beep(100,0.2,'sawtooth',0.08);document.getElementById('hud-lives').textContent='❤️'.repeat(Math.max(0,lives))+'🖤'.repeat(Math.max(0,3-lives));if(lives<=0)endGame();}
      else{beep(600+Math.random()*200,0.08,'sine',0.08);}
      floats.push({x:it.x,y:trayY-10,text:(it.pts>0?'+':'')+it.pts,life:25,color:it.color});
      for(let i=0;i<6;i++)particles.push({x:it.x,y:trayY,vx:(Math.random()-0.5)*4,vy:-2-Math.random()*2,life:12,maxLife:12,size:3,color:it.color});
    }
    if(it.y>h+30)it.caught=true;
  });
  items=items.filter(i=>!i.caught);

  floats.forEach(f=>{f.y-=1.2;f.life--;});floats=floats.filter(f=>f.life>0);
  particles.forEach(p=>{p.x+=p.vx;p.y+=p.vy;p.vy+=0.15;p.life--;});particles=particles.filter(p=>p.life>0);
  document.getElementById('hud-score').textContent=score;
}

function render(){
  const w=canvas.width,h=canvas.height;
  ctx.fillStyle='#0a0f1a';ctx.fillRect(0,0,w,h);
  ctx.strokeStyle='rgba(255,255,255,0.03)';ctx.lineWidth=1;
  for(let x=0;x<w;x+=40){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,h);ctx.stroke();}

  const trayY=h-50;
  // Tray
  ctx.fillStyle='rgba(0,0,0,0.3)';ctx.beginPath();ctx.roundRect(tray.x-TRAY_W/2+2,trayY+2,TRAY_W,TRAY_H,6);ctx.fill();
  const tg=ctx.createLinearGradient(0,trayY,0,trayY+TRAY_H);tg.addColorStop(0,'#f6ad55');tg.addColorStop(1,'#d97706');
  ctx.fillStyle=tg;ctx.beginPath();ctx.roundRect(tray.x-TRAY_W/2,trayY,TRAY_W,TRAY_H,6);ctx.fill();
  ctx.fillStyle='rgba(255,255,255,0.2)';ctx.fillRect(tray.x-TRAY_W/2+4,trayY+2,TRAY_W-8,TRAY_H*0.35);

  // Items
  items.forEach(it=>{
    ctx.save();ctx.translate(it.x,it.y);ctx.rotate(it.rot);
    ctx.font='24px sans-serif';ctx.textAlign='center';ctx.fillText(it.emoji,0,8);
    ctx.restore();
  });

  // Particles
  particles.forEach(p=>{ctx.globalAlpha=p.life/p.maxLife;ctx.fillStyle=p.color;ctx.beginPath();ctx.arc(p.x,p.y,p.size*(p.life/p.maxLife),0,Math.PI*2);ctx.fill();});
  ctx.globalAlpha=1;

  // Floating texts
  floats.forEach(f=>{ctx.globalAlpha=f.life/25;ctx.font="bold 12px 'Press Start 2P',monospace";ctx.textAlign='center';ctx.fillStyle=f.color;ctx.fillText(f.text,f.x,f.y);});
  ctx.globalAlpha=1;
}

function gameLoop(){update();render();requestAnimationFrame(gameLoop);}

function startGame(){
  initAudio();score=0;lives=3;timer=60;frameCount=0;spawnRate=40;
  items=[];particles=[];floats=[];gameActive=true;tray.x=canvas.width/2;
  document.getElementById('hud-lives').textContent='❤️❤️❤️';document.getElementById('hud-time').textContent=60;
  document.getElementById('title-screen').classList.add('hidden');document.getElementById('end-screen').classList.add('hidden');
}

function endGame(){
  gameActive=false;
  if(score>highScore){highScore=score;localStorage.setItem('catch-high',highScore.toString());}
  setTimeout(()=>{document.getElementById('final-score').textContent=score;document.getElementById('end-screen').classList.remove('hidden');},400);
}

document.getElementById('btn-play').addEventListener('click',startGame);
document.getElementById('btn-retry').addEventListener('click',startGame);
gameLoop();
