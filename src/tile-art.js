// Palette and drawing paths adapted from the original flower board generator.
export const tileColors = {
  market: "#7a3030",
  town: "#6a6050",
  forest: "#2a4a22",
  mountain: "#3a3a3a",
  dark: "#1e1a14",
  black: "#0d0d10",
  forage: "#7a5520",
  training: "#4a2e18",
  recruit: "#1e3a28",
  guild: "#1e2e50",
  mine: "#000000",
};
const iconTypes = {
  market: "MARKET",
  town: "TOWN",
  forest: "FOREST",
  mountain: "MOUNTAIN",
  dark: "DARK_FOREST",
  black: "BLACK_FOREST",
  forage: "FORAGE",
  training: "CAMP",
  recruit: "RECRUIT",
  guild: "GUILD",
  mine: "MINE",
};
const iconCache = new Map();
export function tileIconUrl(type) {
  if (!iconCache.has(type)) {
    const canvas = document.createElement("canvas");
    // Render once at high resolution for sharp icons at any normal board size.
    canvas.width = canvas.height = 256;
    const context = canvas.getContext("2d");
    context.scale(4, 4);
    drawIcon(context, iconTypes[type], 32, 32, 32);
    iconCache.set(type, canvas.toDataURL("image/png"));
  }
  return iconCache.get(type);
}

