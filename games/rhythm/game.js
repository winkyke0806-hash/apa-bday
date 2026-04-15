/* ═══ BIRTHDAY BEATS — Rhythm Game ═══ */

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
function resize(){canvas.width=innerWidth;canvas.height=innerHeight;}
window.addEventListener('resize',resize);resize();

let audioCtx=null;
function initAudio(){if(!audioCtx)audioCtx=new(window.AudioContext||window.webkitAudioContext)();}
function beep(f,d,t='sine',v=0.06){if(!audioCtx)return;const o=audioCtx.createOscillator(),g=audioCtx.createGain();o.type=t;o.frequency.value=f;g.gain.value=v;g.gain.exponentialRampToValueAtTime(0.001,audioCtx.currentTime+d);o.connect(g);g.connect(audioCtx.destination);o.start();o.stop(audioCtx.currentTime+d);}

const LANES=4;
const KEYS=['d','f','j','k'];
const LANE_COLORS=['#e94560','#f6ad55','#22c55e','#3b82f6'];
const LANE_NAMES=['D','F','J','K'];
const HIT_Y_FRAC=0.82;
const NOTE_SPEED=4;
const SONG_LENGTH=200; // notes total

let notes=[];
let score=0,combo=0,maxCombo=0,streak=0;
let highScore=parseInt(localStorage.getItem('rhythm-high')||'0');
let gameActive=false;
let spawnTimer=0,noteIndex=0;
let particles=[];
let hitAnim={text:'',timer:0,color:''};
let frameCount=0;

// Generate a "song" — pattern of notes
function generateSong(){
  const song=[];
  for(let i=0;i<SONG_LENGTH;i++){
    const beat=20+i*12+Math.floor(Math.random()*6); // timing
    const lane=Math.floor(Math.random()*LANES);
    // Occasionally double notes
    song.push({beat,lane});
    if(i>30&&Math.random()<0.2){
      const lane2=(lane+1+Math.floor(Math.random()*2))%LANES;
      song.push({beat:beat+1,lane:lane2});
    }
  }
  return song.sort((a,b)=>a.beat-b.beat);
}

let song=[];
let songBeat=0;

function spawnNote(lane){
  notes.push({lane,y:-20,hit:false,missed:false});
}

// Input
const pressed={};
window.addEventListener('keydown',e=>{
  const k=e.key.toLowerCase();
  if(!pressed[k]&&KEYS.includes(k)){
    pressed[k]=true;
    checkHit(KEYS.indexOf(k));
  }
});
window.addEventListener('keyup',e=>{pressed[e.key.toLowerCase()]=false;});

// Touch: divide screen into 4 zones
canvas.addEventListener('touchstart',e=>{
  e.preventDefault();
  const x=e.touches[0].clientX;
  const lane=Math.floor(x/(canvas.width/LANES));
  checkHit(Math.min(LANES-1,Math.max(0,lane)));
});

function checkHit(lane){
  if(!gameActive)return;
  const hitY=canvas.height*HIT_Y_FRAC;
  const tolerance=45;

  let bestNote=null,bestDist=Infinity;
  notes.forEach(n=>{
    if(n.lane===lane&&!n.hit&&!n.missed){
      const dist=Math.abs(n.y-hitY);
      if(dist<tolerance&&dist<bestDist){bestNote=n;bestDist=dist;}
    }
  });

  if(bestNote){
    bestNote.hit=true;
    const accuracy=bestDist<15?'PERFECT':bestDist<30?'GREAT':'OK';
    const pts=accuracy==='PERFECT'?100:accuracy==='GREAT'?50:25;
    score+=pts*(1+Math.floor(combo/5));
    combo++;streak++;
    if(combo>maxCombo)maxCombo=combo;

    // SFX
    beep(440+lane*100,0.1,'sine',0.08);

    // Hit animation
    hitAnim={text:accuracy,timer:20,color:accuracy==='PERFECT'?'#f6ad55':accuracy==='GREAT'?'#22c55e':'#3b82f6'};
    const el=document.getElementById('hit-text');
    el.textContent=accuracy+(combo>3?` ${combo}x`:'');
    el.style.color=hitAnim.color;
    el.classList.add('show');
    setTimeout(()=>el.classList.remove('show'),300);

    // Particles
    const lx=laneX(lane);
    for(let i=0;i<8;i++){
      particles.push({x:lx,y:hitY,vx:(Math.random()-0.5)*5,vy:-2-Math.random()*3,life:15,maxLife:15,size:3+Math.random()*3,color:LANE_COLORS[lane]});
    }
  }else{
    combo=0;
    beep(150,0.1,'square',0.04);
  }
}

function laneX(l){return(l+0.5)*(canvas.width/LANES);}

