const TAU = Math.PI * 2;
const clamp01 = value => Math.max(0, Math.min(1, value));
const TRAFFIC_REGIONS = Object.freeze(["pretoria", "bloemfontein", "cape-town", "durban", "gqeberha", "mbombela"]);

function smoothstep(value) {
  const t = clamp01(value);
  return t * t * (3 - 2 * t);
}

function landmarkX(progress, width) {
  const travel = smoothstep((progress - 0.61) / 0.31);
  return width + 220 - travel * (width + 520);
}

function landmarkAlpha(progress) {
  const fadeIn = smoothstep((progress - 0.58) / 0.08);
  const fadeOut = 1 - smoothstep((progress - 0.91) / 0.07);
  return clamp01(fadeIn * fadeOut);
}

function strokeBuilding(context, x, y, scale, accent) {
  context.save();
  context.translate(x, y);
  context.scale(scale, scale);
  context.strokeStyle = "rgba(38,45,47,.72)";
  context.fillStyle = "rgba(239,224,194,.72)";
  context.lineWidth = 4;
  context.beginPath();
  context.moveTo(-115, 0);
  context.lineTo(-115, -46);
  context.lineTo(-72, -46);
  context.lineTo(-72, -76);
  context.lineTo(-58, -96);
  context.lineTo(-45, -76);
  context.lineTo(-45, -46);
  context.lineTo(45, -46);
  context.lineTo(45, -76);
  context.lineTo(58, -96);
  context.lineTo(72, -76);
  context.lineTo(72, -46);
  context.lineTo(115, -46);
  context.lineTo(115, 0);
  context.closePath();
  context.fill();
  context.stroke();
  context.fillStyle = accent;
  context.globalAlpha *= 0.78;
  for (let i = -4; i <= 4; i += 1) context.fillRect(i * 22 - 5, -35, 10, 17);
  context.restore();
}

function drawFarmSilos(context, x, y, scale) {
  context.save(); context.translate(x, y); context.scale(scale, scale);
  context.fillStyle = "rgba(217,211,191,.78)";
  context.strokeStyle = "rgba(72,70,62,.58)";
  context.lineWidth = 3;
  [-42, 0, 42].forEach((dx, i) => {
    context.beginPath();
    context.rect(dx - 19, -70 - i * 6, 38, 70 + i * 6);
    context.fill(); context.stroke();
    context.beginPath();
    context.ellipse(dx, -70 - i * 6, 19, 8, 0, Math.PI, TAU);
    context.fill(); context.stroke();
  });
  context.strokeStyle = "rgba(80,63,48,.6)";
  context.beginPath(); context.moveTo(-78,0); context.lineTo(-58,-50); context.lineTo(-38,0); context.stroke();
  context.restore();
}

function drawKarooPillars(context, x, y, scale) {
  context.save(); context.translate(x,y); context.scale(scale,scale);
  const rocks=[[-75,66,112],[-10,82,146],[66,58,98]];
  for (const [dx,w,h] of rocks) {
    context.fillStyle = "rgba(133,78,53,.78)";
    context.beginPath();
    context.moveTo(dx-w/2,0); context.lineTo(dx-w*.34,-h*.55); context.lineTo(dx-w*.20,-h);
    context.lineTo(dx+w*.20,-h*.93); context.lineTo(dx+w*.38,-h*.48); context.lineTo(dx+w/2,0); context.closePath(); context.fill();
    context.strokeStyle = "rgba(76,49,39,.28)"; context.lineWidth=4;
    context.beginPath(); context.moveTo(dx-w*.28,-h*.42); context.lineTo(dx+w*.32,-h*.49); context.stroke();
  }
  context.restore();
}

function drawStadium(context, x, y, scale) {
  context.save(); context.translate(x,y); context.scale(scale,scale);
  context.strokeStyle="rgba(234,133,58,.84)"; context.lineWidth=9; context.lineCap="round";
  [-90,-52,-15,22,59,96].forEach((dx,i)=>{
    context.beginPath(); context.moveTo(dx,0); context.quadraticCurveTo(dx+(i%2?13:-13),-96,dx+(i%2?28:-28),-142); context.stroke();
  });
  context.fillStyle="rgba(80,97,89,.72)"; context.beginPath(); context.ellipse(4,-14,126,31,0,Math.PI,TAU); context.fill();
  context.restore();
}