export function drawIcon(ctx, type, x, y, size) {
  const s = size * 0.28;
  ctx.save();
  ctx.translate(x, y);
  ctx.globalAlpha = 0.72;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  const ICON_COLORS = {
    FOREST: "#a0d080",
    DARK_FOREST: "#5a8050",
    BLACK_FOREST: "#7060a0",
    FORAGE: "#d4a843",
    GUILD: "#a0b8f0",
    CAMP: "#d0a080",
    RECRUIT: "#70c090",
    MOUNTAIN: "#c0c0c0",
    MINE: "#c8a060",
    MARKET: "#f0c0b0",
    TOWN: "#f0e0c0",
    CAVE: "#c04040",
  };
  const col = ICON_COLORS[type] || "#ffffff";
  ctx.strokeStyle = col;
  ctx.fillStyle = col;
  ctx.lineWidth = 1.5;

  if (type === "FOREST") {
    ctx.beginPath();
    ctx.moveTo(0, -s);
    ctx.lineTo(s * 0.65, s * 0.3);
    ctx.lineTo(-s * 0.65, s * 0.3);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(0, -s * 0.5);
    ctx.lineTo(s * 0.45, s * 0.7);
    ctx.lineTo(-s * 0.45, s * 0.7);
    ctx.closePath();
    ctx.fill();
    ctx.fillRect(-s * 0.12, s * 0.7, s * 0.24, s * 0.38);
  } else if (type === "DARK_FOREST") {
    // Three pine trees: left, center (tallest), right — packed close together
    const drawTree = (ox, oy, scale) => {
      ctx.beginPath();
      ctx.moveTo(ox, oy - s * 0.72 * scale);
      ctx.lineTo(ox + s * 0.38 * scale, oy - s * 0.1 * scale);
      ctx.lineTo(ox - s * 0.38 * scale, oy - s * 0.1 * scale);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(ox, oy - s * 0.38 * scale);
      ctx.lineTo(ox + s * 0.28 * scale, oy + s * 0.22 * scale);
      ctx.lineTo(ox - s * 0.28 * scale, oy + s * 0.22 * scale);
      ctx.closePath();
      ctx.fill();
      ctx.fillRect(
        ox - s * 0.07 * scale,
        oy + s * 0.22 * scale,
        s * 0.14 * scale,
        s * 0.25 * scale,
      );
    };
    drawTree(-s * 0.52, s * 0.18, 0.78); // left tree, slightly lower
    drawTree(s * 0.52, s * 0.18, 0.78); // right tree, slightly lower
    drawTree(0, -s * 0.08, 1.0); // center tree, tallest, in front
  } else if (type === "BLACK_FOREST") {
    // Four tightly-packed pine trees, more angular/jagged than dark forest
    const drawBTree = (ox, oy, scale) => {
      ctx.beginPath();
      ctx.moveTo(ox, oy - s * 0.8 * scale);
      ctx.lineTo(ox + s * 0.32 * scale, oy - s * 0.05 * scale);
      ctx.lineTo(ox - s * 0.32 * scale, oy - s * 0.05 * scale);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(ox, oy - s * 0.42 * scale);
      ctx.lineTo(ox + s * 0.24 * scale, oy + s * 0.28 * scale);
      ctx.lineTo(ox - s * 0.24 * scale, oy + s * 0.28 * scale);
      ctx.closePath();
      ctx.fill();
      ctx.fillRect(
        ox - s * 0.06 * scale,
        oy + s * 0.28 * scale,
        s * 0.12 * scale,
        s * 0.22 * scale,
      );
    };
    drawBTree(-s * 0.55, s * 0.22, 0.7);
    drawBTree(s * 0.55, s * 0.22, 0.7);
    drawBTree(-s * 0.18, -s * 0.06, 0.88);
    drawBTree(s * 0.18, -s * 0.06, 0.88);
  } else if (type === "FORAGE") {
    ctx.beginPath();
    ctx.ellipse(0, 0, s * 0.55, s * 0.45, 0, Math.PI, 0);
    ctx.fill();
    ctx.fillRect(-s * 0.18, 0, s * 0.36, s * 0.55);
    ctx.fillStyle = "#7a5520";
    ctx.beginPath();
    ctx.arc(-s * 0.18, -s * 0.15, s * 0.1, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(s * 0.18, -s * 0.22, s * 0.08, 0, Math.PI * 2);
    ctx.fill();
  } else if (type === "GUILD") {
    [0, 90, 180, 270].forEach((deg) => {
      const a = (deg * Math.PI) / 180;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(a - 0.25) * s * 0.35, Math.sin(a - 0.25) * s * 0.35);
      ctx.lineTo(Math.cos(a) * s, Math.sin(a) * s);
      ctx.lineTo(Math.cos(a + 0.25) * s * 0.35, Math.sin(a + 0.25) * s * 0.35);
      ctx.closePath();
      ctx.fill();
    });
  } else if (type === "CAMP") {
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(-s * 0.7, -s * 0.7);
    ctx.lineTo(s * 0.7, s * 0.7);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(s * 0.7, -s * 0.7);
    ctx.lineTo(-s * 0.7, s * 0.7);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, 0, s * 0.18, 0, Math.PI * 2);
    ctx.stroke();
  } else if (type === "RECRUIT") {
    // Shield outline with a star inside — distinct from CAMP's crossed swords
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(0, -s * 0.78);
    ctx.lineTo(s * 0.58, -s * 0.38);
    ctx.lineTo(s * 0.58, s * 0.18);
    ctx.quadraticCurveTo(s * 0.58, s * 0.72, 0, s * 0.9);
    ctx.quadraticCurveTo(-s * 0.58, s * 0.72, -s * 0.58, s * 0.18);
    ctx.lineTo(-s * 0.58, -s * 0.38);
    ctx.closePath();
    ctx.stroke();
    // Star inside
    const sr = s * 0.28,
      ir = s * 0.12;
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      const ao = (Math.PI * 2 * i) / 5 - Math.PI / 2;
      const ai = ao + Math.PI / 5;
      if (i === 0) ctx.moveTo(Math.cos(ao) * sr, Math.sin(ao) * sr + s * 0.04);
      else ctx.lineTo(Math.cos(ao) * sr, Math.sin(ao) * sr + s * 0.04);
      ctx.lineTo(Math.cos(ai) * ir, Math.sin(ai) * ir + s * 0.04);
    }
    ctx.closePath();
    ctx.fill();
  } else if (type === "MOUNTAIN") {
    // Two overlapping triangular peaks
    ctx.beginPath();
    ctx.moveTo(-s * 0.25, s * 0.55);
    ctx.lineTo(s * 0.62, s * 0.55);
    ctx.lineTo(s * 0.18, -s * 0.35);
    ctx.closePath();
    ctx.fill();
    // Slightly darker second peak behind
    ctx.fillStyle = ICON_COLORS.MOUNTAIN;
    ctx.globalAlpha = 0.5;
    ctx.beginPath();
    ctx.moveTo(-s * 0.65, s * 0.55);
    ctx.lineTo(s * 0.2, s * 0.55);
    ctx.lineTo(-s * 0.22, -s * 0.6);
    ctx.closePath();
    ctx.fill();
    // Snow cap on front peak
    ctx.globalAlpha = 0.85;
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.moveTo(s * 0.18, -s * 0.35);
    ctx.lineTo(s * 0.38, s * 0.0);
    ctx.lineTo(-s * 0.02, s * 0.0);
    ctx.closePath();
    ctx.fill();
  } else if (type === "MINE") {
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(-s * 0.75, s * 0.75);
    ctx.lineTo(s * 0.18, -s * 0.18);
    ctx.lineWidth = s * 0.22;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(s * 0.18, -s * 0.18, s * 0.16, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-s * 0.18, -s * 0.62);
    ctx.bezierCurveTo(
      s * 0.25,
      -s * 0.95,
      s * 0.85,
      -s * 0.55,
      s * 0.78,
      s * 0.08,
    );
    ctx.lineWidth = s * 0.14;
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(s * 0.62, -s * 0.08);
    ctx.lineTo(s * 0.78, s * 0.08);
    ctx.lineWidth = s * 0.06;
    ctx.stroke();
  } else if (type === "MARKET") {
    // Compass rose — golden to match tile border
    const gold = "#f0c060";
    ctx.strokeStyle = gold;
    ctx.fillStyle = gold;

    // Outer circle
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(0, 0, s * 0.82, 0, Math.PI * 2);
    ctx.stroke();

    // Cardinal points — N/S taller, E/W shorter diamond points
    const drawPoint = (angle, long, wide) => {
      ctx.save();
      ctx.rotate(angle);
      ctx.beginPath();
      ctx.moveTo(0, -long);
      ctx.lineTo(wide, 0);
      ctx.lineTo(0, long * 0.28);
      ctx.lineTo(-wide, 0);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    };
    drawPoint(0, s * 0.72, s * 0.18); // N
    drawPoint(Math.PI, s * 0.72, s * 0.18); // S
    drawPoint(Math.PI / 2, s * 0.52, s * 0.14); // E
    drawPoint(-Math.PI / 2, s * 0.52, s * 0.14); // W

    // Centre dot
    ctx.beginPath();
    ctx.arc(0, 0, s * 0.1, 0, Math.PI * 2);
    ctx.fill();

    // N / S / E / W labels — large, pushed well outside the rose
    const labelSize = size * 0.28; // slightly smaller
    const labelR = size * 0.52; // pulled inward from the border
    ctx.font = `bold ${labelSize}px serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = gold;
    ctx.fillText("N", 0, -labelR);
    ctx.fillText("S", 0, labelR);
    ctx.fillText("E", labelR, 0);
    ctx.fillText("W", -labelR, 0);
  } else if (type === "TOWN") {
    // House silhouette
    ctx.beginPath();
    ctx.moveTo(0, -s * 0.75);
    ctx.lineTo(s * 0.65, -s * 0.1);
    ctx.lineTo(-s * 0.65, -s * 0.1);
    ctx.closePath();
    ctx.fill();
    ctx.fillRect(-s * 0.45, -s * 0.1, s * 0.9, s * 0.85);
    ctx.fillStyle = "#6a6050";
    ctx.fillRect(-s * 0.15, s * 0.2, s * 0.3, s * 0.55);
  }

  ctx.restore();
}
