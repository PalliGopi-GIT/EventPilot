"use client";

import React, { useEffect, useRef } from "react";

interface CloudShaderProps {
  className?: string;
  opacity?: number;
}

/**
 * High-performance WebGL / Canvas Cloud Shader
 * Creates an atmospheric, fluid volumetric cloud aesthetic inspired by Aceternity UI.
 */
export function CloudShader({ className = "", opacity = 0.65 }: CloudShaderProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext("webgl");
    if (!gl) return;

    let animationFrameId: number;
    let startTime = Date.now();

    // Vertex shader
    const vsSource = `
      attribute vec2 position;
      varying vec2 vUv;
      void main() {
        vUv = position * 0.5 + 0.5;
        gl_Position = vec4(position, 0.0, 1.0);
      }
    `;

    // Fragment shader for atmospheric volumetric clouds & deep space hues
    const fsSource = `
      precision highp float;
      uniform vec2 uResolution;
      uniform float uTime;
      uniform float uOpacity;
      varying vec2 vUv;

      // Hash function
      float hash(vec2 p) {
        return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
      }

      // 2D Noise
      float noise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        vec2 u = f * f * (3.0 - 2.0 * f);
        return mix(mix(hash(i + vec2(0.0, 0.0)), hash(i + vec2(1.0, 0.0)), u.x),
                   mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
      }

      // Fractional Brownian Motion (fBm)
      float fbm(vec2 p) {
        float v = 0.0;
        float a = 0.5;
        vec2 shift = vec2(100.0);
        mat2 rot = mat2(cos(0.5), sin(0.5), -sin(0.5), cos(0.5));
        for (int i = 0; i < 5; ++i) {
          v += a * noise(p);
          p = rot * p * 2.0 + shift;
          a *= 0.5;
        }
        return v;
      }

      void main() {
        vec2 st = gl_FragCoord.xy / uResolution.xy;
        st.x *= uResolution.x / uResolution.y;

        vec2 q = vec2(0.0);
        q.x = fbm(st + 0.05 * uTime);
        q.y = fbm(st + vec2(1.0));

        vec2 r = vec2(0.0);
        r.x = fbm(st + 1.0 * q + vec2(1.7, 9.2) + 0.15 * uTime);
        r.y = fbm(st + 1.0 * q + vec2(8.3, 2.8) + 0.126 * uTime);

        float f = fbm(st + r);

        // Deep blue, indigo, and sapphire palette with soft glow
        vec3 colorA = vec3(0.02, 0.04, 0.08); // Dark space
        vec3 colorB = vec3(0.08, 0.18, 0.38); // Deep royal blue
        vec3 colorC = vec3(0.15, 0.35, 0.65); // Electric sapphire
        vec3 colorD = vec3(0.03, 0.08, 0.18); // Midnight

        vec3 col = mix(colorA, colorB, clamp((f * f) * 3.5, 0.0, 1.0));
        col = mix(col, colorC, clamp(length(q), 0.0, 1.0) * 0.7);
        col = mix(col, colorD, clamp(length(r.x), 0.0, 1.0) * 0.4);

        // Vignette
        vec2 uv = gl_FragCoord.xy / uResolution.xy;
        float vignette = uv.x * uv.y * (1.0 - uv.x) * (1.0 - uv.y);
        col *= clamp(pow(16.0 * vignette, 0.25), 0.0, 1.0);

        gl_FragColor = vec4(col, uOpacity);
      }
    `;

    function createShader(gl: WebGLRenderingContext, type: number, source: string) {
      const shader = gl.createShader(type);
      if (!shader) return null;
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.warn(gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    }

    const vertexShader = createShader(gl, gl.VERTEX_SHADER, vsSource);
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fsSource);
    if (!vertexShader || !fragmentShader) return;

    const program = gl.createProgram();
    if (!program) return;
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.warn(gl.getProgramInfoLog(program));
      return;
    }

    // Geometry
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    const positions = new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

    const positionAttributeLocation = gl.getAttribLocation(program, "position");
    const resolutionUniformLocation = gl.getUniformLocation(program, "uResolution");
    const timeUniformLocation = gl.getUniformLocation(program, "uTime");
    const opacityUniformLocation = gl.getUniformLocation(program, "uOpacity");

    const resize = () => {
      const displayWidth = canvas.clientWidth;
      const displayHeight = canvas.clientHeight;
      if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
        canvas.width = displayWidth;
        canvas.height = displayHeight;
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
      }
    };

    const render = () => {
      resize();
      gl.useProgram(program);

      gl.enableVertexAttribArray(positionAttributeLocation);
      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
      gl.vertexAttribPointer(positionAttributeLocation, 2, gl.FLOAT, false, 0, 0);

      const elapsedSeconds = (Date.now() - startTime) / 1000.0;
      gl.uniform2f(resolutionUniformLocation, canvas.width, canvas.height);
      gl.uniform1f(timeUniformLocation, elapsedSeconds);
      gl.uniform1f(opacityUniformLocation, opacity);

      gl.drawArrays(gl.TRIANGLES, 0, 6);
      animationFrameId = requestAnimationFrame(render);
    };

    window.addEventListener("resize", resize);
    render();

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [opacity]);

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 w-full h-full pointer-events-none ${className}`}
    />
  );
}
