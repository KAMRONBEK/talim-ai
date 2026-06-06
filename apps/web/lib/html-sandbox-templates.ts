import type { HtmlSandboxPayload } from '@talim/types';

function num(params: HtmlSandboxPayload['params'], key: string, fallback: number): number {
  const v = params?.[key];
  return typeof v === 'number' ? v : fallback;
}

export function buildSandboxHtml(payload: HtmlSandboxPayload): string {
  if (payload.template === 'custom' && payload.html) {
    return payload.html;
  }

  const p = payload.params ?? {};

  if (payload.template === 'pendulum') {
    const length = num(p, 'length', 2);
    const gravity = num(p, 'gravity', 9.8);
    const initialAngle = num(p, 'initialAngle', num(p, 'angle', 30));
    return `<!DOCTYPE html><html><head><style>
      *{box-sizing:border-box;margin:0;padding:0}
      body{display:flex;align-items:center;justify-content:center;height:100vh;background:#1e1e2e;color:#cdd6f4;font-family:sans-serif}
      canvas{width:100%;max-width:520px;height:280px;background:#11111b;border-radius:8px}
    </style></head><body><canvas id="c" width="520" height="280"></canvas><script>
      const canvas=document.getElementById('c');
      const ctx=canvas.getContext('2d');
      const origin={x:260,y:42};
      const lengthMeters=Math.max(0.5,Math.min(5,${length}));
      const Lpx=70+lengthMeters*45;
      const g=${gravity};
      let angle=${initialAngle}*Math.PI/180;
      let velocity=0;
      let last=performance.now();
      function step(now){
        const dt=Math.min(0.033,(now-last)/1000);
        last=now;
        const accel=-(g/lengthMeters)*Math.sin(angle);
        velocity=(velocity+accel*dt)*0.995;
        angle+=velocity*dt;
        const x=origin.x+Lpx*Math.sin(angle);
        const y=origin.y+Lpx*Math.cos(angle);
        ctx.clearRect(0,0,520,280);
        ctx.strokeStyle='rgba(137,180,250,.2)';
        ctx.lineWidth=1;
        ctx.beginPath();
        ctx.arc(origin.x,origin.y,Lpx,-Math.PI,0);
        ctx.stroke();
        ctx.strokeStyle='#89b4fa';
        ctx.lineWidth=3;
        ctx.beginPath();
        ctx.moveTo(origin.x,origin.y);
        ctx.lineTo(x,y);
        ctx.stroke();
        ctx.fillStyle='#cdd6f4';
        ctx.beginPath();
        ctx.arc(origin.x,origin.y,5,0,Math.PI*2);
        ctx.fill();
        ctx.fillStyle='rgba(243,139,168,.25)';
        ctx.beginPath();
        ctx.arc(x,y,24,0,Math.PI*2);
        ctx.fill();
        ctx.fillStyle='#f38ba8';
        ctx.beginPath();
        ctx.arc(x,y,14,0,Math.PI*2);
        ctx.fill();
        ctx.fillStyle='#cdd6f4';
        ctx.font='12px sans-serif';
        ctx.fillText('length: '+lengthMeters+' m   gravity: '+g+' m/s^2',16,258);
        requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    </script></body></html>`;
  }

  if (payload.template === 'projectile') {
    const angle = num(p, 'angle', 45);
    const speed = num(p, 'speed', 40);
    return `<!DOCTYPE html><html><head><style>
      *{margin:0;padding:0}body{display:flex;align-items:center;justify-content:center;height:100vh;background:#1e1e2e}
      canvas{background:#11111b;border-radius:8px}
    </style></head><body><canvas id="c" width="400" height="280"></canvas><script>
      const canvas=document.getElementById('c'),ctx=canvas.getContext('2d');
      const rad=${angle}*Math.PI/180,vx=${speed}*Math.cos(rad),vy=-${speed}*Math.sin(rad);
      let x=20,y=240,vy2=vy,g=0.4;const trail=[];
      function step(){vy2+=g;y+=vy2;x+=vx;trail.push({x,y});if(trail.length>80)trail.shift();
        if(y<260){requestAnimationFrame(step);}ctx.clearRect(0,0,400,280);
        ctx.strokeStyle='#45475a';ctx.beginPath();ctx.moveTo(0,250);ctx.lineTo(400,250);ctx.stroke();
        ctx.fillStyle='#a6e3a1';trail.forEach((p,i)=>{ctx.globalAlpha=i/trail.length;ctx.fillRect(p.x,p.y,3,3);});
        ctx.globalAlpha=1;ctx.fillStyle='#f38ba8';ctx.beginPath();ctx.arc(x,y,8,0,Math.PI*2);ctx.fill();
        if(y<260)requestAnimationFrame(step);}step();
    </script></body></html>`;
  }

  if (payload.template === 'number-line') {
    const min = num(p, 'min', -5);
    const max = num(p, 'max', 5);
    const highlight = num(p, 'highlight', 2);
    return `<!DOCTYPE html><html><head><style>
      body{margin:0;display:flex;align-items:center;justify-content:center;height:100vh;background:#1e1e2e;color:#cdd6f4;font-family:sans-serif}
      .line{position:relative;width:360px;height:40px;border-top:2px solid #89b4fa;margin-top:20px}
      .tick{position:absolute;top:-6px;width:2px;height:12px;background:#585b70}
      .label{position:absolute;top:14px;font-size:11px;transform:translateX(-50%)}
      .dot{position:absolute;top:-10px;width:14px;height:14px;border-radius:50%;background:#f38ba8;transform:translateX(-50%)}
    </style></head><body><div class="line" id="line"></div><script>
      const min=${min},max=${max},hl=${highlight},line=document.getElementById('line');
      for(let i=min;i<=max;i++){const pct=(i-min)/(max-min)*100;
        const t=document.createElement('div');t.className='tick';t.style.left=pct+'%';line.appendChild(t);
        const l=document.createElement('div');l.className='label';l.style.left=pct+'%';l.textContent=i;line.appendChild(l);}
      const d=document.createElement('div');d.className='dot';d.style.left=((hl-min)/(max-min)*100)+'%';line.appendChild(d);
    </script></body></html>`;
  }

  return '<p>Unknown template</p>';
}
