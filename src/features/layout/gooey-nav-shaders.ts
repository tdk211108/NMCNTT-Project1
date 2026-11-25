export interface GooeyBox {
  cx: number;
  cy: number;
  hw: number;
  hh: number;
}

export interface GooeyBlob {
  x: number;
  y: number;
  r: number;
  tx: number;
  ty: number;
  tint: number[] | null;
}

export interface GooeyPipeline {
  program: WebGLProgram;
  uniforms: Record<string, WebGLUniformLocation | null>;
  buffer: WebGLBuffer;
  position: number;
}

export const GOOEY_MAX_DROPS = 28;
export const GOOEY_MAX_PILLS = 4;

const VERTEX = `#version 300 es
in vec2 aPosition;
void main() {
  gl_Position = vec4(aPosition, 0.0, 1.0);
}
`;

const FRAGMENT = `#version 300 es
precision highp float;

uniform vec2 uSize;
uniform float uRatio;
uniform vec4 uPills[${GOOEY_MAX_PILLS}];
uniform vec4 uHover;
uniform vec4 uDrops[${GOOEY_MAX_DROPS}];
uniform vec2 uTails[${GOOEY_MAX_DROPS}];
uniform vec3 uTints[${GOOEY_MAX_DROPS}];
uniform int uCount;
uniform float uSmooth;
uniform vec3 uPill;
uniform vec4 uHoverColor;
uniform float uShadow;

out vec4 outColor;

float sdPill(vec2 p, vec4 box) {
  vec2 extent = max(box.zw, vec2(0.0));
  float r = min(extent.x, extent.y);
  vec2 q = abs(p - box.xy) - extent + r;
  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
}

float sdCapsule(vec2 p, vec2 a, vec2 b, float r) {
  vec2 pa = p - a;
  vec2 ba = b - a;
  float h = clamp(dot(pa, ba) / max(dot(ba, ba), 0.0001), 0.0, 1.0);
  return length(pa - ba * h) - r;
}

vec4 blend(vec4 a, vec4 b, float k) {
  float h = clamp(0.5 + 0.5 * (b.w - a.w) / k, 0.0, 1.0);
  return vec4(mix(b.rgb, a.rgb, h), mix(b.w, a.w, h) - k * h * (1.0 - h));
}

vec4 field(vec2 p) {
  vec4 shape = vec4(uPill, 1e5);
  for (int i = 0; i < ${GOOEY_MAX_PILLS}; i++) {
    vec4 pill = uPills[i];
    if (pill.z <= 0.0) continue;
    shape = blend(shape, vec4(uPill, sdPill(p, pill)), uSmooth);
  }
  for (int i = 0; i < ${GOOEY_MAX_DROPS}; i++) {
    if (i >= uCount) break;
    vec4 drop = uDrops[i];
    if (drop.z <= 0.0) continue;
    float d = sdCapsule(p, drop.xy, drop.xy - uTails[i], drop.z);
    if (d > shape.w + uSmooth) continue;
    shape = blend(shape, vec4(uTints[i], d), uSmooth);
  }
  return shape;
}

void main() {
  vec2 p = vec2(gl_FragCoord.x, uSize.y * uRatio - gl_FragCoord.y) / uRatio;
  vec4 shape = field(p);
  float d = shape.w;
  float aa = max(fwidth(d), 0.35);
  float body = clamp(0.5 - d / aa, 0.0, 1.0);

  vec2 grad = vec2(dFdx(d), -dFdy(d));
  vec2 n = length(grad) > 0.0001 ? normalize(grad) : vec2(0.0, 1.0);
  float rim = (1.0 - smoothstep(0.0, 1.6, -d)) * max(0.0, -n.y) * 0.25;
  vec3 fill = mix(shape.rgb, vec3(1.0), rim);

  float lifted = field(p - vec2(0.0, 2.5)).w;
  float shadow = (1.0 - smoothstep(-2.5, 7.0, lifted)) * uShadow * (1.0 - body);
  float hover = clamp(0.5 - sdPill(p, uHover) / aa, 0.0, 1.0) * uHoverColor.a;

  vec4 color = vec4(0.0, 0.0, 0.0, shadow);
  color = vec4(uHoverColor.rgb * hover, hover) + color * (1.0 - hover);
  color = vec4(fill * body, body) + color * (1.0 - body);
  outColor = color;
}
`;