function update(){
  if(!gameActive)return;
  frameCount++;
  songBeat++;

  // Spawn notes from song
  while(noteIndex<song.length&&song[noteIndex].beat<=songBeat){
    spawnNote(song[noteIndex].lane);
    noteIndex++;
  }

  // Move notes
  notes.forEach(n=>{
    if(!n.hit)n.y+=NOTE_SPEED+(frameCount*0.002); // gradual speedup
  });

  // Miss detection
  const hitY=canvas.height*HIT_Y_FRAC;
  notes.forEach(n=>{
    if(!n.hit&&!n.missed&&n.y>hitY+50){
      n.missed=true;
      combo=0;streak=0;
    }
  });

  // Cleanup
  notes=notes.filter(n=>n.y<canvas.height+50||n.hit);

  // Particles
  particles.forEach(p=>{p.x+=p.vx;p.y+=p.vy;p.vy+=0.1;p.life--;});
  particles=particles.filter(p=>p.life>0);

  // Song end
  if(noteIndex>=song.length&&notes.every(n=>n.hit||n.missed||n.y>canvas.height)){
    endGame();
  }

  // HUD
  document.getElementById('hud-score').textContent=score;
  document.getElementById('hud-combo').textContent=combo+'x';
  document.getElementById('hud-streak').textContent='🔥 '+streak;
}

function render(){
  const w=canvas.width,h=canvas.height;
  ctx.fillStyle='#0a0f1a';
  ctx.fillRect(0,0,w,h);

  const laneW=w/LANES;
  const hitY=h*HIT_Y_FRAC;

  // Lane backgrounds
  for(let l=0;l<LANES;l++){
    ctx.fillStyle=l%2===0?'rgba(255,255,255,0.015)':'rgba(255,255,255,0.025)';
    ctx.fillRect(l*laneW,0,laneW,h);

    // Lane dividers
    ctx.strokeStyle='rgba(255,255,255,0.06)';
    ctx.lineWidth=1;
    ctx.beginPath();ctx.moveTo(l*laneW,0);ctx.lineTo(l*laneW,h);ctx.stroke();
  }

  // Hit line
  ctx.fillStyle='rgba(255,255,255,0.08)';
  ctx.fillRect(0,hitY-2,w,4);

  // Hit zone indicators
  for(let l=0;l<LANES;l++){
    const lx=laneX(l);
    ctx.strokeStyle=LANE_COLORS[l]+'44';
    ctx.lineWidth=2;
    ctx.beginPath();ctx.arc(lx,hitY,22,0,Math.PI*2);ctx.stroke();

    // Key label
    ctx.fillStyle='rgba(255,255,255,0.15)';
    ctx.font='bold 14px JetBrains Mono';
    ctx.textAlign='center';
    ctx.fillText(LANE_NAMES[l],lx,hitY+5);

    // Flash when pressed
    if(pressed[KEYS[l]]){
      ctx.fillStyle=LANE_COLORS[l]+'33';
      ctx.fillRect(l*laneW,0,laneW,h);
      ctx.fillStyle=LANE_COLORS[l]+'44';
      ctx.beginPath();ctx.arc(lx,hitY,25,0,Math.PI*2);ctx.fill();
    }
  }

  // Notes
  notes.forEach(n=>{
    if(n.hit)return;
    const lx=laneX(n.lane);
    const alpha=n.missed?0.3:1;
    ctx.globalAlpha=alpha;

    // Note glow
    ctx.fillStyle=LANE_COLORS[n.lane]+'22';
    ctx.beginPath();ctx.arc(lx,n.y,18,0,Math.PI*2);ctx.fill();

    // Note body
    ctx.fillStyle=LANE_COLORS[n.lane];
    ctx.beginPath();ctx.arc(lx,n.y,12,0,Math.PI*2);ctx.fill();

    // Note highlight
    ctx.fillStyle='rgba(255,255,255,0.25)';
    ctx.beginPath();ctx.arc(lx-3,n.y-3,5,0,Math.PI*2);ctx.fill();

    ctx.globalAlpha=1;
  });

  // Particles
  particles.forEach(p=>{
    ctx.globalAlpha=p.life/p.maxLife;
    ctx.fillStyle=p.color;
    ctx.beginPath();ctx.arc(p.x,p.y,p.size*(p.life/p.maxLife),0,Math.PI*2);ctx.fill();
  });
  ctx.globalAlpha=1;

  // Combo fire trail on sides when combo > 10
  if(combo>10){
    const intensity=Math.min(1,(combo-10)/20);
    ctx.fillStyle=`rgba(246,173,85,${intensity*0.05})`;
    ctx.fillRect(0,0,30,h);
    ctx.fillRect(w-30,0,30,h);
  }
}

function gameLoop(){update();render();requestAnimationFrame(gameLoop);}

function startGame(){
  initAudio();
  song=generateSong();
  notes=[];score=0;combo=0;maxCombo=0;streak=0;
  noteIndex=0;songBeat=0;frameCount=0;
  particles=[];gameActive=true;
  document.getElementById('title-screen').classList.add('hidden');
  document.getElementById('end-screen').classList.add('hidden');
}

function endGame(){
  gameActive=false;
  if(score>highScore){highScore=score;localStorage.setItem('rhythm-high',highScore.toString());}
  setTimeout(()=>{
    document.getElementById('final-score').textContent=score;
    document.getElementById('final-combo').textContent=maxCombo;
    document.getElementById('final-high').textContent=highScore;
    document.getElementById('end-screen').classList.remove('hidden');
  },500);
}

document.getElementById('btn-play').addEventListener('click',startGame);
document.getElementById('btn-retry').addEventListener('click',startGame);
gameLoop();