function drawTableMountainCable(context, x, y, scale) {
  context.save(); context.translate(x,y); context.scale(scale,scale);
  context.fillStyle="rgba(69,86,92,.64)";
  context.beginPath(); context.moveTo(-135,0); context.lineTo(-88,-83); context.lineTo(-38,-104); context.lineTo(68,-104); context.lineTo(135,-19); context.lineTo(135,0); context.closePath(); context.fill();
  context.strokeStyle="rgba(48,57,60,.58)"; context.lineWidth=3;
  context.beginPath(); context.moveTo(-82,-118); context.lineTo(76,-92); context.stroke();
  const carX=-5 + Math.sin(performance.now()*0.00035)*42;
  context.fillStyle="rgba(221,76,49,.85)"; context.fillRect(carX,-112,22,16);
  context.restore();
}

function drawDurbanArch(context, x, y, scale) {
  context.save(); context.translate(x,y); context.scale(scale,scale);
  context.strokeStyle="rgba(238,238,226,.82)"; context.lineWidth=11; context.lineCap="round";
  context.beginPath(); context.moveTo(-112,0); context.quadraticCurveTo(0,-175,112,0); context.stroke();
  context.strokeStyle="rgba(74,88,92,.62)"; context.lineWidth=5;
  context.beginPath(); context.moveTo(-104,-2); context.lineTo(104,-2); context.stroke();
  context.restore();
}

function drawLighthouse(context, x, y, scale) {
  context.save(); context.translate(x,y); context.scale(scale,scale);
  context.fillStyle="rgba(241,239,226,.84)";
  context.beginPath(); context.moveTo(-27,0); context.lineTo(-18,-105); context.lineTo(18,-105); context.lineTo(27,0); context.closePath(); context.fill();
  context.fillStyle="rgba(202,70,48,.85)"; context.fillRect(-22,-89,44,17); context.fillRect(-29,-117,58,14);
  context.fillStyle="rgba(49,58,61,.72)"; context.fillRect(-15,-132,30,15);
  const beam=Math.sin(performance.now()*0.0012)*0.35;
  context.save(); context.translate(0,-124); context.rotate(beam); context.fillStyle="rgba(255,247,177,.13)";
  context.beginPath(); context.moveTo(0,0); context.lineTo(180,-36); context.lineTo(180,36); context.closePath(); context.fill(); context.restore();
  context.restore();
}

function drawGoldenGate(context, x, y, scale) {
  context.save(); context.translate(x,y); context.scale(scale,scale);
  context.fillStyle="rgba(174,91,54,.78)";
  context.beginPath(); context.moveTo(-138,0); context.lineTo(-118,-80); context.lineTo(-70,-126); context.lineTo(-18,-103); context.lineTo(22,-139); context.lineTo(72,-108); context.lineTo(124,-72); context.lineTo(142,0); context.closePath(); context.fill();
  context.fillStyle="rgba(232,171,98,.34)"; context.beginPath(); context.ellipse(-18,-65,38,44,0,0,TAU); context.fill();
  context.restore();
}

function drawRiverBridge(context, x, y, scale) {
  context.save(); context.translate(x,y); context.scale(scale,scale);
  context.fillStyle="rgba(64,135,157,.34)"; context.fillRect(-160,-13,320,22);
  context.strokeStyle="rgba(77,68,57,.76)"; context.lineWidth=6;
  context.beginPath(); context.moveTo(-154,-24); context.lineTo(154,-24); context.stroke();
  for(let i=-3;i<=3;i+=1){ context.beginPath(); context.moveTo(i*46,-24); context.lineTo(i*46,5); context.stroke(); }
  context.fillStyle="rgba(92,126,60,.65)";
  for(let i=-4;i<=4;i+=1){ context.beginPath(); context.ellipse(i*38,8,26,9,0,0,TAU); context.fill(); }
  context.restore();
}