export const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

export function traceGooeyOverlayPath(
  boxes: GooeyBox[],
  blobs: GooeyBlob[],
  smooth: number,
  width: number,
  height: number,
): string {
  if (width <= 0 || height <= 0 || (boxes.length === 0 && blobs.length === 0)) {
    return '';
  }

  const field = (x: number, y: number) => {
    let d = 1e5;
    const merge = (value: number) => {
      const h = clamp01(0.5 + (0.5 * (value - d)) / smooth);
      d = value + (d - value) * h - smooth * h * (1 - h);
    };
    for (const box of boxes) {
      const r = Math.min(box.hw, box.hh);
      const qx = Math.abs(x - box.cx) - box.hw + r;
      const qy = Math.abs(y - box.cy) - box.hh + r;
      merge(Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - r);
    }
    for (const blob of blobs) {
      const px = x - blob.x;
      const py = y - blob.y;
      const bx = -blob.tx;
      const by = -blob.ty;
      const span = bx * bx + by * by;
      const h = span > 0.0001 ? clamp01((px * bx + py * by) / span) : 0;
      const value = Math.hypot(px - bx * h, py - by * h) - blob.r;
      if (value > d + smooth) continue;
      merge(value);
    }
    return d;
  };

  const step = 2;
  const parts: string[] = [];
  const maxY = Math.ceil(height);
  for (let y = 0; y < maxY; y += 1) {
    const cy = y + 0.5;
    let previous = field(0, cy);
    let start: number | null = previous < 0 ? 0 : null;
    for (let x = step; x <= width + step; x += step) {
      const sampleX = Math.min(x, width);
      const value = field(sampleX, cy);
      if ((previous < 0) !== (value < 0)) {
        const cross = x - step + (step * previous) / (previous - value);
        if (value < 0) start = cross;
        else if (start !== null) {
          parts.push(`M${start.toFixed(1)},${y}H${cross.toFixed(1)}V${y + 1}H${start.toFixed(1)}Z`);
          start = null;
        }
      }
      previous = value;
    }
    if (start !== null) {
      parts.push(`M${start.toFixed(1)},${y}H${width.toFixed(1)}V${y + 1}H${start.toFixed(1)}Z`);
    }
  }
  return parts.join('');
}

export function parseGooeyColor(value: string): number[] {
  const hexMatch = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(value.trim());
  if (hexMatch) {
    const raw = hexMatch[1];
    const hex = raw.length === 3 ? raw.replace(/./g, (d) => d + d) : raw;
    return [
      parseInt(hex.slice(0, 2), 16) / 255,
      parseInt(hex.slice(2, 4), 16) / 255,
      parseInt(hex.slice(4, 6), 16) / 255,
      1,
    ];
  }
  const rgbMatch = /rgba?\(([^)]+)\)/i.exec(value);
  if (rgbMatch) {
    const parts = rgbMatch[1].split(',').map((p) => parseFloat(p));
    return [parts[0] / 255, parts[1] / 255, parts[2] / 255, parts[3] ?? 1];
  }
  return [0.84, 0.1, 0.125, 1];
}

const UNIFORMS = [
  'uSize',
  'uRatio',
  'uPills',
  'uHover',
  'uDrops',
  'uTails',
  'uTints',
  'uCount',
  'uSmooth',
  'uPill',
  'uHoverColor',
  'uShadow',
] as const;

function compileShader(gl: WebGL2RenderingContext, type: number, source: string): WebGLShader | null {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

export function buildGooeyPipeline(gl: WebGL2RenderingContext): GooeyPipeline | null {
  const vs = compileShader(gl, gl.VERTEX_SHADER, VERTEX);
  const fs = compileShader(gl, gl.FRAGMENT_SHADER, FRAGMENT);
  if (!vs || !fs) return null;

  const program = gl.createProgram();
  if (!program) return null;
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  gl.deleteShader(vs);
  gl.deleteShader(fs);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    gl.deleteProgram(program);
    return null;
  }

  const uniforms = Object.fromEntries(UNIFORMS.map((name) => [name, gl.getUniformLocation(program, name)]));
  const buffer = gl.createBuffer();
  if (!buffer) {
    gl.deleteProgram(program);
    return null;
  }
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);

  return { program, uniforms, buffer, position: gl.getAttribLocation(program, 'aPosition') };
}