const LANDMARK_DRAWERS = Object.freeze({
  pretoria: (c,x,y,s,a)=>strokeBuilding(c,x,y,s,a),
  bloemfontein: drawFarmSilos,
  "graaff-reinet": drawKarooPillars,
  mbombela: drawStadium,
  "cape-town": drawTableMountainCable,
  durban: drawDurbanArch,
  gqeberha: drawLighthouse,
  clarens: drawGoldenGate,
  upington: drawRiverBridge
});

export function drawSignatureLandmark(context, regionState, width, groundY, quality = "desktop") {
  if (!regionState?.current) return;
  const progress = regionState.progress;
  const alpha = landmarkAlpha(progress) * (1 - regionState.transition * 0.8);
  if (alpha <= 0.01) return;
  const drawer = LANDMARK_DRAWERS[regionState.current.id];
  if (!drawer) return;
  const x = landmarkX(progress, width);
  const scale = (quality === "mobile" ? 0.72 : 0.88) + Math.sin(progress * Math.PI) * 0.08;
  context.save();
  context.globalAlpha *= alpha;
  drawer(context, x, groundY - 18, scale, regionState.current.accent);
  context.restore();
}

function drawDistantVehicle(context, x, y, scale, kind = "taxi") {
  context.save(); context.translate(x,y); context.scale(scale,scale);
  context.fillStyle = kind === "truck" ? "rgba(224,139,59,.72)" : "rgba(235,235,218,.72)";
  context.beginPath(); context.roundRect?.(-46,-20,92,23,6); context.fill();
  if (!context.roundRect) context.fillRect(-46,-20,92,23);
  if (kind === "taxi") { context.fillStyle="rgba(52,78,84,.65)"; context.fillRect(-31,-15,45,9); }
  context.fillStyle="rgba(43,43,40,.76)";
  context.beginPath(); context.arc(-27,5,8,0,TAU); context.arc(28,5,8,0,TAU); context.fill();
  context.restore();
}

function drawDustDevil(context, x, y, scale) {
  context.save(); context.translate(x,y); context.scale(scale,scale);
  context.strokeStyle="rgba(217,169,104,.25)"; context.lineWidth=4;
  const phase=performance.now()*0.004;
  for(let i=0;i<4;i+=1){
    context.beginPath();
    for(let p=0;p<=18;p+=1){
      const yy=-p*5; const radius=8+p*1.7; const xx=Math.sin(phase+p*0.7+i)*radius;
      if(p===0) context.moveTo(xx,yy); else context.lineTo(xx,yy);
    }
    context.stroke();
  }
  context.restore();
}

export function drawAmbientLife(context, regionState, distance, width, groundY, quality = "desktop") {
  if (!regionState?.display) return;
  const region = regionState.display.id;
  const time = performance.now() * 0.001;
  context.save();

  // Distant traffic gives the route a lived-in feel without affecting collisions.
  if (TRAFFIC_REGIONS.includes(region)) {
    const x = width - ((distance * 0.13 + regionState.displaySerial * 317) % (width + 480));
    drawDistantVehicle(context, x, groundY - 116, 0.42, region === "bloemfontein" ? "truck" : "taxi");
  }

  if (region === "durban" || region === "gqeberha") {
    context.strokeStyle="rgba(245,252,255,.28)"; context.lineWidth=3;
    for(let i=0;i<(quality === "mobile" ? 2 : 4);i+=1){
      const y=groundY-188+i*18;
      const x=((time*54+i*250)%(width+360))-180;
      context.beginPath(); context.moveTo(x,y); context.quadraticCurveTo(x+55,y-8,x+120,y); context.stroke();
    }
  }

  if (region === "upington") {
    const x=width-((distance*0.08+430)%(width+700));
    drawDustDevil(context,x,groundY-16,0.65);
  }

  if (region === "mbombela" && Math.sin(time*0.55 + regionState.displaySerial) > 0.72) {
    context.strokeStyle="rgba(255,250,202,.32)"; context.lineWidth=2;
    const lx=width*0.76;
    context.beginPath(); context.moveTo(lx,80); context.lineTo(lx-18,126); context.lineTo(lx+2,122); context.lineTo(lx-15,168); context.stroke();
  }

  context.restore();
}
